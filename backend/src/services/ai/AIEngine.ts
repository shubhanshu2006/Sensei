import { llmClient } from "./LLMClient.js";
import { resumeParser } from "./ResumeParser.js";
import { githubFetcher } from "./GitHubFetcher.js";
import { screeningService } from "./ScreeningService.js";
import { logger } from "../../utils/logger.js";
import type { SingleQuestionInput, SingleQuestionResult } from "./InterviewGraph.js";

export class AIEngine {
  // screenCandidate
  // Wrapper for screening service with enhanced logging and error handling.
  //
  // Used by: screening.service.ts (service layer)

  async screenCandidate(input: {
    resumeUrl: string;
    githubUrl?: string;
    jobDescription: string;
    jobTitle: string;
    requiredSkills: string[];
    experienceLevel: string;
  }) {
    try {
      logger.info("[AIEngine] Starting candidate screening", {
        jobTitle: input.jobTitle,
        hasGithub: !!input.githubUrl,
      });

      const result = await screeningService.screenCandidate(input);

      logger.info("[AIEngine] Screening completed", {
        score: result.overallMatchScore,
        decision: result.decision,
        processingTimeMs: result.processingTimeMs,
      });

      return result;
    } catch (error) {
      logger.error("[AIEngine] Screening failed", error);
      throw error;
    }
  }

  // parseResume
  // Direct access to resume parser for standalone use.

  async parseResume(resumeUrl: string) {
    return resumeParser.parseFromUrl(resumeUrl);
  }

  // analyzeGitHub
  // Direct access to GitHub fetcher for standalone use.

  async analyzeGitHub(githubUrl: string) {
    return githubFetcher.analyzeGitHub(githubUrl);
  }

  // generateText
  // Direct access to LLM for custom prompts.

  async generateText(
    promptTemplate: string,
    variables: Record<string, unknown>,
    config?: { temperature?: number; maxTokens?: number },
  ) {
    return llmClient.generateText(promptTemplate, variables, config);
  }

  // generateJSON
  // Direct access to LLM for structured outputs.

  async generateJSON<T extends Record<string, any>>(
    promptTemplate: string,
    variables: Record<string, unknown>,
    config?: { temperature?: number; maxTokens?: number },
  ) {
    return llmClient.generateJSON<T>(promptTemplate, variables, config);
  }

  // PHASE 3: Interview Methods
  // Now implemented with LangGraph and evaluation services

  async generateInterviewQuestions(input: {
    resumeText: string;
    jobDescription: string;
    jobTitle: string;
    requiredSkills: string[];
    targetQuestions?: number;
  }): Promise<string[]> {
    try {
      const { interviewGraph } = await import("./InterviewGraph.js");
      return interviewGraph.runInterview(input);
    } catch (error) {
      logger.error("[AIEngine] generateInterviewQuestions failed", error);
      throw error;
    }
  }

  async generateSingleQuestion(input: SingleQuestionInput): Promise<string> {
    try {
      const { interviewGraph } = await import("./InterviewGraph.js");
      return await interviewGraph.generateSingleQuestion(input);
    } catch (error) {
      logger.error("[AIEngine] generateSingleQuestion failed", error);
      throw error;
    }
  }

  async generateSingleQuestionDetailed(input: SingleQuestionInput): Promise<SingleQuestionResult> {
    try {
      const { interviewGraph } = await import("./InterviewGraph.js");
      return await interviewGraph.generateSingleQuestionDetailed(input);
    } catch (error) {
      logger.error("[AIEngine] generateSingleQuestionDetailed failed", error);
      throw error;
    }
  }

  // validateAnswerCorrectness
  // Fast LLM check (uses fast model, 5s timeout) to detect factually incorrect
  // but confidently-stated answers. Only runs on 'strong'/'adequate' answers.

  async validateAnswerCorrectness(input: {
    question: string;
    answer: string;
    topic: string;
    jobTitle: string;
  }): Promise<{ isCorrect: boolean; issue: string }> {
    try {
      const { llmClient } = await import("./LLMClient.js");
      const result = await llmClient.generateJSON<{ isCorrect: boolean; issue: string }>(
        `You are a senior technical interviewer. Quickly assess whether this interview answer contains any factual or technical inaccuracies.

Question asked: {question}
Candidate's answer: {answer}
Topic area: {topic}
Role: {jobTitle}

RULES:
- Focus ONLY on clear factual or technical errors — not on depth, completeness, or communication style.
- An incomplete or surface-level answer is NOT incorrect. Only flag objectively wrong claims.
- If the correctness is debatable or opinion-based, mark as correct.
- Examples of incorrect: wrong algorithm complexity, misattributing a feature to the wrong technology, stating incorrect API behavior.

Return JSON: {"isCorrect": true or false, "issue": "1-sentence description of the inaccuracy, or empty string if correct"}`,
        {
          question: input.question.substring(0, 500),
          answer: input.answer.substring(0, 1500),
          topic: input.topic,
          jobTitle: input.jobTitle,
        },
        { temperature: 0.1, maxTokens: 150, useFastModel: true, timeoutMs: 5000 },
      );

      return {
        isCorrect: result.isCorrect !== false,
        issue: result.issue || '',
      };
    } catch (error) {
      logger.warn("[AIEngine] Answer correctness validation failed, assuming correct", error);
      return { isCorrect: true, issue: '' };
    }
  }

