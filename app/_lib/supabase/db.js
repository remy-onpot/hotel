import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const supabaseSchemaEnv =
  (process.env.NEXT_PUBLIC_SUPABASE_SCHEMA_ENV ?? "public").toLowerCase();
// USED FOR UNAUTHENTICATED ACTIONS
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: supabaseSchemaEnv },
});

export default supabase;
