import Banner from "@/app/_components/Banner";
import EditSection from "./_components/EditSection";
import { notFound } from "next/navigation";
import { getReservationByID } from "@/app/_lib/supabase/reservations";
import { auth } from "@/auth";
import { canEditReservation, getAccraToday } from "@/app/_lib/bookingRules";

export const metadata = {
  title: "Edit Reservation",
  description: "Edit your already booked reservation ",
};

async function Page({ params }) {
  const { id: reservation_id } = await params;

  const session = await auth();
  if (!session?.user) notFound();
  const reservation = await getReservationByID(reservation_id, session.user.id);
  if (!reservation) notFound();

  const isUpdateAllowed = canEditReservation(reservation, getAccraToday());

  if (!isUpdateAllowed) return <h4>Sorry, but reservation cannot be edited.</h4>;

  if (String(session.user.id) !== String(reservation.guest_id))
    return (
      <div className="container">
        <h2>Unauthorized action!</h2>
      </div>
    );
  return (
    <>
      <Banner title={"EDIT RESERVATION"} />
      <EditSection reservation={reservation} />
    </>
  );
}

export default Page;
