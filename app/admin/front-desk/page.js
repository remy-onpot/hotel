import { auth } from "@/auth";
import { isAdminSession } from "@/app/_lib/admin";
import { privilegedQuery } from "@/app/_lib/supabase/supabaseRiskyClient";
import { notFound, redirect } from "next/navigation";
import FrontDesk from "./front-desk";

export const metadata = { title: "Front desk", robots: { index: false, follow: false } };
function accraToday() {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default async function FrontDeskPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  if (!isAdminSession(session)) notFound();
  const localToday = accraToday();
  const [
    { data: rooms, error: roomsError },
    { data: arrivals, error: arrivalsError },
    { data: occupied, error: occupiedError },
    { data: contacts, error: contactsError },
  ] = await Promise.all([
    privilegedQuery("rooms").select("id, name, price, price_usd, capacity, room_units(id, room_number, is_active)").order("name"),
    privilegedQuery("reservations").select("id, room_id, room_unit_id, start_date, end_date, status, checked_in_at, checked_out_at, room_units(room_number), room_service_orders(total_ghs,status,payment_status), rooms(name,room_units(id,room_number,is_active)), guests(fullname, phone, email)").lte("start_date", localToday).gt("end_date", localToday).eq("status", "confirmed").is("checked_in_at", null).is("deleted_at", null).order("start_date").order("id"),
    privilegedQuery("reservations").select("id, room_id, room_unit_id, start_date, end_date, status, checked_in_at, checked_out_at, room_units(room_number), room_service_orders(total_ghs,status,payment_status), rooms(name,room_units(id,room_number,is_active)), guests(fullname, phone, email)").not("checked_in_at", "is", null).is("checked_out_at", null).eq("status", "confirmed").is("deleted_at", null).order("end_date").order("id"),
    privilegedQuery("guests").select("fullname, phone, email, reservations(id)").order("fullname"),
  ]);
  const stays = [...(arrivals ?? []), ...(occupied ?? [])];
  const contactRows = (contacts ?? []).map((guest) => ({ full_name: guest.fullname, phone: guest.phone, email: guest.email, total_stays: guest.reservations?.length ?? 0 }));
  return <FrontDesk rooms={rooms ?? []} stays={stays} contacts={contactRows} today={localToday} loadError={roomsError || arrivalsError || occupiedError || contactsError ? "Some front-desk data could not be loaded." : ""} />;
}
