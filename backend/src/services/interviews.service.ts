import { prisma } from "../database/client.js";
import { ApiError } from "../utils/ApiError.js";

// Service

class InterviewService {
  /**
   * Returns an interview session by its primary-key ID.
   *
   * Access control:
   *  - Candidates may only view sessions where they are the candidate
   *    (either via the `application.candidate` or the direct `candidate` link).
   *  - Recruiters may view sessions linked to jobs they own.
   *
   * @throws 404 if the session does not exist.
   * @throws 403 if the requesting user has no relationship to the session.
   */
  async getSessionById(sessionId: string, userId: string) {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        application: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                recruiterId: true,
              },
            },
            candidate: {
              select: { id: true, userId: true },
            },
          },
        },
        candidate: {
          select: { id: true, userId: true },
        },
        practiceJob: {
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true,
          },
        },
      },
    });

    if (!session) {
      throw new ApiError(404, "Interview session not found");
    }

    // Resolve the candidate's user ID for this session.
    const candidateUserId =
      session.application?.candidate?.userId ?? session.candidate?.userId;

    if (candidateUserId === userId) {
      return session;
    }

    // If the caller is not the candidate, check whether they are the
    // recruiter who owns the job attached to this session.
    const jobRecruiterId = session.application?.job?.recruiterId;
    if (jobRecruiterId) {
      const recruiterProfile = await prisma.recruiterProfile.findUnique({
        where: { id: jobRecruiterId },
        select: { userId: true },
      });

      if (recruiterProfile?.userId === userId) {
        return session;
      }
    }

    throw new ApiError(403, "You do not have access to this interview session");
  }

  /**
   * Returns a session looked up by its unique session token.
   * Used by the WebSocket gateway to authenticate real-time connections.
   *
   * @throws 404 if no session matches the token.
   */
  async getSessionByToken(sessionToken: string) {
    const session = await prisma.interviewSession.findUnique({
      where: { sessionToken },
      include: {
        application: {
          include: {
            candidate: { select: { id: true, userId: true } },
            job: { select: { id: true, title: true, recruiterId: true } },
          },
        },
        candidate: { select: { id: true, userId: true } },
        practiceJob: { select: { id: true, title: true } },
      },
    });

    if (!session) {
      throw new ApiError(404, "Interview session not found");
    }

    return session;
  }

  async getInterviewResults(sessionId: string, userId: string) {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        scorecard: true,
        resumeFeedback: true,
        transcript: {
          select: {
            id: true,
            totalWords: true,
            fillerWordCount: true,
            averagePaceWPM: true,
            createdAt: true,
          },
        },
        application: {
          include: {
            job: { select: { id: true, title: true } },
            candidate: { select: { id: true, userId: true } },
          },
        },
        candidate: { select: { id: true, userId: true } },
        practiceJob: {
          select: { id: true, title: true, category: true, difficulty: true },
        },
      },
    });

    if (!session) {
      throw new ApiError(404, "Interview session not found");
    }

    if (session.status !== "COMPLETED") {
      throw new ApiError(
        400,
        "Interview results are only available once the session is completed",
      );
    }

    const candidateUserId =
      session.application?.candidate?.userId ?? session.candidate?.userId;

    if (candidateUserId !== userId) {
      throw new ApiError(
        403,
        "You do not have access to these interview results",
      );
    }

    return session;
  }

  async getRecruiterInterviewResults(sessionId: string, recruiterId: string) {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        scorecard: true,
        // ResumeFeedback deliberately omitted.
        transcript: {
          select: {
            id: true,
            totalWords: true,
            fillerWordCount: true,
            averagePaceWPM: true,
            createdAt: true,
          },
        },
        application: {
          include: {
            job: {
              select: { id: true, title: true, recruiterId: true },
            },
            candidate: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new ApiError(404, "Interview session not found");
    }

    if (session.status !== "COMPLETED") {
      throw new ApiError(
        400,
        "Interview results are only available once the session is completed",
      );
    }

    if (session.interviewType !== "HIRING" || !session.application) {
      throw new ApiError(
        400,
        "This endpoint is only available for hiring interview sessions",
      );
    }

    if (session.application.job.recruiterId !== recruiterId) {
      throw new ApiError(
        403,
        "You do not have access to this interview session",
      );
    }

    return session;
  }

  async listSessionsForApplication(applicationId: string, recruiterId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: { select: { id: true, recruiterId: true } },
      },
    });

    if (!application) {
      throw new ApiError(404, "Application not found");
    }

    if (application.job.recruiterId !== recruiterId) {
      throw new ApiError(403, "You do not have access to this application");
    }

    const sessions = await prisma.interviewSession.findMany({
      where: { applicationId },
      orderBy: { createdAt: "desc" },
      include: {
        scorecard: {
          select: {
            overallScore: true,
            overallRecommendation: true,
          },
        },
      },
    });

    return sessions;
  }
}

export const interviewService = new InterviewService();
