import OpenAI from "openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";

// ---------------------------------------------------------------------------
// LLMClient
//
// Dual-engine LLM client supporting:
// 1. Groq (Primary with Multi-Key Pool & Automatic Key Failover):
//    - Automatically manages multiple Groq keys (GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_SECONDARY, GROQ_API_KEYS)
//    - When Key 1 hits rate limit (429 / quota limit), it sets a 60s cooldown and seamlessly switches to Key 2
//    - Primary Model: openai/gpt-oss-120b (high reasoning, scorecard evaluation)
//    - Fast Model: openai/gpt-oss-20b (low-latency adaptive questioning)
//    - Fallbacks: llama-3.3-70b-versatile, llama-3.1-8b-instant
// 2. Hugging Face Router (Fallback when all Groq keys are exhausted):
//    - Routes to Groq backend using identical models: openai/gpt-oss-120b:groq, openai/gpt-oss-20b:groq
//    - Base URL: https://router.huggingface.co/v1
// 3. Google Gemini (Terminal fallback):
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

interface GroqClientInstance {
  client: OpenAI;
  keyIndex: number;
  name: string; // e.g. "Key 1", "Key 2", etc.
  apiKey: string;
  maskedKey: string;
  rateLimitedUntil: number; // timestamp in ms until cooldown expires
}

export class LLMClient {
  private groqClients: GroqClientInstance[] = [];
  private hfClient: OpenAI | null = null;
  private defaultConfig: LLMConfig;

  constructor() {
    // Collect all configured Groq keys from config & environment variables
    const rawKeys: string[] =
      (config.groq as any)?.apiKeys?.length > 0
        ? (config.groq as any).apiKeys
        : [
            process.env.GROQ_API_KEY_1,
            config.groq?.apiKey,
            process.env.GROQ_API_KEY_2,
            process.env.GROQ_API_KEY_3,
            process.env.GROQ_API_KEY_4,
            process.env.GROQ_API_KEY_5,
            (config.groq as any)?.secondaryApiKey,
            process.env.GROQ_API_KEY,
            process.env.GROQ_API_KEY_SECONDARY,
            ...(process.env.GROQ_API_KEYS ? process.env.GROQ_API_KEYS.split(",") : []),
          ];

    const uniqueKeys = Array.from(
      new Set(rawKeys.map((k) => k?.trim()).filter(Boolean) as string[]),
    );

    this.groqClients = uniqueKeys.map((key, index) => {
      const maskedKey =
        key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : "***";
      return {
        client: new OpenAI({
          apiKey: key,
          baseURL: "https://api.groq.com/openai/v1",
        }),
        keyIndex: index + 1,
        name: `Key ${index + 1}`,
        apiKey: key,
        maskedKey,
        rateLimitedUntil: 0,
      };
    });

    if (this.groqClients.length > 0) {
      const keyList = this.groqClients
        .map((c) => `${c.name} (${c.maskedKey})`)
        .join(", ");
      logger.info(
        `[LLMClient] Initialized with ${this.groqClients.length} Groq key(s) [${keyList}] (Primary: ${config.groq?.primaryModel || "openai/gpt-oss-120b"}, Fast: ${config.groq?.fastModel || "openai/gpt-oss-20b"})`,
      );
    } else {
      logger.warn(
        "[LLMClient] GROQ_API_KEY not configured. Falling back to Gemini.",
      );
    }

    // Initialize Hugging Face router fallback (routes to Groq backend if all Groq keys hit rate limits)
    const hfKey =
      config.huggingface?.apiKey ||
      process.env.HF_TOKEN ||
      process.env.HUGGINGFACE_API_KEY ||
      "";
    if (hfKey) {
      this.hfClient = new OpenAI({
        apiKey: hfKey,
        baseURL:
          config.huggingface?.baseUrl || "https://router.huggingface.co/v1",
      });
      logger.info(
        "[LLMClient] Initialized Hugging Face router fallback (provider: Groq, endpoint: https://router.huggingface.co/v1)",
      );
    } else {
      logger.info(
        "[LLMClient] HF_TOKEN not configured. Hugging Face fallback disabled until HF_TOKEN is provided.",
      );
    }

    this.defaultConfig = {
      temperature: 0.3,
      maxTokens: 3500,
      topP: 0.9,
    };
  }

