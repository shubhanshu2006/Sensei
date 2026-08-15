import { llmClient } from "./LLMClient.js";
import { resumeParser } from "./ResumeParser.js";
import { githubFetcher } from "./GitHubFetcher.js";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";

export interface ScreeningInput {
  resumeUrl: string;
  githubUrl?: string;
  jobDescription: string;
  jobTitle: string;
  requiredSkills: string[];
  experienceLevel: string;
}

export interface ScreeningResult {
  overallMatchScore: number; // 0-100
  decision: "PROCEED" | "REVIEW" | "REJECT";
  skillMatchAnalysis: string;
  experienceAnalysis: string;
  projectRelevance: string;
  resumeCredibility: string;
  aiRecommendation: string; // For recruiter
  screeningFeedback: string; // For candidate
  processingTimeMs: number;
}

export class ScreeningService {
  // screenCandidate
  // Main entry point for AI screening.
  //
  // Steps:
  // 1. Parse resume text
  // 2. Fetch GitHub data (if provided)
  // 3. Generate AI analysis using LLM
  // 4. Compute match score and decision

  async screenCandidate(input: ScreeningInput): Promise<ScreeningResult> {
    const startTime = Date.now();

    try {
      logger.info("[ScreeningService] Starting screening", {
        jobTitle: input.jobTitle,
        hasGithub: !!input.githubUrl,
      });

      // Step 1: Parse resume
      const resumeData = await resumeParser.parseFromUrl(input.resumeUrl);

      // Step 2: Fetch GitHub data (optional)
      let githubData = null;
      if (input.githubUrl) {
        try {
          githubData = await githubFetcher.analyzeGitHub(input.githubUrl);
        } catch (error) {
          logger.warn(
            "[ScreeningService] GitHub analysis failed, continuing without it",
            error,
          );
          // Non-blocking: continue screening without GitHub data
        }
      }

      // Step 3: Generate AI analysis
      const analysis = await this.generateScreeningAnalysis({
        resumeText: resumeData.text,
        githubData,
        jobDescription: input.jobDescription,
        jobTitle: input.jobTitle,
        requiredSkills: input.requiredSkills,
        experienceLevel: input.experienceLevel,
      });

      // Step 4: Compute decision based on score thresholds
      let decision: "PROCEED" | "REVIEW" | "REJECT";
      if (analysis.overallMatchScore >= 75) {
        decision = "PROCEED";
      } else if (analysis.overallMatchScore >= 50) {
        decision = "REVIEW";
      } else {
        decision = "REJECT";
      }

      const processingTimeMs = Date.now() - startTime;

      logger.info("[ScreeningService] Screening complete", {
        score: analysis.overallMatchScore,
        decision,
        processingTimeMs,
      });

      return {
        ...analysis,
        decision,
        processingTimeMs,
      };
    } catch (error) {
      logger.error("[ScreeningService] Screening failed", error);
      throw new ApiError(500, "Failed to complete candidate screening");
    }
  }

  // generateScreeningAnalysis
  // Uses LLM to analyze resume + GitHub against job requirements.
  //
  // Returns structured JSON with scores and qualitative assessments.

  private async generateScreeningAnalysis(data: {
    resumeText: string;
    githubData: any;
    jobDescription: string;
    jobTitle: string;
    requiredSkills: string[];
    experienceLevel: string;
  }): Promise<Omit<ScreeningResult, "decision" | "processingTimeMs">> {
    const promptTemplate = `You are an expert technical recruiter analyzing a candidate for the position of {jobTitle}.

Job Description:
{jobDescription}

Required Skills: {requiredSkills}
Experience Level: {experienceLevel}

Candidate Resume:
{resumeText}

{githubSection}

Analyze this candidate and provide a structured assessment in JSON format with these fields:

1. overallMatchScore (0-100): Overall fit for the role
2. skillMatchAnalysis (string): How well candidate's skills match requirements (2-3 sentences)
3. experienceAnalysis (string): Assessment of experience level and relevance (2-3 sentences)
4. projectRelevance (string): Quality and relevance of projects/GitHub work (2-3 sentences, or "N/A" if no GitHub)
5. resumeCredibility (string): Professional presentation, clarity, consistency (1-2 sentences)
6. aiRecommendation (string): Your recommendation to the recruiter - PROCEED/REVIEW/REJECT with reasoning (3-4 sentences)
7. screeningFeedback (string): Constructive feedback for the candidate highlighting strengths and areas for improvement (3-4 sentences, professional and encouraging tone)

Return ONLY valid JSON with these exact field names. Be objective, fair, and focus on relevant qualifications.`;

    const githubSection = data.githubData
      ? `GitHub Profile:
Username: ${data.githubData.profile.username}
Public Repos: ${data.githubData.profile.publicRepos}
Total Stars: ${data.githubData.summary.totalStars}
Primary Languages: ${data.githubData.summary.primaryLanguages.join(", ")}
Top Projects: ${data.githubData.topRepositories.map((r: any) => `${r.name} (${r.language}, ${r.stars} stars)`).join(", ")}`
      : "GitHub Profile: Not provided";

    const result = await llmClient.generateJSON<
      Omit<ScreeningResult, "decision" | "processingTimeMs">
    >(
      promptTemplate,
      {
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
        requiredSkills: data.requiredSkills.join(", "),
        experienceLevel: data.experienceLevel,
        resumeText: data.resumeText.substring(0, 8000), // Limit for token budget
        githubSection,
      },
      { temperature: 0.3, maxTokens: 2048 }, // Lower temperature for consistency
    );

    return result;
  }
}

export const screeningService = new ScreeningService();
