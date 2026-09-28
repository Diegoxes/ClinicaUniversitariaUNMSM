import { z } from 'zod';
import { PlanClosureReason, PlanOrigin, QueueEntryStatus, RehabPlanStatus } from '../enums';

export const createPlanSchema = z.object({
  patientId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  plannedSessions: z.number().int().min(1).max(30).default(8),
  origin: z.nativeEnum(PlanOrigin).default(PlanOrigin.THERAPIST_EVAL),
});

export const closePlanSchema = z.object({
  reason: z.nativeEnum(PlanClosureReason),
  note: z.string().optional(),
});

export const createSessionSchema = z.object({
  visitId: z.string().uuid().optional(),
  painIn: z.number().int().min(0).max(10).nullable(),
  painOut: z.number().int().min(0).max(10).nullable(),
  painOmissionReason: z.string().optional(),
  note: z.string().max(500).optional(),
  treatmentIds: z.array(z.string().uuid()).default([]),
  otherTreatment: z.string().optional(),
});

export const addToQueueSchema = z.object({
  patientId: z.string().uuid(),
});

export const reorderQueueSchema = z.object({
  entryIds: z.array(z.string().uuid()).min(1),
});

export const updateQueueStatusSchema = z.object({
  status: z.nativeEnum(QueueEntryStatus),
});

export const createTreatmentCatalogSchema = z.object({
  name: z.string().min(1),
  sortOrder: z.number().int().default(0),
});

export const updateTreatmentCatalogSchema = createTreatmentCatalogSchema.partial().extend({
  active: z.boolean().optional(),
});

export const updateSettingsSchema = z.object({
  defaultPlannedSessions: z.number().int().min(6).max(10).optional(),
  painScaleHelpText: z.string().optional(),
  intakeHelpText: z.string().optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type ClosePlanInput = z.infer<typeof closePlanSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
