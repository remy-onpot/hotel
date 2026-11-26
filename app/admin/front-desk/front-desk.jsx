"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { bookingTotalPrice } from "@/app/utils/reservationsCalcs";
import { lookupWalkInGuest, createWalkInReservation, checkoutStay, checkInExistingStay } from "./actions";
import styles from "./styles.module.css";
import CustomSelect from "@/app/_ui/CustomSelect";
import { formatMoney, formatRoomPrice } from "@/app/_lib/money";

const initial = {};
function csvEscape(value) {
  const text = String(value ?? "");
  const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function CheckoutButton({ stay, amount }) {
  const [state, action, busy] = useActionState(checkoutStay, {});
  return <form action={action} className={styles.stayAction}>
    <input type="hidden" name="reservation_id" value={stay.id} />
    {amount > 0 && <label>Settle room-service bill
      <select name="payment_method" aria-label={`Room service payment method for reservation ${stay.id}`} defaultValue="cash">
        <option value="cash">Cash</option><option value="momo_transfer">MoMo transfer</option><option value="pos_card">POS card</option>
      </select>
    </label>}
    <button className={styles.primaryButton} type="submit" disabled={busy}>
      {busy ? "Checking out..." : `Complete check-out${amount > 0 ? ` · GHS ${amount.toFixed(2)}` : ""}`}
    </button>
    {state.error && <span role="alert" className={styles.actionMessage}>{state.error}</span>}
    {state.success && <span role="status" className={styles.actionMessage}>{state.success}</span>}
  </form>;
}

function CheckInButton({ stay, unavailableUnits }) {
  const [state, action, busy] = useActionState(checkInExistingStay, {});
  const availableUnits = (stay.rooms?.room_units ?? []).filter((unit) => unit.is_active && !unavailableUnits.has(String(unit.id)));
  return <form action={action} className={styles.stayAction}>
    <input type="hidden" name="reservation_id" value={stay.id} />
    <label>Assign a physical room
      <select name="room_unit_id" required defaultValue="" disabled={!availableUnits.length}>
        <option value="" disabled>{availableUnits.length ? "Choose room number" : "No room available"}</option>
        {availableUnits.map((unit) => <option key={unit.id} value={unit.id}>Room {unit.room_number}</option>)}
      </select>
    </label>
    <button className={styles.primaryButton} disabled={busy || !availableUnits.length}>
      {busy ? "Checking in..." : "Check in guest"}
    </button>
    {state.error && <span role="alert" className={styles.actionMessage}>{state.error}</span>}
    {state.success?.token && <span role="status" className={styles.actionMessage}>Room-service code: <strong>{state.success.token}</strong></span>}
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
  const bookedArrivals = stays.filter((stay) => !stay.checked_in_at);
  const inHouseStays = stays.filter((stay) => stay.checked_in_at && !stay.checked_out_at);
  const occupiedUnitIds = new Set(inHouseStays.map((stay) => String(stay.room_unit_id)).filter(Boolean));
  const availableUnits = (selectedRoom?.room_units ?? []).filter((unit) => unit.is_active && !occupiedUnitIds.has(String(unit.id)));
  const estimate = useMemo(() => {
    if (!selectedRoom || !start || !end || end <= start) return null;
    const nights = Math.round((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000);
    return nights > 0 ? bookingTotalPrice(selectedRoom.price, Number(guestCount), nights) : null;
  }, [selectedRoom, start, end, guestCount]);

  useEffect(() => {
    if (!lookup?.guest) return;
    const nameField = document.querySelector('[name="fullname"]');
    const emailField = document.querySelector('[name="email"]');
    if (nameField) nameField.value = lookup.guest.fullname ?? "";
    if (emailField) emailField.value = lookup.guest.email ?? "";
  }, [lookup]);

  function doLookup() {
    startLookup(async () => setLookup(await lookupWalkInGuest(phone)));
  }

  function exportCsv() {
    const rows = [["full_name", "phone", "email", "total_stays"], ...contacts.map((row) => [row.full_name, row.phone, row.email, row.total_stays])];
    const blob = new Blob([rows.map((row) => row.map(csvEscape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "winford-guest-contacts.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return <main className={styles.page}>
    <header className={styles.pageHeader}>
      <div><p className={styles.eyebrow}>Hotel administration</p><h1>Front desk</h1><p>Assign rooms to booked guests, check in walk-ins, and close out departing stays.</p></div>
      <div className={styles.headerActions}>
        <a className={styles.primaryButton} href="#walk-in">New walk-in check-in</a>
        <button type="button" className={styles.secondaryButton} onClick={exportCsv}>Export guest contacts</button>
      </div>
    </header>
    {loadError && <p role="alert" className={styles.error}>{loadError}</p>}

    <nav className={styles.taskNav} aria-label="Front desk tasks">
      <a href="#booked-check-ins"><span>Booked check-ins</span><strong>{bookedArrivals.length}</strong><small>Assign a numbered room</small></a>
      <a href="#walk-in"><span>Walk-in check-in</span><strong aria-hidden="true">+</strong><small>Create and check in a stay</small></a>
      <a href="#check-outs"><span>Check-outs</span><strong>{inHouseStays.length}</strong><small>Settle bills and release rooms</small></a>
    </nav>

    <section id="booked-check-ins" className={styles.panel}>
      <div className={styles.sectionTitle}>
        <div><p className={styles.sectionEyebrow}>Existing reservations</p><h2>Booked guest check-ins</h2><p>Online bookings are confirmed when paid. Assign a numbered room when the guest arrives.</p></div>
        <span className={styles.countBadge}>{bookedArrivals.length} waiting</span>
      </div>
      {bookedArrivals.length ? <ul className={styles.stays}>{bookedArrivals.map((stay) => <li className={styles.stayCard} key={stay.id}>
        <div className={styles.stayDetails}><strong>{stay.guests?.fullname ?? "Guest"}</strong><span>{stay.rooms?.name ?? "Room type"} · Reservation #{stay.id}</span><span>{stay.guests?.phone ?? "No phone on file"}</span><span>Departure {stay.end_date}</span></div>
        <CheckInButton stay={stay} unavailableUnits={occupiedUnitIds} />
      </li>)}</ul> : <div className={styles.emptyState}><strong>All caught up</strong><span>No booked guests are waiting to check in today.</span></div>}
    </section>

    <section id="walk-in" className={`${styles.panel} ${styles.walkInPanel}`}>
      <div className={styles.sectionTitle}><div><p className={styles.sectionEyebrow}>New reservation</p><h2>Walk-in check-in</h2><p>Find or add the guest, choose an available room, record payment, and check them in.</p></div></div>
      <div className={styles.lookup}>
        <label>Guest phone<input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" autoComplete="tel" /></label>
        <button type="button" onClick={doLookup} disabled={looking}>{looking ? "Looking..." : "Look up guest"}</button>
      </div>
      {lookup?.error && <p role="alert" className={styles.error}>{lookup.error}</p>}
      {lookup?.guest && <p role="status">Returning guest: {lookup.guest.total_stays} past stay(s). Details filled in below.</p>}
      {lookup && !lookup.error && !lookup.guest && <p role="status">No guest found. A new guest record will be created.</p>}
      <form action={formAction} className={styles.form}>
        <input type="hidden" name="phone" value={phone} />
        <label>Guest full name<input name="fullname" required maxLength={120} /></label>
        <label>Email (optional)<input name="email" type="email" /></label>
        <label id="front-desk-room-label">Room type<CustomSelect name="room_id" value={selectedRoom ? { value: roomId, label: `${selectedRoom.name} · ${formatRoomPrice(selectedRoom.price, selectedRoom.price_usd)} · capacity ${selectedRoom.capacity}` } : null} onChange={(option) => { setRoomId(option?.value ?? ""); setRoomUnitId(""); }} options={rooms.map((room) => ({ value: String(room.id), label: `${room.name} · ${formatRoomPrice(room.price, room.price_usd)} · capacity ${room.capacity}` }))} ariaLabelledBy="front-desk-room-label" required placeholder="Select a room type" /></label>
        <label id="front-desk-unit-label">Physical room<CustomSelect name="room_unit_id" value={availableUnits.find((unit) => String(unit.id) === roomUnitId) ? { value: roomUnitId, label: `Room ${availableUnits.find((unit) => String(unit.id) === roomUnitId).room_number}` } : null} onChange={(option) => setRoomUnitId(option?.value ?? "")} options={availableUnits.map((unit) => ({ value: String(unit.id), label: `Room ${unit.room_number}` }))} ariaLabelledBy="front-desk-unit-label" required placeholder={availableUnits.length ? "Select a numbered room" : "No room available"} /></label>
        <label>Check-in<input name="start_date" type="date" value={start} onChange={(event) => setStart(event.target.value)} required /></label>
        <label>Check-out<input name="end_date" type="date" value={end} min={start} onChange={(event) => setEnd(event.target.value)} required /></label>
        <label>Number of guests<input name="guests_count" type="number" min="1" max={selectedRoom?.capacity ?? 1} value={guestCount} onChange={(event) => setGuestCount(event.target.value)} required /></label>
        <label id="front-desk-payment-label">Payment method<CustomSelect name="payment_method" defaultValue={{ value: "cash", label: "Cash" }} options={[{ value: "cash", label: "Cash" }, { value: "momo_transfer", label: "MoMo transfer" }, { value: "pos_card", label: "POS card" }]} ariaLabelledBy="front-desk-payment-label" required /></label>
        <p className={styles.estimate}>Estimated total: {estimate ? formatMoney(estimate, "GHS") : "Select valid stay dates"}</p>
        <button className={styles.primaryButton} type="submit" disabled={!rooms.length || !availableUnits.some((unit) => String(unit.id) === roomUnitId)}>Create booking & check in</button>
      </form>
      {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
      {state.success && <div role="status" className={styles.success}><strong>Guest checked in · Room-service access code</strong><p>{state.success.guest} · {state.success.room} · {state.success.start} to {state.success.end} · {formatMoney(state.success.total, "GHS")}</p><p>Give this code to the guest: <strong>{state.success.stayToken}</strong></p><p>Confirmation #{state.success.id}</p></div>}
    </section>

    <section id="check-outs" className={styles.panel}>
      <div className={styles.sectionTitle}>
        <div><p className={styles.sectionEyebrow}>Current stays</p><h2>Check-outs & occupied rooms</h2><p>Review checked-in guests. Delivered room-service items are collected here before departure.</p></div>
        <span className={styles.countBadge}>{inHouseStays.length} in house</span>
      </div>
      {inHouseStays.length ? <ul className={styles.stays}>{inHouseStays.map((stay) => {
        const unpaid = (stay.room_service_orders ?? []).filter((order) => order.payment_status === "unpaid" && order.status === "delivered").reduce((sum, order) => sum + Number(order.total_ghs), 0);
        return <li className={styles.stayCard} key={stay.id}>
          <div className={styles.stayDetails}><strong>{stay.guests?.fullname ?? "Guest"}</strong><span>{stay.rooms?.name ?? "Room type"}{stay.room_units?.room_number ? ` · Room ${stay.room_units.room_number}` : " · Room not assigned"}</span><span>{stay.guests?.phone ?? "No phone on file"}</span><span>Check-out date {stay.end_date}</span><span className={unpaid > 0 ? styles.balanceDue : styles.balanceClear}>{unpaid > 0 ? `Room-service balance: GHS ${unpaid.toFixed(2)}` : "No room-service balance due"}</span></div>
          <CheckoutButton stay={stay} amount={unpaid} />
        </li>;
      })}</ul> : <div className={styles.emptyState}><strong>No checked-in guests</strong><span>Guests appear here after front desk assigns their room.</span></div>}
    </section>
  </main>;
}
