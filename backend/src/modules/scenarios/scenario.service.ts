import { Types } from "mongoose";
import { forecastService } from "../forecast/forecast.service";
import { simulateScenario, ScenarioType } from "../../utils/scenarioSimulator";
import { ScenarioModel } from "./scenario.model";
import { ApiError } from "../../utils/apiError";
import { auditLogService } from "../audit/audit-log.service";

const toObjectId = (id: string) => new Types.ObjectId(id);

export const scenarioService = {
  async simulate(userId: string, payload: { type: ScenarioType; amount: number; note?: string; save?: boolean }) {
    const forecast = await forecastService.build(userId);
    const result = simulateScenario({
      type: payload.type,
      amount: payload.amount,
      projectedCash: forecast.projectedCash,
      currentAvailableCash: forecast.currentAvailableCash,
    });
    const response = {
      type: payload.type,
      inputData: payload,
      resultData: result,
      ...result,
    };
    if (payload.save) {
      const scenario = await ScenarioModel.create({ userId: toObjectId(userId), type: payload.type, inputData: payload, resultData: result });
      await auditLogService.record({
        userId,
        action: "SCENARIO_CREATED",
        entityType: "SCENARIO",
        entityId: scenario._id.toString(),
        newValue: scenario.toObject(),
      });
      return { ...response, scenarioId: scenario._id.toString() };
    }
    return response;
  },

  history(userId: string) {
    return ScenarioModel.find({ userId: toObjectId(userId) }).sort({ createdAt: -1 }).limit(50);
  },

  async delete(userId: string, id: string) {
    const scenario = await ScenarioModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!scenario) throw new ApiError(404, "Scenario not found");
    const oldValue = scenario.toObject();
    await scenario.deleteOne();
    await auditLogService.record({
      userId,
      action: "SCENARIO_DELETED",
      entityType: "SCENARIO",
      entityId: id,
      oldValue,
    });
    return { id };
  },
};
