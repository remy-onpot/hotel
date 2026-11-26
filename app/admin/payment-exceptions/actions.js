"use server";

import { auth } from "@/auth";
import { isAdminSession } from "@/app/_lib/admin";
import { privilegedQuery } from "@/app/_lib/supabase/supabaseRiskyClient";
import { revalidatePath } from "next/cache";

export async function updatePaymentException(formData) {
  const session = await auth();
  if (!isAdminSession(session)) throw new Error("Admin access required.");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("resolution_note") ?? "").trim().slice(0, 500);
  const providerReference = String(formData.get("provider_refund_reference") ?? "").trim().slice(0, 120);
  if (!/^\d+$/.test(id) || !["open", "refund_initiated", "refunded", "closed"].includes(status)) {
    throw new Error("Invalid payment exception update.");
  }
  if (["refund_initiated", "refunded", "closed"].includes(status) && !note) {
    throw new Error("Add a note describing the payment follow-up before saving this status.");
  }
  const { error } = await privilegedQuery("payment_exceptions").update({
    status,
    resolution_note: note,
    provider_refund_reference: providerReference || null,
    resolved_by: session.user.email,
    resolved_at: status === "open" || status === "refund_initiated" ? null : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw new Error("Could not update the payment exception.");
  revalidatePath("/admin/payment-exceptions");
}
