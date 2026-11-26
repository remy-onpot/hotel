const imageBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_IMGS_URL;

export function getRoomImageUrl(path) {
  if (!path || !imageBaseUrl) return "/room-placeholder.svg";
  return `${imageBaseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
