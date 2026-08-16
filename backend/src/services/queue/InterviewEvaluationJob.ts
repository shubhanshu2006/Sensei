import { Queue, Worker, Job } from "bullmq";
import { connection } from "./index.js";
import { prisma } from "../../database/client.js";
import { aiEngine } from "../ai/AIEngine.js";
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

export const interviewEvaluationWorker = new Worker<InterviewEvaluationJobData>(
  "interview-evaluation",
  async (job: Job<InterviewEvaluationJobData>) => {
    const { sessionId, candidateId, jobTitle, requiredSkills } = job.data;

    logger.info("[InterviewEvaluationJob] Starting evaluation", {
      jobId: job.id,
      sessionId,
    });

    try {
      // Step 1: Fetch interview session with Q&A transcript
      const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: {
          transcript: true,
          application: {
            include: {
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
            },
          },
        },
      });

      if (!session) {
        throw new Error(`Interview session ${sessionId} not found`);
      }

      if (!session.transcript) {
        throw new Error(`No transcript found for session ${sessionId}`);
      }

      // Determine job context (hiring vs practice)
      const jobContext = session.application?.job || session.practiceJob;
      if (!jobContext) {
        throw new Error("No job context found for interview");
      }

      // Step 2: Generate AI scorecard using real evaluation
      logger.info("[InterviewEvaluationJob] Generating AI scorecard");

      const scorecardData = await aiEngine.generateInterviewScorecard({
        jobTitle: jobContext.title,
        jobDescription: jobContext.description,
        requiredSkills: jobContext.requiredSkills as string[],
        resumeText: session.resumeUrl,
        qaTranscript: (session.transcript.qaData as any[]) || [],
      });

      const scorecard = await prisma.scorecard.create({
        data: {
          sessionId,
          overallScore: scorecardData.overallScore,
          overallRecommendation: scorecardData.detailedFeedback || scorecardData.overallRecommendation,
          // Dimension scores stored as JSON objects with score and reasoning
          technicalScore: {
            score: scorecardData.technicalScore,
            reasoning: `Technical assessment for ${jobContext.title}`,
          },
          communicationScore: {
            score: scorecardData.communicationScore,
            reasoning: "Communication skills evaluation",
          },
          problemSolvingScore: {
            score: scorecardData.problemSolvingScore,
            reasoning: "Problem-solving approach assessment",
          },
          confidenceScore: {
            score: scorecardData.cultureFitScore || 75, // Use cultureFit as confidence fallback
            reasoning: "Confidence and cultural alignment",
          },
          // Optional behavioral scores
          behavioralScore: scorecardData.interviewerNotes
            ? {
                score: scorecardData.overallScore,
                reasoning: scorecardData.interviewerNotes,
              }
            : undefined,
          // Detailed analysis arrays
          strengths: scorecardData.strengths,
          weaknesses: scorecardData.weaknesses,
          keyInsights: [scorecardData.detailedFeedback],
        },
      });

      // Step 3: Generate resume feedback for candidate
      logger.info("[InterviewEvaluationJob] Generating AI resume feedback");

      const feedbackData = await aiEngine.generateResumeFeedback({
        resumeText: session.resumeUrl,
        jobTitle: jobContext.title,
        careerGoals: undefined, // Could be added to candidate profile later
      });

      const resumeFeedback = await prisma.resumeFeedback.create({
        data: {
          sessionId,
          overallRating: feedbackData.overallRating,
          improvementSuggestions: feedbackData.improvementSuggestions,
          strengthsIdentified: feedbackData.strengthsIdentified,
          formattingScore: feedbackData.formattingScore,
          contentScore: feedbackData.contentScore,
          keywordOptimization: feedbackData.keywordOptimization,
          personalizedRecommendations: feedbackData.careerAdvice,
          missingSkills: [], // Could be extracted from scorecard
          missingProjects: [], // Could be added later
          resumeOptimization: {}, // Could be added later
        },
      });

      // Step 4: Update session status and mark evaluation complete
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          evaluationCompletedAt: new Date(),
        },
      });

      // Step 5: Trigger email notification (via separate queue)
      // await emailQueue.add('interview-completed', { sessionId, candidateId });

      logger.info(
        "[InterviewEvaluationJob] Evaluation completed successfully",
        {
          jobId: job.id,
          sessionId,
          overallScore: scorecardData.overallScore,
          scorecardId: scorecard.id,
          feedbackId: resumeFeedback.id,
        },
      );

      return {
        success: true,
        scorecardId: scorecard.id,
        feedbackId: resumeFeedback.id,
      };
    } catch (error) {
      logger.error("[InterviewEvaluationJob] Evaluation failed", {
        jobId: job.id,
        sessionId,
        error,
      });
      throw error; // Will trigger retry
    }
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
