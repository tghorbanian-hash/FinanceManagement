/* Filename: supabaseConfig.js */
import { createClient } from '@supabase/supabase-js';

// مقادیر مربوط به دیتابیس جدید خود را در اینجا قرار دهید
const SUPABASE_URL = 'YOUR_NEW_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_NEW_SUPABASE_ANON_KEY';

window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
