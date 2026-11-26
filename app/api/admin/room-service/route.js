import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminSession } from "@/app/_lib/admin";
import { privilegedQuery } from "@/app/_lib/supabase/supabaseRiskyClient";
import { updateRoomServiceOrderStatus } from "@/app/_lib/supabase/privilegedReservations";

async function authorized(request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  return null;
}
export async function GET(request) {
  const denied = await authorized(request); if (denied) return denied;
  if (new URL(request.url).searchParams.get("summary") === "1") {
    const { count, error } = await privilegedQuery("room_service_orders")
      .select("id", { count: "exact", head: true }).eq("status", "new");
    if (error) return NextResponse.json({ error: "Could not load the new order count." }, { status: 500 });
    return NextResponse.json({ newOrders: count ?? 0 });
  }
  const { data, error } = await privilegedQuery("room_service_orders").select("id, status, total_ghs, guest_note, created_at, reservations(start_date, end_date, guests(fullname)), room_units(room_number), room_service_order_items(product_name, quantity, line_total_ghs)").order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Could not load room-service orders." }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}
export async function PATCH(request) {
  const denied = await authorized(request); if (denied) return denied;
  let body; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid update." }, { status: 400 }); }
  if (!/^\d+$/.test(String(body?.id)) || !["accepted", "preparing", "delivered", "cancelled"].includes(body?.status)) return NextResponse.json({ error: "Invalid order update." }, { status: 400 });
  const { error } = await updateRoomServiceOrderStatus(Number(body.id), body.status);
  if (error) return NextResponse.json({ error: "Order status could not be updated." }, { status: 409 });
  return NextResponse.json({ updated: true });
}
