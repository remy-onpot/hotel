"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
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

function buildTodayStayRows(stays, today, accraTime) {
  return stays.map((stay) => {
    const arrivalToday = stay.start_date === today;
    const room = `${stay.rooms?.name ?? "Room type"}${stay.room_units?.room_number ? ` · Room ${stay.room_units.room_number}` : " · Room not assigned"}`;
    const status = arrivalToday
      ? stay.checked_out_at ? "Checked out" : stay.checked_in_at ? "Checked in" : "Awaiting check-in"
      : stay.checked_out_at ? "Checked out" : `${accraTime.hour}:${accraTime.minute}` >= "12:00" ? "Overdue for check-out" : "Due to depart";
    return { event: arrivalToday ? "Arrival" : "Departure", guest: stay.guests?.fullname ?? "Guest", id: stay.id, room, checkIn: stay.start_date, checkOut: stay.end_date, status };
  });
}

function makePdf(stays, today, accraTime) {
  const pageSize = 10;
  const rowsByPage = [];
  for (let index = 0; index < stays.length; index += pageSize) rowsByPage.push(stays.slice(index, index + pageSize));
  if (!rowsByPage.length) rowsByPage.push([]);
  const clean = (value) => String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7e]/g, "?");
  const escapePdf = (value) => clean(value).replace(/([\\()])/g, "\\$1");
  const color = (hex) => hex.match(/[0-9a-f]{2}/gi).map((part) => (parseInt(part, 16) / 255).toFixed(3)).join(" ");
  const ink = color("#173b34");
  const gold = color("#b28a56");
  const muted = color("#6c776f");
  const pale = color("#f5f3ee");
  const white = "1 1 1";
  const text = (x, y, value, size = 9, fill = ink, font = "F1") => `BT /${font} ${size} Tf ${fill} rg ${x} ${y} Td (${escapePdf(value)}) Tj ET`;
  const box = (x, y, width, height, fill) => `${fill} rg ${x} ${y} ${width} ${height} re f`;
  const line = (x1, y1, x2, y2, fill) => `${fill} RG 0.7 w ${x1} ${y1} m ${x2} ${y2} l S`;
  const truncate = (value, max) => String(value).length > max ? `${String(value).slice(0, max - 1)}...` : String(value);
  const objects = [null, "<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>"];
  const pageRefs = [];
  rowsByPage.forEach((pageRows, pageIndex) => {
    const pageId = 6 + pageIndex * 2;
    const contentId = pageId + 1;
    pageRefs.push(`${pageId} 0 R`);
    const commands = [
      box(0, 658, 612, 134, ink),
      text(42, 756, "THE WINFORD", 11, white, "F2"),
      text(42, 739, "BOUTIQUE HOTEL ACHIMOTA", 7.5, "0.820 0.866 0.831", "F2"),
      box(42, 729, 54, 2, gold),
      text(42, 694, "Today's stays", 26, white, "F3"),
      text(42, 673, "ARRIVALS & DEPARTURES  /  FRONT DESK", 7.5, "0.820 0.866 0.831", "F2"),
      text(455, 739, today, 12, white, "F2"),
      text(455, 722, `${accraTime.hour}:${accraTime.minute} GMT`, 8, "0.820 0.866 0.831"),
      box(0, 654, 612, 4, gold),
      box(42, 588, 168, 48, pale), box(222, 588, 168, 48, pale), box(402, 588, 168, 48, pale),
      text(54, 618, "ARRIVALS", 7, muted, "F2"), text(54, 596, String(stays.filter((stay) => stay.event === "Arrival").length), 17, ink, "F2"),
      text(234, 618, "DEPARTURES", 7, muted, "F2"), text(234, 596, String(stays.filter((stay) => stay.event === "Departure").length), 17, ink, "F2"),
      text(414, 618, "OVERDUE", 7, muted, "F2"), text(414, 596, String(stays.filter((stay) => stay.status === "Overdue for check-out").length), 17, stays.some((stay) => stay.status === "Overdue for check-out") ? "0.647 0.196 0.145" : ink, "F2"),
      text(42, 558, "GUEST MOVEMENT", 8, ink, "F2"),
      box(42, 520, 528, 24, ink),
      text(52, 529, "TYPE", 7, white, "F2"), text(112, 529, "GUEST", 7, white, "F2"), text(242, 529, "ROOM", 7, white, "F2"), text(378, 529, "STAY DATES", 7, white, "F2"), text(494, 529, "STATUS", 7, white, "F2"),
    ];
    if (pageRows.length) {
      pageRows.forEach((stay, rowIndex) => {
        const y = 520 - (rowIndex + 1) * 36;
        if (rowIndex % 2 === 0) commands.push(box(42, y, 528, 36, pale));
        commands.push(
          text(52, y + 20, stay.event.toUpperCase(), 7, stay.event === "Arrival" ? ink : gold, "F2"),
          text(112, y + 20, truncate(stay.guest, 22), 8),
          text(242, y + 20, truncate(stay.room, 21), 7.5),
          text(378, y + 20, `${stay.checkIn}  -  ${stay.checkOut}`, 7.5),
          text(494, y + 20, truncate(stay.status.replace(" for check-out", ""), 14), 7, stay.status === "Overdue for check-out" ? "0.647 0.196 0.145" : muted, "F2"),
          line(42, y, 570, y, "0.890 0.882 0.851"),
        );
      });
    } else {
      box(42, 484, 528, 44, pale);
      commands.push(text(56, 500, "No arrivals or departures scheduled for today.", 9, muted));
    }
    commands.push(line(42, 48, 570, 48, "0.843 0.827 0.784"));
    commands.push(text(42, 32, "THE WINFORD  /  HOTEL ADMINISTRATION  /  ACCRA, GHANA", 7, muted, "F2"));
    commands.push(text(524, 32, `${pageIndex + 1} / ${rowsByPage.length}`, 7, muted));
    const content = commands.join("\n");
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });
  objects[2] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pageRefs.length} >>`;
  let document = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = document.length;
    document += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = document.length;
  document += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) document += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  document += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([document], { type: "application/pdf" });
}

function CheckoutButton({ stay, amount, overdue }) {
  const [state, action, busy] = useActionState(checkoutStay, {});
  return <form action={action} className={styles.stayAction}>
    <input type="hidden" name="reservation_id" value={stay.id} />
    {amount > 0 && <label>Settle room-service bill
      <select name="payment_method" aria-label={`Room service payment method for reservation ${stay.id}`} defaultValue="cash">
        <option value="cash">Cash</option><option value="momo_transfer">MoMo transfer</option><option value="pos_card">POS card</option>
      </select>
    </label>}
    <button className={`${styles.primaryButton} ${overdue ? styles.overdueButton : ""}`} type="submit" disabled={busy}>
      {busy ? "Checking out..." : `${overdue ? "Overdue · " : ""}Complete check-out${amount > 0 ? ` · GHS ${amount.toFixed(2)}` : ""}`}
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

function accraDateTime(date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export default function FrontDesk({ rooms, stays, reportStays, today, initialNow, loadError }) {
  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState(null);
  const [looking, startLookup] = useTransition();
  const [state, formAction] = useActionState(createWalkInReservation, initial);
  const [roomId, setRoomId] = useState(rooms[0]?.id?.toString() ?? "");
  const [roomUnitId, setRoomUnitId] = useState("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const exportCloseRef = useRef(null);
  const [clockNow, setClockNow] = useState(() => new Date(initialNow));
  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const accraTime = accraDateTime(clockNow);
  const accraToday = `${accraTime.year}-${accraTime.month}-${accraTime.day}`;
  useEffect(() => {
    if (!exportDialogOpen) return;
    exportCloseRef.current?.focus();
    function closeOnEscape(event) {
      if (event.key === "Escape") setExportDialogOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [exportDialogOpen]);
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

  function exportTodayStaysCsv() {
    const staysForExport = buildTodayStayRows(reportStays, today, accraTime);
    const rows = [["event", "guest", "reservation_id", "room", "check_in", "check_out", "stay_status"], ...staysForExport.map((stay) => [stay.event, stay.guest, stay.id, stay.room, stay.checkIn, stay.checkOut, stay.status])];
    const blob = new Blob([rows.map((row) => row.map(csvEscape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `winford-todays-stays-${today}.csv`);
    setExportDialogOpen(false);
  }

  function exportTodayStaysPdf() {
    const staysForExport = buildTodayStayRows(reportStays, today, accraTime);
    downloadBlob(makePdf(staysForExport, today, accraTime), `winford-todays-stays-${today}.pdf`);
    setExportDialogOpen(false);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <main className={styles.page}>
    <header className={styles.pageHeader}>
      <div><p className={styles.eyebrow}>Hotel administration</p><h1>Front desk</h1><p>Assign rooms to booked guests, check in walk-ins, and close out departing stays.</p></div>
      <div className={styles.headerActions}>
        <a className={styles.primaryButton} href="#walk-in">New walk-in check-in</a>
        <button type="button" className={styles.secondaryButton} onClick={() => setExportDialogOpen(true)}>Export today’s stays</button>
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
        const dueToday = stay.end_date === accraToday && `${accraTime.hour}:${accraTime.minute}` < "12:00";
        const overdue = stay.end_date < accraToday || (stay.end_date === accraToday && !dueToday);
        const checkoutStatus = overdue ? "Overdue · check-out was due by 12:00 PM" : dueToday ? "Due today · check-out by 12:00 PM" : "";
        return <li className={styles.stayCard} key={stay.id}>
          <div className={styles.stayDetails}><strong>{stay.guests?.fullname ?? "Guest"}</strong>{checkoutStatus && <span className={`${styles.checkoutFlag} ${overdue ? styles.overdueFlag : styles.dueFlag}`}>{checkoutStatus}</span>}<span>{stay.rooms?.name ?? "Room type"}{stay.room_units?.room_number ? ` · Room ${stay.room_units.room_number}` : " · Room not assigned"}</span><span>{stay.guests?.phone ?? "No phone on file"}</span><span>Check-out date {stay.end_date}</span><span className={unpaid > 0 ? styles.balanceDue : styles.balanceClear}>{unpaid > 0 ? `Room-service balance: GHS ${unpaid.toFixed(2)}` : "No room-service balance due"}</span></div>
          <CheckoutButton stay={stay} amount={unpaid} overdue={overdue} />
        </li>;
      })}</ul> : <div className={styles.emptyState}><strong>No checked-in guests</strong><span>Guests appear here after front desk assigns their room.</span></div>}
    </section>
    {exportDialogOpen && <div className={styles.dialogBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setExportDialogOpen(false); }}>
      <section className={styles.exportDialog} role="dialog" aria-modal="true" aria-labelledby="export-dialog-title" aria-describedby="export-dialog-description">
        <button ref={exportCloseRef} className={styles.dialogClose} type="button" onClick={() => setExportDialogOpen(false)} aria-label="Close export options">×</button>
        <p className={styles.sectionEyebrow}>Front desk report</p>
        <h2 id="export-dialog-title">Choose a file format</h2>
        <p id="export-dialog-description">Export today’s arrivals and departures.</p>
        <div className={styles.exportOptions}>
          <button type="button" className={styles.primaryButton} onClick={exportTodayStaysCsv}>Download CSV</button>
          <button type="button" className={styles.secondaryButton} onClick={exportTodayStaysPdf}>Download PDF</button>
        </div>
      </section>
    </div>}
  </main>;
}
