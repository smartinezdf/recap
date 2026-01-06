import supabase from "../src/lib/supabase";  // Asegúrate de que la ruta sea correcta

// Función para obtener clips
export async function getClips(clubId, courtId) {
  const { data, error } = await supabase
    .from("clips")  // Nombre de la tabla de clips
    .select("clips.id, clips.video_url, clubs.name as club_name, courts.name as court_name")
    .eq("clips.club_id", clubId)  // Filtra por el ID del club
    .eq("clips.court_id", courtId)  // Filtra por el ID de la cancha
    .leftJoin("clubs", "clips.club_id", "clubs.id")  // Relaciona con la tabla clubs
    .leftJoin("courts", "clips.court_id", "courts.id");  // Relaciona con la tabla courts

  if (error) {
    console.error("Error obteniendo clips:", error);
    return [];
  }

  return data;
}


