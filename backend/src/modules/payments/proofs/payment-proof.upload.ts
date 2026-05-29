import fs from "fs";
import path from "path";
import multer from "multer";
import { env } from "../../../config/env";
import { localStorageService } from "../../../storage/local-storage.service";
import { ApiError } from "../../../utils/apiError";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    fs.mkdirSync(localStorageService.paymentProofDir, { recursive: true });
    callback(null, localStorageService.paymentProofDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, safeName);
  },
});

export const paymentProofUpload = multer({
  storage,
  limits: {
    fileSize: env.MAX_PROOF_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new ApiError(400, "Only image proof files are allowed"));
    }

    return callback(null, true);
  },
});