  // evaluateAnswer
  // Comprehensive LLM-powered evaluation of a candidate's answer.
  // Replaces heuristic checks — every answer gets evaluated by the LLM across
  // correctness, depth, relevance, and specificity.
  // The evaluator receives the FULL question and answer (no truncation), plus the job
  // description, the candidate's resume and the conversation so far, so it can judge the
  // answer against what the role needs and what the candidate claims to have done.
  // Throws on failure so the caller can fall back to its own heuristic instead of
  // silently treating an unevaluated answer as "adequate".

  async evaluateAnswer(input: {
    question: string;
    answer: string;
    topic: string;
    jobTitle: string;
    jobDescription: string;
    requiredSkills: string[];
    resumeText?: string;
    conversationHistory?: string;
  }): Promise<{
    quality: 'strong' | 'adequate' | 'weak' | 'vague' | 'incorrect';
    isCorrect: boolean;
    correctnessIssue: string;
    gap: string;
    reasoning: string;
  }> {
    try {
      const { llmClient } = await import("./LLMClient.js");
      const result = await llmClient.generateJSON<{
        quality: string;
        isCorrect: boolean;
        correctnessIssue: string;
        gap: string;
        reasoning: string;
      }>(
        `You are a senior interviewer evaluating a candidate's answer during a live interview for {jobTitle}.

Job Description:
{jobDescription}

Required skills for role: {requiredSkills}

Candidate Resume:
{resumeText}

Interview so far (earlier turns, for context):
{conversationHistory}

--- ANSWER TO EVALUATE ---
Topic being assessed: {topic}
Question asked: {question}
Candidate's full answer: {answer}
--- END ---

Evaluate the answer on these 4 dimensions:
1. CORRECTNESS: Are the factual/technical claims accurate? Are there any objectively wrong statements?
2. DEPTH: Does the answer show genuine understanding or just surface-level knowledge?
3. RELEVANCE: Does the answer actually address the question, or does it dodge/deflect?
4. SPECIFICITY: Does the answer include concrete examples, metrics, or details — or is it generic?

Based on your evaluation, classify the answer:
- "strong": Correct, deep, relevant, and specific. Demonstrates genuine expertise.
- "adequate": Mostly correct and relevant, but could be deeper or more specific.
- "weak": Shallow, generic, or largely misses the point. Shows limited understanding.
- "vague": Non-committal, evasive, or too short to evaluate. Candidate is dodging.
- "incorrect": Contains clear factual/technical errors that the candidate stated confidently.

Return JSON:
{
  "quality": "strong" | "adequate" | "weak" | "vague" | "incorrect",
  "isCorrect": true or false,
  "correctnessIssue": "1-sentence description of the specific inaccuracy if incorrect, otherwise empty string",
  "gap": "1-sentence description of the most important thing missing, vague or unproven in the answer that a follow-up question should target (empty string if strong)",
  "reasoning": "1-sentence explanation of why you chose this quality rating"
}

RULES:
- Be fair but rigorous. An incomplete answer is "weak", not "incorrect".
- Only mark "incorrect" for objectively wrong claims, not opinions or debatable points.
- Judge against what the job description actually demands, and flag claims that contradict the resume.
- A long but generic answer that doesn't address the actual question is "weak" or "vague", not "strong".
- If quality is "incorrect", isCorrect MUST be false and correctnessIssue MUST be filled in.`,
        {
          question: input.question,
          answer: input.answer,
          topic: input.topic,
          jobTitle: input.jobTitle,
          jobDescription: (input.jobDescription || "").substring(0, 12000),
          requiredSkills: input.requiredSkills.slice(0, 15).join(", "),
          resumeText: (input.resumeText || "Not available").substring(0, 12000),
          conversationHistory: input.conversationHistory || "(this is the first answer)",
        },
        // Reasoning models spend completion tokens on hidden reasoning, so leave headroom.
        { temperature: 0.15, maxTokens: 1200, useFastModel: true, timeoutMs: 12000 },
      );

      const validQualities = ['strong', 'adequate', 'weak', 'vague', 'incorrect'];
      const quality = validQualities.includes(result.quality) ? result.quality as any : 'adequate';
      const isIncorrect = quality === 'incorrect' || result.isCorrect === false;

      return {
        quality: isIncorrect && quality !== 'incorrect' && result.correctnessIssue ? 'incorrect' : quality,
        isCorrect: !isIncorrect,
        correctnessIssue: result.correctnessIssue || '',
        gap: result.gap || '',
        reasoning: result.reasoning || '',
      };
    } catch (error) {
      logger.warn("[AIEngine] Answer evaluation failed", error);
      throw error;
    }
  }

