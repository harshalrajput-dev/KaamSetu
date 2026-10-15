import { Router } from "express";
import * as workers from "../controllers/worker.controller.js";
import authenticate from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import { ROLES } from "../models/User.js";
import {
  createWorkerValidator,
  updateWorkerValidator,
  attendanceValidator,
  sanctionValidator,
  workerAccountValidator,
} from "../validators/worker.validator.js";

const router = Router();

router.use(authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.NAKA_ADMIN));

router.get("/", workers.listWorkers);
router.post("/", createWorkerValidator, validate, workers.createWorker);
router.get("/:id", workers.getWorker);
router.get("/:id/stats", workers.workerStats);
router.patch("/:id", updateWorkerValidator, validate, workers.updateWorker);
router.delete("/:id", workers.deleteWorker);
router.post("/:id/attendance", attendanceValidator, validate, workers.addAttendance);
router.post("/:id/sanction", sanctionValidator, validate, workers.sanctionWorker);
router.post("/:id/account", workerAccountValidator, validate, workers.setWorkerAccount);

export default router;
