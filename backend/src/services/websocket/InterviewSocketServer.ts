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
import { queueInterviewEvaluation } from "../queue/index.js";

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

const resumeTextCache = new Map<string, string>();
const resumeNameCache = new Map<string, string>();
const sessionWeakTopics = new Map<string, string[]>();

export class InterviewSocketServer {
  private io: SocketIOServer;
  private timeoutManager: SessionTimeoutManager;
  private pubClient: IORedisClient;
  private subClient: IORedisClient;

  constructor(httpServer: HttpServer) {
    // Initialize Redis clients for Socket.io adapter (clustering support)
    const redisOptions = {
      maxRetriesPerRequest: null,
      retryStrategy(times: number) {
        return Math.min(times * 100, 3000);
      },
    };

    this.pubClient = config.redis.url
      ? new IORedisClient(config.redis.url, redisOptions)
      : new IORedisClient({
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password || undefined,
          tls: config.redis.host.includes("upstash.io") ? {} : undefined,
          ...redisOptions,
        });

    this.pubClient.on("error", (err: Error) => {
      logger.error("[WebSocket] Redis pubClient error:", err);
    });

    this.subClient = this.pubClient.duplicate();

    this.subClient.on("error", (err: Error) => {
      logger.error("[WebSocket] Redis subClient error:", err);
    });

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
                candidate: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
                application: {
                  include: {
                    candidate: {
                      include: {
                        user: {
                          select: {
                            firstName: true,
                            lastName: true,
                          },
                        },
                      },
                    },
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
                    category: true,
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

            const user = session.candidate?.user || session.application?.candidate?.user;
            const candidateName = user?.firstName
              ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`.trim()
              : "Candidate";

            const jobContext = session.application?.job || session.practiceJob;
            const currentQuestion = await this.getCurrentQuestion(
              sessionId,
              data.questionIndex,
            );

            // Check if candidate verbally or in text requested to end the interview
            const normalizedText = transcribedText.trim().toLowerCase().replace(/[.,!?;:'"]/g, "");
            const endPhrases = [
              "end the interview",
              "stop the interview",
              "finish the interview",
              "quit the interview",
              "terminate the interview",
              "end interview",
              "stop interview",
              "finish interview",
              "quit interview",
              "terminate interview",
              "i want to end",
              "i want to stop",
              "can we end",
              "please end",
              "wrap up the interview",
              "close the interview",
            ];
            // Only short messages count as an end request. A long answer that happens to
            // contain e.g. "I want to stop the process..." is a real answer, not a command.
            const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;
            const isEndingInterview =
              wordCount <= 15 &&
              (endPhrases.some((phrase) => normalizedText.includes(phrase)) ||
                /^(end|stop|quit|finish|terminate|exit)\s*(the\s*)?interview$/i.test(normalizedText));

            // Store answer in transcript with metadata
            if (isEndingInterview) {
              // The end request is a command, not an answer: leave the current question
              // unanswered (it is excluded from scoring) and only note it in the raw log.
              if (session.transcript) {
                await prisma.interviewTranscript.update({
                  where: { id: session.transcript.id },
                  data: {
                    rawTranscript: `${session.transcript.rawTranscript || ""}\n\n[Candidate ended the interview before answering Q${data.questionIndex + 1}]`,
                  },
                });
              }
            } else if (session.transcript) {
              const qaData = (session.transcript.qaData as any[]) || [];
              const existingItem = qaData.find(
                (item: any) => item.questionIndex === data.questionIndex,
              );

              const resolvedQuestion =
                (data as any).questionText ||
                (existingItem && existingItem.question && !existingItem.question.startsWith("Question ")
                  ? existingItem.question
                  : currentQuestion);

              if (existingItem) {
                existingItem.question = resolvedQuestion;
                existingItem.answer = transcribedText;
                existingItem.timestamp = new Date().toISOString();
                existingItem.isVoiceMode = data.isVoiceMode || false;
                existingItem.audioDuration = data.audioDuration;
                existingItem.answered = true;
              } else {
                qaData.push({
                  questionIndex: data.questionIndex,
                  question: resolvedQuestion,
                  answer: transcribedText,
                  timestamp: new Date().toISOString(),
                  isVoiceMode: data.isVoiceMode || false,
                  audioDuration: data.audioDuration,
                  answered: true,
                });
              }

              await prisma.interviewTranscript.update({
                where: { id: session.transcript.id },
                data: {
                  qaData,
                  rawTranscript: `${session.transcript.rawTranscript || ""}\n\nQ${data.questionIndex + 1}: ${resolvedQuestion}\nA: ${transcribedText}`,
                },
              });
            } else {
              const resolvedQuestion = (data as any).questionText || currentQuestion;
              // Create transcript if doesn't exist
              await prisma.interviewTranscript.create({
                data: {
                  sessionId,
                  conversationHistory: [],
                  rawTranscript: `Q${data.questionIndex + 1}: ${resolvedQuestion}\nA: ${transcribedText}`,
                  qaData: [
                    {
                      questionIndex: data.questionIndex,
                      question: resolvedQuestion,
                      answer: transcribedText,
                      timestamp: new Date().toISOString(),
                      isVoiceMode: data.isVoiceMode || false,
                      audioDuration: data.audioDuration,
                      answered: true,
                    },
                  ],
                },
              });
            }

            if (isEndingInterview) {
              logger.info("[WebSocket] Candidate requested to end interview verbally/in text", {
                sessionId,
                candidateName,
                text: transcribedText,
              });

              socket.emit("question", {
                questionIndex: data.questionIndex + 1,
                question: `Understood, ${candidateName}. We will wrap up the interview here. Thank you for your time, and your scorecard is being generated now.`,
                totalQuestions: data.questionIndex + 1,
              });

              setTimeout(async () => {
                await this.completeSession(sessionId);
              }, 1800);
              return;
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

      // --- Event: end-interview ---
      socket.on("end-interview", async () => {
        try {
          if (!sessionId) {
            socket.emit("error", { message: "Session ID not found" });
            return;
          }
          logger.info("[WebSocket] Candidate requested early interview completion", { sessionId });
          await this.completeSession(sessionId);
        } catch (error) {
          logger.error("[WebSocket] end-interview error", error);
          socket.emit("error", { message: "Failed to end interview" });
        }
      });

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

  // Helper: Assess answer quality for adaptive cross-questioning
  // Uses fast heuristics (no LLM call) to detect weak/vague answers

  private assessAnswerQuality(answer: string): 'strong' | 'adequate' | 'weak' | 'vague' {
    const trimmed = answer.trim();

    // Very short or empty responses
    if (trimmed.length < 20) return 'vague';
    if (trimmed.length < 80) return 'weak';

    // Detect hedging and uncertainty language
    const hedgePatterns = [
      /i(?:'m| am) not (?:really )?sure/i,
      /i don'?t (?:really )?know/i,
      /i think maybe/i,
      /i guess/i,
      /(?:^|\. )it depends/i,
      /that'?s a (?:good|great|interesting) question/i,
      /i(?:'ve| have)n'?t (?:really )?(?:worked|dealt|used|done)/i,
      /i(?:'m| am) not (?:very )?familiar/i,
      /i(?:'m| am) not (?:really )?experienced/i,
      /off the top of my head/i,
    ];

    const hedgeCount = hedgePatterns.filter(p => p.test(trimmed)).length;
    if (hedgeCount >= 2) return 'vague';
    if (hedgeCount === 1 && trimmed.length < 200) return 'weak';

    // Word count analysis
    const words = trimmed.split(/\s+/).length;
    if (words < 15) return 'weak';

    return words > 40 ? 'strong' : 'adequate';
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
          candidate: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          application: {
            include: {
              job: {
                select: {
                  title: true,
                  description: true,
                  requiredSkills: true,
                },
              },
              candidate: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          practiceJob: {
            select: {
              title: true,
              description: true,
              requiredSkills: true,
              category: true,
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

      // Resolve canonical candidate name from authenticated user profile
      const user = session.candidate?.user || session.application?.candidate?.user;
      const accountName = user?.firstName
        ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`.trim()
        : "";

      let candidateName = accountName || "Candidate";

      // Extract full resume text from S3 buffer or URL if available
      let resumeText = "";
      const targetResumeUrl =
        session.resumeUrl ||
        session.candidate?.resumeUrl ||
        session.application?.candidate?.resumeUrl;

      if (targetResumeUrl) {
        if (resumeTextCache.has(targetResumeUrl)) {
          resumeText = resumeTextCache.get(targetResumeUrl)!;
        } else {
          try {
            const { s3Service } = await import("../storage/S3Service.js");
            const { resumeParser } = await import("../ai/ResumeParser.js");
            let parsedText = "";

            try {
              const buffer = await s3Service.getFileBuffer(targetResumeUrl);
              const parsed = await resumeParser.parseFromBuffer(buffer, targetResumeUrl);
              parsedText = parsed.text;
            } catch (s3Err: any) {
              if (targetResumeUrl.startsWith("http")) {
                logger.info("[WebSocket] S3 buffer fetch failed, falling back to direct URL fetch for resume", {
                  url: targetResumeUrl,
                  s3Error: s3Err?.message,
                });
                const parsed = await resumeParser.parseFromUrl(targetResumeUrl);
                parsedText = parsed.text;
              } else {
                throw s3Err;
              }
            }

            if (parsedText && parsedText.trim().length > 0) {
              resumeText = parsedText.trim();
              resumeTextCache.set(targetResumeUrl, resumeText);

              // Only attempt resume name extraction if the user's account name is missing
              if (!accountName) {
                const extractedName = await resumeParser.extractCandidateName(resumeText);
                if (extractedName) {
                  candidateName = extractedName;
                }
              }

              logger.info("[WebSocket] Resume parsed successfully for interview context", {
                sessionId,
                candidateName,
                characters: resumeText.length,
              });
            }
          } catch (err: any) {
            logger.warn("[WebSocket] Could not parse resume text:", err?.message || err);
          }
        }
      }

      if (!resumeText) {
        const candidateProfile = session.candidate || session.application?.candidate;
        const profileDetails = [
          candidateProfile?.currentDesignation ? `Current Role: ${candidateProfile.currentDesignation}` : '',
          candidateProfile?.currentCompany ? `Company: ${candidateProfile.currentCompany}` : '',
          candidateProfile?.experience ? `Experience: ${candidateProfile.experience} years` : '',
        ].filter(Boolean).join(', ');

        resumeText = `[Candidate: ${candidateName}${profileDetails ? ` (${profileDetails})` : ''}. Target Role: ${jobContext.title}. Job Required Skills: ${(jobContext.requiredSkills as string[]).join(", ")}. Do NOT fabricate any past company, project, or domain experience.]`;
      }

      // Extract QA history from transcript
      const qaData = (session.transcript?.qaData as any[]) || [];

      // If question for this index already exists, return it immediately
      const existingQa = qaData.find((qa: any) => qa.questionIndex === questionIndex && qa.question);
      if (existingQa && existingQa.question) {
        logger.info("[WebSocket] Reusing existing question for index", {
          sessionId,
          questionIndex,
        });
        const payload = {
          questionIndex,
          question: existingQa.question,
          totalQuestions: session.totalQuestions || 10,
        };
        this.io.to(`session:${sessionId}`).emit("question", payload);
        return;
      }

      const previousQuestions = qaData.map((qa: any) => qa.question);

      const conversationHistory = qaData
        .filter((qa: any) => qa.question)
        .map((qa: any, idx: number) => {
          return `Interviewer (Q${idx + 1}): ${qa.question}\n${candidateName}: ${qa.answer || "[No response provided]"}`;
        })
        .join("\n\n");

      const lastQa = qaData.length > 0 ? qaData[qaData.length - 1] : null;
      const lastAnswer = lastQa?.answer || "";

      // Evaluate every answer via LLM for adaptive cross-questioning.
      // The evaluator gets the full Q&A plus the job description, resume and prior turns.
      const requiredSkillsList = jobContext.requiredSkills as string[];
      // Prefer the topic recorded when the question was generated; the round-robin guess
      // is only a fallback for sessions created before topics were persisted.
      const lastAnswerTopic: string | undefined = questionIndex > 0
        ? lastQa?.topic ||
          requiredSkillsList[(questionIndex - 1) % Math.max(1, requiredSkillsList.length)] ||
          undefined
        : undefined;
      const lastFollowUpDepth: number = Number(lastQa?.followUpDepth) || 0;
      const askedTopics: string[] = qaData
        .filter((qa: any) => qa.topic && !qa.isFollowUp)
        .map((qa: any) => qa.topic as string);

      let finalQuality: 'strong' | 'adequate' | 'weak' | 'vague' | 'incorrect' | undefined = undefined;
      let correctnessIssue: string | undefined;
      let probeFocus: string | undefined;
      let evaluationRecord: Record<string, any> | undefined;

      if (lastAnswer && questionIndex > 0) {
        const lastQuestion = lastQa?.question || '';
        // Earlier turns only; the answer being evaluated is passed separately.
        const priorHistory = qaData
          .filter((qa: any) => qa.question && qa.questionIndex < (lastQa?.questionIndex ?? questionIndex - 1))
          .map((qa: any) => `Interviewer: ${qa.question}\n${candidateName}: ${qa.answer || "[No response provided]"}`)
          .join("\n\n");
        try {
          const evaluation = await aiEngine.evaluateAnswer({
            question: lastQuestion,
            answer: lastAnswer,
            topic: lastAnswerTopic || '',
            jobTitle: jobContext.title,
            jobDescription: jobContext.description,
            requiredSkills: requiredSkillsList,
            resumeText,
            conversationHistory: priorHistory,
          });

          finalQuality = evaluation.quality;
          if (!evaluation.isCorrect && evaluation.correctnessIssue) {
            correctnessIssue = evaluation.correctnessIssue;
          }
          probeFocus = evaluation.gap || evaluation.correctnessIssue || undefined;
          evaluationRecord = {
            quality: evaluation.quality,
            isCorrect: evaluation.isCorrect,
            correctnessIssue: evaluation.correctnessIssue,
            gap: evaluation.gap,
            reasoning: evaluation.reasoning,
            source: 'llm',
          };

          logger.info('[WebSocket] LLM answer evaluation completed', {
            sessionId,
            questionIndex,
            quality: finalQuality,
            isCorrect: evaluation.isCorrect,
            reasoning: evaluation.reasoning,
          });
        } catch (err) {
          // Fall back to heuristic if LLM evaluation fails
          logger.warn('[WebSocket] LLM answer evaluation failed, falling back to heuristic', err);
          finalQuality = this.assessAnswerQuality(lastAnswer);
          evaluationRecord = { quality: finalQuality, source: 'heuristic' };
        }
      }

      // Track weak/vague/incorrect topics for adaptive revisiting
      if (finalQuality && (finalQuality === 'weak' || finalQuality === 'vague' || finalQuality === 'incorrect') && lastAnswerTopic) {
        const existing = sessionWeakTopics.get(sessionId) || [];
        if (!existing.includes(lastAnswerTopic)) {
          existing.push(lastAnswerTopic);
          sessionWeakTopics.set(sessionId, existing);
        }
        logger.info('[WebSocket] Answer flagged for cross-questioning', {
          sessionId,
          questionIndex,
          quality: finalQuality,
          topic: lastAnswerTopic,
          correctnessIssue,
        });
      }

      const weakTopics = sessionWeakTopics.get(sessionId) || [];

      // Generate conversational AI question with adaptive follow-up and cross-questioning
      const generated = await aiEngine.generateSingleQuestionDetailed({
        candidateName,
        resumeText,
        jobDescription: jobContext.description,
        jobTitle: jobContext.title,
        requiredSkills: requiredSkillsList,
        category: (jobContext as any).category,
        questionIndex,
        previousQuestions,
        conversationHistory,
        lastAnswer,
        lastAnswerQuality: finalQuality,
        lastAnswerTopic,
        weakTopics,
        correctnessIssue,
        probeFocus,
        askedTopics,
        consecutiveFollowUps: lastFollowUpDepth,
      });
      const question = generated.question;
      const questionMeta = {
        topic: generated.topic,
        isFollowUp: generated.isFollowUp,
        followUpDepth: generated.isFollowUp ? lastFollowUpDepth + 1 : 0,
      };

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

      // Persist the question into transcript immediately so it is never lost
      try {
        const tr = await prisma.interviewTranscript.findFirst({
          where: { sessionId },
        });
        if (tr) {
          const qaData = (tr.qaData as any[]) || [];
          const existing = qaData.find((item: any) => item.questionIndex === questionIndex);
          if (existing) {
            existing.question = question;
            Object.assign(existing, questionMeta);
          } else {
            qaData.push({
              questionIndex,
              question,
              answer: "",
              timestamp: new Date().toISOString(),
              ...questionMeta,
            });
          }
          if (evaluationRecord) {
            const evaluated = qaData.find((item: any) => item.questionIndex === questionIndex - 1);
            if (evaluated) {
              evaluated.evaluation = evaluationRecord;
            }
          }
          await prisma.interviewTranscript.update({
            where: { id: tr.id },
            data: { qaData },
          });
        } else {
          await prisma.interviewTranscript.create({
            data: {
              sessionId,
              conversationHistory: [],
              rawTranscript: `Q${questionIndex + 1}: ${question}\n`,
              qaData: [
                {
                  questionIndex,
                  question,
                  answer: "",
                  timestamp: new Date().toISOString(),
                  ...questionMeta,
                },
              ],
            },
          });
        }
      } catch (saveError) {
        logger.warn("[WebSocket] Failed to pre-save question in transcript", saveError);
      }

      const questionPayload = {
        questionIndex,
        question,
        questionAudio, // Base64 encoded MP3 audio
        totalQuestions: session.totalQuestions || 10,
      };

      this.io.to(`session:${sessionId}`).emit("question", questionPayload);

      logger.info("[WebSocket] AI question sent", {
        sessionId,
        questionIndex,
        questionLength: question.length,
        hasAudio: !!questionAudio,
      });
    } catch (error) {
      logger.error("[WebSocket] Failed to generate question, emitting fallback question", {
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

      try {
        const tr = await prisma.interviewTranscript.findFirst({
          where: { sessionId },
        });
        if (tr) {
          const qaData = (tr.qaData as any[]) || [];
          const existing = qaData.find((item: any) => item.questionIndex === questionIndex);
          if (existing) {
            existing.question = fallbackQuestion;
          } else {
            qaData.push({
              questionIndex,
              question: fallbackQuestion,
              answer: "",
              timestamp: new Date().toISOString(),
            });
          }
          await prisma.interviewTranscript.update({
            where: { id: tr.id },
            data: { qaData },
          });
        }
      } catch {}

      const fallbackPayload = {
        questionIndex,
        question: fallbackQuestion,
        questionAudio: fallbackAudio,
        totalQuestions: 10,
      };

      this.io.to(`session:${sessionId}`).emit("question", fallbackPayload);
    }
  }

  // Helper: Complete session

  private async completeSession(sessionId: string) {
    try {
      const session = await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
        include: {
          application: true,
        },
      });

      // If linked to an application, transition application status
      if (session.applicationId) {
        await prisma.application.update({
          where: { id: session.applicationId },
          data: {
            status: "INTERVIEW_COMPLETED",
          },
        });
      }

      // Notify all clients in session room
      this.io.to(`session:${sessionId}`).emit("session-completed", {
        message: "Interview completed successfully",
      });

      // Stop timeout monitoring and clean up session tracking
      this.timeoutManager.stopMonitoring(sessionId);
      sessionWeakTopics.delete(sessionId);

      // Queue background evaluation job for scorecard and resume feedback generation
      const candidateId =
        session.candidateId || session.application?.candidateId || "";
      await queueInterviewEvaluation({
        sessionId,
        candidateId,
      });

      logger.info("[WebSocket] Session completed and evaluation job queued", {
        sessionId,
        candidateId,
      });
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
      sessionWeakTopics.delete(sessionId);
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
