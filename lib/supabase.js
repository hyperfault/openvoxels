import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.SUPABASE_URL,
    process.SUPABASE_ANON_KEY
  );
}
