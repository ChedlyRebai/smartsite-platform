import { z } from 'zod';

// Creation
export const CreateSiteDto = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  address: z.string().min(1, 'Address is required').max(200),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  area: z.number().min(0, 'Area must be positive'),
  status: z
    .enum(['planning', 'in_progress', 'on_hold', 'completed'])
    .default('planning'),
  workStartDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  workEndDate: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
  budget: z.number().min(0, 'Budget must be positive'),
  progress: z.number().min(0).max(100, 'Progress must be 0-100'),
});

// Update (all optional)
export const UpdateSiteDto = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  address: z.string().min(1, 'Address is required').max(200).optional(),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  area: z.number().min(0, 'Area must be positive').optional(),
  status: z
    .enum(['planning', 'in_progress', 'on_hold', 'completed'])
    .optional(),
  workStartDate: z.string().optional(),
  workEndDate: z.string().optional(),
  projectId: z.string().min(1, 'Project is required').optional(),
  budget: z.number().min(0, 'Budget must be positive').optional(),
  progress: z.number().min(0).max(100, 'Progress must be 0-100').optional(),
});

export type CreateSiteInput = z.infer<typeof CreateSiteDto>;
export type UpdateSiteInput = z.infer<typeof UpdateSiteDto>;
