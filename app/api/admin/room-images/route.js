import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStorageBucketName, isAdminSession } from "@/app/_lib/admin";
import { privilegedQuery, privilegedStorage } from "@/app/_lib/supabase/supabaseRiskyClient";
import { randomUUID } from "node:crypto";
import { normalizeUploadedImage } from "@/app/_lib/imageValidation";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_IMAGE_COUNT = 10;
const MAX_BATCH_SIZE = MAX_IMAGE_SIZE * MAX_IMAGE_COUNT;
const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(request) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  }
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BATCH_SIZE + 256 * 1024) {
    return NextResponse.json({ error: "Choose up to 10 images, with a maximum of 8 MB each." }, { status: 413 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded file." }, { status: 400 });
  }

  const roomId = formData.get("roomId");
  const files = formData.getAll("files");
  const setFirstAsThumbnail = formData.get("setFirstAsThumbnail") === "on";

  if (typeof roomId !== "string" || !/^\d+$/.test(roomId)) {
    return NextResponse.json({ error: "Choose a valid room." }, { status: 400 });
  }
  if (files.length < 1 || files.length > MAX_IMAGE_COUNT || files.some((file) => !(file instanceof File) || file.size === 0)) {
    return NextResponse.json({ error: "Choose between 1 and 10 image files." }, { status: 400 });
  }
  if (files.some((file) => file.size > MAX_IMAGE_SIZE)) {
    return NextResponse.json({ error: "Each image must be 8 MB or smaller." }, { status: 413 });
  }
  if (files.some((file) => !IMAGE_EXTENSIONS[file.type])) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, WebP, or AVIF image." },
      { status: 415 }
    );
  }

  const bucket = getStorageBucketName();
  if (!bucket) {
    return NextResponse.json(
      { error: "Set NEXT_PUBLIC_SUPABASE_IMGS_URL or SUPABASE_STORAGE_BUCKET." },
      { status: 500 }
    );
  }

  const { data: room, error: roomError } = await privilegedQuery("rooms")
    .select("id, name, thumbnail")
    .eq("id", roomId)
    .maybeSingle();

  if (roomError) {
    return NextResponse.json({ error: "Could not load the selected room." }, { status: 500 });
  }
  if (!room) {
    return NextResponse.json({ error: "The selected room does not exist." }, { status: 404 });
  }

  const storage = await privilegedStorage();
  const { data: buckets, error: bucketListError } = await storage.listBuckets();
  if (bucketListError) {
    console.error("Could not list Supabase Storage buckets:", bucketListError);
    return NextResponse.json(
      { error: "Could not access Supabase Storage. Check SUPABASE_SECRET_KEY and the configured Supabase project." },
      { status: 502 }
    );
  }

  const existingBucket = buckets.find((item) => item.id === bucket);
  if (existingBucket && !existingBucket.public) {
    return NextResponse.json(
      { error: `The Supabase Storage bucket "${bucket}" exists but is private. Make it public to display room images.` },
      { status: 409 }
    );
  }

  if (!existingBucket) {
    const { error: createBucketError } = await storage.createBucket(bucket, {
      public: true,
      allowedMimeTypes: Object.keys(IMAGE_EXTENSIONS),
      fileSizeLimit: MAX_IMAGE_SIZE,
    });

    if (createBucketError) {
      console.error(`Could not create Supabase Storage bucket "${bucket}":`, createBucketError);
      return NextResponse.json(
        { error: `Could not create the Supabase Storage bucket "${bucket}": ${createBucketError.message}` },
        { status: 502 }
      );
    }
  }

  const uploaded = [];
  const failures = [];
  let thumbnailAssigned = false;
  for (const file of files) {
    let path;
    let imageRowCreated = false;
    try {
      const originalBuffer = Buffer.from(await file.arrayBuffer());
      const fileBuffer = await normalizeUploadedImage(originalBuffer, file.type);
      if (!fileBuffer || fileBuffer.length > MAX_IMAGE_SIZE) {
        failures.push({ name: file.name, error: "Invalid image or image is too large after processing." });
        continue;
      }

      path = `rooms/${room.id}/${randomUUID()}.webp`;
      const { error: uploadError } = await storage.from(bucket).upload(path, fileBuffer, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw new Error("Storage upload failed.");

      const { error: imageRowError } = await privilegedQuery("room_images")
        .insert({ room_id: room.id, img_path: path });
      if (imageRowError) throw new Error("Could not attach image to the room.");
      imageRowCreated = true;

      const setAsThumbnail = setFirstAsThumbnail && !thumbnailAssigned;
      if (setAsThumbnail) {
        const { error: thumbnailError } = await privilegedQuery("rooms")
          .update({ thumbnail: path, updated_at: new Date().toISOString() })
          .eq("id", room.id);
        if (thumbnailError) throw new Error("Could not set the room cover image.");
        thumbnailAssigned = true;
      }
      uploaded.push({ name: file.name, path, isThumbnail: setAsThumbnail });
    } catch (error) {
      if (imageRowCreated && path) await privilegedQuery("room_images").delete().eq("room_id", room.id).eq("img_path", path);
      if (path) await storage.from(bucket).remove([path]);
      failures.push({ name: file.name, error: error.message || "Upload failed." });
    }
  }

  if (!uploaded.length) {
    return NextResponse.json({ error: failures[0]?.error ?? "No images could be uploaded.", failures, totalCount: files.length }, { status: 422 });
  }

  return NextResponse.json({
    room: { id: room.id, name: room.name },
    uploadedCount: uploaded.length,
    totalCount: files.length,
    uploaded,
    failures,
  });
}

