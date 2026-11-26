import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { daysDifferCount } from "@/app/utils/datetime";
import { bookingTotalPrice } from "@/app/utils/reservationsCalcs";
import { claimRoomReservation, confirmHeldReservation, getReservationByPaymentReference, getReservationTransaction } from "@/app/_lib/supabase/privilegedReservations";
import { randomUUID } from "node:crypto";
import { getRoomById } from "@/app/_lib/supabase/rooms";

const PAYSTACK_API = "https://api.paystack.co";

export async function initializePaystackTransaction({ email, booking, callbackUrl }) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Paystack is not configured. Add PAYSTACK_SECRET_KEY.");

  const room = await getRoomById(booking.room_id);
  if (!room) throw new Error("The selected room could not be found.");

  const nights = daysDifferCount(booking.end_date, booking.start_date);
  if (!Number.isInteger(nights) || nights < 1) throw new Error("Choose a valid stay date range.");
  if (!Number.isInteger(Number(booking.guests_count)) || Number(booking.guests_count) < 1 || Number(booking.guests_count) > room.capacity) {
    throw new Error("The guest count is not valid for this room.");
  }

  const total = Number(bookingTotalPrice(room.price, booking.guests_count, nights));
  const amount = Math.round(total * 100);
  if (!Number.isSafeInteger(amount) || amount < 1) throw new Error("The booking total is invalid.");

  const reference = `winford_${randomUUID()}`;
  const { data: held, error: holdError } = await claimRoomReservation({
    p_room_id: room.id, p_guest_id: booking.guest_id, p_guests_count: Number(booking.guests_count),
    p_start_date: booking.start_date, p_end_date: booking.end_date, p_reserved_price: total,
    p_currency: "GHS", p_message: booking.message ?? "", p_status: "pending",
    p_booking_source: "online", p_payment_method: "paystack", p_payment_reference: reference,
  });
  if (holdError) throw new Error(holdError.code === "23P01" ? "This room was just booked for those dates. Please choose another room or date range." : "Could not hold this room. Please try again.");

  const payload = {
    email,
    amount: String(amount),
    currency: "GHS",
    reference,
    callback_url: callbackUrl,
    metadata: JSON.stringify({
      booking: {
        room_id: room.id,
        guest_id: booking.guest_id,
        guests_count: Number(booking.guests_count),
        message: booking.message ?? "",
        start_date: booking.start_date,
        end_date: booking.end_date,
        amount,
        currency: "GHS",
        reservation_id: held.id,
        reference,
      },
    }),
  };

  const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const result = await response.json();

  if (!response.ok || !result.status || !result.data?.authorization_url || !result.data?.reference) {
    throw new Error(result.message || "Paystack could not start the payment.");
  }

  return result.data;
}

function equalHex(left, right) {
  if (!/^[a-f0-9]{128}$/i.test(left) || !/^[a-f0-9]{128}$/i.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export function verifyPaystackWebhookSignature(rawBody, headers) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  const legacySignature = headers.get("x-paystack-signature");
  if (legacySignature) {
    const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
    return equalHex(legacySignature, expected);
  }

  const modernHeader = headers.get("paystack-signature");
  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!modernHeader || !webhookSecret) return false;

  const fields = modernHeader.split(",").map((field) => field.trim());
  const timestamp = fields.find((field) => field.startsWith("t="))?.slice(2);
  const signatures = fields.filter((field) => field.startsWith("v1="));
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false;

  const expected = createHmac("sha512", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return signatures.some((field) => {
    const signaturePair = field.slice(3).split(":");
    const signature = signaturePair.at(-1);
    return equalHex(signature ?? "", expected);
  });
}

export async function verifyAndSavePaystackReservation(reference) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Paystack is not configured.");
  if (typeof reference !== "string" || !/^[a-zA-Z0-9._=-]{1,100}$/.test(reference)) {
    throw new Error("Invalid payment reference.");
  }

  const response = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  const result = await response.json();
  const transaction = result.data;
  if (!response.ok || !result.status || transaction?.status !== "success") {
    throw new Error("The payment has not been confirmed.");
  }
  if (transaction.reference !== reference || transaction.currency !== "GHS") {
    throw new Error("The payment reference or currency does not match this booking.");
  }

  let metadata;
  try {
    metadata = typeof transaction.metadata === "string" ? JSON.parse(transaction.metadata) : transaction.metadata;
  } catch {
    throw new Error("The payment metadata is invalid.");
  }
  const booking = metadata?.booking;
  if (!booking || booking.currency !== "GHS" || Number(booking.amount) !== Number(transaction.amount)) {
    throw new Error("The paid amount does not match this booking.");
  }
  const storedTransaction = await getReservationTransaction(reference);
  if (!storedTransaction || storedTransaction.provider !== "paystack" ||
      storedTransaction.reservation_id !== Number(booking.reservation_id) ||
      Number(storedTransaction.amount_minor) !== Number(transaction.amount) ||
      storedTransaction.currency !== transaction.currency) {
    throw new Error("The payment does not match the stored reservation transaction.");
  }

  const reservation = await getReservationByPaymentReference(reference);
  if (!reservation || Number(reservation.room_id) !== Number(booking.room_id) ||
      Number(reservation.guest_id) !== Number(booking.guest_id) ||
      Number(reservation.guests_count) !== Number(booking.guests_count) ||
      reservation.start_date !== booking.start_date || reservation.end_date !== booking.end_date) {
    throw new Error("The payment metadata does not match the stored reservation.");
  }

  const room = await getRoomById(booking.room_id);
  if (!room || Number(booking.guests_count) > Number(room.capacity)) {
    throw new Error("The booked room or guest count is invalid.");
  }
  const nights = daysDifferCount(booking.end_date, booking.start_date);
  if (!Number.isInteger(nights) || nights < 1 || !Number.isSafeInteger(Number(transaction.amount)) || Number(transaction.amount) < 1) {
    throw new Error("The payment total or stay dates are invalid.");
  }

  const confirmed = await confirmHeldReservation(reference, {
    amount: Number(transaction.amount),
    currency: transaction.currency,
    providerTransactionId: String(transaction.id),
    paidAt: transaction.paid_at,
  });
  if (confirmed.error) throw new Error(confirmed.error.message ?? "Could not confirm the reservation.");
  return confirmed.data;
}
