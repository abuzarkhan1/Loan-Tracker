import fs from "fs/promises";
import path from "path";
import { env } from "../config/env";
import { StoredFile } from "./storage.types";

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
const paymentProofDir = path.join(uploadRoot, "payment-proofs");
const reportsDir = path.join(uploadRoot, "reports");

export const localStorageService = {
  uploadRoot,
  paymentProofDir,
  reportsDir,

  async ensureDirectories() {
    await Promise.all([
      fs.mkdir(paymentProofDir, { recursive: true }),
      fs.mkdir(reportsDir, { recursive: true }),
    ]);
  },

  buildPublicUrl(relativePath: string) {
    const normalizedPath = `/${relativePath.replace(/^\/+/, "")}`;
    return env.PUBLIC_BASE_URL ? `${env.PUBLIC_BASE_URL.replace(/\/$/, "")}${normalizedPath}` : normalizedPath;
  },

  async remove(storagePath?: string) {
    if (!storagePath) return;
    await fs.rm(storagePath, { force: true });
  },

  fromMulterFile(file: Express.Multer.File): StoredFile {
    const relativePath = path.relative(process.cwd(), file.path).split(path.sep).join("/");
    return {
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      fileUrl: this.buildPublicUrl(relativePath),
      storageType: "LOCAL",
      storagePath: file.path,
    };
  },
};