export async function DELETE(request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  }
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const roomId = params.get("roomId");
  const imagePath = params.get("path");
  if (!roomId || !/^\d+$/.test(roomId) || !imagePath) {
    return NextResponse.json({ error: "Choose a valid room image." }, { status: 400 });
  }

  const { data: room, error: roomError } = await privilegedQuery("rooms")
    .select("id, thumbnail")
    .eq("id", roomId)
    .maybeSingle();
  if (roomError) return NextResponse.json({ error: "Could not load the room." }, { status: 500 });
  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  const { data: image, error: imageError } = await privilegedQuery("room_images")
    .select("id, img_path")
    .eq("room_id", roomId)
    .eq("img_path", imagePath)
    .maybeSingle();
  if (imageError) return NextResponse.json({ error: "Could not load the room image." }, { status: 500 });
  if (!image && room.thumbnail !== imagePath) {
    return NextResponse.json({ error: "That image does not belong to this room." }, { status: 404 });
  }

  if (room.thumbnail === imagePath) {
    const { data: replacement } = await privilegedQuery("room_images")
      .select("img_path")
      .eq("room_id", roomId)
      .neq("img_path", imagePath)
      .order("id")
      .limit(1)
      .maybeSingle();
    const { error: thumbnailError } = await privilegedQuery("rooms")
      .update({ thumbnail: replacement?.img_path ?? "", updated_at: new Date().toISOString() })
      .eq("id", roomId);
    if (thumbnailError) {
      return NextResponse.json({ error: "Could not remove the room thumbnail." }, { status: 500 });
    }
  }

  if (image) {
    const { error: deleteImageError } = await privilegedQuery("room_images")
      .delete()
      .eq("id", image.id);
    if (deleteImageError) {
      return NextResponse.json({ error: "Could not remove the image from the room." }, { status: 500 });
    }
  }

  const bucket = getStorageBucketName();
  if (bucket) {
    const { error: storageError } = await (await privilegedStorage()).from(bucket).remove([imagePath]);
    if (storageError) {
      console.error(`Could not remove room image from bucket "${bucket}":`, storageError);
      return NextResponse.json(
        { deleted: true, warning: "The image was detached from the room but could not be deleted from storage." },
        { status: 200 }
      );
    }
  } else {
    return NextResponse.json(
      { deleted: true, warning: "The image was detached from the room, but no storage bucket is configured." },
      { status: 200 }
    );
  }

  return NextResponse.json({ deleted: true });
}


