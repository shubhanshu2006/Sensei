import { Queue, Worker, Job } from "bullmq";
import { connection } from "./connection.js";
import { prisma } from "../../database/client.js";
import { aiEngine } from "../ai/AIEngine.js";
import { getDimensionTitles } from "../ai/EvaluationService.js";
import { logger } from "../../utils/logger.js";

// ---------------------------------------------------------------------------
// InterviewEvaluationJob - Background processing for interview evaluation
//
// Triggered when: Interview session completes (status → COMPLETED)
//
// Processing steps:
// 1. Fetch interview session with all Q&A pairs
// 2. Generate AI scorecard (technical, communication, problem-solving)
// 3. Generate resume feedback for candidate
// 4. Update database with results
// 5. Trigger email notifications
//
// Queue name: 'interview-evaluation'
// Concurrency: 3 workers
// Retry: 3 attempts with exponential backoff
// ---------------------------------------------------------------------------

export interface InterviewEvaluationJobData {
  sessionId: string;
  candidateId: string;
  jobTitle?: string;
  requiredSkills?: string[];
}

export const interviewEvaluationQueue = new Queue("interview-evaluation", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000, // Start with 2s, then 4s, then 8s
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 jobs
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
    },
  },
});

const inFlightEvaluations = new Map<string, Promise<any>>();

