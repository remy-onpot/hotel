"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { bookingTotalPrice } from "@/app/utils/reservationsCalcs";
import { lookupWalkInGuest, createWalkInReservation, checkoutStay, checkInExistingStay } from "./actions";
import styles from "./styles.module.css";
import CustomSelect from "@/app/_ui/CustomSelect";
import { formatMoney, formatRoomPrice } from "@/app/_lib/money";

const initial = {};
function csvEscape(value) { const text = String(value ?? ""); const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text; return `"${safe.replace(/"/g, '""')}"`; }

function CheckoutButton({ stay, amount }) {
  const [state, action, busy] = useActionState(checkoutStay, {});
  return <form action={action} style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <input type="hidden" name="reservation_id" value={stay.id} />
    <select name="payment_method" aria-label={`Room service payment method for reservation ${stay.id}`} defaultValue="cash"><option value="cash">Cash</option><option value="momo_transfer">MoMo</option><option value="pos_card">POS</option></select>
    <button type="submit" disabled={busy}>Check out{amount > 0 ? ` · GHS ${amount.toFixed(2)}` : ""}</button>
    {state.error && <span role="alert">{state.error}</span>}{state.success && <span role="status">{state.success}</span>}
  </form>;
}

function CheckInButton({ stay }) {
  const [state, action, busy] = useActionState(checkInExistingStay, {});
  return <form action={action} style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <input type="hidden" name="reservation_id" value={stay.id} />
    <select name="room_unit_id" required defaultValue=""><option value="" disabled>Assign room number</option>{(stay.rooms?.room_units ?? []).filter((unit) => unit.is_active).map((unit) => <option key={unit.id} value={unit.id}>Room {unit.room_number}</option>)}</select>
    <button disabled={busy}>Check in</button>
    {state.error && <span role="alert">{state.error}</span>}{state.success?.token && <span role="status">Give guest room-service code: <strong>{state.success.token}</strong></span>}
  </form>;
}

