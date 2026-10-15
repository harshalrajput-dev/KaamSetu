import { Router } from "express";
import authenticate from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// Upload a single optional problem photo. Returns a relative URL.
router.post(
  "/",
  authenticate,
  uploadImage.single("photo"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("No image uploaded");
    res.status(201).json({
      success: true,
      data: { photoUrl: `/uploads/${req.file.filename}` },
    });
  })
);

export default router;
