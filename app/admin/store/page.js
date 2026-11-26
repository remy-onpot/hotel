import { auth } from "@/auth";
import { isAdminSession } from "@/app/_lib/admin";
import { privilegedQuery } from "@/app/_lib/supabase/supabaseRiskyClient";
import { getStorageBucketName } from "@/app/_lib/admin";
import { privilegedStorage } from "@/app/_lib/supabase/supabaseRiskyClient";
import { notFound, redirect } from "next/navigation";
import StoreManager from "./store-manager";
import styles from "./store.module.css";
export const metadata = { title: "Room service store", robots: { index: false, follow: false } };
export default async function StorePage() { const session = await auth(); if (!session?.user?.email) redirect("/signin"); if (!isAdminSession(session)) notFound(); const { data, error } = await privilegedQuery("room_service_products").select("*").order("name"); const bucket = getStorageBucketName(); const storage = bucket ? await privilegedStorage() : null; const products = (data ?? []).map((item) => ({ ...item, imageUrl: bucket && item.image_path ? storage.from(bucket).getPublicUrl(item.image_path).data.publicUrl : "" })); return <main className={styles.page}><header className={styles.header}><p className={styles.eyebrow}>Guest experience</p><h1>Room service menu</h1><p>Manage the items, photography, and prices guests see after scanning their room QR.</p></header>{error ? <p role="alert">Could not load store items. Apply the room service migrations.</p> : <StoreManager products={products} imageStorageReady={Boolean(bucket)} />}</main>; }
