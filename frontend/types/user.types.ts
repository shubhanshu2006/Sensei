export type UserRole = "PLATFORM_ADMIN" | "RECRUITER" | "CANDIDATE";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RecruiterProfile {
  id: string;
  userId: string;
  companyName: string;
  companyWebsite: string | null;
  companySize: string | null;
  industry: string | null;
  designation: string | null;
  phoneNumber: string | null;
  interviewCredits: number;
  freeTrialUsed: boolean;
  freeTrialCredits: number;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  phoneNumber: string | null;
  location: string | null;
  experience: number | null;
  currentCompany: string | null;
  currentDesignation: string | null;
  resumeUrl: string | null;
  resumeFileName: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  practiceCredits: number;
  practiceCreditsUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithProfile extends User {
  recruiterProfile?: RecruiterProfile;
  candidateProfile?: CandidateProfile;
}

export interface OnboardingData {
  role: UserRole;
  // Recruiter fields
  companyName?: string;
  companyWebsite?: string;
  companySize?: string;
  industry?: string;
  designation?: string;
  phoneNumber?: string;
  // Candidate fields
  location?: string;
  experience?: number;
  currentCompany?: string;
  currentDesignation?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
}