  async generateInterviewScorecard(input: {
    jobTitle: string;
    jobDescription: string;
    requiredSkills: string[];
    resumeText: string;
    qaTranscript: Array<{
      question: string;
      answer: string;
      isFollowUp?: boolean;
      evaluation?: { quality?: string; correctnessIssue?: string; gap?: string };
    }>;
    category?: string;
    unassessedSkills?: string[];
  }): Promise<any> {
    try {
      const { evaluationService } = await import("./EvaluationService.js");
      return evaluationService.generateScorecard(input);
    } catch (error) {
      logger.error("[AIEngine] generateInterviewScorecard failed", error);
      throw error;
    }
  }

  async generateResumeFeedback(input: {
    resumeText: string;
    jobTitle: string;
    jobDescription?: string;
    careerGoals?: string;
    requiredSkills?: string[];
  }): Promise<any> {
    try {
      const { evaluationService } = await import("./EvaluationService.js");
      return evaluationService.generateResumeFeedback(input);
    } catch (error) {
      logger.error("[AIEngine] generateResumeFeedback failed", error);
      throw error;
    }
  }

  async analyzeInterviewResponse(input: {
    question: string;
    answer: string;
    expectedSkills: string[];
  }): Promise<any> {
    try {
      const { evaluationService } = await import("./EvaluationService.js");
      return evaluationService.analyzeAnswer(input);
    } catch (error) {
      logger.error("[AIEngine] analyzeInterviewResponse failed", error);
      throw error;
    }
  }

  // transcribeAudio
  // Transcribes audio using Groq Whisper (whisper-large-v3-turbo),
  // with OpenAI Whisper and Gemini Multimodal Audio as fallbacks.

  async transcribeAudio(audioBase64: string): Promise<string> {
    try {
      logger.info("[AIEngine] Starting audio transcription", {
        audioSizeKB: Math.round((audioBase64.length * 0.75) / 1024),
      });

      const startTime = Date.now();
      const { config } = await import("../../config/index.js");
      const groqApiKey = config.groq?.apiKey || process.env.GROQ_API_KEY;
      const audioBuffer = Buffer.from(audioBase64, "base64");

      // Option 1: Use Groq Whisper (Free tier, ultra-fast LPU inference)
      if (groqApiKey) {
        try {
          logger.info("[AIEngine] Transcribing audio with Groq Whisper");
          const OpenAI = (await import("openai")).default;
          const groq = new OpenAI({
            apiKey: groqApiKey,
            baseURL: "https://api.groq.com/openai/v1",
          });

          const audioFile = new File([audioBuffer], "audio.webm", {
            type: "audio/webm",
          });

          const candidateGroqModels = Array.from(
            new Set([
              config.groq?.whisperModel,
              "whisper-large-v3-turbo",
              "whisper-large-v3",
            ].filter(Boolean) as string[])
          );

          for (const model of candidateGroqModels) {
            try {
              logger.info(`[AIEngine] Attempting Groq Whisper transcription with model: ${model}`);
              const res = await groq.audio.transcriptions.create({
                file: audioFile,
                model,
                language: "en",
                response_format: "text",
              });

              const transcription = typeof res === "string" ? res.trim() : ((res as any)?.text || "").trim();
              if (transcription) {
                const processingTime = Date.now() - startTime;
                logger.info("[AIEngine] Groq Whisper audio transcription completed", {
                  model,
                  transcriptionLength: transcription.length,
                  processingTimeMs: processingTime,
                  preview: transcription.slice(0, 80),
                });
                return transcription;
              }
            } catch (modelErr: any) {
              logger.warn(`[AIEngine] Groq Whisper model ${model} failed: ${modelErr?.message || modelErr}`);
            }
          }
        } catch (groqErr: any) {
          logger.warn("[AIEngine] Groq Whisper failed, trying fallbacks", { error: groqErr?.message });
        }
      }

      // Option 2: Use OpenAI Whisper if OPENAI_API_KEY is provided
      if (process.env.OPENAI_API_KEY) {
        try {
          logger.info("[AIEngine] Transcribing audio with OpenAI Whisper (whisper-1)");
          const OpenAI = (await import("openai")).default;
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });

          const audioFile = new File([audioBuffer], "audio.webm", {
            type: "audio/webm",
          });

          const res = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "en",
            response_format: "text",
          });