export async function executeInterviewEvaluation(sessionId: string): Promise<any> {
  if (inFlightEvaluations.has(sessionId)) {
    return inFlightEvaluations.get(sessionId);
  }

  const promise = (async () => {
    logger.info("[InterviewEvaluationJob] Starting evaluation execution", { sessionId });

    // Step 1: Fetch session
    const session = await prisma.interviewSession.findFirst({
      where: {
        OR: [{ id: sessionId }, { sessionToken: sessionId }],
      },
      include: {
        transcript: true,
        scorecard: true,
        candidate: {
          include: {
            user: true,
          },
        },
        application: {
          include: {
            candidate: {
              include: {
                user: true,
              },
            },
            job: {
              select: {
                title: true,
                requiredSkills: true,
                description: true,
              },
            },
          },
        },
        practiceJob: {
          select: {
            title: true,
            requiredSkills: true,
            description: true,
            category: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error(`Interview session ${sessionId} not found`);
    }

    if (session.scorecard) {
      return session.scorecard;
    }

    const realSessionId = session.id;

    // Determine job context
    const jobContext = session.application?.job || session.practiceJob || {
      title: "Technical Interview Practice",
      description: "Comprehensive software engineering assessment",
      requiredSkills: ["Problem Solving", "System Design", "Communication"],
    };

    const jobCategory = (session.practiceJob as any)?.category || (session.application?.job as any)?.category;

    // Extract resume text if available
    const targetResumeUrl =
      session.resumeUrl ||
      session.candidate?.resumeUrl ||
      session.application?.candidate?.resumeUrl ||
      session.application?.resumeUrl;

    let resumeText = "";
    if (targetResumeUrl) {
      try {
        const { resumeParser } = await import("../ai/ResumeParser.js");
        resumeText = await resumeParser.getResumeText(targetResumeUrl);
      } catch (err: any) {
        logger.warn("[InterviewEvaluationJob] Could not parse resume text:", err?.message || err);
      }
    }

    if (!resumeText) {
      resumeText = `Candidate applying for ${jobContext.title}. Required skills: ${((jobContext.requiredSkills as string[]) || []).join(", ")}`;
    }

    const allQaData = (session.transcript?.qaData as any[]) || [];

    // A question that was shown but never answered (candidate ended early) must not be
    // scored as a non-answer. A submitted answer is marked `answered` (or, in older sessions,
    // carries `isVoiceMode`); trailing entries without either were never answered.
    const wasSubmitted = (qa: any) =>
      qa.answered === true ||
      qa.isVoiceMode !== undefined ||
      (typeof qa.answer === "string" && qa.answer.trim().length > 0);
    let lastSubmittedEnd = allQaData.length;
    while (lastSubmittedEnd > 0 && !wasSubmitted(allQaData[lastSubmittedEnd - 1])) {
      lastSubmittedEnd--;
    }
    const qaData = allQaData.slice(0, lastSubmittedEnd);

    const validAnswers = qaData.filter((qa: any) => {
      const ans = (qa.answer || "").trim();
      return (
        ans.length > 5 &&
        !ans.includes("[No verbal response recorded]") &&
        !ans.toLowerCase().includes("no verbal response") &&
        !ans.toLowerCase().includes("no response recorded")
      );
    });

    const hasNoAnswers = validAnswers.length === 0;

    // Coverage: which required skills did no (validly answered) question actually test?
    // Only computed when questions carry a topic (older sessions don't).
    const requiredSkillsForCoverage = ((jobContext.requiredSkills as string[]) || []).filter(Boolean);
    const hasTopicData = qaData.some((qa: any) => qa.topic);
    const assessedTopics = new Set(
      validAnswers.filter((qa: any) => qa.topic).map((qa: any) => String(qa.topic).toLowerCase()),
    );
    const unassessedSkills = hasTopicData && !hasNoAnswers
      ? requiredSkillsForCoverage.filter((skill) => !assessedTopics.has(skill.toLowerCase()))
      : [];

    logger.info("[InterviewEvaluationJob] Generating AI scorecard", {
      sessionId: realSessionId,
      qaCount: qaData.length,
      validAnswersCount: validAnswers.length,
      jobCategory,
    });

    // Step 2: Generate AI scorecard with sensible fallbacks
    let scorecardData: any;
    if (hasNoAnswers) {
      logger.info("[InterviewEvaluationJob] Candidate provided 0 answers, scoring 0", {
        sessionId: realSessionId,
      });
      scorecardData = {
        overallScore: 0,
        technicalScore: 0,
        communicationScore: 0,
        problemSolvingScore: 0,
        cultureFitScore: 0,
        overallRecommendation: "NO",
        detailedFeedback:
          "The interview was concluded without any candidate responses recorded. Since no questions were answered, technical proficiency, problem-solving, and communication skills could not be evaluated.",
        strengths: [],
        weaknesses: ["No verbal or written responses were provided during the interview session"],
        interviewerNotes:
          "Candidate completed or exited the interview without answering any questions. System automatically recorded an overall score of 0.",
      };
    } else {
      try {
        scorecardData = await aiEngine.generateInterviewScorecard({
          jobTitle: jobContext.title,
          jobDescription: jobContext.description,
          requiredSkills: (jobContext.requiredSkills as string[]) || [],
          resumeText,
          qaTranscript: qaData,
          category: jobCategory,
          unassessedSkills,
        });
      } catch (evalError) {
        logger.error("[InterviewEvaluationJob] AI scorecard generation error, using fallback assessment", evalError);
        scorecardData = {
          overallScore: Math.min(50, Math.max(20, validAnswers.length * 10)),
          technicalScore: 40,
          communicationScore: 40,
          problemSolvingScore: 40,
          cultureFitScore: 50,
          overallRecommendation: "CONSIDER",
          detailedFeedback: "The candidate completed the mock interview assessment.",
          strengths: ["Participated in mock interview assessment"],
          weaknesses: ["Deepen edge case consideration and strategic rationale"],
        };
      }
    }

    // Accept a legitimate 0 from the evaluator; only fall back when the value is missing/invalid.
    const toScore = (value: unknown, fallback: number) => {
      const n = Number(value);
      return Number.isFinite(n) ? Math.round(Math.min(100, Math.max(0, n))) : fallback;
    };
    const overallScore = toScore(scorecardData.overallScore, hasNoAnswers ? 0 : 60);
    const dimensionTitles = getDimensionTitles(jobCategory, jobContext.title);
    const overallRecommendation =
      scorecardData.overallRecommendation ||
      (overallScore >= 80 ? "STRONG_YES" : overallScore >= 65 ? "YES" : overallScore >= 50 ? "CONSIDER" : "NO");

    const keyInsights: string[] = [
      ...(scorecardData.detailedFeedback ? [scorecardData.detailedFeedback] : []),
      ...(unassessedSkills.length > 0
        ? [`Not assessed in this interview (no question covered them): ${unassessedSkills.join(", ")}`]
        : []),
    ];

    const scorecard = await prisma.scorecard.upsert({
      where: { sessionId: realSessionId },
      update: {
        overallScore,
        overallRecommendation,
        technicalScore: {
          score: toScore(scorecardData.technicalScore, hasNoAnswers ? 0 : 60),
          reasoning: scorecardData.technicalReasoning || `${dimensionTitles.technicalScore} assessment for ${jobContext.title}`,
          title: dimensionTitles.technicalScore,
        },
        communicationScore: {
          score: toScore(scorecardData.communicationScore, hasNoAnswers ? 0 : 65),
          reasoning: scorecardData.communicationReasoning || `${dimensionTitles.communicationScore} evaluation`,
          title: dimensionTitles.communicationScore,
        },
        problemSolvingScore: {
          score: toScore(scorecardData.problemSolvingScore, hasNoAnswers ? 0 : 60),
          reasoning: scorecardData.problemSolvingReasoning || `${dimensionTitles.problemSolvingScore} assessment`,
          title: dimensionTitles.problemSolvingScore,
        },
        confidenceScore: {
          score: toScore(scorecardData.cultureFitScore, hasNoAnswers ? 0 : 75),
          reasoning: scorecardData.cultureFitReasoning || `${dimensionTitles.confidenceScore} alignment`,
          title: dimensionTitles.confidenceScore,
        },
        behavioralScore: scorecardData.interviewerNotes
          ? {
              score: overallScore,
              reasoning: scorecardData.interviewerNotes,
            }
          : undefined,
        strengths: Array.isArray(scorecardData.strengths) ? scorecardData.strengths : ["Structured communication"],
        weaknesses: Array.isArray(scorecardData.weaknesses) ? scorecardData.weaknesses : ["Deepen strategic trade-offs"],
        keyInsights,
      },
      create: {
        sessionId: realSessionId,
        overallScore,
        overallRecommendation,
        technicalScore: {
          score: toScore(scorecardData.technicalScore, hasNoAnswers ? 0 : 60),
          reasoning: scorecardData.technicalReasoning || `${dimensionTitles.technicalScore} assessment for ${jobContext.title}`,
          title: dimensionTitles.technicalScore,
        },
        communicationScore: {
          score: toScore(scorecardData.communicationScore, hasNoAnswers ? 0 : 65),
          reasoning: scorecardData.communicationReasoning || `${dimensionTitles.communicationScore} evaluation`,
          title: dimensionTitles.communicationScore,
        },
        problemSolvingScore: {
          score: toScore(scorecardData.problemSolvingScore, hasNoAnswers ? 0 : 60),
          reasoning: scorecardData.problemSolvingReasoning || `${dimensionTitles.problemSolvingScore} assessment`,
          title: dimensionTitles.problemSolvingScore,
        },
        confidenceScore: {
          score: toScore(scorecardData.cultureFitScore, hasNoAnswers ? 0 : 75),
          reasoning: scorecardData.cultureFitReasoning || `${dimensionTitles.confidenceScore} alignment`,
          title: dimensionTitles.confidenceScore,
        },
        behavioralScore: scorecardData.interviewerNotes
          ? {
              score: overallScore,
              reasoning: scorecardData.interviewerNotes,
            }
          : undefined,
        strengths: Array.isArray(scorecardData.strengths) ? scorecardData.strengths : ["Structured communication"],
        weaknesses: Array.isArray(scorecardData.weaknesses) ? scorecardData.weaknesses : ["Deepen strategic trade-offs"],
        keyInsights,
      },
    });

    // Step 3: Resume feedback
    try {
      const feedbackData = await aiEngine.generateResumeFeedback({
        resumeText,
        jobTitle: jobContext.title,
        jobDescription: jobContext.description,
        requiredSkills: (jobContext.requiredSkills as string[]) || [],
      });

      // missingSkills should reflect genuine resume keyword gaps, NEVER interview weaknesses
      const missingSkills = Array.isArray(feedbackData.missingSkills)
        ? feedbackData.missingSkills.filter(
            (s: string) =>
              typeof s === "string" &&
              !s.toLowerCase().includes("no response") &&
              !s.toLowerCase().includes("no demonstrated")
          )
        : [];

      await prisma.resumeFeedback.upsert({
        where: { sessionId: realSessionId },
        update: {
          missingSkills,
          missingProjects: [],
          improvementSuggestions: Array.isArray(feedbackData.improvementSuggestions)
            ? feedbackData.improvementSuggestions
            : ["Quantify impact in previous project bullets"],
          personalizedRecommendations: feedbackData.careerAdvice || "",
          resumeOptimization: {
            overallRating: feedbackData.overallRating,
            strengthsIdentified: feedbackData.strengthsIdentified,
            formattingScore: feedbackData.formattingScore,
            contentScore: feedbackData.contentScore,
            keywordOptimization: feedbackData.keywordOptimization,
            jdMatchScore: feedbackData.jdMatchScore,
            matchedRequirements: feedbackData.matchedRequirements,
            unmetRequirements: feedbackData.unmetRequirements,
          },
        },
        create: {
          sessionId: realSessionId,
          missingSkills,
          missingProjects: [],
          improvementSuggestions: Array.isArray(feedbackData.improvementSuggestions)
            ? feedbackData.improvementSuggestions
            : ["Quantify impact in previous project bullets"],
          personalizedRecommendations: feedbackData.careerAdvice || "",
          resumeOptimization: {
            overallRating: feedbackData.overallRating,
            strengthsIdentified: feedbackData.strengthsIdentified,
            formattingScore: feedbackData.formattingScore,
            contentScore: feedbackData.contentScore,
            keywordOptimization: feedbackData.keywordOptimization,
            jdMatchScore: feedbackData.jdMatchScore,
            matchedRequirements: feedbackData.matchedRequirements,
            unmetRequirements: feedbackData.unmetRequirements,
          },
        },
      });
    } catch (fbError) {
      logger.warn("[InterviewEvaluationJob] Resume feedback generation skipped", fbError);
    }

    // Step 4: Ensure session is marked COMPLETED
    await prisma.interviewSession.update({
      where: { id: realSessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    logger.info("[InterviewEvaluationJob] Evaluation completed successfully", {
      sessionId: realSessionId,
      overallScore,
    });

    return scorecard;
  })();

  inFlightEvaluations.set(sessionId, promise);
  try {
    return await promise;
  } finally {
    inFlightEvaluations.delete(sessionId);
  }
}

export const interviewEvaluationWorker = new Worker<InterviewEvaluationJobData>(
  "interview-evaluation",
  async (job: Job<InterviewEvaluationJobData>) => {
    const { sessionId } = job.data;
    return await executeInterviewEvaluation(sessionId);
  },
  {
    connection,
    concurrency: 3, // Process up to 3 evaluations in parallel
  },
);

interviewEvaluationWorker.on("completed", (job) => {
  logger.info("[InterviewEvaluationJob] Job completed", {
    jobId: job.id,
    duration: Date.now() - job.processedOn!,
  });
});

interviewEvaluationWorker.on("failed", (job, err) => {
  logger.error("[InterviewEvaluationJob] Job failed", {
    jobId: job?.id,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});

export const queueInterviewEvaluation = async (
  data: InterviewEvaluationJobData,
) => {
  const job = await interviewEvaluationQueue.add("evaluate", data, {
    jobId: `eval-${data.sessionId}`, // Idempotent job ID
  });

  logger.info("[InterviewEvaluationJob] Job queued", {
    jobId: job.id,
    sessionId: data.sessionId,
  });

  return job;
};
