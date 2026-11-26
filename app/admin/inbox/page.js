import { auth } from "@/auth";
import { isAdminSession } from "@/app/_lib/admin";
import { privilegedQuery } from "@/app/_lib/supabase/supabaseRiskyClient";
import { notFound, redirect } from "next/navigation";
import { updateContactStatus } from "./actions";
import styles from "./styles.module.css";
import CustomSelect from "@/app/_ui/CustomSelect";

export const metadata = { title: "Guest enquiries", robots: { index: false, follow: false } };

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  if (!isAdminSession(session)) notFound();
  const { data: messages, error } = await privilegedQuery("inbox")
    .select("id, fullname, email, phone, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return <main className={styles.page}>
    <header><p>Hotel administration</p><h1>Guest enquiries</h1><span>Latest 100 messages</span></header>
    {error && <p role="alert">Could not load enquiries. Please try again later.</p>}
    {!error && !messages?.length && <p>No enquiries have arrived yet.</p>}
    <div className={styles.list}>{(messages ?? []).map((item) => <article key={item.id} className={styles.card}>
      <div className={styles.top}><h2>{item.fullname}</h2><span>{item.status.replace("_", " ")}</span></div>
      <p><a href={`mailto:${encodeURIComponent(item.email)}`}>{item.email}</a>{item.phone && <> · <a href={`tel:${encodeURIComponent(item.phone)}`}>{item.phone}</a></>}</p>
      <p className={styles.message}>{item.message}</p>
      <small>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</small>
      <form action={updateContactStatus} className={styles.update}>
        <input type="hidden" name="id" value={item.id} />
        <label id={`inbox-status-${item.id}`}>Status <CustomSelect name="status" defaultValue={{ value: item.status, label: { new: "New", in_progress: "In progress", resolved: "Resolved" }[item.status] }} options={[{ value: "new", label: "New" }, { value: "in_progress", label: "In progress" }, { value: "resolved", label: "Resolved" }]} ariaLabel={`Status for ${item.fullname}`} /></label>
        <button type="submit">Save</button>
      </form>
    </article>)}</div>
  </main>;
}
