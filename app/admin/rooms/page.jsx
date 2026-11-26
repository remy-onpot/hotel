import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminSession, getStorageBucketName } from "@/app/_lib/admin";
import { getAdminRoomData, privilegedStorage } from "@/app/_lib/supabase/supabaseRiskyClient";
import RoomImageManager from "./room-image-manager";
import styles from "./styles.module.css";

export const metadata = {
  title: "Room manager",
  robots: { index: false, follow: false },
};

export default async function AdminRoomsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  if (!isAdminSession(session)) notFound();

  const [{ data: rooms, error: roomsError }, { data: roomImages, error: imagesError }, { data: roomUnits, error: unitsError }] = await getAdminRoomData();

  if (roomsError || imagesError || unitsError) {
    return (
      <main className={styles.page}>
        <h1>Room manager</h1>
        <p role="alert">Could not load rooms or images. Apply the latest Supabase migrations and try again.</p>
      </main>
    );
  }

  const bucket = getStorageBucketName();
  const storage = await privilegedStorage();
  const roomsWithImages = (rooms ?? []).map((room) => ({
    ...room,
    units: (roomUnits ?? []).filter((unit) => unit.room_type_id === room.id),
    thumbnailUrl: bucket && room.thumbnail
      ? storage.from(bucket).getPublicUrl(room.thumbnail).data.publicUrl
      : "",
    images: (roomImages ?? [])
      .filter((image) => image.room_id === room.id)
      .map((image) => ({
        ...image,
        publicUrl: bucket
          ? storage.from(bucket).getPublicUrl(image.img_path).data.publicUrl
          : "",
      })),
  }));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Hotel administration</p>
        <h1>Room manager</h1>
        <p>Upload a cover image or add photos to a room’s gallery.</p>
      </header>
      {!bucket && (
        <p className={styles.notice} role="alert">
          Configure NEXT_PUBLIC_SUPABASE_IMGS_URL or SUPABASE_STORAGE_BUCKET before uploading.
        </p>
      )}

      <RoomImageManager rooms={roomsWithImages} appUrl={process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || ""} />

      {roomsWithImages.length === 0 && <p>No rooms found. Add rooms before uploading photos.</p>}
    </main>
  );
}