  /**
   * Returns Groq clients, prioritizing those not currently in a rate-limit cooldown.
   */
  private getActiveGroqClients(): GroqClientInstance[] {
    const now = Date.now();
    const available = this.groqClients.filter((c) => c.rateLimitedUntil <= now);
    if (available.length > 0) {
      return available;
    }
    // If all keys are currently marked as rate-limited, return all sorted by
    // cooldown expiration ascending so the one closest to expiry is retried first.
    return [...this.groqClients].sort(
      (a, b) => a.rateLimitedUntil - b.rateLimitedUntil,
    );
  }

  /**
   * Lazily retrieve or initialize the Hugging Face router client
   */
  private getHfClient(): OpenAI | null {
    if (this.hfClient) return this.hfClient;
    const hfKey =
      config.huggingface?.apiKey ||
      process.env.HF_TOKEN ||
      process.env.HUGGINGFACE_API_KEY ||
      "";
    if (hfKey) {
      this.hfClient = new OpenAI({
        apiKey: hfKey,
        baseURL:
          config.huggingface?.baseUrl || "https://router.huggingface.co/v1",
      });
      return this.hfClient;
    }
    return null;
  }

  /**
   * Checks whether an error is a rate limit or capacity exhaustion error
   */
  private isRateLimitOrCapacityError(error: any): boolean {
    if (!error) return false;
    const status = error.status || error.statusCode || error.response?.status;
    if (status === 429 || status === 503) return true;
    const msg = String(error.message || "").toLowerCase();
    const code = String(error.code || "").toLowerCase();
    return (
      code === "rate_limit_exceeded" ||
      code === "insufficient_quota" ||
      msg.includes("rate limit") ||
      msg.includes("rate_limit") ||
      msg.includes("too many requests") ||
      msg.includes("429") ||
      msg.includes("tpm") ||
      msg.includes("rpm") ||
      msg.includes("tokens per minute") ||
      msg.includes("requests per minute") ||
      msg.includes("capacity") ||
      msg.includes("overloaded")
    );
  }