          const transcription = typeof res === "string" ? res.trim() : ((res as any)?.text || "").trim();
          if (transcription) {
            const processingTime = Date.now() - startTime;
            logger.info("[AIEngine] OpenAI Whisper audio transcription completed", {
              transcriptionLength: transcription.length,
              processingTimeMs: processingTime,
            });
            return transcription;
          }
        } catch (openaiErr: any) {
          logger.warn("[AIEngine] OpenAI Whisper failed, trying Gemini", { error: openaiErr?.message });
        }
      }

      // Option 3: Native Gemini multimodal audio transcription using GOOGLE_API_KEY
      if (config.gemini?.apiKey || process.env.GOOGLE_API_KEY) {
        logger.info("[AIEngine] Transcribing audio with Gemini multimodal audio model");
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(config.gemini.apiKey || process.env.GOOGLE_API_KEY || "");

        const candidateModels = Array.from(
          new Set([
            config.gemini.model,
            "gemini-3.8-flash",
            "gemini-3.7-flash",
            "gemini-3.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-flash-latest",
          ].filter(Boolean))
        );

        let lastError: any = null;

        for (const modelName of candidateModels) {
          try {
            logger.info(`[AIEngine] Attempting audio transcription with model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent([
              {
                inlineData: {
                  data: audioBase64,
                  mimeType: "audio/webm",
                },
              },
              {
                text: "Listen carefully to this audio recording of a candidate answering a question during an interview. Transcribe the candidate's speech verbatim in English. Do NOT add any extra commentary, introductory notes, explanations, timestamps, or quotes. Output ONLY the raw transcribed words spoken by the user.",
              },
            ]);

            const transcription = result.response.text().trim();
            if (transcription) {
              const processingTime = Date.now() - startTime;
              logger.info(`[AIEngine] Gemini audio transcription succeeded with model: ${modelName}`, {
                transcriptionLength: transcription.length,
                processingTimeMs: processingTime,
                preview: transcription.slice(0, 80),
              });
              return transcription;
            }
          } catch (modelErr: any) {
            lastError = modelErr;
            logger.warn(`[AIEngine] Transcription model ${modelName} failed: ${modelErr.message || modelErr}`);
          }
        }

        if (lastError) {
          throw lastError;
        }
      }

      throw new Error("No transcription provider available (Configure GROQ_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY).");
    } catch (error) {
      logger.error("[AIEngine] Audio transcription failed", error);
      throw new Error(
        "Failed to transcribe audio. Please try again or use text mode.",
      );
    }
  }

  // generateSpeech
  // Generates speech audio from text using OpenAI TTS API for voice interviews
  // Returns base64 encoded audio that can be played on frontend

  async generateSpeech(
    text: string,
    voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
  ): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        logger.info(
          "[AIEngine] OPENAI_API_KEY not set — skipping server-side TTS audio (client will use browser speech synthesis)",
        );
        return "";
      }

      logger.info("[AIEngine] Starting speech generation", {
        textLength: text.length,
        voice,
      });

      const startTime = Date.now();

      // Import OpenAI for TTS API
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Call TTS API
      const mp3Response = await openai.audio.speech.create({
        model: "tts-1", // Use tts-1-hd for higher quality if needed
        voice: voice,
        input: text,
        response_format: "mp3",
        speed: 1.0, // Normal speed, can be 0.25 to 4.0
      });

      // Convert response to buffer
      const buffer = Buffer.from(await mp3Response.arrayBuffer());

      // Convert to base64 for transmission
      const audioBase64 = buffer.toString("base64");

      const processingTime = Date.now() - startTime;

      logger.info("[AIEngine] Speech generation completed", {
        audioSizeKB: Math.round(buffer.length / 1024),
        processingTimeMs: processingTime,
      });

      return audioBase64;
    } catch (error) {
      logger.error("[AIEngine] Speech generation failed", error);
      throw new Error(
        "Failed to generate speech audio. Falling back to text mode.",
      );
    }
  }
}

export const aiEngine = new AIEngine();
