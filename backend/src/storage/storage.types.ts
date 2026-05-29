export type StorageType = "LOCAL" | "S3_READY";

export type StoredFile = {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  storageType: StorageType;
  storagePath?: string;
};
