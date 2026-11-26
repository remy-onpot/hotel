import supabase from "./db";

function assertQuerySucceeded(operation, error) {
  if (error) {
    console.error(`Supabase ${operation} failed:`, error.code ?? "unknown");
    throw new Error(`Could not ${operation}. Please try again later.`);
  }
}

export async function getAllRooms() {
  const { data: rooms, error } = await supabase.from("rooms").select("*");
  assertQuerySucceeded("load rooms", error);
  return rooms ?? [];
}

export async function getRoomById(id) {
  const { data: room, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  assertQuerySucceeded("load this room", error);
  return room;
}

export async function getRoomImages(id) {
  const { data: room_images, error } = await supabase
    .from("room_images")
    .select("*")
    .eq("room_id", id);
  assertQuerySucceeded("load room images", error);
  return room_images ?? [];
}

export async function filterRoomsByDate(
  start = "2024-09-21",
  end = "2024-09-27"
) {
  const now = new Date().toISOString();
  let { data: reservations, error } = await supabase
    .from("reservations")
    .select("room_id")
    .lt("start_date", end)
    .gt("end_date", start)
    .or(`status.eq.confirmed,and(status.eq.pending,hold_expires_at.gt.${now})`);

  if (error) {
    console.error("Supabase room availability lookup failed:", error.code ?? "unknown");
    return { data: null, error };
  }

  const { data: rooms, error: roomsError } = await supabase.from("rooms").select("*");
  if (roomsError) {
    console.error("Supabase room catalogue lookup failed:", roomsError.code ?? "unknown");
    return { data: null, error: roomsError };
  }

  const bookedByRoom = new Map();
  for (const reservation of reservations ?? []) {
    bookedByRoom.set(reservation.room_id, (bookedByRoom.get(reservation.room_id) ?? 0) + 1);
  }
  return {
    data: (rooms ?? []).map((room) => ({
      ...room,
      isAvailable: (bookedByRoom.get(room.id) ?? 0) < Number(room.inventory_count ?? 1),
    })),
    error: null,
  };
}

export async function checkRoomAvailability(roomId, start, end) {
  const now = new Date().toISOString();
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("inventory_count")
    .eq("id", roomId)
    .maybeSingle();
  if (roomError || !room) {
    if (roomError) console.error("Supabase room inventory lookup failed:", roomError.code ?? "unknown");
    return { data: null, error: roomError ?? new Error("Room type not found") };
  }
  const { count, error } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId)
    .lt("start_date", end)
    .gt("end_date", start)
    .or(`status.eq.confirmed,and(status.eq.pending,hold_expires_at.gt.${now})`)

  if (error) {
    console.error("Supabase room availability lookup failed:", error.code ?? "unknown");
    return { data: null, error };
  }
  return { data: (count ?? 0) < Number(room.inventory_count ?? 1), error: null };
}
