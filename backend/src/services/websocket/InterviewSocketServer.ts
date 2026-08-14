import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis as IORedisClient } from "ioredis";
import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";
import { prisma } from "../../database/client.js";
import { ApiError } from "../../utils/ApiError.js";
import { SessionTimeoutManager } from "./SessionTimeoutManager.js";
import { aiEngine } from "../ai/AIEngine.js";

// Handles:
// - Session authentication via tokens
// - Question delivery
// - Answer submission
// - Real-time feedback
// - Session timeout management
// - Heartbeat/connection monitoring
//
// Events:
// - Client → Server: join-session, submit-answer, heartbeat
// - Server → Client: question, feedback, session-timeout, error

interface AuthenticatedSocket extends Socket {
  sessionId?: string;
  candidateId?: string;
  sessionToken?: string;
}

export class InterviewSocketServer {
  private io: SocketIOServer;
  private timeoutManager: SessionTimeoutManager;
  private pubClient: IORedisClient;
  private subClient: IORedisClient;

  constructor(httpServer: HttpServer) {
    // Initialize Redis clients for Socket.io adapter (clustering support)
    this.pubClient = new IORedisClient({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
    });

    this.subClient = this.pubClient.duplicate();

    // Initialize Socket.io with Redis adapter
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Attach Redis adapter for multi-server scaling
    this.io.adapter(createAdapter(this.pubClient, this.subClient));

    this.timeoutManager = new SessionTimeoutManager();

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info("[WebSocket] Interview Socket Server initialized");
  }

  // Middleware: Authentication
  // Validates session token before allowing connection.

  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const sessionToken = socket.handshake.auth.sessionToken as string;

        if (!sessionToken) {
          throw new ApiError(401, "Session token required");
        }

        // Verify session exists and is active
        const session = await prisma.interviewSession.findUnique({
          where: { sessionToken },
          select: {
            id: true,
            candidateId: true,
            status: true,
            sessionToken: true,
            createdAt: true, // Added for expiration check
          },
        });

        if (!session) {
          throw new ApiError(404, "Invalid session token");
        }

        if (session.status === "COMPLETED" || session.status === "ABANDONED") {
          throw new ApiError(403, "Session already ended");
        }

        // Token expiration check (24 hours from creation)
        const tokenAgeMs = Date.now() - session.createdAt.getTime();
        const maxTokenAgeMs = 24 * 60 * 60 * 1000; // 24 hours

        if (tokenAgeMs > maxTokenAgeMs) {
          logger.warn("[WebSocket] Session token expired", {
            sessionId: session.id,
            ageHours: Math.floor(tokenAgeMs / (60 * 60 * 1000)),
          });
          throw new ApiError(
            401,
            "Session token expired. Please start a new interview session.",
          );
        }

        // Attach session data to socket
        socket.sessionId = session.id;
        socket.candidateId = session.candidateId ?? undefined;
        socket.sessionToken = sessionToken;

        logger.info("[WebSocket] Client authenticated", {
          socketId: socket.id,
          sessionId: session.id,
          tokenAgeHours: Math.floor(tokenAgeMs / (60 * 60 * 1000)),
        });

