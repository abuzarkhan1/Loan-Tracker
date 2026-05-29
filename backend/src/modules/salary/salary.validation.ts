import { z } from "zod";
import { PaymentMethod } from "../../constants/enums";
import { objectIdSchema } from "../contacts/contact.validation";
import { SALARY_ALLOCATION_TYPES } from "./salary-allocation.model";
import { SALARY_ENTRY_STATUSES } from "./salary-entry.model";
import { SALARY_FREQUENCIES, SALARY_SOURCES } from "./salary-profile.model";

const profileBody = z.object({
  defaultAmount: z.coerce.number().min(0),
  frequency: z.enum(SALARY_FREQUENCIES).default("MONTHLY"),
  salaryDay: z.coerce.number().int().min(1).max(28),
  cycleStartDay: z.coerce.number().int().min(1).max(28),
  source: z.enum(SALARY_SOURCES).default("JOB"),
  paymentMethod: z.enum(PaymentMethod).default(PaymentMethod.BANK),
  autoCreateExpectedSalary: z.boolean().default(false),
  reminderEnabled: z.boolean().default(false),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const upsertSalaryProfileSchema = z.object({ body: profileBody });
export const patchSalaryProfileSchema = z.object({ body: profileBody.partial() });

const entryBody = z.object({
  amount: z.coerce.number().positive(),
  source: z.enum(SALARY_SOURCES).default("JOB"),
  paymentMethod: z.enum(PaymentMethod).default(PaymentMethod.BANK),
  salaryDate: z.coerce.date(),
  cycleStartDate: z.coerce.date().optional(),
  cycleEndDate: z.coerce.date().optional(),
  status: z.enum(SALARY_ENTRY_STATUSES).default("EXPECTED"),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const createSalaryEntrySchema = z.object({ body: entryBody });
export const updateSalaryEntrySchema = z.object({ params: z.object({ id: objectIdSchema }), body: entryBody.partial() });
export const salaryEntryIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const markSalaryReceivedSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    amount: z.coerce.number().positive().optional(),
    salaryDate: z.coerce.date().optional(),
    paymentMethod: z.enum(PaymentMethod).optional(),
    note: z.string().trim().max(500).optional().or(z.literal("")),
  }),
});
export const salaryEntryListSchema = z.object({
  query: z.object({
    status: z.enum(SALARY_ENTRY_STATUSES).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
export const salaryCycleQuerySchema = z.object({
  query: z.object({
    date: z.coerce.date().optional(),
  }),
});

const allocationBody = z.object({
  salaryEntryId: objectIdSchema.optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  cycleStartDate: z.coerce.date().optional(),
  cycleEndDate: z.coerce.date().optional(),
  categoryId: objectIdSchema.optional(),
  name: z.string().trim().min(2).max(100),
  allocatedAmount: z.coerce.number().min(0),
  type: z.enum(SALARY_ALLOCATION_TYPES).default("EXPENSE"),
});

export const createSalaryAllocationSchema = z.object({ body: allocationBody });
export const updateSalaryAllocationSchema = z.object({ params: z.object({ id: objectIdSchema }), body: allocationBody.partial() });
export const salaryAllocationIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const salaryAllocationListSchema = z.object({
  query: z.object({
    type: z.enum(SALARY_ALLOCATION_TYPES).optional(),
    date: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
  }),
});
