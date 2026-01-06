import { createClient } from "@supabase/supabase-js";

// Obtener las variables de entorno desde el archivo .env.local
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Verifica si las variables están configuradas correctamente
if (!supabaseUrl || !supabaseKey) {
  throw new Error("supabaseUrl and supabaseKey are required");
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key:", supabaseKey);
