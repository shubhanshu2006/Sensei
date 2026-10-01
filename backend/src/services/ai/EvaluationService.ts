import { llmClient } from "./LLMClient.js";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";

import { normalizeInterviewCategory } from "./InterviewGraph.js";

export interface EvaluationInput {
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  resumeText: string;
  qaTranscript: Array<{
    question: string;
    answer: string;
    isFollowUp?: boolean;
    evaluation?: {
      quality?: string;
      correctnessIssue?: string;
      gap?: string;
    };
  }>;
  category?: string;
  // Required skills that no answered question tested. Empty/undefined when unknown.
  unassessedSkills?: string[];
}

export function getDimensionTitles(category?: string, jobTitle?: string) {
  const track = normalizeInterviewCategory(category, jobTitle);
  switch (track) {
    case "SALES":
      return {
        technical: "Pitch & Value Proposition",
        communication: "Objection Handling",
        problemSolving: "Discovery & Active Listening",
        confidence: "Closing & Deal Control",
        technicalScore: "Pitch & Value Proposition",
        communicationScore: "Objection Handling",
        problemSolvingScore: "Discovery & Active Listening",
        confidenceScore: "Closing & Deal Control",
      };
    case "HR":
      return {
        technical: "People Strategy & Compliance",
        communication: "Behavioral & STAR Method",
        problemSolving: "Conflict Resolution & Empathy",
        confidence: "Ethics & Culture Alignment",
        technicalScore: "People Strategy & Compliance",
        communicationScore: "Behavioral & STAR Method",
        problemSolvingScore: "Conflict Resolution & Empathy",
        confidenceScore: "Ethics & Culture Alignment",
      };
    case "COMMUNICATION":
      return {
        technical: "Structure & Brevity (PREP)",
        communication: "Articulation & Clarity",
        problemSolving: "Active Listening & Adaptability",
        confidence: "Executive Presence & Tone",
        technicalScore: "Structure & Brevity (PREP)",
        communicationScore: "Articulation & Clarity",
        problemSolvingScore: "Active Listening & Adaptability",
        confidenceScore: "Executive Presence & Tone",
      };
    case "TECH":
    default:
      return {
        technical: "Technical Knowledge",
        communication: "Communication",
        problemSolving: "Problem Solving",
        confidence: "Culture & Confidence",
        technicalScore: "Technical Knowledge",
        communicationScore: "Communication",
        problemSolvingScore: "Problem Solving",
        confidenceScore: "Culture & Confidence",
      };
  }
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
  technicalReasoning?: string;
  communicationReasoning?: string;
  problemSolvingReasoning?: string;
  cultureFitReasoning?: string;
}

const clampScore = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(Math.min(100, Math.max(0, n))) : fallback;
};

// Appended to every track's scorecard prompt so scoring rules and per-dimension
// reasoning are requested consistently.
const SCORECARD_RULES = `

SCORING RULES (apply strictly):
- Score ONLY what the candidate demonstrated in the transcript, judged against the Job Description requirements. Use the resume only to check consistency with claims, never to award credit for things not shown in answers.
- Every question/answer pair counts. Wrong, vague, evasive or unanswered responses must lower the relevant dimension scores; do not average them away.
- Questions marked [cross-question ...] were follow-ups to a weak or vague answer. Weigh whether the candidate improved, doubled down, or self-corrected. "Live assessment" notes are hints from the interviewer, not final verdicts.
- If the candidate engaged in abusive/vulgar language or repeatedly attempted to derail the interview with off-topic queries (e.g. asking general knowledge or personal questions instead of answering), penalize communicationScore and cultureFitScore severely, and document the unprofessional conduct in weaknesses and interviewerNotes.
- Use the full 0-100 range. 0-39 poor, 40-59 below the bar, 60-74 acceptable, 75-89 strong, 90-100 exceptional. Score 0 is valid if a dimension was not demonstrated at all.
- overallScore must be consistent with the four dimension scores. Never lower any score or the overall score because a JD skill or topic was not asked about; only what the candidate actually answered counts.
- Also include these extra JSON fields, each 1-2 sentences citing specific answers (e.g. "Q3") as evidence:
  "technicalReasoning", "communicationReasoning", "problemSolvingReasoning", "cultureFitReasoning"`;

export interface ResumeFeedbackResult {
  overallRating: "EXCELLENT" | "GOOD" | "AVERAGE" | "NEEDS_IMPROVEMENT";
  improvementSuggestions: string[];
  strengthsIdentified: string[];
  formattingScore: number; // 0-100
  contentScore: number; // 0-100
  keywordOptimization: string;
  careerAdvice: string;
  missingSkills: string[];
  jdMatchScore?: number; // 0-100, resume vs job description
  matchedRequirements?: string[];
  unmetRequirements?: string[];
}

