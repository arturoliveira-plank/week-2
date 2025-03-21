import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DatabaseThread {
  id: string;
  user_id: string;
  title: string;
  messages: any[];
  created_at: string;
  updated_at: string;
}

export async function saveThread(thread: DatabaseThread) {
  const { data, error } = await supabase
    .from('threads')
    .upsert(thread)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getThreads() {
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getThread(id: string) {
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}