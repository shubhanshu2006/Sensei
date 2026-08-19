export enum ApplicationStatus {
  SUBMITTED = "SUBMITTED",
  SCREENING = "SCREENING",
  SCREENED = "SCREENED",
  SHORTLISTED = "SHORTLISTED",
  INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED",
  INTERVIEWED = "INTERVIEWED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  resumeUrl: string;
  coverLetter?: string;
  status: ApplicationStatus;
  screeningScore?: number;
  screeningReport?: {
    id: string;
    overallScore: number;
    skillsMatch: number;
    experienceMatch: number;
    cultureFit: number;
    recommendation: "STRONG_YES" | "YES" | "MAYBE" | "NO" | "STRONG_NO";
    summary: string;
    strengths: string[];
    concerns: string[];
    interviewSuggestions: string[];
  };
  candidate: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      profilePictureUrl?: string;
    };
    currentTitle?: string;
    location?: string;
    yearsOfExperience?: number;
  };
  job: {
    id: string;
    title: string;
    companyName: string;
  };
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  jobId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
