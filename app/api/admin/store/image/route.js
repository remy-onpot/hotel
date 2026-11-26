import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStorageBucketName, isAdminSession } from "@/app/_lib/admin";
import { normalizeUploadedImage } from "@/app/_lib/imageValidation";
import { privilegedQuery, privilegedStorage } from "@/app/_lib/supabase/supabaseRiskyClient";

export const runtime = "nodejs";
const maxSize = 8 * 1024 * 1024;
const types = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxSize + 128 * 1024) return NextResponse.json({ error: "Choose an image up to 8 MB." }, { status: 413 });

  let form;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Could not read the uploaded image." }, { status: 400 }); }
  const productId = String(form.get("productId") ?? "");
  const file = form.get("image");
  if (!/^\d+$/.test(productId) || !(file instanceof File) || file.size < 1 || file.size > maxSize || !types.has(file.type)) {
    return NextResponse.json({ error: "Choose one JPEG, PNG, WebP, or AVIF image up to 8 MB." }, { status: 400 });
  }
  const { data: product, error: productError } = await privilegedQuery("room_service_products").select("id,image_path").eq("id", productId).maybeSingle();
  if (productError || !product) return NextResponse.json({ error: "Store item not found." }, { status: 404 });
  const bucket = getStorageBucketName();
  if (!bucket) return NextResponse.json({ error: "Configure the hotel image storage bucket first." }, { status: 503 });
  const storage = await privilegedStorage();
  const { data: buckets, error: bucketError } = await storage.listBuckets();
  if (bucketError) return NextResponse.json({ error: "Could not access image storage." }, { status: 502 });
  const existing = buckets.find((item) => item.id === bucket);
  if (existing && !existing.public) return NextResponse.json({ error: "The configured image bucket must be public to display menu images." }, { status: 409 });
  if (!existing) {
    const { error } = await storage.createBucket(bucket, { public: true, allowedMimeTypes: [...types], fileSizeLimit: maxSize });
    if (error) return NextResponse.json({ error: "Could not prepare image storage." }, { status: 502 });
  }
  const normalized = await normalizeUploadedImage(Buffer.from(await file.arrayBuffer()), file.type);
  if (!normalized || normalized.length > maxSize) return NextResponse.json({ error: "That file is not a valid image." }, { status: 415 });
  const path = `room-service/products/${productId}/${randomUUID()}.webp`;
  const { error: uploadError } = await storage.from(bucket).upload(path, normalized, { contentType: "image/webp", cacheControl: "3600", upsert: false });
  if (uploadError) return NextResponse.json({ error: "Could not upload the item image." }, { status: 502 });
  const { error: updateError } = await privilegedQuery("room_service_products").update({ image_path: path, updated_at: new Date().toISOString() }).eq("id", productId);
  if (updateError) {
    await storage.from(bucket).remove([path]);
    return NextResponse.json({ error: "Could not attach the image to the item." }, { status: 500 });
  }
  if (product.image_path) await storage.from(bucket).remove([product.image_path]);
  const imageUrl = storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ image_path: path, imageUrl });
}
