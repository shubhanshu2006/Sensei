import * as pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { createRequire } from "module";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";

const nodeRequire = createRequire(import.meta.url);

async function extractTextFromPdfBuffer(buffer: Buffer): Promise<{ text: string; numpages: number }> {
  // Strategy 1: pdf-parse v2 class PDFParse (static, dynamic, and cjs require)
  try {
    let PDFClass: any = (pdfParse as any)?.PDFParse || (pdfParse as any)?.default?.PDFParse;
    
    if (!PDFClass) {
      try {
        const cjs = nodeRequire("pdf-parse");
        PDFClass = cjs?.PDFParse || cjs?.default?.PDFParse;
      } catch {
        // ignore
      }
    }

    if (!PDFClass) {
      const dynamicMod: any = await import("pdf-parse");
      PDFClass = dynamicMod?.PDFParse || dynamicMod?.default?.PDFParse;
    }

    if (PDFClass) {
      const parser = new PDFClass({ data: buffer });
      const textResult = await parser.getText();
      const text = textResult?.text || "";
      const numpages = textResult?.pages?.length || 1;
      if (typeof parser.destroy === "function") {
        await parser.destroy().catch(() => {});
      }
      if (text.trim().length > 0) {
        return { text, numpages };
      }
    }
  } catch (err: any) {
    logger.warn("[ResumeParser] PDFParse class extraction encountered error", { message: err?.message });
  }

  // Strategy 2: pdf-parse v1 callable (legacy fallback)
  try {
    let callable: any = typeof (pdfParse as any) === "function" ? pdfParse : (pdfParse as any)?.default;
    if (typeof callable !== "function") {
      try {
        const cjs = nodeRequire("pdf-parse");
        callable = typeof cjs === "function" ? cjs : cjs?.default;
      } catch {
        // ignore
      }
    }
    if (typeof callable === "function") {
      const data = await callable(buffer);
      if (data?.text) {
        return { text: data.text, numpages: data?.numpages || 1 };
      }
    }
  } catch (err: any) {
    logger.warn("[ResumeParser] Legacy pdf-parse callable failed", { message: err?.message });
  }

  return { text: "", numpages: 1 };
}

// ResumeParser - Extract text from PDF and DOCX resumes
// Supports:
// - PDF files (via pdf-parse)
// - DOCX files (via mammoth)
// - Text cleaning and normalization
//
// Returns plain text suitable for AI analysis.

export interface ParsedResume {
  text: string;
  pageCount?: number;
  wordCount: number;
  metadata: {
    format: "pdf" | "docx" | "unknown";
    fileSize?: number;
  };
}

export class ResumeParser {
  private textCache = new Map<string, string>();

  /**
   * Retrieves cleaned resume text given a target URL or S3 key, with caching and fallback.
   */
  async getResumeText(targetUrlOrKey?: string | null): Promise<string> {
    if (!targetUrlOrKey || typeof targetUrlOrKey !== "string" || targetUrlOrKey.trim().length === 0) {
      return "";
    }
    const key = targetUrlOrKey.trim();
    if (this.textCache.has(key)) {
      return this.textCache.get(key)!;
    }

    let extracted = "";
    try {
      const { s3Service } = await import("../storage/S3Service.js");
      const buffer = await s3Service.getFileBuffer(key);
      const parsed = await this.parseFromBuffer(buffer, key);
      extracted = parsed.text || "";
    } catch (s3Err: any) {
      if (key.startsWith("http://") || key.startsWith("https://")) {
        try {
          logger.info("[ResumeParser] S3 buffer fetch failed, falling back to direct URL fetch", {
            key,
            error: s3Err?.message || s3Err,
          });
          const parsed = await this.parseFromUrl(key);
          extracted = parsed.text || "";
        } catch (urlErr: any) {
          logger.warn("[ResumeParser] Direct URL parse failed", { key, error: urlErr?.message || urlErr });
        }
      } else {
        logger.warn("[ResumeParser] S3 buffer fetch failed and not an HTTP URL", { key, error: s3Err?.message || s3Err });
      }
    }

    if (extracted && extracted.trim().length > 0) {
      const cleaned = extracted.trim();
      this.textCache.set(key, cleaned);
      return cleaned;
    }
    return "";
  }

  // parseFromUrl
  // Fetches a resume from a URL (S3 pre-signed URL) and extracts text.
  //
  // Automatically detects file format from content type or extension.

