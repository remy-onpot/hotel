import { notFound } from "next/navigation";
import { getStorageBucketName } from "@/app/_lib/admin";
import { getRoomServiceProducts, privilegedQuery, privilegedStorage } from "@/app/_lib/supabase/supabaseRiskyClient";
import RoomStore from "./room-store";
import styles from "./store.module.css";

export const metadata = { title: "Room service · The Winford", robots: { index: false, follow: false } };

export default async function RoomStorePage({ params }) {
  const { qrToken } = await params;
  const { data: unit } = await privilegedQuery("room_units").select("id, room_number, is_active, rooms(name)").eq("qr_token", qrToken).maybeSingle();
  if (!unit?.is_active) notFound();

  const { data: products, error } = await getRoomServiceProducts();
  const bucket = getStorageBucketName();
  const storage = bucket ? await privilegedStorage() : null;
  const menu = (products ?? []).map((product) => ({
    ...product,
    imageUrl: bucket && product.image_path ? storage.from(bucket).getPublicUrl(product.image_path).data.publicUrl : "",
  }));

  return <div className={styles.page}>
    <div className={styles.topBar}><a href="/" className={styles.brand}>THE WINFORD <span>BOUTIQUE HOTEL</span></a><span className={styles.serviceLabel}>IN ROOM DINING</span></div>
    <section className={styles.hero}>
      <div className={styles.heroCopy}><p className={styles.eyebrow}>A little something, delivered</p><h1>Room service,<br /><em>made for you.</em></h1><p>Browse the menu, choose your favourites, and we’ll bring them to your door.</p></div>
      <div className={styles.roomBadge}><span className={styles.roomDot} /><span>ORDERING FOR</span><strong>ROOM {unit.room_number}</strong><small>{unit.rooms?.name}</small></div>
    </section>
    <div className={styles.notice}><span aria-hidden="true">✓</span><p>Your order will be added to the folio for <strong>Room {unit.room_number}</strong>. Please confirm this is your room before continuing.</p></div>
    {error && <p role="alert" className={styles.error}>Room service is temporarily unavailable. Please contact the front desk.</p>}
    <RoomStore qrToken={qrToken} roomNumber={unit.room_number} products={error ? [] : menu} />
    <footer className={styles.footer}>THE WINFORD BOUTIQUE HOTEL <span>·</span> ROOM {unit.room_number}</footer>
  </div>;
}
