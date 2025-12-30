
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://emkrkwfwlkpvgknphdpi.supabase.co';
const SUPABASE_ANON_KEY: string = 'sb_publishable_ql9XYq62YwOiaTDqoDNlSg_m2ZZKKgC'; 

export const isConfigured = SUPABASE_ANON_KEY !== '' && !SUPABASE_ANON_KEY.includes('SUA_ANON');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
