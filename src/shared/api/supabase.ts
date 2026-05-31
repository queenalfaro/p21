import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"
import { env } from "@/shared/config"

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey)
