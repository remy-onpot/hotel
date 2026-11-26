import { auth } from "@/auth";
import { isAdminSession } from "@/app/_lib/admin";
import { privilegedQuery } from "@/app/_lib/supabase/supabaseRiskyClient";
import { notFound, redirect } from "next/navigation";
import { updatePaymentException } from "./actions";
import styles from "./styles.module.css";
import CustomSelect from "@/app/_ui/CustomSelect";

export const metadata = { title: "Payment exceptions", robots: { index: false, follow: false } };

const statusOptions = [
  { value: "open", label: "Needs review" },
  { value: "refund_initiated", label: "Refund initiated" },
  { value: "refunded", label: "Refund completed" },
  { value: "closed", label: "Closed, no refund" },
];
const dateTime = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export default async function PaymentExceptionsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  if (!isAdminSession(session)) notFound();
  const { data: exceptions, error } = await privilegedQuery("payment_exceptions")
    .select("id, payment_reference, reservation_id, paid_amount_minor, currency, reason, status, resolution_note, provider_refund_reference, created_at, resolved_by, resolved_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const records = exceptions ?? [];
  const openCount = records.filter((item) => item.status === "open").length;
  const refundCount = records.filter((item) => item.status === "refund_initiated").length;
  const closedCount = records.filter((item) => ["refunded", "closed"].includes(item.status)).length;

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>Finance &amp; follow-up</p><h1>Payment exceptions</h1><p>Review payments that could not be matched to a confirmed room hold, and record the resolution.</p></div>
      <span className={styles.headerStat}>Latest <strong>{records.length}</strong> records</span>
    </header>
    {!error && <div className={styles.metrics} aria-label="Payment exception summary">
      <article><span>Needs review</span><strong>{openCount}</strong><small>Staff follow-up required</small></article>
      <article><span>Refund initiated</span><strong>{refundCount}</strong><small>Waiting for provider completion</small></article>
      <article><span>Resolved</span><strong>{closedCount}</strong><small>Refunded or closed</small></article>
    </div>}
    {error && <p className={styles.error} role="alert">Could not load payment exceptions. Check that the latest Supabase migrations are applied.</p>}
    {!error && !records.length && <div className={styles.empty}><span aria-hidden="true">✓</span><h2>No payment exceptions</h2><p>Payments that need manual review will appear here.</p></div>}
    <div className={styles.list}>{records.map((item) => {
      const statusLabel = statusOptions.find((option) => option.value === item.status)?.label ?? item.status.replaceAll("_", " ");
      const amount = (Number(item.paid_amount_minor ?? 0) / 100).toFixed(2);
      return <article key={item.id} className={styles.card}>
        <div className={styles.cardHeader}><div><p className={styles.cardEyebrow}>Payment reference</p><h2>{item.payment_reference}</h2></div><span className={`${styles.status} ${styles[`status_${item.status}`] ?? ""}`}>{statusLabel}</span></div>
        <div className={styles.paymentSummary}><strong>{item.currency} {amount}</strong><span>Reservation #{item.reservation_id ?? "unavailable"}</span></div>
        <p className={styles.reason}>{item.reason}</p>
        <small className={styles.timestamp}>Received {dateTime.format(new Date(item.created_at))}</small>
        {item.resolution_note && <p className={styles.note}><strong>Staff note</strong>{item.resolution_note}</p>}
        {item.provider_refund_reference && <p className={styles.providerReference}><strong>Provider refund reference</strong>{item.provider_refund_reference}</p>}
        {item.resolved_at && <small className={styles.timestamp}>Updated by {item.resolved_by ?? "staff"} · {dateTime.format(new Date(item.resolved_at))}</small>}
        <form action={updatePaymentException} className={styles.form}>
          <input type="hidden" name="id" value={item.id} />
          <label>Queue status<CustomSelect name="status" defaultValue={{ value: item.status, label: statusLabel }} options={statusOptions} ariaLabel={`Queue status for payment ${item.payment_reference}`} /></label>
          <label className={styles.wideField}>Staff note<textarea name="resolution_note" maxLength={500} defaultValue={item.resolution_note} placeholder="Record what was checked or the refund outcome" /></label>
          <label className={styles.wideField}>Paystack refund reference<input name="provider_refund_reference" maxLength={120} defaultValue={item.provider_refund_reference ?? ""} placeholder="Optional provider reference" /></label>
          <button type="submit">Save resolution</button>
        </form>
      </article>;
    })}</div>
  </main>;
}
