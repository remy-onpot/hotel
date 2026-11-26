import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStorageBucketName, isAdminSession } from "@/app/_lib/admin";
import { privilegedQuery, privilegedStorage, setRoomTypeUnits } from "@/app/_lib/supabase/supabaseRiskyClient";

async function authorizeAdmin(request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { response: NextResponse.json({ error: "Sign in is required." }, { status: 401 }) };
  if (!isAdminSession(session)) return { response: NextResponse.json({ error: "Admin access is required." }, { status: 403 }) };

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return { response: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) };
  }

  return { email };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalizeFeatures(value) {
  if (value === undefined) return { features: undefined };

  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\r?\n/)
      : null;
  if (!values) return { error: "Room features must be a list, with one feature per line." };

  const features = [...new Map(
    values
      .filter((feature) => typeof feature === "string")
      .map((feature) => feature.trim())
      .filter(Boolean)
      .map((feature) => [feature.toLowerCase(), feature])
  ).values()];

  if (features.length > 40 || features.some((feature) => feature.length > 120)) {
    return { error: "Add no more than 40 amenities, each 120 characters or fewer." };
  }

  return { features };
}

function normalizeRoomNumbers(value) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[\n,]+/) : null;
  if (!values) return { error: "Enter one physical room number per line." };
  const roomNumbers = values.map((number) => String(number).trim()).filter(Boolean);
  if (!roomNumbers.length || roomNumbers.length > 500 || roomNumbers.some((number) => number.length > 24 || !/^[A-Za-z0-9][A-Za-z0-9 -]{0,23}$/.test(number))) {
    return { error: "Enter 1 to 500 room numbers, each 24 characters or fewer." };
  }
  if (new Set(roomNumbers.map((number) => number.toLowerCase())).size !== roomNumbers.length) {
    return { error: "Room numbers must be unique within this room type." };
  }
  return { roomNumbers };
}

