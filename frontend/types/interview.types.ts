export enum InterviewStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum InterviewType {
  REAL = "REAL",
  PRACTICE = "PRACTICE",
}

export interface InterviewSession {
  id: string;
  sessionToken: string;
  type: InterviewType;
  jobId?: string;
  applicationId?: string;
  candidateId: string;
  status: InterviewStatus;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  questionsAsked: number;
  questionsAnswered: number;
  scorecard?: {
    id: string;
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    problemSolvingScore: number;
    cultureFitScore: number;
    recommendation:
      | "STRONG_HIRE"
      | "HIRE"
      | "MAYBE"
      | "NO_HIRE"
      | "STRONG_NO_HIRE";
    strengths: string[];
    weaknesses: string[];
    summary: string;
    detailedFeedback: string;
  };
  candidate: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      profilePictureUrl?: string;
    };
  };
  job?: {
    id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleInterviewInput {
  applicationId: string;
  scheduledAt: string;
  message?: string;
}
