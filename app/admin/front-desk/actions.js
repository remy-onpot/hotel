"use server";

import { createHash, randomBytes } from "node:crypto";

import { auth } from "@/auth";
import { isAdminSession } from "@/app/_lib/admin";
import { privilegedFindGuestByPhone, privilegedQuery, privilegedCreateGuest } from "@/app/_lib/supabase/supabaseRiskyClient";
import { claimRoomReservation, checkInReservation, checkoutRoomStay } from "@/app/_lib/supabase/privilegedReservations";
import { bookingTotalPrice } from "@/app/utils/reservationsCalcs";
import { daysDifferCount } from "@/app/utils/datetime";
import { revalidatePath } from "next/cache";

function isDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function accraToday() {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function requireAdmin() {
  const session = await auth();
  if (!isAdminSession(session)) throw new Error("Admin access required.");
}

export async function lookupWalkInGuest(phone) {
  await requireAdmin();
  const normalized = String(phone ?? "").replace(/\D/g, "");
  if (normalized.length < 7) return { error: "Enter a valid phone number." };
  const { data, error } = await privilegedFindGuestByPhone(normalized);
  if (error) return { error: "Could not look up that phone number." };
  const guest = (data ?? []).find((item) => String(item.phone ?? "").replace(/\D/g, "") === normalized);
  if (!guest) return { guest: null };
  const { count, error: countError } = await privilegedQuery("reservations").select("id", { count: "exact", head: true }).eq("guest_id", guest.id);
  if (countError) return { error: "Could not load the guest's stay history." };
  return { guest: { ...guest, total_stays: count ?? 0 } };
}

export async function createWalkInReservation(_state, formData) {
  await requireAdmin();
  const fullname = String(formData.get("fullname") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  const phone = String(formData.get("phone") ?? "").trim();
  const roomId = String(formData.get("room_id") ?? "");
  const roomUnitId = String(formData.get("room_unit_id") ?? "");
  const start = String(formData.get("start_date") ?? "");
  const end = String(formData.get("end_date") ?? "");
  const guests = Number(formData.get("guests_count"));
  const method = String(formData.get("payment_method") ?? "");
  if (fullname.length < 2 || fullname.length > 120 || phone.replace(/\D/g, "").length < 7) return { error: "Enter a guest name and valid phone number." };
  if (!/^\d+$/.test(roomId) || !/^\d+$/.test(roomUnitId) || !isDateOnly(start) || !isDateOnly(end) || end <= start) return { error: "Choose a physical room and a valid check-in/check-out date range." };
  const today = accraToday();
  if (start < today) return { error: "Check-in date cannot be in the past." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid guest email address." };
  if (!Number.isInteger(guests) || guests < 1 || !["cash", "momo_transfer", "pos_card"].includes(method)) return { error: "Check the guest count and payment method." };

  let { data: matches, error } = await privilegedFindGuestByPhone(phone.replace(/\D/g, ""));
  if (error) return { error: "Could not find or create the guest record." };
  let guest = (matches ?? []).find((item) => String(item.phone ?? "").replace(/\D/g, "") === phone.replace(/\D/g, ""));
  if (guest) {
    const changes = { fullname };
    if (email) changes.email = email;
    const updated = await privilegedQuery("guests").update(changes).eq("id", guest.id).select("id").single();
    if (updated.error) return { error: "Could not update the guest record." };
  } else {
    const created = await privilegedCreateGuest({ fullname, email, phone, password: null, avatar: "", nationality: "", "countryFlag": "", "nationalID": "" });
    if (created.error) return { error: "Could not save the guest. Check whether this phone number is already on file." };
    guest = created.data?.[0];
  }
  if (!guest?.id) return { error: "Could not save the guest record." };
  const { data: room, error: roomError } = await privilegedQuery("rooms").select("id, name, price, capacity, room_units(id, room_number, is_active)").eq("id", roomId).maybeSingle();
  if (roomError || !room) return { error: "Could not load the selected room." };
  if (guests > room.capacity) return { error: `This room accepts up to ${room.capacity} guests.` };
  const unit = room.room_units?.find((item) => String(item.id) === roomUnitId && item.is_active);
  if (!unit) return { error: "Choose an active numbered room under the selected room type." };
  if (start !== accraToday()) return { error: "Walk-in check-in must start today. Create a future reservation through the public booking flow." };
  const nights = daysDifferCount(end, start);
  if (!Number.isInteger(nights) || nights < 1) return { error: "Choose valid stay dates." };
  const total = Number(bookingTotalPrice(room.price, guests, nights));
  const { data: reservation, error: bookingError } = await claimRoomReservation({
    p_room_id: room.id, p_guest_id: guest.id, p_guests_count: guests, p_start_date: start,
    p_end_date: end, p_reserved_price: total, p_currency: "GHS", p_message: "",
    p_status: "confirmed", p_booking_source: "walk_in", p_payment_method: method,
    p_payment_reference: null,
  });
  if (bookingError?.code === "23P01") return { error: "That room is already occupied for the selected dates. Choose another room or date range." };
  if (bookingError?.code === "42703") return { error: "The reservation database is missing required Paystack columns. Apply the latest Supabase migrations, then retry." };
  if (bookingError) return { error: `Could not create this reservation (database error ${bookingError.code ?? "unknown"}).` };
  const stayToken = randomBytes(12).toString("base64url");
  const tokenHash = createHash("sha256").update(stayToken).digest("hex");
  const { error: checkinError } = await checkInReservation(reservation.id, unit.id, tokenHash);
  if (checkinError) {
    await privilegedQuery("reservations").update({ status: "cancelled" }).eq("id", reservation.id);
    return { error: `Could not assign that room for check-in (${checkinError.code}).` };
  }
  revalidatePath("/admin/front-desk");
  return { success: { guest: fullname, room: `${room.name} · ${unit.room_number}`, start, end, total, currency: "GHS", id: reservation.id, stayToken } };
}

export async function checkoutStay(_state, formData) {
  await requireAdmin();
  const id = String(formData.get("reservation_id") ?? "");
  const method = String(formData.get("payment_method") ?? "");
  if (!/^\d+$/.test(id) || !["cash", "momo_transfer", "pos_card"].includes(method)) return { error: "Choose a valid checkout payment method." };
  const { error } = await checkoutRoomStay(id, method);
  if (error) return { error: error.code === "ORDERS_STILL_IN_PROGRESS" ? "Complete or cancel room-service orders before checkout." : `Checkout could not be completed (${error.code}).` };
  revalidatePath("/admin/front-desk");
  return { success: "Guest checked out and room-service folio settled." };
}

export async function checkInExistingStay(_state, formData) {
  await requireAdmin();
  const id = String(formData.get("reservation_id") ?? "");
  const unitId = String(formData.get("room_unit_id") ?? "");
  if (!/^\d+$/.test(id) || !/^\d+$/.test(unitId)) return { error: "Choose a valid reservation and physical room." };
  const token = randomBytes(12).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  const { error } = await checkInReservation(Number(id), Number(unitId), hash);
  if (error) return { error: error.code === "ROOM_UNIT_UNAVAILABLE" ? "That room is booked for overlapping dates." : "Could not check in this reservation. Check its dates and status." };
  revalidatePath("/admin/front-desk");
  return { success: { token } };
}
