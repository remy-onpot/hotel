import { auth } from "@/auth";
import { getStorageBucketName, isAdminSession } from "@/app/_lib/admin";
import { privilegedQuery, privilegedStorage } from "@/app/_lib/supabase/supabaseRiskyClient";
import { notFound, redirect } from "next/navigation";
import GalleryManager from "./gallery-manager";
import styles from "./styles.module.css";

export const metadata = { title: "Property gallery", robots: { index: false, follow: false } };

export default async function AdminGalleryPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  if (!isAdminSession(session)) notFound();

  const [{ data: images, error }, storage] = await Promise.all([
    privilegedQuery("gallery_images").select("id, image_path, title, alt_text, display_order, is_published, created_at").order("display_order").order("created_at", { ascending: true }),
    privilegedStorage(),
  ]);
  const bucket = getStorageBucketName();
  const galleryImages = (images ?? []).map((image) => ({
    ...image,
    imageUrl: bucket ? storage.from(bucket).getPublicUrl(image.image_path).data.publicUrl : "",
  }));

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>The property, in pictures</p><h1>Property gallery</h1><p>Curate the spaces, details, and experiences guests can explore before they arrive.</p></div>
      <span className={styles.headerStat}><strong>{galleryImages.length}</strong> gallery {galleryImages.length === 1 ? "image" : "images"}</span>
    </header>
    {!bucket && <p className={styles.notice} role="alert">Configure the hotel image storage bucket before uploading photographs.</p>}
    {error && <p className={styles.error} role="alert">Could not load the gallery. Apply the property gallery migration, then refresh this page.</p>}
    {!error && <GalleryManager initialImages={galleryImages} imageStorageReady={Boolean(bucket)} />}
  </main>;
}
