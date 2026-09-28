import { z } from 'zod';
import { GlobalRole, UnitRole } from '../enums';

export const createStaffSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  fullName: z.string().min(1),
  globalRole: z.nativeEnum(GlobalRole).default(GlobalRole.STAFF),
  unitAssignments: z
    .array(
      z.object({
        unitId: z.string().uuid(),
        role: z.nativeEnum(UnitRole),
      }),
    )
    .default([]),
});

export const updateStaffSchema = z.object({
  fullName: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  active: z.boolean().optional(),
  globalRole: z.nativeEnum(GlobalRole).optional(),
  unitAssignments: z
    .array(
      z.object({
        unitId: z.string().uuid(),
        role: z.nativeEnum(UnitRole),
      }),
    )
    .optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
