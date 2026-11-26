"use server";

import { auth } from "@/auth";
import { isAdminSession } from "@/app/_lib/admin";
import { privilegedQuery } from "@/app/_lib/supabase/supabaseRiskyClient";
import { revalidatePath } from "next/cache";

export async function updateContactStatus(formData) {
  const session = await auth();
  if (!isAdminSession(session)) throw new Error("Admin access required.");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!/^\d+$/.test(id) || !["new", "in_progress", "resolved"].includes(status)) {
    throw new Error("Invalid contact message update.");
  }
  const { error } = await privilegedQuery("inbox").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error("Could not update the enquiry.");
  revalidatePath("/admin/inbox");
}
