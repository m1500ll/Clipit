import { supabase } from '@/lib/supabase';
import { mockRepository } from './mockRepository';
import { createSupabaseRepository } from './supabaseRepository';

export const repository = supabase ? createSupabaseRepository(supabase) : mockRepository;
export type { NewProjectInput, Repository } from './types';
