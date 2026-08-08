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

// CRM Schemas
export const companySchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  industry: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  employees: z.number().int().min(0).optional(),
  revenue: z.number().min(0).optional(),
  gst_number: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
})

export const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  whatsapp: z.string().optional(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  company_id: z.string().uuid().optional().nullable(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  twitter: z.string().optional(),
  birthday: z.string().optional(),
  lead_source: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  status: z.enum(['active', 'inactive', 'lead']).default('active'),
  assigned_to: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
})

export const leadSchema = z.object({
  name: z.string().min(1, 'Lead name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  company_id: z.string().uuid().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  budget: z.number().min(0).optional(),
  interest: z.string().optional(),
  lead_score: z.number().int().min(0).max(100).default(0),
  lead_source: z.string().optional(),
  campaign: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost']).default('new'),
  assigned_to: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
})

export const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.string().default('USD'),
  pipeline_id: z.string().uuid('Please select a pipeline'),
  stage_id: z.string().uuid('Please select a stage'),
  probability: z.number().int().min(0).max(100).optional(),
  close_date: z.string().optional(),
  company_id: z.string().uuid().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  status: z.enum(['open', 'won', 'lost']).default('open'),
  lost_reason: z.string().optional(),
  won_reason: z.string().optional(),
  assigned_to: z.string().uuid().optional().nullable(),
})

export const activitySchema = z.object({
  type: z.enum(['task', 'call', 'meeting', 'email', 'whatsapp', 'sms', 'demo', 'follow-up', 'reminder', 'note']).default('note'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  due_date: z.string().optional(),
  completed_at: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  is_recurring: z.boolean().default(false),
  recurrence_rule: z.string().optional(),
  deal_id: z.string().uuid().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
})

export const noteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
  contact_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
})

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().default('USD'),
  stock: z.number().int().min(0).optional(),
})

// Existing schemas
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
