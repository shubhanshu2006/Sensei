import OpenAI from "openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";

// ---------------------------------------------------------------------------
// LLMClient
//
// Dual-engine LLM client supporting:
// 1. Groq (OpenAI-compatible endpoint):
//    - Primary Model: openai/gpt-oss-120b (high reasoning, scorecard evaluation)
//    - Fast Model: openai/gpt-oss-20b (low-latency adaptive questioning)
//    - Fallbacks: llama-3.3-70b-versatile, llama-3.1-8b-instant
// 2. Google Gemini (fallback):
//    - gemini-3.8-flash, gemini-3.7-flash, gemini-2.5-flash
// ---------------------------------------------------------------------------

export interface LLMConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  timeoutMs?: number;
  useFastModel?: boolean;
}

interface ModelCandidate {
  provider: "groq" | "gemini";
  model: string;
}

export class LLMClient {
  private groqClient: OpenAI | null = null;
  private defaultConfig: LLMConfig;

  constructor() {
    const groqKey = config.groq?.apiKey || process.env.GROQ_API_KEY || "";
    if (groqKey) {
      this.groqClient = new OpenAI({
        apiKey: groqKey,
        baseURL: "https://api.groq.com/openai/v1",
      });
      logger.info(
        `[LLMClient] Initialized with Groq (Primary: ${config.groq?.primaryModel || "openai/gpt-oss-120b"}, Fast: ${config.groq?.fastModel || "openai/gpt-oss-20b"})`,
      );
    } else {
      logger.warn(
        "[LLMClient] GROQ_API_KEY not configured. Falling back to Gemini.",
      );
    }

    this.defaultConfig = {
      temperature: 0.3,
      maxTokens: 3500,
      topP: 0.9,
    };
  }

  private formatPrompt(
    template: string,
    variables: Record<string, unknown>,
  ): string {
    // Single pass with a replacer function: user-provided values (answers, resume text)
    // are never re-scanned for placeholders and `$&`-style sequences are kept literal.
    return template.replace(/\{(\w+)\}/g, (match, key: string) =>
      Object.prototype.hasOwnProperty.call(variables, key)
        ? String(variables[key] ?? "")
        : match,
    );
  }

  private getCandidateModels(isFast: boolean = false): ModelCandidate[] {
    const candidates: ModelCandidate[] = [];
    const groqKey = config.groq?.apiKey || process.env.GROQ_API_KEY || "";

    if (groqKey) {
      const primary = config.groq?.primaryModel || "openai/gpt-oss-120b";
      const fast = config.groq?.fastModel || "openai/gpt-oss-20b";

      if (isFast) {
        candidates.push({ provider: "groq", model: fast });
        candidates.push({ provider: "groq", model: primary });
      } else {
        candidates.push({ provider: "groq", model: primary });
        candidates.push({ provider: "groq", model: fast });
      }

      // Additional Groq open-source fallbacks
      candidates.push({ provider: "groq", model: "llama-3.3-70b-versatile" });
      candidates.push({ provider: "groq", model: "llama-3.1-8b-instant" });
    }

    // Gemini fallback
    const geminiKey = config.gemini?.apiKey || process.env.GOOGLE_API_KEY;
    if (geminiKey) {
      candidates.push({
        provider: "gemini",
        model: config.gemini?.model || "gemini-3.8-flash",
      });
      candidates.push({ provider: "gemini", model: "gemini-3.7-flash" });
      candidates.push({ provider: "gemini", model: "gemini-3.5-flash" });
      candidates.push({ provider: "gemini", model: "gemini-flash-latest" });
    }

    return candidates;
  }

