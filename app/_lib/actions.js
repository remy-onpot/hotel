"use server";
import { auth, signIn, signOut } from "@/auth";
import { contactSchema, signInSchema, signupSchema } from "./zodSchemas";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isBefore, isValid } from "date-fns";
import {
  cancelReservation,
  getReservationByID,
  getRoomReservationsResult,
  updateReservationForGuest,
} from "./supabase/reservations";
import { bookingTotalPrice } from "../utils/reservationsCalcs";
import { daysDifferCount } from "../utils/datetime";
import { revalidatePath } from "next/cache";
import { createGuest, getGuestByEmail } from "./supabase/guests";
import { hashSync } from "bcryptjs";
import { createMessage } from "./supabase/inbox";
import { canEditReservation, dateRangesOverlap, getAccraToday, isBlockingReservation, isGuestCountWithinCapacity } from "./bookingRules";

export async function authAction(prevState, formData) {
  // await new Promise((res) => setTimeout(res, 500));
  const email = formData.get("email");
  const password = formData.get("password");
  prevState = {};

  if (!(email && password))
    return { message: "email and password are required" };

  try {
    signInSchema.parse({ email, password });
  } catch (err) {
    err.issues.forEach((element) => {
      prevState[element?.path[0] ?? "unknown"] = element.message;
    });

    return { ...prevState };
  }

  const credentials = { email, password };
  let loginSuccess = true;
  try {
    await signIn("credentials", { ...credentials, redirect: false });
  } catch (err) {
    loginSuccess = false;
    return { ...prevState, criticalError: "Wrong email or password!" };
  } finally {
    if (loginSuccess) {
      const session = await auth();
      redirect(
        session?.user?.role === "admin"
          ? "/admin/rooms"
          : (await cookies()).has("pending_reservation")
            ? "/reservations/checkout"
            : "/account/history"
      );
    }
  }
}

