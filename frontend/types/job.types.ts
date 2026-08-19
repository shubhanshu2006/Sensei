export enum JobStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  CLOSED = "CLOSED",
}

export enum ExperienceLevel {
  INTERNSHIP = "INTERNSHIP",
  ENTRY_LEVEL = "ENTRY_LEVEL",
  MID_LEVEL = "MID_LEVEL",
  SENIOR_LEVEL = "SENIOR_LEVEL",
  LEAD = "LEAD",
}

export enum JobType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  INTERNSHIP = "INTERNSHIP",
}

export enum WorkMode {
  REMOTE = "REMOTE",
  ONSITE = "ONSITE",
  HYBRID = "HYBRID",
}

export enum ScreeningMode {
  AUTOMATIC = "AUTOMATIC",
  ASSISTED = "ASSISTED",
}

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  jobType: JobType;
  workMode: WorkMode;
  experienceLevel: ExperienceLevel;
  requiredSkills: string[];
  salaryMin?: number;
  salaryMax?: number;
  status: JobStatus;
  screeningMode: ScreeningMode;
  autoInviteThreshold?: number;
  questionsCount: number;
  recruiterId: string;
  recruiter?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
    companyName: string;
    companyLogo?: string;
  };
  applicationsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  title: string;
  description: string;
  location: string;
  jobType: JobType;
  workMode: WorkMode;
  experienceLevel: ExperienceLevel;
  requiredSkills: string[];
  salaryMin?: number;
  salaryMax?: number;
  status: JobStatus;
  screeningMode: ScreeningMode;
  autoInviteThreshold?: number;
  questionsCount: number;
}

export interface UpdateJobInput extends Partial<CreateJobInput> {
  id: string;
}

export interface JobFilters {
  status?: JobStatus;
  experienceLevel?: ExperienceLevel;
  jobType?: JobType;
  workMode?: WorkMode;
  search?: string;
  page?: number;
  limit?: number;
}
