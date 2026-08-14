-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "totalQuestions" SET DEFAULT 10;

-- AlterTable
ALTER TABLE "InterviewTranscript" ADD COLUMN     "qaData" JSONB;
