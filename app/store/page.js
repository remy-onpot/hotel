import { auth } from "@/auth";
import { getStorageBucketName } from "@/app/_lib/admin";
import { getRoomServiceProducts, privilegedQuery, privilegedStorage } from "@/app/_lib/supabase/supabaseRiskyClient";
import RoomStore from "./room/[qrToken]/room-store";
import styles from "./room/[qrToken]/store.module.css";

export const metadata = { title: "Room service menu", robots: { index: false, follow: false } };

function accraToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const date = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${date.year}-${date.month}-${date.day}`;
}

export default async function GuestStorePage() {
  const session = await auth();
  const today = accraToday();
  let activeStay = null;
  if (session?.user?.id && session.user.role !== "admin") {
    const { data } = await privilegedQuery("reservations")
      .select("id, room_units(id, room_number), rooms(name)")
      .eq("guest_id", session.user.id).eq("status", "confirmed")
      .not("checked_in_at", "is", null).is("checked_out_at", null)
      .lte("start_date", today).gt("end_date", today)
      .order("checked_in_at", { ascending: false }).limit(1);
    activeStay = data?.[0] ?? null;
  }

  const [{ data: products, error }, bucket] = await Promise.all([
    getRoomServiceProducts(),
    Promise.resolve(getStorageBucketName()),
  ]);
  const storage = bucket ? await privilegedStorage() : null;
  const menu = (products ?? []).map((product) => ({
    ...product,
    imageUrl: bucket && product.image_path ? storage.from(bucket).getPublicUrl(product.image_path).data.publicUrl : "",
  }));
  const roomNumber = activeStay?.room_units?.room_number;
  const canOrder = Boolean(activeStay?.room_units?.id);

  return <div className={styles.page}>
    <div className={styles.topBar}><a href="/" className={styles.brand}>THE WINFORD <span>BOUTIQUE HOTEL</span></a><span className={styles.serviceLabel}>IN ROOM DINING</span></div>
    <section className={styles.hero}>
      <div className={styles.heroCopy}><p className={styles.eyebrow}>For the moments in between</p><h1>Your stay,<br /><em>served well.</em></h1><p>Explore food, drinks, and thoughtful extras from The Winford room-service menu.</p></div>
      <div className={styles.roomBadge}><span className={styles.roomDot} /><span>{canOrder ? "ACTIVE STAY" : "ROOM SERVICE"}</span><strong>{canOrder ? `ROOM ${roomNumber}` : "THE MENU"}</strong><small>{canOrder ? activeStay.rooms?.name : "Browse our selections"}</small></div>
    </section>
    <div className={styles.notice}><span aria-hidden="true">✓</span><p>{canOrder ? <>Ordering for <strong>Room {roomNumber}</strong>. Your order will be added to your current stay folio.</> : <>You can browse the menu here. To order, scan the room-service QR in your room after check-in.</>}</p></div>
    {error && <p role="alert" className={styles.error}>Room service is temporarily unavailable. Please contact the front desk.</p>}
    <RoomStore reservationId={canOrder ? activeStay.id : null} roomNumber={roomNumber} products={error ? [] : menu} orderingEnabled={canOrder} requiresStayCode={false} />
    <footer className={styles.footer}>THE WINFORD BOUTIQUE HOTEL <span>·</span>{canOrder ? ` ROOM ${roomNumber}` : " ROOM SERVICE"}</footer>
  </div>;
}