        next();
      } catch (error) {
        logger.error("[WebSocket] Authentication failed", error);
        next(error as Error);
      }
    });
  }

  // Event Handlers

  private setupEventHandlers() {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      const { sessionId, candidateId } = socket;

      logger.info("[WebSocket] Client connected", {
        socketId: socket.id,
        sessionId,
        candidateId,
      });

      // Join session-specific room
      if (sessionId) {
        socket.join(`session:${sessionId}`);

        // Start session timeout monitoring
        this.timeoutManager.startMonitoring(sessionId, () => {
          this.handleSessionTimeout(sessionId);
        });
      }

      // --- Event: join-session ---
      socket.on("join-session", async (data?: { isVoiceMode?: boolean }) => {
        try {
          logger.info("[WebSocket] join-session", {
            sessionId,
            isVoiceMode: data?.isVoiceMode || false,
          });

          // Fetch current session state
          const session = await prisma.interviewSession.findUnique({
            where: { id: sessionId },
            include: {
              transcript: true,
            },
          });

          if (!session) {
            socket.emit("error", { message: "Session not found" });
            return;
          }

          // Update session status to IN_PROGRESS if SCHEDULED
          if (session.status === "SCHEDULED") {
            await prisma.interviewSession.update({
              where: { id: sessionId },
              data: {
                status: "IN_PROGRESS",
                startedAt: new Date(),
              },
            });
          }

          // Send initial state to client
          socket.emit("session-joined", {
            sessionId: session.id,
            currentQuestionIndex: session.currentQuestionIndex || 0,
            totalQuestions: session.totalQuestions || 10,
            status: session.status,
            isVoiceMode: data?.isVoiceMode || false,
          });

          // Send first question with voice audio if in voice mode
          if (sessionId) {
            this.sendNextQuestion(socket, sessionId, 0);
          }
        } catch (error) {
          logger.error("[WebSocket] join-session error", error);
          socket.emit("error", { message: "Failed to join session" });
        }
      });

      // --- Event: submit-answer ---
      socket.on(
        "submit-answer",
        async (data: {
          questionIndex: number;
          answer: string;
          audioBase64?: string;
          audioDuration?: number; // seconds
          isVoiceMode?: boolean;
        }) => {
          try {
            logger.info("[WebSocket] submit-answer", {
              sessionId,
              questionIndex: data.questionIndex,
              isVoiceMode: data.isVoiceMode || false,
              audioDuration: data.audioDuration,
            });

            // Reset timeout on activity
            if (sessionId) {
              this.timeoutManager.resetTimeout(sessionId);
            }

            let transcribedText = data.answer;

            // If voice mode, transcribe audio using OpenAI Whisper
            if (data.isVoiceMode && data.audioBase64) {
              try {
                transcribedText = await aiEngine.transcribeAudio(
                  data.audioBase64,
                );

                logger.info("[WebSocket] Audio transcribed", {
                  sessionId,
                  questionIndex: data.questionIndex,
                  transcriptLength: transcribedText.length,
                  audioDuration: data.audioDuration,
                });

                // Send transcription back to client for display
                socket.emit("transcription-complete", {
                  questionIndex: data.questionIndex,
                  transcription: transcribedText,
                });
              } catch (transcriptionError) {
                logger.error("[WebSocket] Audio transcription failed", {
                  sessionId,
                  error: transcriptionError,
                });

                socket.emit("error", {
                  message:
                    "Failed to transcribe audio. Please try again or switch to text mode.",
                  code: "TRANSCRIPTION_FAILED",
                });
                return;
              }
            }

            if (!sessionId) {
              socket.emit("error", { message: "Session ID not found" });
              return;
            }

            // Fetch current session and job context for AI evaluation
            const session = await prisma.interviewSession.findUnique({
              where: { id: sessionId },
              include: {
                application: {
                  include: {
                    job: {
                      select: {
                        title: true,
                        description: true,
                        requiredSkills: true,
                      },
                    },
                  },
                },
                practiceJob: {
                  select: {
                    title: true,
                    description: true,
                    requiredSkills: true,
                  },
                },
                transcript: {
                  select: {
                    id: true,
                    qaData: true,
                    rawTranscript: true,
                  },
                },
              },
            });

            if (!session) {
              socket.emit("error", { message: "Session not found" });
              return;
            }

            const jobContext = session.application?.job || session.practiceJob;
            const currentQuestion = await this.getCurrentQuestion(
              sessionId,
              data.questionIndex,
            );

            // Store answer in transcript with metadata
            if (session.transcript) {
              const qaData = (session.transcript.qaData as any[]) || [];
              qaData.push({
                questionIndex: data.questionIndex,
                question: currentQuestion,
                answer: transcribedText,
                timestamp: new Date().toISOString(),
                isVoiceMode: data.isVoiceMode || false,
                audioDuration: data.audioDuration,
              });

              await prisma.interviewTranscript.update({
                where: { id: session.transcript.id },
                data: {
                  qaData,
                  rawTranscript: `${session.transcript.rawTranscript || ""}\n\nQ${data.questionIndex + 1}: ${currentQuestion}\nA: ${transcribedText}`,
                },
              });
            } else {
              // Create transcript if doesn't exist
              await prisma.interviewTranscript.create({
                data: {
                  sessionId,
                  conversationHistory: [],
                  rawTranscript: `Q${data.questionIndex + 1}: ${currentQuestion}\nA: ${transcribedText}`,
                  qaData: [
                    {
                      questionIndex: data.questionIndex,
                      question: currentQuestion,
                      answer: transcribedText,
                      timestamp: new Date().toISOString(),
                      isVoiceMode: data.isVoiceMode || false,
                      audioDuration: data.audioDuration,
                    },
                  ],
                },
              });
            }

            // Update session progress
            await prisma.interviewSession.update({
              where: { id: sessionId },
              data: {
                currentQuestionIndex: data.questionIndex + 1,
              },
            });

            // Check if interview is complete
            const updatedSession = await prisma.interviewSession.findUnique({
              where: { id: sessionId },
              select: { totalQuestions: true, currentQuestionIndex: true },
            });

            if (
              updatedSession &&
              updatedSession.currentQuestionIndex! >=
                updatedSession.totalQuestions!
            ) {
              await this.completeSession(sessionId);
            } else {
              // Send next AI-generated question
              this.sendNextQuestion(socket, sessionId, data.questionIndex + 1);
            }
          } catch (error) {
            logger.error("[WebSocket] submit-answer error", error);
            socket.emit("error", { message: "Failed to submit answer" });
          }
        },
      );

      // --- Event: heartbeat ---
      socket.on("heartbeat", () => {
        if (sessionId) {
          this.timeoutManager.resetTimeout(sessionId);
        }
        socket.emit("heartbeat-ack");
      });

      // --- Event: disconnect ---
      socket.on("disconnect", (reason) => {
        logger.info("[WebSocket] Client disconnected", {
          socketId: socket.id,
          sessionId,
          reason,
        });

        if (sessionId) {
          this.timeoutManager.stopMonitoring(sessionId);
        }
      });
    });
  }

  // Helper: Get current question text

  private async getCurrentQuestion(
    sessionId: string,
    questionIndex: number,
  ): Promise<string> {
    const transcript = await prisma.interviewTranscript.findFirst({
      where: { sessionId },
      select: { qaData: true },
    });

    if (transcript && transcript.qaData) {
      const qaData = transcript.qaData as any[];
      const qa = qaData.find(
        (item: any) => item.questionIndex === questionIndex,
      );
      if (qa) {
        return qa.question;
      }
    }

    return `Question ${questionIndex + 1}`;
  }

  // Helper: Send next question
  // Generates dynamic AI questions based on job requirements and candidate profile

  private async sendNextQuestion(
    socket: AuthenticatedSocket,
    sessionId: string,
    questionIndex: number,
  ) {
    try {
      const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: {
          application: {
            include: {
              job: {
                select: {
                  title: true,
                  description: true,
                  requiredSkills: true,
                },
              },
            },
          },
          practiceJob: {
            select: {
              title: true,
              description: true,
              requiredSkills: true,
            },
          },
          transcript: {
            select: {
              qaData: true,
            },
          },
        },
      });

      if (!session) {
        socket.emit("error", { message: "Session not found" });
        return;
      }

      // Determine job context (hiring vs practice)
      const jobContext = session.application?.job || session.practiceJob;
      if (!jobContext) {
        socket.emit("error", { message: "Job context not found" });
        return;
      }

      // Extract previous questions from transcript
      const qaData = (session.transcript?.qaData as any[]) || [];
      const previousQuestions = qaData.map((qa: any) => qa.question);

      // Generate AI question using InterviewGraph
      const question = await aiEngine.generateSingleQuestion({
        resumeText: session.resumeUrl,
        jobDescription: jobContext.description,
        jobTitle: jobContext.title,
        requiredSkills: jobContext.requiredSkills as string[],
        questionIndex,
        previousQuestions,
      });

      // Generate voice audio for the question (TTS)
      let questionAudio: string | undefined;
      try {
        questionAudio = await aiEngine.generateSpeech(question, "alloy");

        logger.info("[WebSocket] Question audio generated", {
          sessionId,
          questionIndex,
          audioSizeKB: Math.round((questionAudio.length * 0.75) / 1024),
        });
      } catch (audioError) {
        logger.error(
          "[WebSocket] Failed to generate question audio, sending text only",
          {
            sessionId,
            questionIndex,
            error: audioError,
          },
        );
        // Continue without audio - text will still be sent
      }

      socket.emit("question", {
        questionIndex,
        question,
        questionAudio, // Base64 encoded MP3 audio
        totalQuestions: session.totalQuestions,
      });

      logger.info("[WebSocket] AI question sent", {
        sessionId,
        questionIndex,
        questionLength: question.length,
        hasAudio: !!questionAudio,
      });
    } catch (error) {
      logger.error("[WebSocket] Failed to generate question", {
        sessionId,
        questionIndex,
        error,
      });

      // Fallback to generic question if AI fails
      const fallbackQuestions = [
        "Tell me about your experience with this technology stack.",
        "Describe a challenging technical problem you solved recently.",
        "How do you approach debugging complex issues?",
        "Explain your experience with testing and quality assurance.",
        "What is your process for learning new technologies?",
      ];

      const fallbackQuestion =
        fallbackQuestions[questionIndex % fallbackQuestions.length];

      // Try to generate audio for fallback question
      let fallbackAudio: string | undefined;
      try {
        fallbackAudio = await aiEngine.generateSpeech(
          fallbackQuestion,
          "alloy",
        );
      } catch {
        // If audio generation fails, send text only
      }

      socket.emit("question", {
        questionIndex,
        question: fallbackQuestion,
        questionAudio: fallbackAudio,
        totalQuestions: 10, // Default fallback
      });
    }
  }

  // Helper: Complete session

  private async completeSession(sessionId: string) {
    try {
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // Notify all clients in session room
      this.io.to(`session:${sessionId}`).emit("session-completed", {
        message: "Interview completed successfully",
      });

      // Queue background evaluation job (implemented via InterviewEvaluationJob)
      // This is automatically triggered when session completes

      logger.info("[WebSocket] Session completed", { sessionId });
    } catch (error) {
      logger.error("[WebSocket] Failed to complete session", {
        sessionId,
        error,
      });
    }
  }

  // Helper: Handle session timeout

  private async handleSessionTimeout(sessionId: string) {
    try {
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: "ABANDONED",
          completedAt: new Date(),
        },
      });

      this.io.to(`session:${sessionId}`).emit("session-timeout", {
        message: "Session timed out due to inactivity",
      });

      logger.warn("[WebSocket] Session timeout", { sessionId });
    } catch (error) {
      logger.error("[WebSocket] Failed to handle timeout", {
        sessionId,
        error,
      });
    }
  }

  // Graceful shutdown

  async close() {
    logger.info("[WebSocket] Closing Socket.io server...");

    this.timeoutManager.cleanup();

    await new Promise<void>((resolve) => {
      this.io.close(() => {
        logger.info("[WebSocket] Socket.io server closed");
        resolve();
      });
    });

    await this.pubClient.quit();
    await this.subClient.quit();

    logger.info("[WebSocket] Redis connections closed");
  }
}
