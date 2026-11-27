import Link from "next/link";
import { auth } from "@/auth";
import { isAdminSession } from "@/app/_lib/admin";
import { privilegedQuery } from "@/app/_lib/supabase/supabaseRiskyClient";
import { notFound, redirect } from "next/navigation";
import styles from "./history.module.css";
import CustomSelect from "@/app/_ui/CustomSelect";

export const metadata = { title: "Stay history", robots: { index: false, follow: false } };
const pageSize = 25;
const statuses = ["confirmed", "finished", "cancelled", "canceled", "expired", "conflict_refund_required", "pending", "unconfirmed"];
const statusOptions = statuses.map((status) => ({ value: status, label: status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) }));

function accraToday() {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function searchUrl(params, page) {
  const query = new URLSearchParams();
  for (const key of ["q", "status", "from", "to"]) if (params[key]) query.set(key, params[key]);
  if (page > 1) query.set("page", String(page));
  const suffix = query.toString();
  return `/admin/history${suffix ? `?${suffix}` : ""}`;
}

export default async function AdminHistoryPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  if (!isAdminSession(session)) notFound();
  const raw = await searchParams;
  const params = {
    q: String(raw?.q ?? "").trim().slice(0, 100),
    status: statuses.includes(String(raw?.status)) ? String(raw.status) : "",
    from: /^\d{4}-\d{2}-\d{2}$/.test(String(raw?.from ?? "")) ? String(raw.from) : "",
    to: /^\d{4}-\d{2}-\d{2}$/.test(String(raw?.to ?? "")) ? String(raw.to) : "",
  };
  const requestedPage = Math.max(1, Number.parseInt(String(raw?.page ?? "1"), 10) || 1);
  const today = accraToday();
  let guestIds = null;
  let noGuestMatches = false;
  let guestSearchError = false;
  let guestSearchMessage = "";
  if (params.q && !/^\d+$/.test(params.q)) {
    const { data, error } = await privilegedQuery("guests").select("id").ilike("fullname", `%${params.q}%`).limit(300);
    if (error) {
      noGuestMatches = true;
      guestSearchError = true;
      guestSearchMessage = error.message ?? "Guest search failed.";
    }
    else {
      guestIds = (data ?? []).map((guest) => guest.id);
      noGuestMatches = guestIds.length === 0;
    }
  }

  let records = [];
  let total = 0;
  let loadError = false;
  let loadErrorCode = "";
  let loadErrorMessage = "";
  let legacySchema = false;
  if (!noGuestMatches) {
    const makeQuery = (withRoomUnits) => {
      let query = privilegedQuery("reservations")
        .select(withRoomUnits
          ? "id, guest_id, room_id, room_unit_id, start_date, end_date, reserved_price, status, checked_in_at, checked_out_at, created_at, guests(fullname, phone), rooms(name), room_units(room_number)"
          : "id, guest_id, room_id, start_date, end_date, reserved_price, status, created_at, guests(fullname, phone), rooms(name)", { count: "exact" })
        .is("deleted_at", null)
        .or(`end_date.lt.${today},status.eq.finished,status.eq.cancelled,status.eq.canceled,status.eq.expired,status.eq.conflict_refund_required`);
      if (params.q) {
        if (/^\d+$/.test(params.q)) query = query.or(guestIds?.length ? `id.eq.${params.q},guest_id.in.(${guestIds.join(",")})` : `id.eq.${params.q}`);
        else query = query.in("guest_id", guestIds);
      }
      if (params.status) query = query.eq("status", params.status);
      if (params.from) query = query.gte("end_date", params.from);
      if (params.to) query = query.lte("end_date", params.to);
      const offset = (requestedPage - 1) * pageSize;
      return query.order("end_date", { ascending: false }).order("id", { ascending: false }).range(offset, offset + pageSize - 1);
    };
    let result = await makeQuery(true);
    if (["42703", "42P01", "PGRST200", "PGRST204", "PGRST205"].includes(result.error?.code)) {
      legacySchema = true;
      result = await makeQuery(false);
    }
    const { data, count, error } = result;
    if (error) {
      loadError = true;
      loadErrorCode = error.code ?? "unknown";
      loadErrorMessage = error.message ?? "Stay query failed.";
    }
    records = data ?? [];
    total = count ?? 0;
  }
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const dateTime = new Intl.DateTimeFormat("en-GH", { timeZone: "Africa/Accra", dateStyle: "medium" });

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>Guest operations</p><h1>Stay history</h1><p>Search past stays and review their reservation, payment, and room details.</p></div>
      <span className={styles.headerStat}><strong>{total.toLocaleString()}</strong> matching stays</span>
    </header>

    <form className={styles.filters} method="get">
      <label>Guest or reservation<input name="q" defaultValue={params.q} placeholder="Name or reservation number" /></label>
      <label id="history-status-label">Stay status<CustomSelect name="status" defaultValue={statusOptions.find((option) => option.value === params.status) ?? null} options={statusOptions} ariaLabelledBy="history-status-label" placeholder="All statuses" isClearable /></label>
      <label>Checkout from<input type="date" name="from" defaultValue={params.from} /></label>
      <label>Checkout to<input type="date" name="to" defaultValue={params.to} /></label>
      <button type="submit">Apply filters</button>
      <Link href="/admin/history">Clear</Link>
    </form>

    {loadError || guestSearchError ? <p role="alert" className={styles.error}>Could not load stay history{loadErrorCode ? ` (database error ${loadErrorCode})` : ""}: {loadErrorMessage || guestSearchMessage}</p> : records.length ? <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Guest</th><th>Room</th><th>Stay dates</th><th>Checked out</th><th>Reservation</th><th></th></tr></thead>
          <tbody>{records.map((stay) => <tr key={stay.id}>
            <td><strong>{stay.guests?.fullname ?? "Guest"}</strong><small>{stay.guests?.phone ?? "No phone on file"}</small></td>
            <td>{stay.rooms?.name ?? "Room type"}<small>{stay.room_units?.room_number ? `Room ${stay.room_units.room_number}` : "Room not assigned"}</small></td>
            <td>{dateTime.format(new Date(`${stay.start_date}T12:00:00Z`))}<small>to {dateTime.format(new Date(`${stay.end_date}T12:00:00Z`))}</small></td>
            <td>{stay.checked_out_at ? new Intl.DateTimeFormat("en-GH", { timeZone: "Africa/Accra", dateStyle: "medium", timeStyle: "short" }).format(new Date(stay.checked_out_at)) : "—"}</td>
            <td><span className={`${styles.status} ${styles[`status_${stay.status}`] ?? ""}`}>{stay.status.replaceAll("_", " ")}</span></td>
            <td><Link className={styles.detailLink} href={`/admin/history/${stay.id}`}>View details <span aria-hidden="true">→</span></Link></td>
          </tr>)}</tbody>
        </table>
      </div>
      <nav className={styles.pagination} aria-label="Stay history pages">
        <span>Page {Math.min(requestedPage, totalPages)} of {totalPages}</span>
        <div>{currentPage > 1 && <Link href={searchUrl(params, currentPage - 1)}>Previous</Link>}{currentPage < totalPages && <Link href={searchUrl(params, currentPage + 1)}>Next</Link>}</div>
      </nav>
    </> : <div className={styles.empty}><span aria-hidden="true">✓</span><h2>No stays found</h2><p>Try a different guest name, status, or checkout date range.</p></div>}
  </main>;
}
