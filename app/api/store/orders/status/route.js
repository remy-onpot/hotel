import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { privilegedQuery } from "@/app/_lib/supabase/supabaseRiskyClient";

function accraToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export async function POST(request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid status request." }, { status: 400 }); }

  const today = accraToday();
  let stayQuery;
  if (/^\d+$/.test(String(body?.reservationId ?? ""))) {
    const session = await auth();
    if (!session?.user?.email || !session.user.id || session.user.role === "admin") {
      return NextResponse.json({ error: "Sign in to view orders for this stay." }, { status: 401 });
    }
    const guestId = Number(session.user.id);
    if (!Number.isSafeInteger(guestId) || guestId < 1) return NextResponse.json({ error: "Guest account could not be verified." }, { status: 401 });
    stayQuery = privilegedQuery("reservations").select("id")
      .eq("id", Number(body.reservationId)).eq("guest_id", guestId);
  } else {
    const qrToken = String(body?.qrToken ?? "");
    const code = String(body?.code ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(qrToken) || code.length < 8 || code.length > 64) {
      return NextResponse.json({ error: "Enter the room QR and your stay access code to view orders." }, { status: 400 });
    }
    const { data: unit, error: unitError } = await privilegedQuery("room_units")
      .select("id").eq("qr_token", qrToken).eq("is_active", true).maybeSingle();
    if (unitError) return NextResponse.json({ error: "Could not verify this room." }, { status: 500 });
    if (!unit) return NextResponse.json({ error: "This room QR is no longer active." }, { status: 404 });
    const tokenHash = createHash("sha256").update(code).digest("hex");
    stayQuery = privilegedQuery("reservations").select("id")
      .eq("room_unit_id", unit.id).eq("room_order_token_hash", tokenHash);
  }

  const { data: stay, error: stayError } = await stayQuery
    .eq("status", "confirmed").not("checked_in_at", "is", null)
    .is("checked_out_at", null).is("deleted_at", null)
    .lte("start_date", today).gt("end_date", today).maybeSingle();
  if (stayError) return NextResponse.json({ error: "Could not load this stay's orders." }, { status: 500 });
  if (!stay) return NextResponse.json({ error: "No active checked-in stay matches this guest and room." }, { status: 403 });

  const { data: orders, error: orderError } = await privilegedQuery("room_service_orders")
    .select("id, status, payment_status, total_ghs, created_at, updated_at, guest_note, room_units(room_number), room_service_order_items(product_name, quantity, line_total_ghs)")
    .eq("reservation_id", stay.id).order("created_at", { ascending: false }).limit(10);
  if (orderError) return NextResponse.json({ error: "Could not load your order status." }, { status: 500 });
  return NextResponse.json({ orders: orders ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