  async parseFromUrl(resumeUrl: string): Promise<ParsedResume> {
    try {
      logger.info("[ResumeParser] Fetching resume", { resumeUrl });

      // Fetch the file
      const response = await fetch(resumeUrl);
      if (!response.ok) {
        throw new ApiError(400, "Failed to fetch resume from URL");
      }

      const contentType = response.headers.get("content-type") || "";
      const buffer = Buffer.from(await response.arrayBuffer());

      // Detect format
      let format: "pdf" | "docx" | "unknown" = "unknown";
      if (
        contentType.includes("pdf") ||
        resumeUrl.toLowerCase().endsWith(".pdf")
      ) {
        format = "pdf";
      } else if (
        contentType.includes("officedocument") ||
        contentType.includes("msword") ||
        resumeUrl.toLowerCase().endsWith(".docx") ||
        resumeUrl.toLowerCase().endsWith(".doc")
      ) {
        format = "docx";
      }

      // Parse based on format
      if (format === "pdf") {
        return await this.parsePDF(buffer);
      } else if (format === "docx") {
        return await this.parseDOCX(buffer);
      } else {
        throw new ApiError(
          400,
          "Unsupported resume format. Please use PDF or DOCX.",
        );
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("[ResumeParser] Failed to parse resume", error);
      throw new ApiError(500, "Failed to parse resume");
    }
  }

  /**
   * Parses resume text directly from a raw file Buffer.
   */
  async parseFromBuffer(
    buffer: Buffer,
    formatOrFilename: string = "pdf",
  ): Promise<ParsedResume> {
    const isDocx =
      formatOrFilename.toLowerCase().includes("docx") ||
      formatOrFilename.toLowerCase().includes("doc");
    if (isDocx) {
      return await this.parseDOCX(buffer);
    }
    return await this.parsePDF(buffer);
  }

  // parsePDF
  // Extracts text from PDF buffer using pdf-parse library.

  async parsePDF(buffer: Buffer): Promise<ParsedResume> {
    try {
      const data = await extractTextFromPdfBuffer(buffer);
      const cleanedText = this.cleanText(data?.text || "");

      if (!cleanedText) {
        logger.warn("[ResumeParser] No text extracted from PDF, continuing without resume text");
        return {
          text: "",
          wordCount: 0,
          metadata: {
            format: "pdf",
            fileSize: buffer.length,
          },
        };
      }

      logger.info("[ResumeParser] PDF parsed", {
        pages: data?.numpages || 1,
        characters: cleanedText.length,
      });

      return {
        text: cleanedText,
        pageCount: data?.numpages || 1,
        wordCount: this.countWords(cleanedText),
        metadata: {
          format: "pdf",
          fileSize: buffer.length,
        },
      };
    } catch (error) {
      logger.error("[ResumeParser] PDF parsing failed", error);
      return {
        text: "",
        wordCount: 0,
        metadata: {
          format: "pdf",
          fileSize: buffer.length,
        },
      };
    }
  }

  // parseDOCX
  // Extracts text from DOCX buffer using mammoth library.

  async parseDOCX(buffer: Buffer): Promise<ParsedResume> {
    try {
      const result = await mammoth.extractRawText({ buffer });

      const cleanedText = this.cleanText(result.value);

      logger.info("[ResumeParser] DOCX parsed", {
        characters: cleanedText.length,
      });

      return {
        text: cleanedText,
        wordCount: this.countWords(cleanedText),
        metadata: {
          format: "docx",
          fileSize: buffer.length,
        },
      };
    } catch (error) {
      logger.error("[ResumeParser] DOCX parsing failed", error);
      throw new ApiError(
        400,
        "Failed to parse DOCX resume. File may be corrupted.",
      );
    }
  }

  // cleanText
  // Normalizes extracted text:
  // - Removes excessive whitespace
  // - Normalizes line breaks
  // - Removes special characters that confuse LLMs

  private cleanText(text: string): string {
    return (
      text
        // Normalize line breaks
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        // Remove multiple newlines
        .replace(/\n{3,}/g, "\n\n")
        // Remove excessive spaces
        .replace(/[ \t]+/g, " ")
        // Remove leading/trailing whitespace per line
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
        // Final trim
        .trim()
    );
  }

  // countWords
  // Simple word counting for validation and analytics.

  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  // extractSections
  // Attempts to identify common resume sections (Education, Experience, etc.)
  // Returns a structured object for more targeted AI analysis.
  //
  // This is a best-effort heuristic — actual section detection is done by
  // the LLM in the screening service.

  extractSections(text: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const sectionPatterns = [
      /(?:^|\n)(education|academic|qualifications)(?:\s*:\s*|\n)/i,
      /(?:^|\n)(experience|employment|work history)(?:\s*:\s*|\n)/i,
      /(?:^|\n)(skills|technical skills|expertise)(?:\s*:\s*|\n)/i,
      /(?:^|\n)(projects|portfolio)(?:\s*:\s*|\n)/i,
      /(?:^|\n)(certifications|certificates)(?:\s*:\s*|\n)/i,
    ];

    // Simple section splitting (can be improved with more sophisticated NLP)
    const lines = text.split("\n");
    let currentSection = "summary";
    let currentContent: string[] = [];

    for (const line of lines) {
      const matched = sectionPatterns.find((pattern) => pattern.test(line));
      if (matched) {
        // Save previous section
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join("\n").trim();
        }
        // Start new section
        currentSection = line
          .trim()
          .toLowerCase()
          .replace(/[:\s]+$/, "");
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join("\n").trim();
    }

    logger.info("[ResumeParser] Sections extracted", {
      sectionCount: Object.keys(sections).length,
    });

    return sections;
  }

  /**
   * Extracts the candidate's personal full name from resume text.
   * Uses a fast, non-blocking heuristic on the header lines first,
   * falling back to an LLM extractor for complex multi-column resumes.
   */
  async extractCandidateName(text: string): Promise<string | null> {
    if (!text || text.trim().length === 0) return null;

    // Fast heuristic from the first 10 non-empty lines
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .slice(0, 10);

    const blacklist = [
      "developer", "engineer", "designer", "manager", "intern", "lead",
      "architect", "analyst", "student", "specialist", "consultant", "resume",
      "curriculum", "vitae", "summary", "profile", "contact", "education",
      "experience", "skills", "projects", "objective", "certifications", "phone",
      "email", "address", "portfolio", "github", "linkedin", "page",
    ];

    for (const line of lines) {
      // Ignore header titles, contact info, emails, urls, phone numbers
      if (/^(curriculum vitae|resume|cv|contact|profile|personal info|summary|objective)/i.test(line)) continue;
      if (/@|http|www\.|\.com|\.in|\.org|\+?\d{7,}|github\.com|linkedin\.com/i.test(line)) continue;
      if (line.length > 35 || line.length < 2) continue;

      // Check if line consists of 1 to 4 alphabetical words
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        const isAlphabetic = words.every((w) => /^[A-Za-z\.\-']+$/.test(w));
        const hasBlacklist = words.some((w) => blacklist.includes(w.toLowerCase()));
        if (isAlphabetic && !hasBlacklist) {
          const formatted = words
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
          logger.info("[ResumeParser] Extracted candidate name from resume via heuristic", { name: formatted });
          return formatted;
        }
      }
    }

    // Heuristic didn't yield a confident 2-4 word name; use LLM on the first 1200 characters
    try {
      const { llmClient } = await import("./LLMClient.js");
      const prompt = `You are an expert resume parser. Extract the full personal name of the candidate from the header/beginning of this resume text.
Resume excerpt:
"""
{excerpt}
"""

Rules:
- Return ONLY the candidate's personal full name (e.g., "Harsh Singh", "Jane Doe", "Rahul Kumar").
- Do NOT include titles, roles, emails, phone numbers, prefixes, or punctuation.
- If no candidate name is present, return "UNKNOWN".`;

      const response = await llmClient.generateText(
        prompt,
        { excerpt: text.substring(0, 1200) },
        { temperature: 0.1, maxTokens: 30 },
      );

      const name = response.trim().replace(/^["']|["']$/g, "").trim();
      if (name && name !== "UNKNOWN" && name.length <= 40 && !name.includes("\n") && !name.includes("@")) {
        logger.info("[ResumeParser] Extracted candidate name from resume via LLM", { name });
        return name;
      }
    } catch (err: any) {
      logger.warn("[ResumeParser] LLM name extraction failed:", err?.message || err);
    }

    return null;
  }
}

export const resumeParser = new ResumeParser();
