import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { calendarService } from "./calendar.service";

const cached = async <T>(key: string, factory: () => Promise<T>) => {
  const value = await cacheService.get<T>(key);
  if (value) return value;
  const data = await factory();
  await cacheService.set(key, data, cacheTtl.finance);
  return data;
};

export const getCalendarEvents = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cached(cacheKeys.calendar.events(userId, req.query as never), () => calendarService.events(userId, req.query as never));
  return sendResponse(res, 200, "Calendar events fetched successfully", data);
});

export const getCalendarDay = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await calendarService.day(userId, req.query.date as unknown as Date);
  return sendResponse(res, 200, "Calendar day fetched successfully", data);
});

export const getCalendarMonthSummary = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cached(cacheKeys.calendar.monthSummary(userId, req.query as never), () => calendarService.monthSummary(userId, req.query as never));
  return sendResponse(res, 200, "Calendar month summary fetched successfully", data);
});
