import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/**
 * Singleton Supabase client — import this everywhere you need DB or Auth access.
 * Row types are cast at call site (e.g. `data as Assessment[]`).
 *
 *   import { supabase } from "../lib/supabase";
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
