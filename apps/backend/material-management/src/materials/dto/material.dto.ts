import { z } from 'zod';

// Unit enum
const UNIT_ENUM = ['bag', 'kg', 'm²', 'ton', 'piece'] as const;
type Unit = (typeof UNIT_ENUM)[number];

// Validation création
export const CreateMaterialSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  name: z.string().min(1, 'Name is required').max(100),
  unit: z.enum(UNIT_ENUM, { errorMap: () => ({ message: 'Unit must be bag, kg, m², ton, or piece' }) }),
  estimated_price: z.number({ invalid_type_error: 'Estimated price is required' }).min(0, 'Price must be positive'),
  alert_threshold: z.number({ invalid_type_error: 'Alert threshold is required' }).min(0, 'Threshold must be positive'),
  supplier_id: z.string({ required_error: 'Supplier is required' }).min(1, 'Supplier is required'),
});

// Validation mise à jour (tous optionnels)
export const UpdateMaterialSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50).optional(),
  name: z.string().min(1, 'Name is required').max(100).optional(),
  unit: z.enum(UNIT_ENUM).optional(),
  estimated_price: z.number().min(0, 'Price must be positive').optional(),
  alert_threshold: z.number().min(0, 'Threshold must be positive').optional(),
  supplier_id: z.string().min(1, 'Supplier is required').optional(),
});

export type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof UpdateMaterialSchema>;