  // -------------------------------------------------------------------------
  // generateText
  // -------------------------------------------------------------------------
  async generateText(
    promptTemplate: string,
    variables: Record<string, unknown>,
    userConfig: LLMConfig = {},
  ): Promise<string> {
    const formatted = this.formatPrompt(promptTemplate, variables);
    const candidateModels = this.getCandidateModels(Boolean(userConfig.useFastModel));
    const timeoutMs = userConfig.timeoutMs ?? 20000;
    const mergedConfig = { ...this.defaultConfig, ...userConfig };
    let lastError: any;

    if (candidateModels.length === 0) {
      throw new ApiError(500, "No LLM providers configured (neither GROQ_API_KEY nor GOOGLE_API_KEY is available)");
    }

    for (let i = 0; i < candidateModels.length; i++) {
      const candidate = candidateModels[i];
      try {
        if (candidate.provider === "groq" && this.groqClient) {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    `Timeout after ${Math.round(timeoutMs / 1000)}s on Groq ${candidate.model}`,
                  ),
                ),
              timeoutMs,
            ),
          );

          const apiPromise = this.groqClient.chat.completions.create({
            model: candidate.model,
            messages: [
              {
                role: "system",
                content: "You are an expert AI interviewer and assessment specialist.",
              },
              { role: "user", content: formatted },
            ],
            temperature: mergedConfig.temperature,
            max_tokens: mergedConfig.maxTokens,
            top_p: mergedConfig.topP,
          });

          const response = await Promise.race([apiPromise, timeoutPromise]);
          const result = response.choices[0]?.message?.content || "";

          logger.info("[LLMClient] Text generated successfully", {
            provider: "groq",
            model: candidate.model,
            tokens: response.usage?.total_tokens,
          });

