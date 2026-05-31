export const env = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
} as const

// Analytics timing constants (from userless.md)
export const HEARTBEAT_INTERVAL_MS = 2_000
export const ANALYTICS_BATCH_INTERVAL_MS = 5_000
export const ANALYTICS_WARMUP_MS = 3_000
export const ANALYTICS_SERVER_TIMEOUT_MS = 30_000
export const TRANSIENT_FOCUS_LOSS_MS = 30_000
export const BRIEF_HIDDEN_MS = 5_000
export const ACTIVE_SWITCH_HIDDEN_MS = 30_000
export const ACTIVE_SWITCH_INTERACTION_MS = 3_000
export const ACTIVE_SWITCH_HEARTBEAT_MS = 15_000
