import { auth } from "@/auth";
import { isAdminSession } from "@/app/_lib/admin";
import { privilegedQuery } from "@/app/_lib/supabase/supabaseRiskyClient";
import { notFound, redirect } from "next/navigation";
import { updateContactStatus } from "./actions";
import styles from "./styles.module.css";
import CustomSelect from "@/app/_ui/CustomSelect";

export const metadata = { title: "Guest enquiries", robots: { index: false, follow: false } };

const statusOptions = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  if (!isAdminSession(session)) notFound();
  const { data: messages, error } = await privilegedQuery("inbox")
    .select("id, fullname, email, phone, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const enquiries = messages ?? [];
  const newCount = enquiries.filter((item) => item.status === "new").length;
  const activeCount = enquiries.filter((item) => item.status === "in_progress").length;
  const resolvedCount = enquiries.filter((item) => item.status === "resolved").length;

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>Guest relations</p><h1>Guest enquiries</h1><p>Keep every guest conversation moving with a timely, thoughtful response.</p></div>
      <span className={styles.headerStat}>Latest <strong>{enquiries.length}</strong> messages</span>
    </header>
    {!error && <div className={styles.metrics} aria-label="Enquiry summary">
      <article><span>New enquiries</span><strong>{newCount}</strong><small>Awaiting a first response</small></article>
      <article><span>In progress</span><strong>{activeCount}</strong><small>Being handled by the team</small></article>
      <article><span>Resolved</span><strong>{resolvedCount}</strong><small>Marked complete</small></article>
    </div>}
    {error && <p className={styles.error} role="alert">Could not load enquiries. Please try again later.</p>}
    {!error && !enquiries.length && <div className={styles.empty}><span aria-hidden="true">✉</span><h2>No enquiries yet</h2><p>New guest messages will appear here.</p></div>}
    <div className={styles.list}>{enquiries.map((item) => <article key={item.id} className={styles.card}>
      <div className={styles.top}><div><p className={styles.cardEyebrow}>Guest message</p><h2>{item.fullname}</h2></div><span className={`${styles.status} ${styles[`status_${item.status}`] ?? ""}`}>{item.status.replace("_", " ")}</span></div>
      <div className={styles.contact}><a href={`mailto:${encodeURIComponent(item.email)}`}>{item.email}</a>{item.phone && <a href={`tel:${encodeURIComponent(item.phone)}`}>{item.phone}</a>}</div>
      <p className={styles.message}>{item.message}</p>
      <small className={styles.timestamp}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</small>
      <form action={updateContactStatus} className={styles.update}>
        <input type="hidden" name="id" value={item.id} />
        <label>Status<CustomSelect name="status" defaultValue={{ value: item.status, label: statusOptions.find((option) => option.value === item.status)?.label ?? item.status }} options={statusOptions} ariaLabel={`Status for ${item.fullname}`} /></label>
        <button type="submit">Update status</button>
      </form>
    </article>)}</div>
  </main>;
}
