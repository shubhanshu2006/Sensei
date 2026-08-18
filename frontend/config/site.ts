export const siteConfig = {
  name: "Sensei AI",
  description: "AI-Powered Interview Platform",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000",

  roles: {
    ADMIN: "PLATFORM_ADMIN" as const,
    RECRUITER: "RECRUITER" as const,
    CANDIDATE: "CANDIDATE" as const,
  },

  applicationStatus: {
    SUBMITTED: "SUBMITTED",
    SCREENING_IN_PROGRESS: "SCREENING_IN_PROGRESS",
    SCREENING_COMPLETED: "SCREENING_COMPLETED",
    SHORTLISTED: "SHORTLISTED",
    REJECTED: "REJECTED",
    INTERVIEW_INVITED: "INTERVIEW_INVITED",
    INTERVIEW_SCHEDULED: "INTERVIEW_SCHEDULED",
    INTERVIEW_COMPLETED: "INTERVIEW_COMPLETED",
    WITHDRAWN: "WITHDRAWN",
  } as const,

  jobStatus: {
    DRAFT: "DRAFT",
    ACTIVE: "ACTIVE",
    PAUSED: "PAUSED",
    CLOSED: "CLOSED",
  } as const,

  interviewStatus: {
    SCHEDULED: "SCHEDULED",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    ABANDONED: "ABANDONED",
    CANCELLED: "CANCELLED",
  } as const,

  practiceCategories: [
    "FRONTEND",
    "BACKEND",
    "FULLSTACK",
    "MOBILE",
    "DEVOPS",
    "DATA_SCIENCE",
    "MACHINE_LEARNING",
    "SYSTEM_DESIGN",
    "PRODUCT_MANAGEMENT",
    "OTHER",
  ] as const,

  practiceDifficulty: [
    "BEGINNER",
    "INTERMEDIATE",
    "ADVANCED",
    "EXPERT",
  ] as const,
};
