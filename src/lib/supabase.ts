import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'mlrit.jiobase.com';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpa3B6bHpjcXF3dGxxZnhsY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MjM0ODAsImV4cCI6MjA4Nzk5OTQ4MH0.oTSG2Azp7teT-bekhz8gwV13JLoFwsHSyP5rCuFzMyY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
