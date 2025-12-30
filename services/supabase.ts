
import { createClient } from '@supabase/supabase-js';

// ملاحظة للمطور: قم بوضع روابط Supabase الخاصة بك هنا لتفعيل التخزين السحابي
const SUPABASE_URL = ''; 
const SUPABASE_ANON_KEY = '';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export const isSupabaseActive = () => !!supabase;
