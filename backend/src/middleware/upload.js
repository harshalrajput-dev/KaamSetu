import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString("hex");
    cb(null, `${Date.now()}-${name}${ext}`);
  },
});

const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG or WEBP images are allowed"));
    }
    return cb(null, true);
  },
});

export const UPLOAD_DIR = uploadDir;
