import styles from "./style.module.css";
import Heading from "@/app/_ui/Heading";
import ReservationCard from "./_components/ReservationCard";
import { getGuestReservations } from "@/app/_lib/supabase/reservations";
import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Booking History",
  description: "Review and manage your reservations at The Winford Boutique Hotel Achimota.",
};

async function History() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  if (session.user.role === "admin") redirect("/admin/rooms");
  const reservations = await getGuestReservations(session.user.id);

  return (
    <>
      <section className={styles.page}>
      <header className={styles.pageHeader}><p>YOUR WINFORD ACCOUNT</p><Heading textClassName={styles.heading}>Your stays</Heading><span>Reservations you’ve made at The Winford.</span></header>
      <div className={styles.reservationList}>
        {reservations.length ? (
          reservations.reverse().map((item) => <ReservationCard key={item.id} reservation={item} />)
        ) : (
          <div className={styles.emptyState}>
            <p>Your next stay is waiting.</p>
            <Link href={"/rooms"}>Explore rooms <span aria-hidden="true">→</span></Link>
          </div>
        )}
      </div>
      </section>
    </>
  );
}

export default History;
