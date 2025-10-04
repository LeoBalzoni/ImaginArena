import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: window.localStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types
export interface User {
  id: string;
  username: string;
  is_admin: boolean;
  is_bot: boolean;
  created_at: string;
}

export interface Tournament {
  id: string;
  status: "lobby" | "in_progress" | "finished";
  tournament_size: 2 | 4 | 8 | 16 | 32;
  language: "en" | "it";
  admin_ended: boolean;
  created_by?: string;
  created_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  player1_id: string;
  player2_id: string;
  prompt: string;
  winner_id?: string;
  created_at: string;
}

export interface Submission {
  id: string;
  match_id: string;
  user_id: string;
  image_url: string;
  created_at: string;
}

export interface Vote {
  id: string;
  match_id: string;
  voter_id: string;
  voted_for_submission_id: string;
  created_at: string;
}