export async function POST(request) {
  const { response } = await authorizeAdmin(request);
  if (response) return response;

  const body = await readJson(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const price = Number(body?.price);
  const priceUsd = body?.price_usd === "" || body?.price_usd == null ? null : Number(body.price_usd);
  const capacity = Number(body?.capacity);
  const sleeps = Number(body?.sleeps);
  const { roomNumbers, error: roomNumbersError } = normalizeRoomNumbers(body?.room_numbers);
  const { features, error: featuresError } = normalizeFeatures(body?.features);

  if (!name || name.length > 120) {
    return NextResponse.json({ error: "Room name is required and must be 120 characters or fewer." }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Price must be a valid non-negative number." }, { status: 400 });
  }
  if (priceUsd !== null && (!Number.isFinite(priceUsd) || priceUsd < 0)) {
    return NextResponse.json({ error: "The USD display price must be a valid non-negative number or left blank." }, { status: 400 });
  }
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) {
    return NextResponse.json({ error: "Capacity must be a whole number from 1 to 50." }, { status: 400 });
  }
  if (!Number.isInteger(sleeps) || sleeps < 1 || sleeps > 50) {
    return NextResponse.json({ error: "Sleeps must be a whole number from 1 to 50." }, { status: 400 });
  }
  if (roomNumbersError) return NextResponse.json({ error: roomNumbersError }, { status: 400 });
  if (description.length > 5000) {
    return NextResponse.json({ error: "Description must be 5,000 characters or fewer." }, { status: 400 });
  }
  if (featuresError) return NextResponse.json({ error: featuresError }, { status: 400 });

  const { data: room, error } = await privilegedQuery("rooms")
    .insert({ name, description, price, price_usd: priceUsd, capacity, sleeps, inventory_count: roomNumbers.length, features: features ?? [], thumbnail: "" })
    .select("id, name, description, price, price_usd, capacity, sleeps, features, thumbnail, inventory_count")
    .single();

  if (error) {
    console.error("Could not create room:", error);
    return NextResponse.json({ error: "Could not create the room. Check the rooms table configuration." }, { status: 500 });
  }

  const { data: unitsResult, error: unitsError } = await setRoomTypeUnits(room.id, roomNumbers);
  if (unitsError || !unitsResult?.ok) {
    await privilegedQuery("rooms").delete().eq("id", room.id);
    return NextResponse.json({ error: unitsResult?.code === "ROOM_NUMBER_IN_USE" ? "A room number is already assigned to another room type." : "Could not save the physical room numbers." }, { status: 409 });
  }

  return NextResponse.json({ room }, { status: 201 });
}

export async function PATCH(request) {
  const { response } = await authorizeAdmin(request);
  if (response) return response;

  const body = await readJson(request);
  const id = body?.id;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const price = Number(body?.price);
  const priceUsd = body?.price_usd === "" || body?.price_usd == null ? null : Number(body.price_usd);
  const { roomNumbers, error: roomNumbersError } = normalizeRoomNumbers(body?.room_numbers);
  const { features, error: featuresError } = normalizeFeatures(body?.features);
  if (!/^\d+$/.test(String(id ?? ""))) {
    return NextResponse.json({ error: "Choose a valid room." }, { status: 400 });
  }
  if (!name || name.length > 120) {
    return NextResponse.json({ error: "Room name is required and must be 120 characters or fewer." }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Price must be a valid non-negative number." }, { status: 400 });
  }
  if (priceUsd !== null && (!Number.isFinite(priceUsd) || priceUsd < 0)) {
    return NextResponse.json({ error: "The USD display price must be a valid non-negative number or left blank." }, { status: 400 });
  }
  if (roomNumbersError) return NextResponse.json({ error: roomNumbersError }, { status: 400 });
  if (featuresError) return NextResponse.json({ error: featuresError }, { status: 400 });

  const changes = { name, price, price_usd: priceUsd, updated_at: new Date().toISOString() };
  if (features !== undefined) changes.features = features;

  const { data: room, error } = await privilegedQuery("rooms")
    .update(changes)
    .eq("id", id)
    .select("id, name, description, price, price_usd, capacity, sleeps, features, thumbnail, inventory_count")
    .maybeSingle();

  if (error) {
    console.error("Could not update room:", error);
    if (error.code === "23514") return NextResponse.json({ error: "Inventory cannot be reduced below the number already booked for overlapping dates." }, { status: 409 });
    return NextResponse.json({ error: "Could not update the room." }, { status: 500 });
  }
  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  const { data: unitsResult, error: unitsError } = await setRoomTypeUnits(id, roomNumbers);
  if (unitsError || !unitsResult?.ok) {
    const messages = {
      ROOM_IN_USE: "A room with an upcoming or active stay cannot be removed.",
      ROOM_NUMBER_IN_USE: "A room number is already assigned to another room type.",
      INVALID_ROOM_NUMBERS: "Check the room numbers and try again.",
    };
    return NextResponse.json({ error: messages[unitsResult?.code] ?? "Could not save the physical room numbers." }, { status: 409 });
  }

  return NextResponse.json({ room });
}

export async function DELETE(request) {
  const { response } = await authorizeAdmin(request);
  if (response) return response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Choose a valid room." }, { status: 400 });
  }

  const { data: room, error: roomError } = await privilegedQuery("rooms")
    .select("id, thumbnail")
    .eq("id", id)
    .maybeSingle();
  if (roomError) return NextResponse.json({ error: "Could not load the room." }, { status: 500 });
  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  const { data: images, error: imagesError } = await privilegedQuery("room_images")
    .select("img_path")
    .eq("room_id", id);
  if (imagesError) return NextResponse.json({ error: "Could not load the room images." }, { status: 500 });

  const { error: deleteError } = await privilegedQuery("rooms").delete().eq("id", id);
  if (deleteError?.code === "23503") {
    return NextResponse.json({ error: "This room has reservations and cannot be deleted." }, { status: 409 });
  }
  if (deleteError) {
    console.error("Could not delete room:", deleteError);
    return NextResponse.json({ error: "Could not delete the room." }, { status: 500 });
  }

  const paths = [...new Set([room.thumbnail, ...(images ?? []).map((image) => image.img_path)].filter(Boolean))];
  const bucket = getStorageBucketName();
  let imageCleanupWarning = false;
  if (bucket && paths.length) {
    const { error: storageError } = await (await privilegedStorage()).from(bucket).remove(paths);
    if (storageError) {
      console.error(`Room ${id} was deleted but its storage images could not be removed:`, storageError);
      imageCleanupWarning = true;
    }
  } else if (paths.length) {
    imageCleanupWarning = true;
  }

  return NextResponse.json({ deleted: true, imageCleanupWarning });
}


