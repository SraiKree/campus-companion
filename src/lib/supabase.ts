
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aikpzlzcqqwtlqfxlcer.supabase.co';
const SUPABASE_URL = 'https://mlrit.jiobase.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpa3B6bHpjcXF3dGxxZnhsY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MjM0ODAsImV4cCI6MjA4Nzk5OTQ4MH0.oTSG2Azp7teT-bekhz8gwV13JLoFwsHSyP5rCuFzMyY';

let supabaseClient: SupabaseClient | null = null;
