import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/**
 * Singleton Supabase client — import this everywhere you need DB or Auth access.
 *
 *   import { supabase } from "../lib/supabase";
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
