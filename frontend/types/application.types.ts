export enum ApplicationStatus {
  SUBMITTED = "SUBMITTED",
  SCREENING_IN_PROGRESS = "SCREENING_IN_PROGRESS",
  SCREENING_COMPLETED = "SCREENING_COMPLETED",
  SHORTLISTED = "SHORTLISTED",
  REJECTED = "REJECTED",
  INTERVIEW_INVITED = "INTERVIEW_INVITED",
  INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED",
  INTERVIEW_COMPLETED = "INTERVIEW_COMPLETED",
  WITHDRAWN = "WITHDRAWN",
}

export type ScreeningDecision =
  | "STRONG_MATCH"
  | "MODERATE_MATCH"
  | "WEAK_MATCH"
  | "NOT_SUITABLE";

export interface ScreeningReport {
  id: string;
  applicationId: string;
  overallMatchScore: number;
  skillsScore?: number;
  experienceScore?: number;
  decision: ScreeningDecision;
  strengths?: string[];
  concerns?: string[];
  suggestions?: string[];
  skillMatchAnalysis?: {
    matched?: string[];
    missing?: string[];
    [key: string]: any;
  };
  experienceAnalysis?: any;
  projectRelevance?: any;
  resumeCredibility?: any;
  aiRecommendation?: string;
  feedbackSummary?: string;
  screeningFeedback?: string;
  detailedFeedback?: any;
  processingTimeMs?: number;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  resumeUrl: string;
  coverLetter?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  status: ApplicationStatus;
  appliedAt: string;
  screeningCompletedAt?: string;
  interviewInvitedAt?: string;
  updatedAt: string;
  screeningReport?: ScreeningReport;
  candidate?: {
    id: string;
    phoneNumber?: string;
    location?: string;
    experience?: number;
    currentCompany?: string;
    currentDesignation?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    linkedinUrl?: string;
    user: {
      id?: string;
      firstName?: string;
      lastName?: string;
      email: string;
      avatar?: string;
    };
  };
  job?: {
    id: string;
    title: string;
    description?: string;
    location?: string;
    jobType?: string;
    experienceLevel?: string;
    companyName?: string;
  };
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  jobId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "appliedAt" | "score";
  sortOrder?: "asc" | "desc";
}
