"use client";

let supabaseInstance = null;

export function createClient() {
  if (typeof window === "undefined") return null;
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const { createBrowserClient } = require("@supabase/ssr");
  supabaseInstance = createBrowserClient(url, key);
  return supabaseInstance;
}
