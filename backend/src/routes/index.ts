import { Router } from "express";
import authRouter from "./auth.routes.js";
import usersRouter from "./users.routes.js";
import recruitersRouter from "./recruiters.routes.js";
import candidatesRouter from "./candidates.routes.js";
import jobsRouter from "./jobs.routes.js";
import practiceRouter from "./practice.routes.js";
import applicationsRouter from "./applications.routes.js";
import interviewsRouter from "./interviews.routes.js";
import creditsRouter from "./credits.routes.js";
import paymentsRouter from "./payments.routes.js";
import adminRouter from "./admin.routes.js";
import screeningRouter from "./screening.routes.js";

const router = Router();

// Mount all feature routes

router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/recruiters", recruitersRouter);
router.use("/candidates", candidatesRouter);
router.use("/jobs", jobsRouter);
router.use("/practice", practiceRouter);
router.use("/applications", applicationsRouter);
router.use("/interviews", interviewsRouter);
router.use("/credits", creditsRouter);
router.use("/payments", paymentsRouter);
router.use("/admin", adminRouter);
router.use("/screening", screeningRouter);

export default router;
