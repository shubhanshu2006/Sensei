import { llmClient } from "./LLMClient.js";
import { resumeParser } from "./ResumeParser.js";
import { githubFetcher } from "./GitHubFetcher.js";
import { screeningService } from "./ScreeningService.js";
import { logger } from "../../utils/logger.js";

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

  async generateSingleQuestion(input: {
    resumeText: string;
    jobDescription: string;
    jobTitle: string;
    requiredSkills: string[];
    questionIndex: number;
    previousQuestions: string[];
  }): Promise<string> {
    try {
      const { interviewGraph } = await import("./InterviewGraph.js");
      return interviewGraph.generateSingleQuestion(input);
    } catch (error) {
      logger.error("[AIEngine] generateSingleQuestion failed", error);
      throw error;
    }
  }

  async generateInterviewScorecard(input: {
    jobTitle: string;
    jobDescription: string;
    requiredSkills: string[];
    resumeText: string;
    qaTranscript: Array<{ question: string; answer: string }>;
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
    careerGoals?: string;
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
  // Transcribes audio using OpenAI Whisper API for voice interview mode

  async transcribeAudio(audioBase64: string): Promise<string> {
    try {
      logger.info("[AIEngine] Starting audio transcription", {
        audioSizeKB: Math.round((audioBase64.length * 0.75) / 1024),
      });

      const startTime = Date.now();

      // Import OpenAI for Whisper API
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioBase64, "base64");

      // Create a file-like object for OpenAI API
      const audioFile = new File([audioBuffer], "audio.webm", {
        type: "audio/webm",
      });

      // Call Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en", // Can be made dynamic
        response_format: "text",
      });

      const processingTime = Date.now() - startTime;

      logger.info("[AIEngine] Audio transcription completed", {
        transcriptionLength: transcription.length,
        processingTimeMs: processingTime,
      });

      return transcription;
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
