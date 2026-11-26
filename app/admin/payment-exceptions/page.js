import { auth } from "@/auth";
import { isAdminSession } from "@/app/_lib/admin";
import { privilegedQuery } from "@/app/_lib/supabase/supabaseRiskyClient";
import { notFound, redirect } from "next/navigation";
import { updatePaymentException } from "./actions";
import styles from "./styles.module.css";
import CustomSelect from "@/app/_ui/CustomSelect";

export const metadata = { title: "Payment exceptions", robots: { index: false, follow: false } };

export default async function PaymentExceptionsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  if (!isAdminSession(session)) notFound();
  const { data: exceptions, error } = await privilegedQuery("payment_exceptions")
    .select("id, payment_reference, reservation_id, paid_amount_minor, currency, reason, status, resolution_note, provider_refund_reference, created_at, resolved_by, resolved_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const openCount = (exceptions ?? []).filter((item) => item.status === "open" || item.status === "refund_initiated").length;

  return <main className={styles.page}>
    <header><p>Hotel administration</p><h1>Payment exceptions</h1><p>Payments that need staff review because the room hold could not be confirmed.</p></header>
    {!error && <p className={styles.count} role="status">{openCount} open item(s) · latest 100 payment records</p>}
    {error && <p role="alert">Could not load payment exceptions. Check that the latest Supabase migrations are applied.</p>}
    {!error && !exceptions?.length && <p>No payment exceptions are waiting for review.</p>}
    <div className={styles.list}>{(exceptions ?? []).map((item) => <article key={item.id} className={styles.card}>
      <div className={styles.heading}><h2>Payment {item.payment_reference}</h2><span>{item.status.replaceAll("_", " ")}</span></div>
      <p><strong>{item.currency} {(Number(item.paid_amount_minor ?? 0) / 100).toFixed(2)}</strong> · Reservation #{item.reservation_id ?? "unavailable"}</p>
      <p>{item.reason}</p>
      <small>Received {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</small>
      {item.resolution_note && <p className={styles.note}><strong>Staff note:</strong> {item.resolution_note}</p>}
      {item.provider_refund_reference && <p><strong>Provider refund reference:</strong> {item.provider_refund_reference}</p>}
      {item.resolved_at && <small>Updated by {item.resolved_by ?? "staff"} · {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.resolved_at))}</small>}
      <form action={updatePaymentException} className={styles.form}>
        <input type="hidden" name="id" value={item.id} />
        <label>Queue status<CustomSelect name="status" defaultValue={{ value: item.status, label: { open: "Needs review", refund_initiated: "Refund initiated", refunded: "Refund completed", closed: "Closed, no refund" }[item.status] }} options={[{ value: "open", label: "Needs review" }, { value: "refund_initiated", label: "Refund initiated" }, { value: "refunded", label: "Refund completed" }, { value: "closed", label: "Closed, no refund" }]} ariaLabel={`Queue status for payment ${item.payment_reference}`} /></label>
        <label>Staff note<textarea name="resolution_note" maxLength={500} defaultValue={item.resolution_note} placeholder="Record what was checked or the refund outcome" /></label>
        <label>Paystack refund reference<input name="provider_refund_reference" maxLength={120} defaultValue={item.provider_refund_reference ?? ""} /></label>
        <button type="submit">Save update</button>
      </form>
    </article>)}</div>
  </main>;
}