export class EvaluationService {
  // generateScorecard
  // Analyzes interview performance and generates recruiter-facing scorecard.

  async generateScorecard(input: EvaluationInput): Promise<ScorecardResult> {
    const qaTranscript = Array.isArray(input.qaTranscript) ? input.qaTranscript : [];
    const track = normalizeInterviewCategory(input.category, input.jobTitle);

    logger.info("[EvaluationService] Generating scorecard", {
      jobTitle: input.jobTitle,
      track,
      questionsCount: qaTranscript.length,
    });

    // Guard: If the candidate answered 0 questions, return score 0 immediately
    const validAnswers = qaTranscript.filter((qa) => {
      const ans = (qa.answer || "").trim();
      return (
        ans.length > 5 &&
        !ans.includes("[No verbal response recorded]") &&
        !ans.toLowerCase().includes("no verbal response") &&
        !ans.toLowerCase().includes("no response recorded")
      );
    });

    if (validAnswers.length === 0) {
      logger.info("[EvaluationService] Zero valid candidate responses recorded, returning 0 scorecard", {
        totalQuestions: qaTranscript.length,
      });

      return {
        overallScore: 0,
        technicalScore: 0,
        communicationScore: 0,
        problemSolvingScore: 0,
        cultureFitScore: 0,
        overallRecommendation: "NO",
        detailedFeedback:
          "The interview concluded without any candidate responses recorded. Since no questions were answered, technical competency, problem-solving, and communication skills could not be evaluated.",
        strengths: [],
        weaknesses: [
          "No verbal or written responses were provided during the interview session",
          "Unable to evaluate technical or communication skills due to absence of responses",
        ],
        interviewerNotes:
          "Candidate submitted or concluded the interview with 0 recorded answers. An automatic score of 0 was recorded.",
      };
    }

    try {
      let prompt: string;

      if (track === "SALES") {
        prompt = `You are an expert Head of Sales / Enterprise Sales Leader evaluating a candidate for the sales position of {jobTitle}.

Job Description:
{jobDescription}

Key Sales Competencies / Skills:
{requiredSkills}

Candidate Resume Background:
{resumeText}

Interview Transcript:
{transcript}

Evaluate the candidate on these 4 core sales dimensions (0-100 each), taking into account their answers and their resume claims:
1. Pitch & Value Proposition (technicalScore field): Clarity in articulating business ROI, positioning features as solutions, customer-centric value delivery
2. Objection Handling & Negotiation (communicationScore field): Navigating pushback on price, timing, and competitor comparisons calmly and convincingly
3. Discovery & Active Listening (problemSolvingScore field): Uncovering customer pain points, asking probing open-ended questions, understanding buyer persona
4. Closing Confidence & Deal Control (cultureFitScore field): Confidence in establishing next steps, urgency, mutual action plans, driving commitment

Provide your evaluation in JSON format:
{
  "overallScore": number (0-100, weighted average),
  "technicalScore": number (representing Pitch & Value Proposition),
  "communicationScore": number (representing Objection Handling & Negotiation),
  "problemSolvingScore": number (representing Discovery & Active Listening),
  "cultureFitScore": number (representing Closing Confidence & Deal Control),
  "overallRecommendation": "STRONG_YES" | "YES" | "CONSIDER" | "NO",
  "detailedFeedback": "3-4 sentences summarizing their sales pitching, discovery rigor, and objection handling effectiveness",
  "strengths": ["sales strength 1", "sales strength 2", ...],
  "weaknesses": ["sales gap 1", "sales gap 2", ...],
  "interviewerNotes": "2-3 sentences for the hiring manager on deal readiness and coachability"
}

Be objective, rigorous, and focus on demonstrated sales execution.`;
      } else if (track === "HR") {
        prompt = `You are a Chief People Officer / Head of Talent evaluating a candidate for the human resources position of {jobTitle}.

Job Description:
{jobDescription}

Key HR Competencies / Skills:
{requiredSkills}

Candidate Resume Background:
{resumeText}

Interview Transcript:
{transcript}

Evaluate the candidate on these 4 core HR dimensions (0-100 each), taking into account their answers and their resume claims:
1. People Strategy & Compliance (technicalScore field): Knowledge of labor policies, compliance, workplace risk mitigation, and scaling talent
2. Behavioral & STAR Method (communicationScore field): Depth and structure of situational responses (Situation, Task, Action, Result)
3. Conflict Resolution & Empathy (problemSolvingScore field): Navigating sensitive workplace disputes, emotional intelligence, neutrality, mediating employee issues
4. Ethics & Culture Alignment (cultureFitScore field): Fair judgment, organizational values advocacy, integrity under executive pressure

Provide your evaluation in JSON format:
{
  "overallScore": number (0-100, weighted average),
  "technicalScore": number (representing People Strategy & Compliance),
  "communicationScore": number (representing Behavioral & STAR Execution),
  "problemSolvingScore": number (representing Conflict Resolution & Empathy),
  "cultureFitScore": number (representing Ethics & Culture Alignment),
  "overallRecommendation": "STRONG_YES" | "YES" | "CONSIDER" | "NO",
  "detailedFeedback": "3-4 sentences summarizing their HR judgment, conflict handling, and people strategy",
  "strengths": ["HR strength 1", "HR strength 2", ...],
  "weaknesses": ["HR gap 1", "HR gap 2", ...],
  "interviewerNotes": "2-3 sentences for the leadership team on cultural leadership and judgment"
}

Be objective, fair, and focus on demonstrated people judgment.`;
      } else if (track === "COMMUNICATION") {
        prompt = `You are an Executive Communications Coach and Senior Bar-Raiser evaluating a candidate on Communication & Behavioral Mastery for {jobTitle}.

Context & Objectives:
{jobDescription}

Target Focus Areas:
{requiredSkills}

Candidate Resume Background:
{resumeText}

Interview Transcript:
{transcript}

Evaluate the candidate on these 4 core communication dimensions (0-100 each):
1. Structure & Brevity (technicalScore field): Use of frameworks like PREP (Point, Reason, Example, Point) or STAR, eliminating rambling or fluff
2. Articulation & Clarity (communicationScore field): Translating complex ideas into clear takeaways, precision in speech, directness
3. Active Listening & Responsiveness (problemSolvingScore field): Directly answering the core question without evading, adjusting based on prompts
4. Executive Presence & Tone (cultureFitScore field): Confidence, authority, composure under pressure, professional demeanor

Provide your evaluation in JSON format:
{
  "overallScore": number (0-100, weighted average),
  "technicalScore": number (representing Structure & Brevity),
  "communicationScore": number (representing Articulation & Clarity),
  "problemSolvingScore": number (representing Active Listening & Responsiveness),
  "cultureFitScore": number (representing Executive Presence & Tone),
  "overallRecommendation": "STRONG_YES" | "YES" | "CONSIDER" | "NO",
  "detailedFeedback": "3-4 sentences summarizing their communication clarity, structured delivery, and executive presence",
  "strengths": ["communication strength 1", "communication strength 2", ...],
  "weaknesses": ["communication area to improve 1", "communication area to improve 2", ...],
  "interviewerNotes": "2-3 sentences on their storytelling impact and verbal polish"
}

Be objective, constructive, and focus on communication efficacy.`;
      } else {
        // TECH Track (Default - unchanged)
        prompt = `You are an expert technical interviewer evaluating a candidate for {jobTitle}.

Job Description:
{jobDescription}

Required Skills:
{requiredSkills}

Candidate Resume Background:
{resumeText}

Interview Transcript:
{transcript}

Evaluate the candidate on these dimensions (0-100 each), taking into account both the interview responses and their resume claims:
1. Technical Competency: Depth of technical knowledge, accuracy, problem-solving approach, alignment with resume
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
  "detailedFeedback": "3-4 sentences summarizing overall performance and resume alignment",
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "interviewerNotes": "2-3 sentences for the hiring manager"
}

Be objective, fair, and focus on demonstrated skills.`;
      }

      prompt += SCORECARD_RULES;

      const unassessed = (input.unassessedSkills || []).filter(Boolean);
      if (unassessed.length > 0) {
        prompt += `\n\nCOVERAGE GAP (important): The interview never tested these required skills: ${unassessed.join(", ")}.
- Do NOT guess the candidate's level in them and do NOT reward or penalize them for these skills; base dimension scores only on what was actually tested.
- Not being asked about a skill is not the candidate's fault: it must not reduce any score or the recommendation.
- Only mention in \"interviewerNotes\" that these skills were not tested, so the reader knows they remain unverified.`;
      }

      const transcript = qaTranscript.length > 0
        ? qaTranscript
            .map((qa, i) => {
              const tag = qa.isFollowUp ? " [cross-question probing the previous answer]" : "";
              const ev = qa.evaluation;
              const note =
                ev && ev.quality
                  ? `\n(Live assessment of A${i + 1}: ${ev.quality}${ev.correctnessIssue ? `; possible inaccuracy: ${ev.correctnessIssue}` : ev.gap ? `; gap: ${ev.gap}` : ""})`
                  : "";
              return `Q${i + 1}${tag}: ${qa.question}\nA${i + 1}: ${qa.answer || "[No verbal response recorded]"}${note}\n`;
            })
            .join("\n")
        : "Candidate did not answer any interview questions.";

      const result = await llmClient.generateJSON<ScorecardResult>(
        prompt,
        {
          jobTitle: input.jobTitle || (track === "SALES" ? "Sales Role" : track === "HR" ? "HR Role" : track === "COMMUNICATION" ? "Communication Role" : "Technical Role"),
          jobDescription: (input.jobDescription || "").substring(0, 12000),
          requiredSkills: Array.isArray(input.requiredSkills)
            ? input.requiredSkills.join(", ")
            : String(input.requiredSkills || ""),
          resumeText: (input.resumeText || "").substring(0, 12000),
          transcript: transcript.substring(0, 30000),
        },
        { temperature: 0.2, maxTokens: 3500, timeoutMs: 30000 },
      );

      const technicalScore = clampScore(result.technicalScore, 50);
      const communicationScore = clampScore(result.communicationScore, 50);
      const problemSolvingScore = clampScore(result.problemSolvingScore, 50);
      const cultureFitScore = clampScore(result.cultureFitScore, 50);
      const dimensionMean = Math.round(
        (technicalScore + communicationScore + problemSolvingScore + cultureFitScore) / 4,
      );
      const overallScore = clampScore(result.overallScore, dimensionMean);
      const validRecommendations = ["STRONG_YES", "YES", "CONSIDER", "NO"];

      const sanitized: ScorecardResult = {
        overallScore,
        technicalScore,
        communicationScore,
        problemSolvingScore,
        cultureFitScore,
        technicalReasoning: result.technicalReasoning || undefined,
        communicationReasoning: result.communicationReasoning || undefined,
        problemSolvingReasoning: result.problemSolvingReasoning || undefined,
        cultureFitReasoning: result.cultureFitReasoning || undefined,
        overallRecommendation: validRecommendations.includes(result.overallRecommendation as string)
          ? result.overallRecommendation
          : overallScore >= 80 ? "STRONG_YES" : overallScore >= 65 ? "YES" : overallScore >= 50 ? "CONSIDER" : "NO",
        detailedFeedback: result.detailedFeedback || "Interview evaluation completed.",
        strengths: Array.isArray(result.strengths) ? result.strengths : [],
        weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
        interviewerNotes: result.interviewerNotes || "",
      };

      logger.info("[EvaluationService] Scorecard generated", {
        track,
        overallScore: sanitized.overallScore,
        recommendation: sanitized.overallRecommendation,
      });

      return sanitized;
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
    jobDescription?: string;
    careerGoals?: string;
    requiredSkills?: string[];
  }): Promise<ResumeFeedbackResult> {
    logger.info("[EvaluationService] Generating resume feedback", {
      jobTitle: input.jobTitle,
      hasResumeText: !!input.resumeText,
    });

    try {
      const requiredSkillsList = Array.isArray(input.requiredSkills)
        ? input.requiredSkills.join(", ")
        : String(input.requiredSkills || "");

      const prompt = `You are a professional technical career coach reviewing a candidate's resume for a {jobTitle} position.

Target Role: {jobTitle}
Key Skills for Role: {requiredSkills}

Full Job Description (the benchmark for this evaluation):
{jobDescription}

Candidate Resume Content:
{resumeText}

Candidate Career Goals: {careerGoals}

JOB DESCRIPTION MATCH ANALYSIS (mandatory):
- Extract the concrete requirements from the Job Description (skills, tools, years/level of experience, responsibilities, domain).
- For each, decide from the resume text alone whether it is clearly shown ("matchedRequirements") or not evidenced ("unmetRequirements"). Quote or closely paraphrase the resume evidence for matched items, e.g. "React - built dashboard at X".
- "jdMatchScore" (0-100) = how well the resume as written satisfies the Job Description's requirements, weighting must-haves above nice-to-haves.
- "missingSkills" and "improvementSuggestions" must be driven by gaps against THIS Job Description, not generic advice.

CRITICAL ACCURACY AND ANTI-HALLUCINATION RULES:
1. Base your evaluation strictly and ONLY on what is explicitly written in the Resume Content above.
2. NEVER fabricate, assume, or hallucinate details not explicitly written in the resume. For example: do NOT assume or invent past domains (like cybersecurity, mobile apps, etc.) or personal information (like date of birth, marital status) unless they literally appear in the text.
3. If the candidate's resume explicitly mentions a technology or tool (e.g., JavaScript, TypeScript, Node.js, Express, MongoDB, PostgreSQL, REST APIs, Git, etc.), you MUST recognize it under strengthsIdentified. NEVER list an existing skill under missingSkills or claim they have "no demonstrated experience" with it.
4. "missingSkills": A list of specific technologies or domain skills required for a {jobTitle} that are GENUINELY absent from the candidate's resume content. If the resume already covers the required skills, return an empty array [] or at most 1-2 advanced adjacent industry tools (e.g., "Docker", "Redis", "CI/CD").
5. "improvementSuggestions": 3-4 realistic, constructive suggestions based strictly on their actual projects and bullet points (e.g., quantifying project achievements with metrics, detailing system scalability or architecture trade-offs).
6. "strengthsIdentified": 3-4 specific strengths directly found in their resume content.

Provide constructive, encouraging feedback in JSON format:
{
  "overallRating": "EXCELLENT" | "GOOD" | "AVERAGE" | "NEEDS_IMPROVEMENT",
  "missingSkills": ["genuinely missing skill 1", ...] (ONLY skills missing from resume that are required for the role; if none missing, return []),
  "improvementSuggestions": ["actionable suggestion 1", "actionable suggestion 2", ...] (3-5 realistic items),
  "strengthsIdentified": ["strength 1", "strength 2", ...] (3-5 positive aspects based on actual resume content),
  "formattingScore": number (0-100),
  "contentScore": number (0-100),
  "keywordOptimization": "1-2 sentences about ATS keyword optimization against the Job Description's keywords",
  "careerAdvice": "2-3 sentences of personalized career guidance",
  "jdMatchScore": number (0-100),
  "matchedRequirements": ["JD requirement - resume evidence", ...],
  "unmetRequirements": ["JD requirement not evidenced in the resume", ...]
}`;

      const result = await llmClient.generateJSON<ResumeFeedbackResult>(
        prompt,
        {
          jobTitle: input.jobTitle || "Software Engineer",
          requiredSkills: requiredSkillsList || "Problem Solving, Data Structures, Modern Engineering",
          jobDescription: (input.jobDescription || "Not provided; rely on the role title and key skills.").substring(0, 12000),
          resumeText: (input.resumeText || "").substring(0, 12000),
          careerGoals: input.careerGoals || "Not specified",
        },
        { temperature: 0.2, maxTokens: 3500, timeoutMs: 30000 },
      );

      const sanitized: ResumeFeedbackResult = {
        overallRating: result.overallRating || "GOOD",
        missingSkills: Array.isArray(result.missingSkills)
          ? result.missingSkills.filter((s: any) => typeof s === "string" && s.trim().length > 0 && !s.toLowerCase().includes("no response") && !s.toLowerCase().includes("no demonstrated"))
          : [],
        improvementSuggestions: Array.isArray(result.improvementSuggestions)
          ? result.improvementSuggestions
          : ["Highlight specific technical metrics and impact in project descriptions"],
        strengthsIdentified: Array.isArray(result.strengthsIdentified)
          ? result.strengthsIdentified
          : ["Relevant technology stack alignment"],
        formattingScore: Math.round(Number(result.formattingScore) || 75),
        contentScore: Math.round(Number(result.contentScore) || 75),
        keywordOptimization: result.keywordOptimization || "Good coverage of core technical keywords.",
        careerAdvice: result.careerAdvice || "Continue expanding depth in distributed systems and cloud architecture.",
        jdMatchScore: clampScore(result.jdMatchScore, 0),
        matchedRequirements: Array.isArray(result.matchedRequirements)
          ? result.matchedRequirements.filter((s: any) => typeof s === "string" && s.trim())
          : [],
        unmetRequirements: Array.isArray(result.unmetRequirements)
          ? result.unmetRequirements.filter((s: any) => typeof s === "string" && s.trim())
          : [],
      };

      logger.info("[EvaluationService] Resume feedback generated", {
        rating: sanitized.overallRating,
        suggestionsCount: sanitized.improvementSuggestions.length,
        missingSkillsCount: sanitized.missingSkills.length,
      });

      return sanitized;
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
