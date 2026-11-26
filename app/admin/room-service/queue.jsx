"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

const next = { new: ["accepted", "cancelled"], accepted: ["preparing", "cancelled"], preparing: ["delivered", "cancelled"] };
const statusLabels = { new: "New order", accepted: "Accepted", preparing: "Preparing", delivered: "Delivered", cancelled: "Cancelled" };
const actionLabels = { accepted: "Accept order", preparing: "Start preparing", delivered: "Mark delivered", cancelled: "Cancel order" };
const filters = [
  { value: "active", label: "Active orders" },
  { value: "new", label: "New" },
  { value: "preparing", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All orders" },
];

function timeLabel(value) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Accra" }).format(new Date(value));
}

function orderMatches(order, filter) {
  if (filter === "active") return ["new", "accepted", "preparing"].includes(order.status);
  if (filter === "completed") return ["delivered", "cancelled"].includes(order.status);
  if (filter === "all") return true;
  if (filter === "preparing") return ["accepted", "preparing"].includes(order.status);
  return order.status === filter;
}

export default function OrderQueue() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [sound, setSound] = useState(false);
  const [filter, setFilter] = useState("active");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const seen = useRef(null);
  const alertAudio = useRef(null);

  useEffect(() => () => alertAudio.current?.pause(), []);

  async function toggleSoundAlerts() {
    if (sound) {
      alertAudio.current?.pause();
      setSound(false);
      return;
    }
    const audio = new Audio("/sounds/mixkit-software-interface-back-2575%20(1).wav");
    audio.preload = "auto";
    audio.volume = 0.72;
    audio.muted = true;
    alertAudio.current = audio;
    try {
      // Prime playback from the user's click so a later polling alert can play.
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      setSound(true);
      setError("");
    } catch {
      audio.muted = false;
      setError("Sound could not be enabled. Check your browser's audio permissions.");
    }
  }

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/room-service", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load orders.");
      const incoming = data.orders ?? [];
      const newIds = incoming.filter((order) => order.status === "new").map((order) => order.id);
      if (seen.current && newIds.some((id) => !seen.current.has(id)) && sound) {
        const audio = alertAudio.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => setError("A new order arrived, but the notification sound could not play."));
        }
      }
      seen.current = new Set(newIds);
      setOrders(incoming);
      setLastUpdated(new Date());
      setError("");
    } catch (cause) {
      setError(cause.message || "Could not load room-service orders.");
    }
  }, [sound]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  async function update(id, status) {
    setBusyId(id);
    try {
      const response = await fetch("/api/admin/room-service", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update that order.");
      await load();
    } catch (cause) {
      setError(cause.message || "Could not update that order.");
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(() => ({
    active: orders.filter((order) => ["new", "accepted", "preparing"].includes(order.status)).length,
    new: orders.filter((order) => order.status === "new").length,
    preparing: orders.filter((order) => ["accepted", "preparing"].includes(order.status)).length,
    completed: orders.filter((order) => ["delivered", "cancelled"].includes(order.status)).length,
  }), [orders]);

  const visibleOrders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (!orderMatches(order, filter)) return false;
      if (!needle) return true;
      return [order.id, order.room_units?.room_number, order.reservations?.guests?.fullname]
        .some((value) => String(value ?? "").toLowerCase().includes(needle));
    });
  }, [filter, orders, query]);

  return <section className={styles.queue} aria-label="Room service order queue">
    <div className={styles.metrics}>
      <div className={styles.metricCard}><span>Needs attention</span><strong>{counts.new}</strong><small>New guest requests</small></div>
      <div className={styles.metricCard}><span>In progress</span><strong>{counts.preparing}</strong><small>Accepted or being prepared</small></div>
      <div className={styles.metricCard}><span>Active queue</span><strong>{counts.active}</strong><small>Orders not yet completed</small></div>
      <div className={styles.metricCard}><span>Completed</span><strong>{counts.completed}</strong><small>Delivered or cancelled</small></div>
    </div>

    <div className={styles.toolbar}>
      <div className={styles.filters} role="group" aria-label="Filter orders">
        {filters.map((item) => <button key={item.value} type="button" className={filter === item.value ? styles.filterActive : styles.filterButton} onClick={() => setFilter(item.value)} aria-pressed={filter === item.value}>
          {item.label}{item.value === "new" && counts.new > 0 && <span className={styles.filterCount}>{counts.new}</span>}
        </button>)}
      </div>
      <label className={styles.search}>Search orders<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Room, guest, or order #" /></label>
      <div className={styles.toolbarActions}>
        <button type="button" className={sound ? styles.soundOn : styles.soundButton} onClick={toggleSoundAlerts} aria-pressed={sound}>{sound ? "Sound alerts on" : "Enable sound alerts"}</button>
        <button type="button" className={styles.refreshButton} onClick={load}>Refresh</button>
      </div>
    </div>

    <div className={styles.queueMeta}>
      <span>{visibleOrders.length} {filter === "active" ? "active" : "matching"} order{visibleOrders.length === 1 ? "" : "s"}</span>
      <span>{lastUpdated ? `Updated ${timeLabel(lastUpdated)}` : "Connecting to live queue..."} · Refreshes every 5 seconds</span>
    </div>
    {error && <p className={styles.error} role="alert">{error}</p>}

    {!visibleOrders.length ? <div className={styles.emptyState}>
      <span className={styles.emptyIcon} aria-hidden="true">✓</span>
      <h2>{query ? "No matching orders" : filter === "active" || filter === "new" ? "You’re all caught up" : "No orders in this view"}</h2>
      <p>{query ? "Try another guest name, room number, or order number." : "New room-service requests will appear here as guests place them."}</p>
    </div> : <div className={styles.orderGrid}>{visibleOrders.map((order) => <article key={order.id} className={`${styles.orderCard} ${order.status === "new" ? styles.newOrder : ""}`}>
      <div className={styles.cardTop}>
        <div><span className={styles.orderNumber}>Order #{order.id}</span><span className={`${styles.statusBadge} ${styles[`status_${order.status}`]}`}>{statusLabels[order.status] ?? order.status}</span></div>
        <time dateTime={order.created_at}>{timeLabel(order.created_at)}</time>
      </div>
      <div className={styles.guestBlock}>
        <span className={styles.roomNumber}>{order.room_units?.room_number ? `Room ${order.room_units.room_number}` : "Room not assigned"}</span>
        <strong>{order.reservations?.guests?.fullname || "Hotel guest"}</strong>
        <small>{order.reservations?.start_date} to {order.reservations?.end_date}</small>
      </div>
      <ul className={styles.itemList}>{(order.room_service_order_items ?? []).map((item, index) => <li key={`${order.id}-${index}`}><span><b>{item.quantity}×</b> {item.product_name}</span><strong>GHS {Number(item.line_total_ghs ?? 0).toFixed(2)}</strong></li>)}</ul>
      {order.guest_note && <p className={styles.guestNote}><span>Guest note</span>{order.guest_note}</p>}
      <div className={styles.cardBottom}><strong className={styles.orderTotal}>GHS {Number(order.total_ghs ?? 0).toFixed(2)}</strong>
        <div className={styles.orderActions}>{next[order.status]?.map((status) => <button key={status} type="button" disabled={busyId === order.id} className={status === "cancelled" ? styles.cancelButton : styles.advanceButton} onClick={() => update(order.id, status)}>
          {busyId === order.id ? "Saving..." : actionLabels[status]}
        </button>)}</div>
      </div>
    </article>)}</div>}
  </section>;
}
