import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
})

export const clientSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'lead']).default('active'),
  notes: z.string().optional(),
})

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']).default('planning'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  progress: z.number().int().min(0).max(100).default(0),
})

export const taskSchema = z.object({
  project_id: z.string().uuid('Please select a project'),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).default('todo'),
  due_date: z.string().optional(),
  assigned_to: z.string().uuid().optional().nullable(),
})
