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
    quality: 'strong' | 'adequate' | 'weak' | 'vague' | 'incorrect' | 'off_topic' | 'abusive';
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

Perform a comprehensive analysis on the following dimensions:
1. CANDIDATE INTENT & INTERVIEW CONTEXT:
   - Is the candidate engaging with the interview?
   - CLARIFICATION REQUESTS: If the candidate says "I didn't understand", "Could you clarify?", "Can you explain what you mean?", "Could you repeat that?", "I don't follow", or similar expressions, this is a normal clarification request directly about the interview question. It is NOT off-topic and NOT abusive.
   - ADMISSION OF KNOWLEDGE GAP: If the candidate says "I don't know", "I am not sure", "I have no idea", "Haven't worked with that", "I can't recall", they are honestly admitting they do not know the answer. This is a legitimate interview answer demonstrating a knowledge gap. It is NOT off-topic and NOT abusive.
   - OFF-TOPIC DIVERSION: The candidate is completely abandoning the interview to ask the interviewer unrelated questions (e.g. asking "who is the PM of India", "who created you", "what is the weather", talking about politics, sports, movies, personal questions to the interviewer, or casual non-interview chit-chat).
2. PROFESSIONAL CONDUCT:
   - Does the response contain profanity, foul language, slurs, threats, sexually explicit language, or hostile insults (e.g. "fuck off", "stfu", vulgar abuses)?
3. TECHNICAL / FACTUAL CORRECTNESS:
   - Are the technical statements correct? Did they make confident but objectively incorrect assertions?
4. DEPTH & SPECIFICITY:
   - Does the answer demonstrate deep architectural/practical understanding, or is it shallow/generic?

Based on your analysis, classify the quality into EXACTLY one of these categories:
- "abusive": Candidate used profanity, slurs, vulgarity, threats, or abusive/hostile language (e.g. "fuck off", "shut up", vulgar insults). This takes HIGHEST priority.
- "off_topic": Candidate is NOT answering or attempting to engage with the interview topic. Instead, they are deliberately asking unrelated non-interview questions (e.g. "who is the PM of India", "who created you", "what's the weather", chatting about personal life, politics, movies, etc.) or derailing the session.
  CRITICAL: NEVER classify as "off_topic" if the candidate says they didn't understand ("I didn't understand", "can you clarify?"). That is a clarification request, classified as "vague".
  CRITICAL: NEVER classify as "off_topic" if the candidate says they don't know ("I don't know", "not sure"). That is an admission of lack of knowledge, classified as "weak".
- "strong": Correct, deep, relevant, and specific. Demonstrates genuine expertise.
- "adequate": Mostly correct and relevant, but could be deeper or more specific.
- "weak": Shallow, generic, largely misses the point, or candidate admits they do not know / have not worked with the concept ("I don't know", "not sure", "no idea").
- "vague": Candidate expresses that they did not understand the question ("I didn't understand", "can you explain?", "what do you mean?"), or gives an evasive, non-committal, or excessively brief answer.
- "incorrect": Contains clear factual or technical errors that the candidate stated confidently.

Return JSON:
{
  "quality": "strong" | "adequate" | "weak" | "vague" | "incorrect" | "off_topic" | "abusive",
  "isCorrect": true or false,
  "correctnessIssue": "1-sentence description of the specific inaccuracy if incorrect, otherwise empty string",
  "gap": "1-sentence description of what is missing, unclear, or what clarification is needed (empty string if strong)",
  "reasoning": "1-sentence explanation of why you chose this quality rating based on normal analysis"
}

RULES:
- "abusive" is strictly for vulgar, profane, threatening, or hostile language.
- "off_topic" is strictly for genuine non-interview diversions (asking general knowledge questions to interviewer, small talk, derailing).
- "I didn't understand", "Could you rephrase?", "What do you mean?", "Can you explain?" MUST be classified as "vague" with gap noting that the candidate needs the question rephrased or clarified.
- "I don't know", "I am not sure", "I have no idea", "I haven't worked with that" MUST be classified as "weak" with gap noting candidate's unfamiliarity with the topic.
- Be fair and objective. Judge against what the job description actually demands.`,
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

      const validQualities = ['strong', 'adequate', 'weak', 'vague', 'incorrect', 'off_topic', 'abusive'];
      const quality = validQualities.includes(result.quality) ? result.quality as any : 'adequate';
      const isIncorrect = quality === 'incorrect' || result.isCorrect === false;

      let resolvedQuality = quality;
      if (quality !== 'off_topic' && quality !== 'abusive') {
        if (isIncorrect && quality !== 'incorrect' && result.correctnessIssue) {
          resolvedQuality = 'incorrect';
        }
      }

      return {
        quality: resolvedQuality,
        isCorrect: quality === 'off_topic' || quality === 'abusive' ? false : !isIncorrect,
        correctnessIssue: result.correctnessIssue || '',
        gap: result.gap || '',
        reasoning: result.reasoning || '',
      };
    } catch (error) {
      logger.warn("[AIEngine] Answer evaluation failed", error);
      throw error;
    }
  }

  // generateReframedWarningQuestion
  // Dynamically generates a reframed question after off-topic or abusive behavior
  // instead of verbatim copy-pasting the previous question.

  async generateReframedWarningQuestion(input: {
    candidateName: string;
    jobTitle: string;
    topic: string;
    baseQuestion: string;
    type: 'off_topic' | 'abusive';
    candidateAnswer: string;
  }): Promise<string> {
    try {
      const { llmClient } = await import("./LLMClient.js");

      const prompt = `You are a sharp, authoritative, and professional senior interviewer conducting a live interview for {jobTitle}.
