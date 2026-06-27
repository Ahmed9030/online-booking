import { z } from 'zod'

export const loginSchema = z.object({
  email_or_username: z.string().min(1, 'مطلوب'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, 'الاسم قصير جداً').max(100),
    email: z.string().email('بريد إلكتروني غير صحيح'),
    password: z.string().min(8, 'كلمة المرور ضعيفة جداً'),
    password_confirmation: z.string(),
    business_name: z.string().min(3, 'اسم المشروع قصير'),
    branch_name: z.string().min(3, 'اسم الفرع قصير'),
    branch_address: z.string().min(5, 'العنوان قصير'),
    city: z.string().optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'كلمات المرور غير متطابقة',
    path: ['password_confirmation'],
  })

export const otpSchema = z.object({
  phone: z
    .string()
    .regex(/^(\+20|0)?1[0-2,5]\d{8}$/, 'رقم هاتف مصري غير صحيح'),
})

export const verifyOtpSchema = z.object({
  phone: z.string(),
  code: z.string().length(6, 'الكود يجب أن يكون 6 أرقام'),
})

export const bookingSchema = z.object({
  branch_id: z.string().uuid('معرف الفرع غير صحيح'),
  service_id: z.string().uuid('معرف الخدمة غير صحيح'),
  staff_id: z.string().uuid('معرف الموظف غير صحيح').optional().nullable(),
  customer_name: z.string().min(2, 'الاسم قصير جداً').max(100),
  customer_phone: z
    .string()
    .regex(/^(\+20|0)?1[0-2,5]\d{8}$/, 'رقم هاتف غير صحيح'),
  date: z.string().date('التاريخ غير صحيح'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'الوقت غير صحيح'),
})

export const branchSchema = z.object({
  name: z.string().min(3, 'اسم الفرع قصير').max(100),
  address: z.string().min(5, 'العنوان قصير'),
  city: z.string().max(50),
  whatsapp_number: z.string(),
  slug: z
    .string()
    .regex(/^[a-z0-9\-]+$/, 'يجب أن يحتوي على أحرف وأرقام وشرطات فقط'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type OtpFormData = z.infer<typeof otpSchema>
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>
export type BookingFormData = z.infer<typeof bookingSchema>
export type BranchFormData = z.infer<typeof branchSchema>
