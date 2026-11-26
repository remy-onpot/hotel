import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const secretKey = process.env.SUPABASE_SECRET_KEY ?? "";
const supabaseSchemaEnv =
  (process.env.NEXT_PUBLIC_SUPABASE_SCHEMA_ENV ?? "public").toLowerCase();
let riskyClient;

function getRiskyClient() {
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for privileged Supabase operations.");
  }
  if (!secretKey.trim()) {
    throw new Error("SUPABASE_SECRET_KEY is required for privileged Supabase operations.");
  }

  if (!riskyClient) {
    riskyClient = createClient(supabaseUrl, secretKey, {
      db: { schema: supabaseSchemaEnv },
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return riskyClient;
}

// Privileged access is intentionally kept behind server-only module boundaries.
// Callers must use the explicit operations below rather than receiving the client.
export async function privilegedGuestById(id) {
  return getRiskyClient().from("guests_view").select("*").eq("id", id).maybeSingle();
}
export async function privilegedGuestByEmail(email) {
  return getRiskyClient().from("guests_view").select("*").eq("email", email).maybeSingle();
}
export async function privilegedGuestPasswordByEmail(email) {
  return getRiskyClient().from("guests").select("*").eq("email", email).single();
}
export async function privilegedCreateGuest(guest) {
  return getRiskyClient().from("guests").insert([guest]).select();
}
export async function privilegedFindGuestByPhone(phone) {
  return getRiskyClient().rpc("find_guest_by_normalized_phone", { p_phone: String(phone ?? "") });
}
export async function privilegedInsertInbox(message) {
  return getRiskyClient().rpc("submit_contact_message", {
    p_fullname: message.fullname,
    p_email: message.email,
    p_phone: message.phone,
    p_message: message.message,
  });
}
export function privilegedQuery(table) {
  const allowed = new Set(["rooms", "room_images", "gallery_images", "reservations", "guests", "inbox", "payment_exceptions", "room_units", "room_service_products", "room_service_orders", "room_service_order_items"]);
  if (!allowed.has(table)) throw new Error("Unsupported privileged query.");
  return getRiskyClient().from(table);
}
export async function getAdminRoomData() {
  const client = getRiskyClient();
  return Promise.all([
    client.from("rooms").select("id, name, description, thumbnail, price, price_usd, capacity, sleeps, features, inventory_count").order("id"),
    client.from("room_images").select("id, room_id, img_path").order("id"),
    client.from("room_units").select("id, room_type_id, room_number, qr_token, is_active").order("room_number"),
  ]);
}
export async function setRoomTypeUnits(roomTypeId, roomNumbers) {
  return getRiskyClient().rpc("set_room_type_units", { p_room_type_id: roomTypeId, p_room_numbers: roomNumbers });
}
export async function getRoomServiceProducts({ availableOnly = true } = {}) {
  const client = getRiskyClient();
  const selectProducts = (includeImagePath) => {
    let query = client.from("room_service_products").select(
      includeImagePath
        ? "id, name, description, price_ghs, price_usd, image_path, is_available"
        : "id, name, description, price_ghs, price_usd, is_available"
    );
    if (availableOnly) query = query.eq("is_available", true);
    return query.order("name");
  };

  let result = await selectProducts(true);
  const missingImageColumn = result.error && (
    result.error.code === "42703" ||
    result.error.code === "PGRST204" ||
    result.error.message?.toLowerCase().includes("image_path")
  );
  if (missingImageColumn) {
    result = await selectProducts(false);
    if (result.data) result.data = result.data.map((product) => ({ ...product, image_path: "" }));
  }
  return result;
}
export async function privilegedStorage() {
  return getRiskyClient().storage;
}