export default function FrontDesk({ rooms, stays, contacts, today, loadError }) {
  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState(null);
  const [looking, startLookup] = useTransition();
  const [state, formAction] = useActionState(createWalkInReservation, initial);
  const [roomId, setRoomId] = useState(rooms[0]?.id?.toString() ?? "");
  const [roomUnitId, setRoomUnitId] = useState("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const selectedRoom = rooms.find((room) => String(room.id) === roomId);
  const availableUnits = (selectedRoom?.room_units ?? []).filter((unit) => unit.is_active);
  const estimate = useMemo(() => {
    if (!selectedRoom || !start || !end || end <= start) return null;
    const nights = Math.round((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000);
    return nights > 0 ? bookingTotalPrice(selectedRoom.price, Number(guestCount), nights) : null;
  }, [selectedRoom, start, end, guestCount]);

  useEffect(() => { if (lookup?.guest) { document.querySelector('[name="fullname"]').value = lookup.guest.fullname ?? ""; document.querySelector('[name="email"]').value = lookup.guest.email ?? ""; } }, [lookup]);
  function doLookup() {
    startLookup(async () => setLookup(await lookupWalkInGuest(phone)));
  }
  function exportCsv() {
    const rows = [["full_name", "phone", "email", "total_stays"], ...contacts.map((row) => [row.full_name, row.phone, row.email, row.total_stays])];
    const blob = new Blob([rows.map((row) => row.map(csvEscape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "winford-guest-contacts.csv"; link.click(); URL.revokeObjectURL(url);
  }

  return <main className={styles.page}>
    <header><p className={styles.eyebrow}>Hotel administration</p><h1>Front desk</h1><p>Check in walk-in guests, take payment, and review today’s arrivals.</p></header>
    {loadError && <p role="alert" className={styles.error}>{loadError}</p>}
    <section className={styles.panel}>
      <h2>Walk-in check-in</h2>
      <div className={styles.lookup}><label>Guest phone<input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" autoComplete="tel" /></label><button type="button" onClick={doLookup} disabled={looking}>{looking ? "Looking…" : "Look up guest"}</button></div>
      {lookup?.error && <p role="alert" className={styles.error}>{lookup.error}</p>}
      {lookup?.guest && <p role="status">Returning guest: {lookup.guest.total_stays} past stay(s). Details filled in below.</p>}
      {lookup && !lookup.error && !lookup.guest && <p role="status">No guest found. A new guest record will be created.</p>}
      <form action={formAction} className={styles.form}>
        <input type="hidden" name="phone" value={phone} />
        <label>Guest full name<input name="fullname" required maxLength={120} /></label>
        <label>Email (optional)<input name="email" type="email" /></label>
        <label id="front-desk-room-label">Room type<CustomSelect name="room_id" value={rooms.find((room) => String(room.id) === roomId) ? { value: roomId, label: `${selectedRoom.name} · ${formatRoomPrice(selectedRoom.price, selectedRoom.price_usd)} · capacity ${selectedRoom.capacity}` } : null} onChange={(option) => { setRoomId(option?.value ?? ""); setRoomUnitId(""); }} options={rooms.map((room) => ({ value: String(room.id), label: `${room.name} · ${formatRoomPrice(room.price, room.price_usd)} · capacity ${room.capacity}` }))} ariaLabelledBy="front-desk-room-label" required placeholder="Select a room type" /></label>
        <label id="front-desk-unit-label">Physical room<CustomSelect name="room_unit_id" value={availableUnits.find((unit) => String(unit.id) === roomUnitId) ? { value: roomUnitId, label: `Room ${availableUnits.find((unit) => String(unit.id) === roomUnitId).room_number}` } : null} onChange={(option) => setRoomUnitId(option?.value ?? "")} options={availableUnits.map((unit) => ({ value: String(unit.id), label: `Room ${unit.room_number}` }))} ariaLabelledBy="front-desk-unit-label" required placeholder="Select a numbered room" /></label>
        <label>Check-in<input name="start_date" type="date" value={start} onChange={(event) => setStart(event.target.value)} required /></label>
        <label>Check-out<input name="end_date" type="date" value={end} min={start} onChange={(event) => setEnd(event.target.value)} required /></label>
        <label>Number of guests<input name="guests_count" type="number" min="1" max={selectedRoom?.capacity ?? 1} value={guestCount} onChange={(event) => setGuestCount(event.target.value)} required /></label>
        <label id="front-desk-payment-label">Payment method<CustomSelect name="payment_method" defaultValue={{ value: "cash", label: "Cash" }} options={[{ value: "cash", label: "Cash" }, { value: "momo_transfer", label: "MoMo transfer" }, { value: "pos_card", label: "POS card" }]} ariaLabelledBy="front-desk-payment-label" required /></label>
        <p className={styles.estimate}>Estimated total: {estimate ? formatMoney(estimate, "GHS") : "Select valid stay dates"}</p>
        <button type="submit" disabled={!rooms.length}>Confirm walk-in booking</button>
      </form>
      {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
      {state.success && <div role="status" className={styles.success}><strong>Checked in · Stay access code</strong><p>{state.success.guest} · {state.success.room} · {state.success.start} to {state.success.end} · {formatMoney(state.success.total, "GHS")}</p><p>Give this code to the guest for room-service orders: <strong>{state.success.stayToken}</strong></p><p>Confirmation #{state.success.id}</p></div>}
    </section>
    <section className={styles.panel}><div className={styles.sectionHeading}><h2>Today’s check-ins & occupancy</h2><button type="button" onClick={exportCsv}>Export guest contacts CSV</button></div>
      {stays.length ? <ul className={styles.stays}>{stays.map((stay) => { const unpaid = (stay.room_service_orders ?? []).filter((order) => order.payment_status === "unpaid" && order.status === "delivered").reduce((sum, order) => sum + Number(order.total_ghs), 0); return <li key={stay.id}><strong>{stay.guests?.fullname ?? "Guest"}</strong><span>{stay.rooms?.name ?? "Room"}{stay.room_units?.room_number ? ` · ${stay.room_units.room_number}` : " · Not assigned"}</span><span>{stay.guests?.phone ?? ""}</span><span>Check-out {stay.end_date}</span><span>Room-service due: GHS {unpaid.toFixed(2)}</span>{stay.checked_in_at ? <CheckoutButton stay={stay} amount={unpaid} /> : <CheckInButton stay={stay} />}</li>; })}</ul> : <p>No arrivals recorded for today.</p>}
      <p>{stays.length} confirmed guest(s) staying or checking in today.</p>
    </section>
  </main>;
}
