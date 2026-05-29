import { Types } from "mongoose";
import { localStorageService } from "../../../storage/local-storage.service";
import { ApiError } from "../../../utils/apiError";
import { PaymentModel } from "../payment.model";
import { PaymentProofModel } from "./payment-proof.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

export const paymentProofService = {
  async addProof(userId: string, paymentId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new ApiError(400, "Proof image is required");
    }

    const payment = await PaymentModel.findOne({ _id: paymentId, userId });
    if (!payment) {
      await localStorageService.remove(file.path);
      throw new ApiError(404, "Payment not found");
    }

    const existing = await PaymentProofModel.findOne({ paymentId, userId });
    if (existing) {
      await localStorageService.remove(existing.storagePath);
    }

    const storedFile = localStorageService.fromMulterFile(file);
    const proof = await PaymentProofModel.findOneAndUpdate(
      { paymentId, userId },
      {
        $set: {
          userId: toObjectId(userId),
          paymentId: toObjectId(paymentId),
          loanId: payment.loanId,
          ...storedFile,
        },
      },
      { new: true, upsert: true, runValidators: true },
    );

    return proof;
  },

  async getProof(userId: string, paymentId: string) {
    const payment = await PaymentModel.findOne({ _id: paymentId, userId }).select("_id");
    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    const proof = await PaymentProofModel.findOne({ paymentId, userId });
    if (!proof) {
      throw new ApiError(404, "Payment proof not found");
    }

    return proof;
  },

  async deleteProof(userId: string, paymentId: string) {
    const proof = await this.getProof(userId, paymentId);
    await localStorageService.remove(proof.storagePath);
    await proof.deleteOne();
    return { id: proof._id.toString(), paymentId };
  },
};
