import Link from "next/link";
import { auth } from "@/auth";
import { isAdminSession } from "@/app/_lib/admin";
import { privilegedQuery } from "@/app/_lib/supabase/supabaseRiskyClient";
import { notFound, redirect } from "next/navigation";
import styles from "../history.module.css";
import DownloadStayPdf from "../download-stay-pdf";

export const metadata = { title: "Stay details", robots: { index: false, follow: false } };
const schemaMismatchCodes = ["42703", "42P01", "PGRST200", "PGRST204", "PGRST205"];

export default async function AdminStayHistoryDetail({ params }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  if (!isAdminSession(session)) notFound();
  const { id } = await params;
  if (!/^\d+$/.test(String(id))) notFound();

  let { data: stay, error } = await privilegedQuery("reservations")
    .select("id, start_date, end_date, reserved_price, status, guests_count, message, created_at, checked_in_at, checked_out_at, guests(fullname, phone, email), rooms(name), room_units(room_number), room_service_orders(id, status, payment_status, payment_method, total_ghs, guest_note, created_at, paid_at, room_service_order_items(product_name, quantity, unit_price_ghs, line_total_ghs))")
    .eq("id", id).is("deleted_at", null).maybeSingle();
  let legacySchema = false;
  if (schemaMismatchCodes.includes(error?.code)) {
    legacySchema = true;
    ({ data: stay, error } = await privilegedQuery("reservations")
      .select("id, start_date, end_date, reserved_price, status, guests_count, message, created_at, guests(fullname, phone, email), rooms(name)")
      .eq("id", id).is("deleted_at", null).maybeSingle());
  }
  if (!stay && !error) notFound();

  let transactions = null;
  let transactionError = null;
  if (stay && !legacySchema) {
    ({ data: transactions, error: transactionError } = await privilegedQuery("reservations")
      .select("reservation_transactions(id, provider, provider_reference, transaction_type, amount_minor, currency, method, status, recorded_by, verified_at, paid_at, created_at)")
      .eq("id", id).maybeSingle());
    if (schemaMismatchCodes.includes(transactionError?.code)) {
      legacySchema = true;
      transactionError = null;
      ({ data: stay, error } = await privilegedQuery("reservations")
        .select("id, start_date, end_date, reserved_price, status, guests_count, message, created_at, guests(fullname, phone, email), rooms(name)")
        .eq("id", id).is("deleted_at", null).maybeSingle());
    }
  }
  const recordTransactions = transactions?.reservation_transactions ?? [];
  const orders = stay?.room_service_orders ?? [];
  const dateTime = new Intl.DateTimeFormat("en-GH", { timeZone: "Africa/Accra", dateStyle: "medium", timeStyle: "short" });
  const dateOnly = new Intl.DateTimeFormat("en-GH", { timeZone: "Africa/Accra", dateStyle: "medium" });
  const roomServiceTotal = orders.reduce((sum, order) => sum + Number(order.total_ghs ?? 0), 0);
  const reservationCurrency = recordTransactions.find((transaction) => transaction.transaction_type === "charge")?.currency;

  return <main className={styles.page}>
    <Link className={styles.backLink} href="/admin/history">← Back to stay history</Link>
    {error ? <p role="alert" className={styles.error}>Could not load this stay{error.code ? ` (database error ${error.code})` : ""}: {error.message ?? "Stay query failed."}</p> : <>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Reservation #{stay.id}</p><h1>{stay.guests?.fullname ?? "Guest stay"}</h1><p>{stay.rooms?.name ?? "Room type"}{stay.room_units?.room_number ? ` · Room ${stay.room_units.room_number}` : ""} · {dateOnly.format(new Date(`${stay.start_date}T12:00:00Z`))} – {dateOnly.format(new Date(`${stay.end_date}T12:00:00Z`))}</p></div>
        <div className={styles.headerActions}>
          <span className={`${styles.status} ${styles[`status_${stay.status}`] ?? ""}`}>{stay.status.replaceAll("_", " ")}</span>
          <DownloadStayPdf stay={{ id: stay.id, start_date: stay.start_date, end_date: stay.end_date, reserved_price: stay.reserved_price, status: stay.status, guests_count: stay.guests_count, created_at: stay.created_at, checked_in_at: stay.checked_in_at, checked_out_at: stay.checked_out_at, guests: stay.guests, rooms: stay.rooms, room_units: stay.room_units }} transactions={recordTransactions} orders={orders} reservationCurrency={reservationCurrency} />
        </div>
      </header>

      <div className={styles.detailGrid}>
        <section className={styles.detailCard}><p className={styles.eyebrow}>Guest &amp; reservation</p><h2>Stay information</h2>
          <dl><dt>Guest</dt><dd>{stay.guests?.fullname ?? "Guest"}</dd><dt>Phone</dt><dd>{stay.guests?.phone ?? "—"}</dd><dt>Email</dt><dd>{stay.guests?.email ?? "—"}</dd><dt>Guests</dt><dd>{stay.guests_count}</dd><dt>Booked</dt><dd>{dateTime.format(new Date(stay.created_at))}</dd><dt>Reserved total</dt><dd>{reservationCurrency ? `${reservationCurrency} ` : ""}{Number(stay.reserved_price).toFixed(2)}{!reservationCurrency && <small className={styles.muted}>Currency not recorded</small>}</dd></dl>
          {stay.message && <p className={styles.guestNote}><strong>Guest note</strong>{stay.message}</p>}
        </section>
        <section className={styles.detailCard}><p className={styles.eyebrow}>Front desk</p><h2>Stay timeline</h2>
          <dl><dt>Check-in date</dt><dd>{dateOnly.format(new Date(`${stay.start_date}T12:00:00Z`))}</dd><dt>Checked in</dt><dd>{stay.checked_in_at ? dateTime.format(new Date(stay.checked_in_at)) : "Not recorded"}</dd><dt>Check-out date</dt><dd>{dateOnly.format(new Date(`${stay.end_date}T12:00:00Z`))}</dd><dt>Checked out</dt><dd>{stay.checked_out_at ? dateTime.format(new Date(stay.checked_out_at)) : "Not recorded"}</dd></dl>
        </section>
      </div>

      <section className={styles.detailCard}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Payment records</p><h2>Transactions</h2></div><span>{recordTransactions.length} record(s)</span></div>
        {transactionError ? <p className={styles.inlineError}>Payment records could not be loaded.</p> : recordTransactions.length ? <div className={styles.transactionList}>{recordTransactions.map((transaction) => <article key={transaction.id}>
          <div><strong>{transaction.transaction_type.replaceAll("_", " ")} · {transaction.provider}</strong><small>{dateTime.format(new Date(transaction.created_at))}{transaction.recorded_by ? ` · Recorded by ${transaction.recorded_by}` : ""}</small></div>
          <div className={styles.transactionAmount}>{transaction.currency} {(Number(transaction.amount_minor) / 100).toFixed(2)}<small>{transaction.status.replaceAll("_", " ")}</small></div>
          {transaction.method && <span>Method: {transaction.method}</span>}{transaction.provider_reference && <span>Reference: {transaction.provider_reference}</span>}
        </article>)}</div> : <p className={styles.muted}>{legacySchema ? "Detailed payment transactions are not available in this database schema." : "No transaction records are attached to this stay."}</p>}
      </section>

      <section className={styles.detailCard}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>In-stay charges</p><h2>Room-service folio</h2></div><strong className={styles.folioTotal}>GHS {roomServiceTotal.toFixed(2)}</strong></div>
        {orders.length ? <div className={styles.orderList}>{orders.map((order) => <article key={order.id}>
          <div className={styles.orderHeader}><strong>Order #{order.id}</strong><span>{order.status.replaceAll("_", " ")} · {order.payment_status}</span></div>
          <small>Placed {dateTime.format(new Date(order.created_at))}{order.paid_at ? ` · Paid ${dateTime.format(new Date(order.paid_at))}` : ""}{order.payment_method ? ` · ${order.payment_method}` : ""}</small>
          <ul>{(order.room_service_order_items ?? []).map((item, index) => <li key={`${item.product_name}-${index}`}><span>{item.quantity} × {item.product_name}</span><span>GHS {Number(item.line_total_ghs).toFixed(2)}</span></li>)}</ul>
          {order.guest_note && <p className={styles.muted}>Guest note: {order.guest_note}</p>}
          <strong className={styles.orderTotal}>Order total · GHS {Number(order.total_ghs).toFixed(2)}</strong>
        </article>)}</div> : <p className={styles.muted}>{legacySchema ? "Room-service records are not available in this database schema." : "No room-service orders for this stay."}</p>}
      </section>
    </>}
  </main>;
}
