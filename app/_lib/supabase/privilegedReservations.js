import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SECRET_KEY ?? "";
const schema = (process.env.NEXT_PUBLIC_SUPABASE_SCHEMA_ENV ?? "public").toLowerCase();
let serviceClient;
function client() {
  if (!url || !key.trim()) throw new Error("Privileged Supabase configuration is missing.");
  serviceClient ??= createClient(url, key, { db: { schema }, auth: { autoRefreshToken: false, persistSession: false } });
  return serviceClient;
}

export async function claimRoomReservation(values) {
  const { data, error } = await client().rpc("claim_room_reservation", values);
  if (error) return { data: null, error };
  if (!data?.ok) return { data: null, error: { code: data?.code ?? "BOOKING_CONFLICT", message: data?.message } };
  return { data: data.reservation, error: null };
}

async function callStaffRpc(name, args) {
  const { data, error } = await client().rpc(name, args);
  if (error) return { data: null, error };
  if (!data?.ok) return { data: null, error: { code: data?.code ?? "REQUEST_FAILED", ...data } };
  return { data, error: null };
}
export const checkInReservation = (reservationId, roomUnitId, tokenHash) => callStaffRpc("check_in_reservation", {
  p_reservation_id: reservationId, p_room_unit_id: roomUnitId, p_room_order_token_hash: tokenHash,
});
export const checkoutRoomStay = (reservationId, paymentMethod) => callStaffRpc("checkout_room_stay", {
  p_reservation_id: reservationId, p_payment_method: paymentMethod ?? null,
});
export const updateRoomServiceOrderStatus = (orderId, status) => callStaffRpc("update_room_service_order_status", {
  p_order_id: orderId, p_status: status,
});
export const submitRoomServiceOrder = (roomUnitId, tokenHash, items, note) => callStaffRpc("submit_room_service_order", {
  p_room_unit_id: roomUnitId, p_room_order_token_hash: tokenHash, p_items: items, p_guest_note: note,
});
export const submitRoomServiceOrderForGuest = (reservationId, guestId, items, note) => callStaffRpc("submit_room_service_order_for_guest", {
  p_reservation_id: reservationId, p_guest_id: guestId, p_items: items, p_guest_note: note,
});

export async function updateGuestReservation({ id, guestId, startDate, endDate, guestsCount, reservedPrice }) {
  const { data, error } = await client().rpc("update_guest_reservation", {
    p_reservation_id: id,
    p_guest_id: guestId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_guests_count: guestsCount,
    p_reserved_price: reservedPrice,
  });
  if (error) return { data: null, error };
  if (!data?.ok) return { data: null, error: { code: data?.code ?? "UPDATE_FAILED" } };
  return { data, error: null };
}

export async function cancelGuestReservation(id, guestId) {
  const { data, error } = await client().rpc("cancel_guest_reservation", {
    p_reservation_id: id,
    p_guest_id: guestId,
  });
  if (error) return { data: null, error };
  if (!data?.ok) return { data: null, error: { code: data?.code ?? "CANCEL_FAILED" } };
  return { data, error: null };
}

export async function deleteGuestReservation(id, guestId) {
  const { data, error } = await client().rpc("soft_delete_guest_reservation", {
    p_reservation_id: id,
    p_guest_id: guestId,
  });
  if (error) return { data: null, error };
  if (!data?.ok) return { data: null, error: { code: data?.code ?? "DELETE_FAILED" } };
  return { data, error: null };
}

export async function enqueuePaymentException({ reference, reservationId, amountMinor, currency = "GHS", reason }) {
  const { data, error } = await client().from("payment_exceptions").upsert({
    payment_reference: reference,
    reservation_id: reservationId ?? null,
    paid_amount_minor: amountMinor != null && Number.isSafeInteger(Number(amountMinor)) ? Number(amountMinor) : null,
    currency,
    reason,
  }, { onConflict: "payment_reference", ignoreDuplicates: true }).select("id").maybeSingle();
  if (error) throw new Error("Could not add the payment to the staff refund queue.");
  return data;
}

export async function confirmHeldReservation(reference, payment = {}) {
  const { data, error } = await client().rpc("confirm_paystack_reservation", {
    p_reference: reference, p_amount_minor: payment.amount, p_currency: payment.currency ?? "GHS",
    p_provider_transaction_id: payment.providerTransactionId ?? null, p_paid_at: payment.paidAt ?? null,
  });
  if (error) return { data: null, error };
  if (data?.ok) return { data: data.reservation, error: null };
  if (data?.code !== "HOLD_UNAVAILABLE") {
    return { data: null, error: { code: data?.code ?? "PAYMENT_CONFIRMATION_FAILED", message: "The payment could not be matched to its reservation." } };
  }

  const reservationId = data.reservation_id;
  const { data: reservation, error: lookupError } = await client().from("reservations")
    .select("id, guest_id, room_id, reserved_price, status")
    .eq("id", reservationId).maybeSingle();
  if (lookupError) return { data: null, error: lookupError };
  await client().from("reservations").update({ status: "conflict_refund_required" })
    .eq("id", reservationId).in("status", ["pending", "expired"]);
  await enqueuePaymentException({
    reference,
    reservationId,
    amountMinor: payment.amount ?? (reservation ? Math.round(Number(reservation.reserved_price) * 100) : null),
    currency: payment.currency ?? "GHS",
    reason: "Payment verified, but the room hold expired or could not be confirmed. Review and refund if required.",
  });
  console.error("Verified payment has no confirmable room hold; refund review required.");
  return { data: null, error: { code: "REFUND_REQUIRED", message: "Payment received, but the room could not be confirmed. Contact the hotel for a refund." } };
}

export async function getReservationByPaymentReference(reference) {
  const { data: transaction, error: transactionError } = await client().from("reservation_transactions")
    .select("reservation_id, currency, status").eq("provider_reference", reference).maybeSingle();
  if (transactionError) throw new Error("Unable to load the payment transaction.");
  if (!transaction) return null;
  const { data, error } = await client().from("reservations")
    .select("*, rooms(thumbnail, name)").eq("id", transaction.reservation_id).maybeSingle();
  if (error) throw new Error("Unable to load the payment reservation.");
  return data ? { ...data, currency: transaction.currency, paymentTransactionStatus: transaction.status } : null;
}

export async function getReservationTransaction(reference) {
  const { data, error } = await client().from("reservation_transactions")
    .select("id, reservation_id, provider, provider_reference, amount_minor, currency, status")
    .eq("provider_reference", reference).maybeSingle();
  if (error) throw new Error("Unable to load the payment transaction.");
  return data;
}
