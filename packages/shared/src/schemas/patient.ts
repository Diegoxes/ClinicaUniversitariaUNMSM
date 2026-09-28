import { z } from 'zod';
import { IntakePath, PatientVisitType, UserTariffType } from '../enums';

export const createPatientSchema = z.object({
  firstName: z.string().min(1, 'Nombres requeridos'),
  lastName: z.string().min(1, 'Apellidos requeridos'),
  age: z.number().int().min(0).max(150),
  phone: z.string().optional(),
  district: z.string().min(1, 'Distrito requerido'),
  documentNumber: z.string().optional(),
  tariffType: z.nativeEnum(UserTariffType),
});

export const updatePatientSchema = createPatientSchema.partial();

export const createVisitSchema = z.object({
  patientId: z.string().uuid(),
  intakePath: z.nativeEnum(IntakePath),
  diagnosis: z.string().min(1, 'Diagnóstico requerido'),
  visitType: z.nativeEnum(PatientVisitType),
  referralReason: z.string().optional(),
  referralInstructions: z.string().optional(),
  cashTicket: z.string().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type CreateVisitInput = z.infer<typeof createVisitSchema>;
