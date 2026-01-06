import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ NO tirar error en build. Mejor warn.
if (!supabaseUrl || !supabaseKey) {
  console.warn("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// ✅ Creamos cliente solo si existen (evita crash en build)
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : (null as any);

export default supabase;
