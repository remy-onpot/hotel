import "server-only";

export function isAdminSession(session) {
  return session?.user?.role === "admin";
}

export function getStorageBucketName() {
  const configuredImageUrl = process.env.NEXT_PUBLIC_SUPABASE_IMGS_URL;
  if (configuredImageUrl) {
    const path = new URL(configuredImageUrl).pathname;
    const bucketFromUrl = path.match(/\/storage\/v1\/object\/public\/([^/]+)/)?.[1];
    if (bucketFromUrl) return bucketFromUrl;
  }

  return process.env.SUPABASE_STORAGE_BUCKET ?? "";
}
