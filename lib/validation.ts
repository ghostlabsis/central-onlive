import { z } from 'zod';

export const FormInputSchema = z.object({
  selliver: z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    level: z.enum(['iniciante', 'intermediaria', 'pro']),
    previous_lives: z.number().int().min(0),
    whatsapp: z.string().optional(),
  }),
  live: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use formato YYYY-MM-DD'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Use formato HH:MM'),
    duration_min: z.number().int().min(30).max(240),
    context: z.enum(['regular', 'brand-day', 'cast-day', 'lancamento']),
    master_coupon: z.string().min(1),
  }),
  hero: z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    price_full: z.number().min(0),
    price_live: z.number().min(0),
    extra_coupon: z.string().optional(),
    stock: z.number().int().min(0),
    differentials: z.array(z.object({
      label: z.string().min(1),
      description: z.string().min(1),
    })).min(1).max(6),
    main_objection: z.string().min(1),
  }),
  secondary_products: z.array(z.object({
    name: z.string().min(1),
    price_live: z.number().min(0),
    bundle_with_hero: z.boolean(),
  })).optional().default([]),
  compliance: z.object({
    regulated_category: z.string().min(1),
    forbidden_claims: z.array(z.string()).min(1),
    allowed_claims: z.array(z.string()).min(1),
    anvisa_registration: z.string().optional(),
  }),
});

export type FormInput = z.infer<typeof FormInputSchema>;
