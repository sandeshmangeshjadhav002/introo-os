import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// Support BOTH Supabase env var names:
//   - VITE_SUPABASE_PUBLISHABLE_KEY  (new 2025+ naming — "publishable" key)
//   - VITE_SUPABASE_ANON_KEY         (legacy naming — still works everywhere)
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