          return result.trim();
        } else {
          // Gemini fallback
          const geminiModel = new ChatGoogleGenerativeAI({
            apiKey: config.gemini.apiKey,
            model: candidate.model,
            temperature: mergedConfig.temperature,
            maxOutputTokens: mergedConfig.maxTokens ?? 3500,
            topP: mergedConfig.topP,
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    `Timeout after ${Math.round(timeoutMs / 1000)}s on Gemini ${candidate.model}`,
                  ),
                ),
              timeoutMs,
            ),
          );

          const response = await Promise.race([
            geminiModel.invoke(formatted),
            timeoutPromise,
          ]);

          const result =
            typeof response.content === "string"
              ? response.content
              : Array.isArray(response.content)
                ? response.content
                    .map((c) => (typeof c === "string" ? c : (c as any).text || ""))
                    .join("")
                : JSON.stringify(response.content);

          logger.info("[LLMClient] Text generated successfully", {
            provider: "gemini",
            model: candidate.model,
          });

          return result.trim();
        }
      } catch (error: any) {
        lastError = error;
        logger.warn(
          `[LLMClient] Model ${candidate.provider}:${candidate.model} failed (${error?.message || error}), failing over...`,
        );
        if (i < candidateModels.length - 1) continue;
      }
    }

    logger.error("[LLMClient] Text generation failed on all models", lastError);
    throw new ApiError(500, `AI text generation failed: ${lastError?.message || lastError}`);
  }

  // -------------------------------------------------------------------------
  // generateJSON
  // -------------------------------------------------------------------------
  async generateJSON<T extends Record<string, any> = Record<string, unknown>>(
    promptTemplate: string,
    variables: Record<string, unknown>,
    userConfig: LLMConfig = {},
  ): Promise<T> {
    const formatted =
      this.formatPrompt(promptTemplate, variables) +
      "\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested schema. Do not enclose in backticks or markdown, and do not include extra explanations.";

    const candidateModels = this.getCandidateModels(Boolean(userConfig.useFastModel));
    const timeoutMs = userConfig.timeoutMs ?? 30000;
    const mergedConfig = { ...this.defaultConfig, ...userConfig };
    let lastError: any;

    if (candidateModels.length === 0) {
      throw new ApiError(500, "No LLM providers configured (neither GROQ_API_KEY nor GOOGLE_API_KEY is available)");
    }

    for (let i = 0; i < candidateModels.length; i++) {
      const candidate = candidateModels[i];
      try {
        let rawText = "";

        if (candidate.provider === "groq" && this.groqClient) {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    `Timeout after ${Math.round(timeoutMs / 1000)}s on Groq ${candidate.model}`,
                  ),
                ),
              timeoutMs,
            ),
          );

          const apiPromise = this.groqClient.chat.completions.create({
            model: candidate.model,
            messages: [
              {
                role: "system",
                content:
                  "You are an expert AI interview and assessment engine. You must respond strictly with a valid JSON object matching the requested schema. Do NOT include markdown code blocks, backticks, or preamble.",
              },
              { role: "user", content: formatted },
            ],
            temperature: mergedConfig.temperature,
            max_tokens: mergedConfig.maxTokens,
            top_p: mergedConfig.topP,
            response_format: { type: "json_object" },
          });

          const response = await Promise.race([apiPromise, timeoutPromise]);
          rawText = response.choices[0]?.message?.content || "";

          logger.info("[LLMClient] JSON generated successfully", {
            provider: "groq",
            model: candidate.model,
            tokens: response.usage?.total_tokens,
          });
        } else {
          // Gemini fallback
          const geminiModel = new ChatGoogleGenerativeAI({
            apiKey: config.gemini.apiKey,
            model: candidate.model,
            temperature: mergedConfig.temperature,
            maxOutputTokens: mergedConfig.maxTokens ?? 3500,
            topP: mergedConfig.topP,
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    `Timeout after ${Math.round(timeoutMs / 1000)}s on Gemini ${candidate.model}`,
                  ),
                ),
              timeoutMs,
            ),
          );

          const response = await Promise.race([
            geminiModel.invoke(formatted),
            timeoutPromise,
          ]);

          rawText =
            typeof response.content === "string"
              ? response.content
              : Array.isArray(response.content)
                ? response.content
                    .map((c) => (typeof c === "string" ? c : (c as any).text || ""))
                    .join("")
                : JSON.stringify(response.content);
        }

        let cleaned = rawText
          .trim()
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleaned = jsonMatch[0];
        }

        let result: T;
        try {
          result = JSON.parse(cleaned) as T;
        } catch (parseError: any) {
          // Attempt basic recovery for unclosed trailing strings/braces
          try {
            let repaired = cleaned;
            const openQuotes = (repaired.match(/(?<!\\)"/g) || []).length;
            if (openQuotes % 2 !== 0) repaired += '"';
            const openBraces = (repaired.match(/\{/g) || []).length;
            const closeBraces = (repaired.match(/\}/g) || []).length;
            for (let b = 0; b < openBraces - closeBraces; b++) repaired += "}";
            result = JSON.parse(repaired) as T;
          } catch {
            throw parseError;
          }
        }

        logger.info("[LLMClient] JSON parsing completed", {
          provider: candidate.provider,
          model: candidate.model,
          outputKeys: Object.keys(result as object).length,
        });

        return result;
      } catch (error: any) {
        lastError = error;
        logger.warn(
          `[LLMClient] JSON model ${candidate.provider}:${candidate.model} failed (${error?.message || error}), failing over...`,
        );
        if (i < candidateModels.length - 1) continue;
      }
    }

    logger.error("[LLMClient] JSON generation failed on all models", lastError);
    throw new ApiError(500, `AI structured output generation failed: ${lastError?.message || lastError}`);
  }

  // -------------------------------------------------------------------------
  // generateWithRetry
  // -------------------------------------------------------------------------
  async generateWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const delay = baseDelay * Math.pow(2, attempt);

        logger.warn(
          `[LLMClient] Attempt ${attempt + 1} failed, retrying in ${delay}ms`,
          {
            error: lastError.message,
          },
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    logger.error("[LLMClient] All retry attempts failed", lastError);
    throw new ApiError(500, "AI service unavailable after retries");
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export const llmClient = new LLMClient();
