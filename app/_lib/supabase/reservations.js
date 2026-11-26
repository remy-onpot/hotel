import "server-only";
import supabase from "./db";
import { privilegedQuery } from "./supabaseRiskyClient";
import {
  cancelGuestReservation,
  deleteGuestReservation,
  updateGuestReservation,
} from "./privilegedReservations";

function assertQuerySucceeded(operation, error) {
  if (error) {
    console.error(`Supabase ${operation} failed:`, error.code ?? "unknown");
    throw new Error(`Could not ${operation}. Please try again later.`);
  }
}

export async function getGuestReservations(guestId) {
  const { data, error } = await privilegedQuery("reservations")
    .select("*, rooms(thumbnail, name, capacity)")
    .eq("guest_id", guestId)
    .is("deleted_at", null);
  assertQuerySucceeded("load reservations", error);
  return data ?? [];
}

export async function deleteReservation(guestId, id) {
  return deleteGuestReservation(id, guestId);
}

export async function getRoomReservationsResult(id) {
  const { data, error } = await supabase.from("reservations")
    .select("id, room_id, start_date, end_date, status, hold_expires_at")
    .eq("room_id", id);
  if (error) console.error("Supabase room reservation lookup failed:", error.code ?? "unknown");
  return { data, error };
}

export async function getReservationByID(id, guestId) {
  if (!guestId) throw new Error("A guest identity is required to load a reservation.");
  const { data, error } = await privilegedQuery("reservations")
    .select("*, rooms(thumbnail, name, capacity, price)")
    .eq("id", id)
    .eq("guest_id", guestId)
    .maybeSingle();
  assertQuerySucceeded("load reservation", error);
  return data;
}

export async function updateReservationForGuest(guestId, id, price, guestsCount, startDate, endDate) {
  return updateGuestReservation({
    id,
    guestId,
    reservedPrice: price,
    guestsCount,
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  });
}

export async function cancelReservation(guestId, id) {
  return cancelGuestReservation(id, guestId);
}
