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
      <Heading textClassName={styles.heading}>Your History</Heading>
      <div>
        {reservations.length ? (
          reservations.reverse().map((item) => <ReservationCard key={item.id} reservation={item} />)
        ) : (
          <div>
            <p>You have no booked room.</p>
            <Link href={"/rooms"}>View Rooms</Link>
          </div>
        )}
      </div>
    </>
  );
}

export default History;