export async function bookingCancelAction() {
  // await new Promise((res) => setTimeout(res, 5000));

  const cookiesStore = await cookies();
  if (cookiesStore.has("pending_reservation")) {
    cookiesStore.delete("pending_reservation");
    redirect("/rooms", "replace");
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/signin" });
}

export async function reservationUpdateAction(prevState, formData) {
  prevState = {};

  const start_date = new Date(formData.get("start_date"));
  const end_date = new Date(formData.get("end_date"));
  const guests_count = formData.get("guests");
  const reservation_id = formData.get("reservation_id");

  // CHECKING FOR DATES VALIDATION THAT WAS PICKED UP BY REACT DAYPICKER
  if (!(isValid(start_date) && isValid(end_date)))
    return {
      ...prevState,
      error: "Invalid date, please choose a range from the calendar",
    };
  if (isBefore(end_date, start_date) || start_date.getTime() === end_date.getTime())
    return {
      ...prevState,
      error: "Invalid date, please choose a valid rate range from the calendar",
    };

  // CHECKING FOR USER AUTHENTICATION AND THE EXISTENCE OF THE TARGETED RESERVATION
  const session = await auth();

  if (!session?.user)
    return {
      ...prevState,
      error:
        "Unauthorized to perform this action, please sign in and try again",
    };

  const target_reservation = await getReservationByID(reservation_id, session.user.id);

  if (!target_reservation)
    return {
      ...prevState,
      error:
        "Error, you are attempting to update an unexisted reservation. please access through your reservation history!",
    };

  if (target_reservation.guest_id !== session.user.id)
    return { ...prevState, error: "Unauthorized to perform this action!" };
  if (!canEditReservation(target_reservation, getAccraToday()))
    return { ...prevState, error: "This reservation can no longer be edited." };

  if (!isGuestCountWithinCapacity(guests_count, target_reservation.rooms.capacity))
    return { ...prevState, error: "Invalid guests number! Please choose a number from the dropdown area." };

  // MAKING SURE THAT THE NEW SELECTED DATE RANGE DOES NOT INTERSECT WITH AN ALREADY BOOKED ONE
  // EXCEPT THE CURRENT RESERVATION THAT IS MEANT TO BE UPDATED
  const { data: planned_room_reservations, error: availabilityError } = await getRoomReservationsResult(
    target_reservation.room_id
  );
  if (availabilityError) return { ...prevState, error: "Could not check room availability. Please try again." };
  const overlaps = planned_room_reservations?.some((item) => item.id != reservation_id &&
    isBlockingReservation(item) &&
    dateRangesOverlap(item.start_date, item.end_date, start_date.toISOString().slice(0, 10), end_date.toISOString().slice(0, 10)));
  if (overlaps) {
    return {
      ...prevState,
      error:
        "Invalid date! The selected range already have a booked plan, please adjust your booking range",
    };
  }

  const totalNights = daysDifferCount(end_date, start_date);
  const new_total = bookingTotalPrice(
    target_reservation.rooms.price,
    guests_count,
    totalNights
  );
  const { error: updateError } = await updateReservationForGuest(
    session.user.id,
    reservation_id,
    new_total,
    guests_count,
    start_date,
    end_date
  );
  if (updateError?.code === "23P01") return { ...prevState, error: "Those dates were just booked. Please choose another date range." };
  if (updateError) return { ...prevState, error: "Could not update your reservation. Please try again." };

  revalidatePath(`/reservations/edit/${reservation_id}`);
  return { status: "success" };
}

export async function reservationCancelAction(prevState, formData) {
  const reservation_id = formData.get("reservation_id");
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in before cancelling." };
  const reservation = await getReservationByID(reservation_id, session.user.id);
  if (!reservation || String(reservation.guest_id) !== String(session.user.id)) return { error: "Reservation not found." };
    if (!canEditReservation(reservation, getAccraToday())) return { error: "This reservation can no longer be cancelled online." };
  const { error } = await cancelReservation(session.user.id, reservation_id);
  if (error?.code === "NOT_CANCELLABLE") return { error: "This reservation can no longer be cancelled online." };
  if (error) return { error: "Could not cancel your reservation. Please try again." };

  revalidatePath("/account/history");
  return { status: "success" };
}

export async function signupAction(prevState, formData) {
  prevState = {};
  const fullname = formData.get("fullname");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirm_password = formData.get("confirm_password");

  try {
    const z_validation = signupSchema.parse({
      fullname,
      email,
      password,
      confirm_password,
    });
  } catch (err) {
    err.issues.forEach((element) => {
      prevState[element?.path[0] ?? "unknown"] = element.message;
    });
    return { ...prevState };
  }

  const does_email_exists = await getGuestByEmail(email);

  if (does_email_exists)
    return { ...prevState, critical: "Email address already exists!" };

  const avatar = `https://ui-avatars.com/api/?name=${fullname.replace(
    " ",
    "+"
  )}&background=161616&color=F1F1F1`;
  const { error: createError } = await createGuest(fullname, email, avatar, hashSync(password, 10));
  if (createError) return { ...prevState, critical: "Could not create your account. Please check the email address or try again." };

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    return {
      ...prevState,
      authErr:
        "Error occured while attempting to authenticate you. Please try login in through the sign page!",
    };
  }

  redirect("/account/history");
}

export async function contactAction(state, formData) {
  "use server";
  let currentState = {
    errors: {},
    isSuccess: false,
  };

  if (String(formData.get("website") ?? "").trim()) {
    return { ...currentState, isSuccess: true };
  }

  const fullname = formData.get("fullname");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const message = formData.get("message");

  const validation = contactSchema.safeParse({
    fullname,
    email,
    phone,
    message,
  });

  if (!validation.success) {
    const errors = {};
    validation.error.issues.forEach((item) => {
      errors[item.path.at(0)] = item.message;
    });
    return { ...currentState, errors };
  }

  try {
    await createMessage(validation.data);
  } catch (err) {
    return {
      ...currentState,
      errors: { ...currentState.errors, critical: err.message },
    };
  }

  return { ...currentState, isSuccess: true, errors: {} };
}
