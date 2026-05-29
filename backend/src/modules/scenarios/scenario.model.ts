import mongoose, { Document, Schema, Types } from "mongoose";
import { ScenarioType } from "../../utils/scenarioSimulator";

export interface IScenario extends Document {
  userId: Types.ObjectId;
  type: ScenarioType;
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const scenarioSchema = new Schema<IScenario>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["PURCHASE", "REDUCE_EXPENSE", "EXTRA_LOAN_PAYMENT", "SALARY_DELAY", "EXTRA_SAVING", "CUSTOM"], required: true, index: true },
    inputData: { type: Schema.Types.Mixed, default: {} },
    resultData: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

scenarioSchema.index({ userId: 1, createdAt: -1 });

export const ScenarioModel = mongoose.model<IScenario>("Scenario", scenarioSchema);
