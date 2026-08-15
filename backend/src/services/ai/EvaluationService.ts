import { llmClient } from "./LLMClient.js";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";

export interface EvaluationInput {
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  resumeText: string;
  qaTranscript: Array<{
    question: string;
    answer: string;
  }>;
}

export interface ScorecardResult {
  overallScore: number; // 0-100
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  cultureFitScore: number;
  overallRecommendation: "STRONG_YES" | "YES" | "CONSIDER" | "NO";
  detailedFeedback: string;
  strengths: string[];
  weaknesses: string[];
  interviewerNotes: string;
}

export interface ResumeFeedbackResult {
  overallRating: "EXCELLENT" | "GOOD" | "AVERAGE" | "NEEDS_IMPROVEMENT";
  improvementSuggestions: string[];
  strengthsIdentified: string[];
  formattingScore: number; // 0-100
  contentScore: number; // 0-100
  keywordOptimization: string;
  careerAdvice: string;
}

export class EvaluationService {
  // generateScorecard
  // Analyzes interview performance and generates recruiter-facing scorecard.

  async generateScorecard(input: EvaluationInput): Promise<ScorecardResult> {
    logger.info("[EvaluationService] Generating scorecard", {
      jobTitle: input.jobTitle,
      questionsCount: input.qaTranscript.length,
    });

    try {
      const prompt = `You are an expert technical interviewer evaluating a candidate for {jobTitle}.

Job Description:
{jobDescription}

Required Skills:
{requiredSkills}

Interview Transcript:
{transcript}

Evaluate the candidate on these dimensions (0-100 each):
1. Technical Competency: Depth of technical knowledge, accuracy, problem-solving approach
2. Communication Skills: Clarity, structure, ability to explain complex concepts
3. Problem-Solving: Analytical thinking, creativity, handling of edge cases
4. Cultural Fit: Collaboration mindset, learning attitude, values alignment

Provide your evaluation in JSON format:
{
  "overallScore": number (0-100, weighted average),
  "technicalScore": number,
  "communicationScore": number,
  "problemSolvingScore": number,
  "cultureFitScore": number,
  "overallRecommendation": "STRONG_YES" | "YES" | "CONSIDER" | "NO",
  "detailedFeedback": "3-4 sentences summarizing overall performance",
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "interviewerNotes": "2-3 sentences for the hiring manager"
}

Be objective, fair, and focus on demonstrated skills.`;

      const transcript = input.qaTranscript
        .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}\n`)
        .join("\n");

      const result = await llmClient.generateJSON<ScorecardResult>(
        prompt,
        {
          jobTitle: input.jobTitle,
          jobDescription: input.jobDescription.substring(0, 1500),
          requiredSkills: input.requiredSkills.join(", "),
          transcript: transcript.substring(0, 6000), // Limit for token budget
        },
        { temperature: 0.2, maxTokens: 1500 }, // Low temperature for consistency
      );

      logger.info("[EvaluationService] Scorecard generated", {
        overallScore: result.overallScore,
        recommendation: result.overallRecommendation,
      });

      return result;
    } catch (error) {
      logger.error("[EvaluationService] Scorecard generation failed", error);
      throw new ApiError(500, "Failed to generate interview scorecard");
    }
  }

  // generateResumeFeedback
  // Creates private candidate-facing feedback for resume improvement.

  async generateResumeFeedback(input: {
    resumeText: string;
    jobTitle: string;
    careerGoals?: string;
  }): Promise<ResumeFeedbackResult> {
    logger.info("[EvaluationService] Generating resume feedback");

    try {
      const prompt = `You are a professional career coach reviewing a resume for a {jobTitle} position.

Resume Content:
{resumeText}

Career Goals: {careerGoals}

Provide constructive, encouraging feedback in JSON format:
{
  "overallRating": "EXCELLENT" | "GOOD" | "AVERAGE" | "NEEDS_IMPROVEMENT",
  "improvementSuggestions": ["suggestion 1", "suggestion 2", ...] (3-5 actionable items),
  "strengthsIdentified": ["strength 1", "strength 2", ...] (3-5 positive aspects),
  "formattingScore": number (0-100, visual presentation, structure, readability),
  "contentScore": number (0-100, relevance, achievements, impact),
  "keywordOptimization": "1-2 sentences about ATS optimization",
  "careerAdvice": "2-3 sentences of personalized career guidance"
}

Be encouraging and actionable. Focus on what will make the biggest impact.`;

      const result = await llmClient.generateJSON<ResumeFeedbackResult>(
        prompt,
        {
          jobTitle: input.jobTitle,
          resumeText: input.resumeText.substring(0, 4000),
          careerGoals: input.careerGoals || "Not specified",
        },
        { temperature: 0.3, maxTokens: 1200 },
      );

      logger.info("[EvaluationService] Resume feedback generated", {
        rating: result.overallRating,
        suggestionsCount: result.improvementSuggestions.length,
      });

      return result;
    } catch (error) {
      logger.error(
        "[EvaluationService] Resume feedback generation failed",
        error,
      );
      throw new ApiError(500, "Failed to generate resume feedback");
    }
  }

  // -------------------------------------------------------------------------
  // analyzeAnswer
  // Real-time analysis of a single answer (used during live interviews).
  // -------------------------------------------------------------------------

  async analyzeAnswer(input: {
    question: string;
    answer: string;
    expectedSkills: string[];
  }): Promise<{
    quality: "excellent" | "good" | "average" | "poor";
    score: number;
    feedback: string;
  }> {
    logger.info("[EvaluationService] Analyzing single answer");

    try {
      const prompt = `Evaluate this interview response:

Question: {question}
Answer: {answer}
Expected Skills: {skills}

Rate the response (JSON format):
{
  "quality": "excellent" | "good" | "average" | "poor",
  "score": number (0-100),
  "feedback": "1-2 sentences of constructive feedback"
}`;

      const result = await llmClient.generateJSON(
        prompt,
        {
          question: input.question,
          answer: input.answer.substring(0, 2000),
          skills: input.expectedSkills.join(", "),
        },
        { temperature: 0.3, maxTokens: 200 },
      );

      return result as any;
    } catch (error) {
      logger.error("[EvaluationService] Answer analysis failed", error);
      throw new ApiError(500, "Failed to analyze answer");
    }
  }
}

export const evaluationService = new EvaluationService();
