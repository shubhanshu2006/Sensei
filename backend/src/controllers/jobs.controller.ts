import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { jobService } from "../services/jobs.service.js";
import type {
  CreateJobInput,
  UpdateJobInput,
  JobStatusInput,
  JobQueryInput,
} from "../validations/jobs.validation.js";

// JobController
// All methods are wrapped in asyncHandler so thrown ApiErrors propagate
// cleanly to the global error handler.

export class JobController {
  // createJob
  // POST /jobs
  // Body is validated by validateBody(createJobSchema) upstream.
  // Responds with 201 Created.

  createJob = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const recruiterId = req.user!.recruiterProfileId!;
      const data = req.body as CreateJobInput;

      const job = await jobService.createJob(recruiterId, data);

      res
        .status(201)
        .json(new ApiResponse(201, job, "Job created successfully"));
    },
  );

  // getMyJobs
  // GET /jobs/my
  // Returns the authenticated recruiter's own jobs with filters and pagination.
  // Query is validated by validateQuery(jobQuerySchema) upstream.

  getMyJobs = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const recruiterId = req.user!.recruiterProfileId!;
      const query = req.query as unknown as JobQueryInput;

      const result = await jobService.getRecruiterJobs(recruiterId, query);

      res
        .status(200)
        .json(new ApiResponse(200, result, "Jobs retrieved successfully"));
    },
  );

  // getJobById
  // GET /jobs/:id/manage  (recruiter — ownership enforced)
  // GET /jobs/:id         (public / optionalAuth — no ownership check)
  //
  // Uses req.route.path to distinguish between the two route patterns.
  // The /manage route is protected by requireRecruiterProfile, so
  // recruiterProfileId is guaranteed to be present on that path.

  getJobById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const id = req.params.id as string;

      // Determine whether this is the recruiter "manage" route or the public view.
      // req.route.path is the raw route pattern string (e.g. "/:id/manage").
      const routePattern = (req.route as { path: string }).path as string;
      const isManageRoute = routePattern.includes("/manage");

      // For /manage, pass the recruiterProfileId so the service enforces ownership.
      const recruiterId = isManageRoute
        ? req.user?.recruiterProfileId
        : undefined;

      const job = await jobService.getJobById(id, recruiterId);

      res
        .status(200)
        .json(new ApiResponse(200, job, "Job retrieved successfully"));
    },
  );

  // updateJob
  // PUT /jobs/:id
  // Body is validated by validateBody(updateJobSchema) upstream.

  updateJob = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const recruiterId = req.user!.recruiterProfileId!;
      const id = req.params.id as string;
      const data = req.body as UpdateJobInput;

      const updated = await jobService.updateJob(id, recruiterId, data);

      res
        .status(200)
        .json(new ApiResponse(200, updated, "Job updated successfully"));
    },
  );

  // deleteJob
  // DELETE /jobs/:id
  // Only DRAFT jobs may be deleted.

  deleteJob = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const recruiterId = req.user!.recruiterProfileId!;
      const id = req.params.id as string;

      await jobService.deleteJob(id, recruiterId);

      res
        .status(200)
        .json(new ApiResponse(200, null, "Job deleted successfully"));
    },
  );

  // updateJobStatus
  // PATCH /jobs/:id/status
  // Body is validated by validateBody(jobStatusSchema) upstream.

  updateJobStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const recruiterId = req.user!.recruiterProfileId!;
      const id = req.params.id as string;
      const { status } = req.body as JobStatusInput;

      const updated = await jobService.updateJobStatus(id, recruiterId, status);

      res
        .status(200)
        .json(new ApiResponse(200, updated, `Job status updated to ${status}`));
    },
  );

  // getPublicJobs
  // GET /jobs
  // Returns ACTIVE jobs for candidate browsing.
  // Query is validated by validateQuery(jobQuerySchema) upstream.

  getPublicJobs = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const query = req.query as unknown as JobQueryInput;

      const result = await jobService.getPublicJobs(query);

      res
        .status(200)
        .json(new ApiResponse(200, result, "Jobs retrieved successfully"));
    },
  );
}

// Singleton export

export const jobController = new JobController();
