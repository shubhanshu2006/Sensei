import * as pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";

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

  // parsePDF
  // Extracts text from PDF buffer using pdf-parse library.

  async parsePDF(buffer: Buffer): Promise<ParsedResume> {
    try {
      // pdf-parse is CommonJS, need to handle it properly in ESM
      const pdf = (pdfParse as any).default || pdfParse;
      const data = await pdf(buffer);

      const cleanedText = this.cleanText(data.text);

      logger.info("[ResumeParser] PDF parsed", {
        pages: data.numpages,
        characters: cleanedText.length,
      });

      return {
        text: cleanedText,
        pageCount: data.numpages,
        wordCount: this.countWords(cleanedText),
        metadata: {
          format: "pdf",
          fileSize: buffer.length,
        },
      };
    } catch (error) {
      logger.error("[ResumeParser] PDF parsing failed", error);
      throw new ApiError(
        400,
        "Failed to parse PDF resume. File may be corrupted.",
      );
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
}

export const resumeParser = new ResumeParser();
