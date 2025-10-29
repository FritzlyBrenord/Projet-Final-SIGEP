import { createClient } from "@supabase/supabase-js";

const supabseUrl: any = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabseAnonKey: any = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = createClient(supabseUrl, supabseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
