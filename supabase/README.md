# Introo OS - Backend Setup

## Overview

This is the complete backend architecture for Introo OS, built with Supabase.

## Tech Stack

- **Supabase Auth (Authentication)
- **PostgreSQL** (Database)
- **Supabase Storage** (File storage)
- **Supabase Realtime** (Real-time subscriptions)

## Prerequisites

1. A Supabase account (https://supabase.com)
2. Supabase CLI (optional, but recommended)
3. Node.js (for edge functions, if needed)

## Setup Steps

### 1. Database Setup

1. Create a new Supabase project
2. Go to the SQL Editor
3. Run the migration file `migrations/00001_initial_schema.sql`

### 2. Environment Variables

In your Supabase project settings, set up the following environment variables in your `.env` file (create from `.env.example`):

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Storage Setup

1. Go to Storage in your Supabase dashboard
2. Create the buckets as specified in `storage.md`
3. Apply the RLS policies from `storage.md`

### 4. Auth Configuration

1. In Supabase Auth, enable email/password authentication
2. Configure email templates (confirmation, password reset)
3. Enable email confirmation if required

## Database Schema

The database includes the following tables:

- `organizations` - Company/organization info
- `users` - User profiles with roles
- `clients` - Customer/client info
- `leads` - Sales leads
- `projects` - Project management
- `tasks` - Task management
- `employees` - Employee records
- `attendance` - Attendance tracking
- `leave_requests` - Leave management
- `invoices` - Billing
- `payments` - Payment records
- `documents` - Document management
- `notifications` - In-app notifications
- `activity_logs` - Audit logging

## Roles & Permissions

Roles available:

- `super_admin` - Full system access
- `admin` - Organization-wide admin access
- `manager` - Project and team management
- `employee` - Standard employee access
- `client` - Client portal access

## Features Implemented

- ✅ Row Level Security (RLS) on all tables
- ✅ Multi-tenant organization isolation
- ✅ UUID primary keys
- ✅ created_at and updated_at timestamps with triggers
- ✅ Dashboard helper views for analytics
- ✅ Real-time subscriptions for tasks, notifications, projects, activity logs
- ✅ Audit logging via activity_logs
- ✅ Email confirmation and password reset flows
- ✅ Role-based access control

## Edge Functions (Optional)

Add edge functions in the `functions/` directory (coming soon!
