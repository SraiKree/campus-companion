import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aikpzlzcqqwtlqfxlcer.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_vhhr6-GY43cX64B9WnWYUQ_X67z87tG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);