import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { privilegedQuery } from "@/app/_lib/supabase/supabaseRiskyClient";
import { submitRoomServiceOrder, submitRoomServiceOrderForGuest } from "@/app/_lib/supabase/privilegedReservations";
import { auth } from "@/auth";

export async function POST(request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid order." }, { status: 400 }); }
  const token = String(body?.qrToken ?? "");
  const code = String(body?.code ?? "").trim();
  const note = String(body?.note ?? "").trim();
  const accountOrder = /^\d+$/.test(String(body?.reservationId ?? ""));
  if ((!accountOrder && !/^[0-9a-f-]{36}$/i.test(token)) || (accountOrder && (token || code)) || (!accountOrder && (code.length < 8 || code.length > 64)) || note.length > 500 || !Array.isArray(body?.items)) return NextResponse.json({ error: "Check your room, stay access code, and order details." }, { status: 400 });
  const items = body.items.map((item) => ({ product_id: Number(item.productId), quantity: Number(item.quantity) }));
  if (items.length < 1 || items.length > 20 || items.some((item) => !Number.isSafeInteger(item.product_id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) return NextResponse.json({ error: "Choose between 1 and 20 valid items." }, { status: 400 });
  let result;
  if (accountOrder) {
    const session = await auth();
    if (!session?.user?.email || !session.user.id || session.user.role === "admin") return NextResponse.json({ error: "Sign in with the guest account for this stay to place an order." }, { status: 401 });
    const guestId = Number(session.user.id);
    if (!Number.isSafeInteger(guestId) || guestId < 1) return NextResponse.json({ error: "Your guest account could not be verified. Sign in again and retry." }, { status: 401 });
    result = await submitRoomServiceOrderForGuest(Number(body.reservationId), guestId, items, note);
  } else {
    const { data: unit } = await privilegedQuery("room_units").select("id, is_active").eq("qr_token", token).maybeSingle();
    if (!unit?.is_active) return NextResponse.json({ error: "This room ordering QR is no longer active." }, { status: 404 });
    const hash = createHash("sha256").update(code).digest("hex");
    result = await submitRoomServiceOrder(unit.id, hash, items, note);
  }
  const { data, error } = result;
  if (error) return NextResponse.json({ error: error.code === "INVALID_STAY_ACCESS" ? "That stay access code is incorrect or the stay is no longer active." : error.code === "NO_ACTIVE_ASSIGNED_STAY" ? "There is no active checked-in stay linked to this guest account." : error.code === "PRODUCT_UNAVAILABLE" ? "An item is no longer available. Refresh and try again." : "Could not place the order." }, { status: 409 });
  return NextResponse.json({ orderId: data.order_id, total: data.total_ghs }, { status: 201 });
}
