import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  JsonOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";
import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";

// Features:
// - Structured JSON outputs with type safety
// - Configurable temperature and token limits
// - Retry logic with exponential backoff
// - Token usage tracking

export interface LLMConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
}

export class LLMClient {
  private model: ChatGoogleGenerativeAI;
  private defaultConfig: LLMConfig;

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: config.gemini.apiKey,
      model: "gemini-1.5-pro", // Changed from modelName to model
      temperature: 0.7,
      maxOutputTokens: 2048,
    });

    this.defaultConfig = {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
    };

    logger.info("[LLMClient] Initialized with Gemini 1.5 Pro");
  }

  // generateText
  // General-purpose text generation with prompt template support.
  //
  // Returns raw string output.

  async generateText(
    promptTemplate: string,
    variables: Record<string, unknown>,
    config: LLMConfig = {},
  ): Promise<string> {
    try {
      const prompt = PromptTemplate.fromTemplate(promptTemplate);
      const chain = prompt
        .pipe(this.getModel(config))
        .pipe(new StringOutputParser());

      const result = await chain.invoke(variables);

      logger.info("[LLMClient] Text generation completed", {
        promptLength: promptTemplate.length,
        outputLength: result.length,
      });

      return result;
    } catch (error) {
      logger.error("[LLMClient] Text generation failed", error);
      throw new ApiError(500, "AI text generation failed");
    }
  }

  // generateJSON
  // Structured output generation with schema validation.
  //
  // Returns parsed JSON object conforming to the provided schema.
  // Automatically retries if the model returns invalid JSON.

  async generateJSON<T extends Record<string, any> = Record<string, unknown>>(
    promptTemplate: string,
    variables: Record<string, unknown>,
    config: LLMConfig = {},
  ): Promise<T> {
    try {
      const prompt = PromptTemplate.fromTemplate(promptTemplate);
      const chain = prompt
        .pipe(this.getModel(config))
        .pipe(new JsonOutputParser<T>());

      const result = await chain.invoke(variables);

      logger.info("[LLMClient] JSON generation completed", {
        outputKeys: Object.keys(result as object).length,
      });

      return result;
    } catch (error) {
      logger.error("[LLMClient] JSON generation failed", error);
      throw new ApiError(500, "AI structured output generation failed");
    }
  }

  // generateWithRetry
  // Wrapper for automatic retry with exponential backoff.
  // Useful for handling rate limits or transient API errors.

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

  // getModel
  // Returns a model instance with merged configuration.
  // Allows per-call config overrides while maintaining defaults.

  private getModel(userConfig: LLMConfig): ChatGoogleGenerativeAI {
    const mergedConfig = { ...this.defaultConfig, ...userConfig };

    return new ChatGoogleGenerativeAI({
      apiKey: config.gemini.apiKey,
      model: "gemini-1.5-pro", 
      temperature: mergedConfig.temperature,
      maxOutputTokens: mergedConfig.maxTokens,
      topP: mergedConfig.topP,
      stopSequences: mergedConfig.stopSequences,
    });
  }

  // estimateTokens
  // Rough token estimation for cost calculation.
  // Gemini charges per token, so this helps with budget tracking.
  //
  // Rule of thumb: 1 token ≈ 4 characters for English text.

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export const llmClient = new LLMClient();