  private formatPrompt(
    template: string,
    variables: Record<string, unknown>,
  ): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) =>
      Object.prototype.hasOwnProperty.call(variables, key)
        ? String(variables[key] ?? "")
        : match,
    );
  }

  private getCandidateModels(isFast: boolean = false): ModelCandidate[] {
    const candidates: ModelCandidate[] = [];
    const hasGroq = this.groqClients.length > 0;

    if (hasGroq) {
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

    // Gemini terminal fallback
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
  // Hugging Face Fallback Callers (Preserves Groq as provider & identical model)
  // -------------------------------------------------------------------------

  private async callHuggingFaceText(
    model: string,
    prompt: string,
    mergedConfig: LLMConfig,
    timeoutMs: number,
  ): Promise<string> {
    const client = this.getHfClient();
    if (!client) {
      throw new Error(
        "Hugging Face client is not initialized (missing HF_TOKEN)",
      );
    }

    // On Hugging Face router, specifying provider is done via the :groq suffix
    // We try `${model}:groq` first to explicitly route to Groq on Hugging Face,
    // and fall back to `${model}` if needed.
    const candidateHfModels = [`${model}:groq`, model];

    let lastHfError: any;
    for (const hfModel of candidateHfModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `Timeout after ${Math.round(timeoutMs / 1000)}s on Hugging Face router (${hfModel})`,
                ),
              ),
            timeoutMs,
          ),
        );

        const apiPromise = client.chat.completions.create({
          model: hfModel,
          messages: [
            {
              role: "system",
              content:
                "You are an expert AI interviewer and assessment specialist.",
            },
            { role: "user", content: prompt },
          ],
          temperature: mergedConfig.temperature,
          max_tokens: mergedConfig.maxTokens,
          top_p: mergedConfig.topP,
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);
        const result = response.choices[0]?.message?.content || "";

        logger.info(
          "[LLMClient] Text generated successfully via Hugging Face fallback (Groq provider)",
          {
            model: hfModel,
            tokens: response.usage?.total_tokens,
          },
        );

        return result;
      } catch (err: any) {
        lastHfError = err;
        logger.warn(
          `[LLMClient] Hugging Face attempt failed with model string "${hfModel}": ${err?.message || err}`,
        );
      }
    }

    throw lastHfError;
  }

  private async callHuggingFaceJSON(
    model: string,
    formatted: string,
    mergedConfig: LLMConfig,
    timeoutMs: number,
  ): Promise<string> {
    const client = this.getHfClient();
    if (!client) {
      throw new Error(
        "Hugging Face client is not initialized (missing HF_TOKEN)",
      );
    }

    const candidateHfModels = [`${model}:groq`, model];

    let lastHfError: any;
    for (const hfModel of candidateHfModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `Timeout after ${Math.round(timeoutMs / 1000)}s on Hugging Face router (${hfModel})`,
                ),
              ),
            timeoutMs,
          ),
        );

        const apiPromise = client.chat.completions.create({
          model: hfModel,
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
        const rawText = response.choices[0]?.message?.content || "";

        logger.info(
          "[LLMClient] JSON generated successfully via Hugging Face fallback (Groq provider)",
          {
            model: hfModel,
            tokens: response.usage?.total_tokens,
          },
        );

        return rawText;
      } catch (err: any) {
        lastHfError = err;
        logger.warn(
          `[LLMClient] Hugging Face JSON attempt failed with model string "${hfModel}": ${err?.message || err}`,
        );
      }
    }

    throw lastHfError;
  }

  /**
   * Helper to clean, extract, parse and repair JSON from model outputs
   */
  private parseAndRepairJSON<T>(
    rawText: string,
    provider: string,
    model: string,
  ): T {
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
      provider,
      model,
      outputKeys: Object.keys(result as object).length,
    });

    return result;
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
    const candidateModels = this.getCandidateModels(
      Boolean(userConfig.useFastModel),
    );
    const timeoutMs = userConfig.timeoutMs ?? 20000;
    const mergedConfig = { ...this.defaultConfig, ...userConfig };
    let lastError: any;

    if (candidateModels.length === 0) {
      throw new ApiError(
        500,
        "No LLM providers configured (neither GROQ_API_KEY, HF_TOKEN nor GOOGLE_API_KEY is available)",
      );
    }

    for (let i = 0; i < candidateModels.length; i++) {
      const candidate = candidateModels[i];
      try {
        if (candidate.provider === "groq" && this.groqClients.length > 0) {
          const activeGroqClients = this.getActiveGroqClients();
          let lastGroqError: any = null;

          for (let k = 0; k < activeGroqClients.length; k++) {
            const groqInstance = activeGroqClients[k];
            try {
              const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(
                  () =>
                    reject(
                      new Error(
                        `Timeout after ${Math.round(timeoutMs / 1000)}s on Groq ${candidate.model} [Key: ${groqInstance.maskedKey}]`,
                      ),
                    ),
                  timeoutMs,
                ),
              );

              const apiPromise = groqInstance.client.chat.completions.create({
                model: candidate.model,
                messages: [
                  {
                    role: "system",
                    content:
                      "You are an expert AI interviewer and assessment specialist.",
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
                key: groqInstance.maskedKey,
                model: candidate.model,
                tokens: response.usage?.total_tokens,
              });

              return result.trim();
            } catch (groqError: any) {
              lastGroqError = groqError;
              const isRateLimit = this.isRateLimitOrCapacityError(groqError);

              if (isRateLimit) {
                groqInstance.rateLimitedUntil = Date.now() + 60_000;
                logger.warn(
                  `[LLMClient] Groq ${groqInstance.name} [${groqInstance.maskedKey}] RATE LIMITED (429/quota). Cooldown set for 60s. ${
                    k < activeGroqClients.length - 1
                      ? `Switching to ${activeGroqClients[k + 1].name} [${activeGroqClients[k + 1].maskedKey}]...`
                      : "All Groq keys exhausted."
                  }`,
                );
              } else {
                logger.warn(
                  `[LLMClient] Groq ${groqInstance.name} [${groqInstance.maskedKey}] failed on model "${candidate.model}": ${groqError?.message || groqError}.`,
                );
              }

              // Try next available Groq key
              continue;
            }
          }

          // When all Groq keys have been tried and failed/exhausted:
          // Fall back to Hugging Face router (with Groq provider and identical model)
          const hfClient = this.getHfClient();
          if (hfClient) {
            logger.warn(
              `[LLMClient] All ${this.groqClients.length} Groq key(s) failed or rate-limited on model "${candidate.model}". Triggering Hugging Face router fallback with provider: Groq, model: "${candidate.model}"...`,
            );
            try {
              const hfResult = await this.callHuggingFaceText(
                candidate.model,
                formatted,
                mergedConfig,
                timeoutMs,
              );
              return hfResult.trim();
            } catch (hfError: any) {
              logger.warn(
                `[LLMClient] Hugging Face fallback on model "${candidate.model}" failed: ${hfError?.message || hfError}`,
              );
            }
          } else {
            logger.warn(
              `[LLMClient] All Groq key(s) failed or rate-limited on model "${candidate.model}", but HF_TOKEN is not configured for Hugging Face fallback.`,
            );
          }

          // Propagate last Groq error to proceed to next model candidate or Gemini
          throw lastGroqError;
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
                    .map((c) =>
                      typeof c === "string" ? c : (c as any).text || "",
                    )
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
    throw new ApiError(
      500,
      `AI text generation failed: ${lastError?.message || lastError}`,
    );
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

    const candidateModels = this.getCandidateModels(
      Boolean(userConfig.useFastModel),
    );
    const timeoutMs = userConfig.timeoutMs ?? 30000;
    const mergedConfig = { ...this.defaultConfig, ...userConfig };
    let lastError: any;

    if (candidateModels.length === 0) {
      throw new ApiError(
        500,
        "No LLM providers configured (neither GROQ_API_KEY, HF_TOKEN nor GOOGLE_API_KEY is available)",
      );
    }

    for (let i = 0; i < candidateModels.length; i++) {
      const candidate = candidateModels[i];
      try {
        let rawText = "";

        if (candidate.provider === "groq" && this.groqClients.length > 0) {
          const activeGroqClients = this.getActiveGroqClients();
          let lastGroqError: any = null;

          for (let k = 0; k < activeGroqClients.length; k++) {
            const groqInstance = activeGroqClients[k];
            try {
              const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(
                  () =>
                    reject(
                      new Error(
                        `Timeout after ${Math.round(timeoutMs / 1000)}s on Groq ${candidate.model} [Key: ${groqInstance.maskedKey}]`,
                      ),
                    ),
                  timeoutMs,
                ),
              );

              const apiPromise = groqInstance.client.chat.completions.create({
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
                key: groqInstance.maskedKey,
                model: candidate.model,
                tokens: response.usage?.total_tokens,
              });

              return this.parseAndRepairJSON<T>(
                rawText,
                "groq",
                candidate.model,
              );
            } catch (groqError: any) {
              lastGroqError = groqError;
              const isRateLimit = this.isRateLimitOrCapacityError(groqError);

              if (isRateLimit) {
                groqInstance.rateLimitedUntil = Date.now() + 60_000;
                logger.warn(
                  `[LLMClient] Groq ${groqInstance.name} [${groqInstance.maskedKey}] JSON RATE LIMITED (429/quota). Cooldown set for 60s. ${
                    k < activeGroqClients.length - 1
                      ? `Switching to ${activeGroqClients[k + 1].name} [${activeGroqClients[k + 1].maskedKey}]...`
                      : "All Groq keys exhausted."
                  }`,
                );
              } else {
                logger.warn(
                  `[LLMClient] Groq ${groqInstance.name} [${groqInstance.maskedKey}] JSON error on model "${candidate.model}": ${groqError?.message || groqError}.`,
                );
              }

              // Try next available Groq key
              continue;
            }
          }

          // When all Groq keys are exhausted, fallback to Hugging Face router
          const hfClient = this.getHfClient();
          if (hfClient) {
            logger.warn(
              `[LLMClient] All ${this.groqClients.length} Groq key(s) failed or rate-limited on JSON model "${candidate.model}". Triggering Hugging Face router fallback with provider: Groq, model: "${candidate.model}"...`,
            );
            try {
              const hfRawText = await this.callHuggingFaceJSON(
                candidate.model,
                formatted,
                mergedConfig,
                timeoutMs,
              );
              return this.parseAndRepairJSON<T>(
                hfRawText,
                "huggingface",
                candidate.model,
              );
            } catch (hfError: any) {
              logger.warn(
                `[LLMClient] Hugging Face JSON fallback on model "${candidate.model}" failed: ${hfError?.message || hfError}`,
              );
            }
          } else {
            logger.warn(
              `[LLMClient] All Groq key(s) failed or rate-limited on JSON model "${candidate.model}", but HF_TOKEN is not configured for Hugging Face fallback.`,
            );
          }

          // Propagate error to advance to next candidate model or Gemini
          throw lastGroqError;
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
                    .map((c) =>
                      typeof c === "string" ? c : (c as any).text || "",
                    )
                    .join("")
                : JSON.stringify(response.content);

          return this.parseAndRepairJSON<T>(rawText, "gemini", candidate.model);
        }
      } catch (error: any) {
        lastError = error;
        logger.warn(
          `[LLMClient] JSON model ${candidate.provider}:${candidate.model} failed (${error?.message || error}), failing over...`,
        );
        if (i < candidateModels.length - 1) continue;
      }
    }

    logger.error("[LLMClient] JSON generation failed on all models", lastError);
    throw new ApiError(
      500,
      `AI structured output generation failed: ${lastError?.message || lastError}`,
    );
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

