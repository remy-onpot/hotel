import CheckoutForm from "../CheckoutForm";
import CheckoutOverview from "../CheckoutOverview";
import styles from "./styles.module.css";
import { cookies } from "next/headers";
import { getRoomById } from "@/app/_lib/supabase/rooms";
import { getGuestByEmail, updateGuest } from "@/app/_lib/supabase/guests";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { reservationSchema } from "@/app/_lib/zodSchemas";
import { bookingCancelAction, signOutAction } from "@/app/_lib/actions";
import SelectCountry from "@/app/_ui/SelectCountry";
import { revalidatePath } from "next/cache";
import { initializePaystackTransaction } from "@/app/_lib/paystack";

async function CheckoutSection() {
  const session = await auth();
  if (session?.user?.role === "admin") {
    return (
      <section className={`${styles.formSection} container`}>
        <div>
          <h2>Use a guest account to book</h2>
          <p>
            You are signed in with a hotel administrator account. Guest bookings
            need a guest account, so sign out and continue with a guest login.
          </p>
          <form action={signOutAction}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </section>
    );
  }
  if (!session?.user?.email) redirect("/signin");

  const reservation_cookies = await cookies();
  if (!reservation_cookies.has("pending_reservation")) {
    redirect("/rooms");
  }

  const pending_reservation = JSON.parse(
    reservation_cookies.get("pending_reservation").value
  );

  const [room, guest] = await Promise.all([
    getRoomById(pending_reservation.room_id),
    getGuestByEmail(session.user.email),
  ]);

  if (!room) notFound();
  if (!guest) redirect("/signin");

  async function createReservationAction(prevState, formData) {
    "use server";
    prevState = { ...prevState, isConfirming: true };
    const fullname = formData.get("fullname");
    const nationalID = formData.get("nationalID");
    const session = await auth();
    if (!session?.user?.email || String(session.user.id) !== String(guest.id)) return { ...prevState, criticalError: "Please sign in again before starting checkout." };
    const email = session.user.email;
    const phone = formData.get("phone");
    const nationalityWithFlag = formData.get("nationality");
    const message = formData.get("message");

    try {
      reservationSchema.parse({
        fullname,
        email,
        phone,
        nationality: nationalityWithFlag,
        nationalID,
        message,
      });
    } catch (err) {
      // console.log("errors");
      // console.log(err.issues);
      prevState = {};
      err?.issues.forEach((element) => {
        prevState[element?.path[0] ?? "unknown"] = element.message;
      });

      return { ...prevState };
    }

    const [nationality, countryFlag] = nationalityWithFlag.split("%");

    let authorizationUrl;
    try {
      const profileUpdate = await updateGuest(
        guest.id,
        fullname,
        nationality,
        countryFlag,
        phone,
        nationalID
      );
      if (profileUpdate.error) throw new Error("Could not save your guest details. Please try again.");

      pending_reservation.message = message;
      const cookiesStore = await cookies();
      cookiesStore.set(
        "pending_reservation",
        JSON.stringify(pending_reservation),
        {
          maxAge: 60 * 60 * 2,
          httpOnly: true,
        }
      );

      const transaction = await initializePaystackTransaction({
        email,
        booking: { ...pending_reservation, guest_id: guest.id },
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment`,
      });
      authorizationUrl = transaction.authorization_url;
    } catch (err) {
      return { ...prevState, criticalError: err?.message ?? "Unable to start payment. Please try again." };
    }

    revalidatePath("/account/history");
    redirect(authorizationUrl);
  }

  return (
    <div className={`${styles.formSection} container`}>
      <CheckoutForm
        createReservationAction={createReservationAction}
        room={room}
        guest={guest}
        bookingCancelAction={bookingCancelAction}
      >
        {/* PASSING THIS AS CHILD TO PREVENT UNCESSACERY RERENDERS FOR THIS COMPONENT SINCE:
          1 - ITS A SERVER COMPONENT AND NEEDED TO BE RENDERED INSIDE A CLIENT COMPONENT
          2 - IT HAS SOME INNER API CALLS, SO RENDERING AS A CHILD WOULD PREVENT WASTING RENDERES
        */}
        <SelectCountry
          name={"nationality"}
          className={styles.formInput}
          defaultCountry={guest.nationality}
        />
      </CheckoutForm>

      <CheckoutOverview room={room} pending_reservation={pending_reservation} />
    </div>
  );
}

export default CheckoutSection;
