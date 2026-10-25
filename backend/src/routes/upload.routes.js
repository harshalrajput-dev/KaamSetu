import express from "express";
import upload from "../middleware/upload.js"; // Import multer middleware

const router = express.Router();

router.post("/", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    return res.json({ success: true, fileUrl: `/uploads/${req.file.filename}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;