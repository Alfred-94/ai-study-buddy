import { createClient } from '@supabase/supabase-js';

// This is your live Supabase project URL pulled from your dashboard address bar:
const supabaseUrl = 'https://sbeqgxubhzijmotxdinh.supabase.co';

// PASTE YOUR ACTUAL ANON KEY BELOW:
// Go to your Supabase Dashboard -> Project Settings (gear icon) -> API -> Copy the 'anon public' key string
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZXFneHViaHppam1vdHhkaW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjUzODQsImV4cCI6MjA5NDgwMTM4NH0.SjmWkMmkbTz5a35_WoAwVZX0YO3h7_3PLcH5v81tzE8'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
