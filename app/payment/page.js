import { getReservationByPaymentReference } from "../_lib/supabase/privilegedReservations";
import { redirect } from "next/navigation";
import SuccessPage from "./_components/SuccessPage/SuccessPage";
import ExpirePage from "./_components/ExpirePage/ExpirePage";
import { auth } from "@/auth";
import { verifyAndSavePaystackReservation } from "@/app/_lib/paystack";

export const metadata = {
  title: "Booking Overview",
};

export default async function PreviewPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const reference = resolvedSearchParams?.reference;

  if (!reference)
    return (
      <div className="container">
        {" "}
        <h1>Forbidden</h1>
      </div>
    );

  const session = await auth();

  if (!session?.user) redirect("/signin");

  let reservation;
  try {
    await verifyAndSavePaystackReservation(reference);
    reservation = await getReservationByPaymentReference(reference);
  } catch {
    return <ExpirePage reference={reference} />;
  }

  if (!reservation?.id || reservation.guest_id !== session.user.id) return <ExpirePage reference={reference} />;
  return <SuccessPage reservation={reservation} />;
}