Candidate Name: {candidateName}
Role: {jobTitle}
Core Topic: {topic}
Original Question Context: {baseQuestion}
Candidate's Inappropriate Response: "{candidateAnswer}"

Situation:
The candidate just responded inappropriately with {violationType}:
{violationGuidance}

YOUR TASK:
Speak directly to {candidateName} in 2 to 3 natural spoken sentences total:
1. ADDRESS THE BEHAVIOR FIRMLY:
   - If ABUSIVE: Issue a strict, professional warning that foul, disrespectful, or abusive language is unacceptable and grounds for immediate disqualification, and demand professional conduct.
   - If OFF-TOPIC: Firmly remind them that you are strictly here for the {jobTitle} interview, decline to answer their non-interview query, and tell them to stay focused on the interview.
2. REFRAME THE QUESTION NATURALLY (CRITICAL):
   - DO NOT copy-paste the original question verbatim.
   - DO NOT use boilerplate prefixes like "Now, let's return to the question:".
   - DO NOT include opening greetings or pleasantries (no "Welcome", "Thank you for joining us").
   - Frame a fresh, direct, and concise technical question targeting {topic}.
   - Demand concrete depth on how they would solve or implement it.

RULES:
- ZERO HALLUCINATION (STRICT): Only reference what the candidate actually said in "{candidateAnswer}". Never invent or hallucinate topics they did not ask about (e.g. NEVER mention war, politics, or random unrelated subjects that the candidate did not explicitly say).
- Total length: exactly 2 to 3 spoken sentences.
- Speak naturally and authoritatively like a seasoned human interviewer.
- Return ONLY the exact words spoken by the interviewer. Never include prefixes like "Interviewer:" or quotation marks.`;

      const violationType = input.type === 'abusive' ? 'ABUSIVE / PROFANE LANGUAGE' : 'OFF-TOPIC NON-INTERVIEW QUERY';
      const violationGuidance = input.type === 'abusive'
        ? 'The candidate used profanity, slurs, or abusive language.'
        : 'The candidate asked unrelated questions (e.g. general knowledge, personal questions, who created you) instead of answering the interview question.';

      const result = await llmClient.generateText(prompt, {
        candidateName: input.candidateName,
        jobTitle: input.jobTitle,
        topic: input.topic,
        baseQuestion: input.baseQuestion,
        candidateAnswer: input.candidateAnswer,
        violationType,
        violationGuidance,
      }, { temperature: 0.25, maxTokens: 350, useFastModel: true });

      const cleaned = result.trim().replace(/^["']|["']$/g, '');
      if (cleaned.length > 20) {
        return cleaned;
      }
    } catch (err) {
      logger.warn("[AIEngine] generateReframedWarningQuestion failed, using fallback", err);
    }

    // High quality fallback if LLM call fails
    if (input.type === 'abusive') {
      return `${input.candidateName}, I must issue a strict warning: abusive or disrespectful language is completely unacceptable and grounds for immediate disqualification. Please maintain professional conduct. Now, tell me specifically how you approach ${input.topic} in production.`;
    }
    return `${input.candidateName}, we are here strictly for your ${input.jobTitle} interview, not for general knowledge or unrelated topics. Let's focus on your technical capabilities. To proceed, could you explain how you handle ${input.topic}?`;
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
      const groqApiKeys: string[] = (config.groq as any)?.apiKeys?.length > 0
        ? (config.groq as any).apiKeys
        : Array.from(
            new Set(
              [
                config.groq?.apiKey,
                process.env.GROQ_API_KEY_1,
                process.env.GROQ_API_KEY,
                process.env.GROQ_API_KEY_2,
                process.env.GROQ_API_KEY_3,
                process.env.GROQ_API_KEY_4,
                process.env.GROQ_API_KEY_5,
                process.env.GROQ_API_KEY_SECONDARY,
                ...(process.env.GROQ_API_KEYS ? process.env.GROQ_API_KEYS.split(",") : []),
              ]
                .map((k) => k?.trim())
                .filter(Boolean) as string[],
            ),
          );
      const audioBuffer = Buffer.from(audioBase64, "base64");

      // Option 1: Use Groq Whisper with multi-key failover (Free tier, ultra-fast LPU inference)
      if (groqApiKeys.length > 0) {
        for (let k = 0; k < groqApiKeys.length; k++) {
          const currentKey = groqApiKeys[k];
          const maskedKey = currentKey.length > 8 ? `${currentKey.slice(0, 4)}...${currentKey.slice(-4)}` : `key #${k + 1}`;
          try {
            logger.info(`[AIEngine] Transcribing audio with Groq Whisper (key ${k + 1}/${groqApiKeys.length}: ${maskedKey})`);
            const OpenAI = (await import("openai")).default;
            const groq = new OpenAI({
              apiKey: currentKey,
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
                    key: maskedKey,
                    model,
                    transcriptionLength: transcription.length,
                    processingTimeMs: processingTime,
                    preview: transcription.slice(0, 80),
                  });
                  return transcription;
                }
              } catch (modelErr: any) {
                logger.warn(`[AIEngine] Groq Whisper model ${model} failed on key ${maskedKey}: ${modelErr?.message || modelErr}`);
              }
            }
          } catch (groqErr: any) {
            logger.warn(`[AIEngine] Groq Whisper key ${maskedKey} failed, attempting next key if available: ${groqErr?.message || groqErr}`);
          }
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
