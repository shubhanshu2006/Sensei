-- CreateIndex
CREATE INDEX "Application_jobId_status_idx" ON "Application"("jobId", "status");

-- CreateIndex
CREATE INDEX "Application_candidateId_status_idx" ON "Application"("candidateId", "status");

-- CreateIndex
CREATE INDEX "Application_status_appliedAt_idx" ON "Application"("status", "appliedAt");

-- CreateIndex
CREATE INDEX "InterviewSession_candidateId_status_idx" ON "InterviewSession"("candidateId", "status");

-- CreateIndex
CREATE INDEX "InterviewSession_applicationId_status_idx" ON "InterviewSession"("applicationId", "status");

-- CreateIndex
CREATE INDEX "InterviewSession_status_createdAt_idx" ON "InterviewSession"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_recruiterId_createdAt_idx" ON "Payment"("recruiterId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_recruiterId_status_idx" ON "Payment"("recruiterId", "status");
