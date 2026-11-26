import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStorageBucketName, isAdminSession } from "@/app/_lib/admin";
import { normalizeUploadedImage } from "@/app/_lib/imageValidation";
import { privilegedQuery, privilegedStorage } from "@/app/_lib/supabase/supabaseRiskyClient";

export const runtime = "nodejs";
const maxSize = 8 * 1024 * 1024;
const types = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

async function authorize(request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  return null;
}

function publicUrl(storage, bucket, imagePath) {
  return storage.from(bucket).getPublicUrl(imagePath).data.publicUrl;
}

export async function POST(request) {
  const denied = await authorize(request);
  if (denied) return denied;
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxSize + 128 * 1024) {
    return NextResponse.json({ error: "Choose an image up to 8 MB." }, { status: 413 });
  }

  let form;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Could not read the uploaded image." }, { status: 400 }); }
  const title = String(form.get("title") ?? "").trim();
  const altText = String(form.get("alt_text") ?? "").trim();
  const file = form.get("image");
  if (title.length > 120 || !altText || altText.length > 180) {
    return NextResponse.json({ error: "Add a short title and descriptive alt text (up to 180 characters)." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size < 1 || file.size > maxSize || !types.has(file.type)) {
    return NextResponse.json({ error: "Choose one JPEG, PNG, WebP, or AVIF image up to 8 MB." }, { status: 400 });
  }

  const bucket = getStorageBucketName();
  if (!bucket) return NextResponse.json({ error: "Configure the hotel image storage bucket first." }, { status: 503 });
  const storage = await privilegedStorage();
  const { data: buckets, error: bucketError } = await storage.listBuckets();
  if (bucketError) return NextResponse.json({ error: "Could not access image storage." }, { status: 502 });
  const existing = buckets.find((item) => item.id === bucket);
  if (existing && !existing.public) return NextResponse.json({ error: "The configured image bucket must be public to display gallery images." }, { status: 409 });
  if (!existing) {
    const { error } = await storage.createBucket(bucket, { public: true, allowedMimeTypes: [...types], fileSizeLimit: maxSize });
    if (error) return NextResponse.json({ error: "Could not prepare image storage." }, { status: 502 });
  }

  const normalized = await normalizeUploadedImage(Buffer.from(await file.arrayBuffer()), file.type);
  if (!normalized || normalized.length > maxSize) return NextResponse.json({ error: "That file is not a valid image." }, { status: 415 });
  const imagePath = `property-gallery/${randomUUID()}.webp`;
  const { error: uploadError } = await storage.from(bucket).upload(imagePath, normalized, { contentType: "image/webp", cacheControl: "3600", upsert: false });
  if (uploadError) return NextResponse.json({ error: "Could not upload the gallery image." }, { status: 502 });

  const { data: lastItem } = await privilegedQuery("gallery_images").select("display_order").order("display_order", { ascending: false }).limit(1).maybeSingle();
  const { data: image, error } = await privilegedQuery("gallery_images")
    .insert({ image_path: imagePath, title, alt_text: altText, display_order: Number(lastItem?.display_order ?? -1) + 1 })
    .select("id, image_path, title, alt_text, display_order, is_published, created_at")
    .single();
  if (error) {
    await storage.from(bucket).remove([imagePath]);
    console.error("Could not save property gallery image:", error.code ?? "unknown");
    return NextResponse.json({ error: "Could not save the gallery image. Apply the property gallery migration." }, { status: 500 });
  }
  return NextResponse.json({ image: { ...image, imageUrl: publicUrl(storage, bucket, imagePath) } }, { status: 201 });
}

export async function PATCH(request) {
  const denied = await authorize(request);
  if (denied) return denied;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid update." }, { status: 400 }); }
  const id = String(body?.id ?? "");
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Choose a valid gallery image." }, { status: 400 });

  const changes = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (title.length > 120) return NextResponse.json({ error: "Titles must be 120 characters or fewer." }, { status: 400 });
    changes.title = title;
  }
  if (body.alt_text !== undefined) {
    const altText = typeof body.alt_text === "string" ? body.alt_text.trim() : "";
    if (!altText || altText.length > 180) return NextResponse.json({ error: "Alt text must be 1 to 180 characters." }, { status: 400 });
    changes.alt_text = altText;
  }
  if (body.display_order !== undefined) {
    const order = Number(body.display_order);
    if (!Number.isInteger(order) || order < 0 || order > 10000) return NextResponse.json({ error: "Choose a valid display position." }, { status: 400 });
    changes.display_order = order;
  }
  if (body.is_published !== undefined) {
    if (typeof body.is_published !== "boolean") return NextResponse.json({ error: "Choose whether this image is published." }, { status: 400 });
    changes.is_published = body.is_published;
  }
  const { data, error } = await privilegedQuery("gallery_images").update(changes).eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not update this gallery image." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Gallery image not found." }, { status: 404 });
  return NextResponse.json({ updated: true });
}

export async function DELETE(request) {
  const denied = await authorize(request);
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^\d+$/.test(id)) return NextResponse.json({ error: "Choose a valid gallery image." }, { status: 400 });
  const { data: image, error: loadError } = await privilegedQuery("gallery_images").select("image_path").eq("id", id).maybeSingle();
  if (loadError) return NextResponse.json({ error: "Could not load the gallery image." }, { status: 500 });
  if (!image) return NextResponse.json({ error: "Gallery image not found." }, { status: 404 });
  const { error } = await privilegedQuery("gallery_images").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Could not remove this gallery image." }, { status: 500 });
  const bucket = getStorageBucketName();
  let cleanupWarning = false;
  if (bucket) {
    const { error: cleanupError } = await (await privilegedStorage()).from(bucket).remove([image.image_path]);
    cleanupWarning = Boolean(cleanupError);
  } else cleanupWarning = true;
  return NextResponse.json({ deleted: true, cleanupWarning });
}
