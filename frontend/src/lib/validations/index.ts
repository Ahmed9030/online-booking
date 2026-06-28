import { z } from 'zod'

export const loginSchema = z.object({
  email_or_username: z.string().min(1, 'validation.required'),
  password: z.string().min(6, 'validation.password_min'),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, 'validation.name_short').max(100),
    email: z.string().email('validation.invalid_email'),
    password: z.string().min(8, 'validation.password_weak'),
    password_confirmation: z.string(),
    business_name: z.string().min(3, 'validation.business_name_short'),
    branch_name: z.string().min(3, 'validation.branch_name_short'),
    branch_address: z.string().min(5, 'validation.address_short'),
    city: z.string().optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'validation.passwords_mismatch',
    path: ['password_confirmation'],
  })

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^(\+20|0)?1[0-2,5]\d{8}$/, 'validation.invalid_phone'),
})

export const verifyOtpSchema = z.object({
  phone: z.string(),
  code: z.string().length(6, 'validation.code_length'),
})

export const bookingSchema = z.object({
  branch_id: z.string().uuid('validation.invalid_branch'),
  service_id: z.string().uuid('validation.invalid_service'),
  staff_id: z.string().uuid('validation.invalid_staff').optional().nullable(),
  customer_name: z.string().min(2, 'validation.name_short').max(100),
  customer_phone: z
    .string()
    .regex(/^(\+20|0)?1[0-2,5]\d{8}$/, 'validation.invalid_phone'),
  date: z.string().date('validation.invalid_date'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'validation.invalid_time'),
})

export const branchSchema = z.object({
  name: z.string().min(3, 'validation.branch_name_short').max(100),
  address: z.string().min(5, 'validation.address_short'),
  city: z.string().max(50),
  whatsapp_number: z.string(),
  slug: z
    .string()
    .regex(/^[a-z0-9\-]+$/, 'validation.invalid_slug'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type SendOtpFormData = z.infer<typeof sendOtpSchema>
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>
export type BookingFormData = z.infer<typeof bookingSchema>
export type BranchFormData = z.infer<typeof branchSchema>
