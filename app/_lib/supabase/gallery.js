import supabase from "./db";

export async function getPublishedGalleryImages() {
  const { data, error } = await supabase
    .from("gallery_images")
    .select("id, image_path, title, alt_text, display_order")
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Supabase property gallery lookup failed:", error.code ?? "unknown");
    return [];
  }
  return data ?? [];
}
