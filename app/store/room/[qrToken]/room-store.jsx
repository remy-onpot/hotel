"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./store.module.css";

const orderStages = ["new", "accepted", "preparing", "delivered"];
const orderStageLabels = ["Received", "Accepted", "Preparing", "Delivered"];

function OrderTracker({ orders, error, canTrack, orderingEnabled, showHeading = true }) {
  if (!orderingEnabled) return null;
  return <section className={styles.orderTracker} aria-label="Your room-service orders">
    {showHeading && <div className={styles.trackerHeading}><div><p className={styles.eyebrow}>Stay updates</p><h3>Your orders</h3></div><span className={styles.trackerLive}><i />Live updates</span></div>}
    {!canTrack ? <p className={styles.trackerHint}>Enter your stay access code to see order updates for this room.</p> : error ? <p className={styles.trackerError} role="status">{error}</p> : !orders.length ? <p className={styles.trackerHint}>No orders for this stay yet. New orders will appear here.</p> : <div className={styles.trackedOrders}>
      {orders.slice(0, 5).map((order) => {
        const cancelled = order.status === "cancelled";
        const currentStage = orderStages.indexOf(order.status);
        const statusText = cancelled ? "Cancelled" : orderStageLabels[Math.max(0, currentStage)] ?? "Received";
        return <article className={styles.trackedOrder} key={order.id}>
          <div className={styles.trackedOrderTop}><div><strong>Order #{order.id}</strong><span>{statusText}</span></div><small>GHS {Number(order.total_ghs).toFixed(2)}</small></div>
          <p>{(order.room_service_order_items ?? []).map((item) => `${item.quantity}× ${item.product_name}`).join(" · ")}</p>
          {cancelled ? <div className={styles.cancelledState}>This order was cancelled. Please contact the front desk if you need help.</div> : <ol className={styles.progress} aria-label={`Order ${order.id}: ${statusText}`}>
            {orderStageLabels.map((label, index) => <li key={label} className={index < currentStage ? styles.stageDone : index === currentStage ? styles.stageCurrent : ""}><span>{index < currentStage ? "✓" : index + 1}</span><small>{label}</small></li>)}
          </ol>}
          <div className={styles.trackedOrderFoot}><span>Updated {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Accra" }).format(new Date(order.updated_at ?? order.created_at))}</span><span>{order.payment_status === "paid" ? "Folio settled" : "Added to room folio"}</span></div>
        </article>;
      })}
      {orders.length > 5 && <small className={styles.trackerHint}>Showing your 5 most recent orders.</small>}
    </div>}
  </section>;
}

function OrderStatusControls({ orders, error, canTrack, orderingEnabled, requiresStayCode, code, setCode }) {
  const dialogRef = useRef(null);
  if (!orderingEnabled) return null;
  const activeCount = orders.filter((order) => ["new", "accepted", "preparing"].includes(order.status)).length;
  return <div className={styles.orderStatusControls}>
    <button type="button" className={styles.ordersButton} aria-haspopup="dialog" aria-controls="guest-order-status-dialog" onClick={() => dialogRef.current?.showModal()}>
      <span><small>Stay updates</small>Your orders</span>
      {activeCount > 0 && <b aria-label={`${activeCount} active orders`}>{activeCount > 9 ? "9+" : activeCount}</b>}
      <span className={styles.ordersButtonArrow} aria-hidden="true">›</span>
    </button>
    <dialog id="guest-order-status-dialog" ref={dialogRef} className={styles.orderDialog} aria-labelledby="guest-order-dialog-title" onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <div className={styles.orderDialogPanel}>
        <div className={styles.modalOrderHeading}>
          <div><p className={styles.eyebrow}>Stay updates</p><h2 id="guest-order-dialog-title">Your orders</h2></div>
          <button type="button" className={styles.modalClose} onClick={() => dialogRef.current?.close()}>Close</button>
        </div>
        {requiresStayCode && <label className={styles.field}>Stay access code<input required minLength={8} maxLength={64} autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Provided by the front desk" /></label>}
        <OrderTracker orders={orders} error={error} canTrack={canTrack} orderingEnabled={orderingEnabled} showHeading={false} />
      </div>
    </dialog>
  </div>;
}

export default function RoomStore({ qrToken, reservationId, roomNumber, products, orderingEnabled = true, requiresStayCode = true }) {
  const [cart, setCart] = useState({});
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [trackedOrders, setTrackedOrders] = useState([]);
  const [trackingError, setTrackingError] = useState("");
  const [trackRefresh, setTrackRefresh] = useState(0);
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const total = useMemo(() => products.reduce((sum, item) => sum + Number(item.price_ghs) * (cart[item.id] ?? 0), 0), [products, cart]);
  const canTrack = orderingEnabled && (Boolean(reservationId) || (requiresStayCode && Boolean(qrToken) && code.trim().length >= 8));

  useEffect(() => {
    if (!canTrack) {
      setTrackedOrders([]);
      setTrackingError("");
      return;
    }
    let mounted = true;
    async function loadOrders() {
      try {
        const response = await fetch("/api/store/orders/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId: reservationId ?? undefined, qrToken, code: requiresStayCode ? code.trim() : undefined }),
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Order status is temporarily unavailable.");
        if (mounted) { setTrackedOrders(result.orders ?? []); setTrackingError(""); }
      } catch (cause) {
        if (mounted) setTrackingError(cause.message || "Order status is temporarily unavailable.");
      }
    }
    loadOrders();
    const timer = setInterval(loadOrders, 10000);
    return () => { mounted = false; clearInterval(timer); };
  }, [canTrack, code, qrToken, reservationId, requiresStayCode, trackRefresh]);

  function changeQuantity(id, amount) {
    setCart((current) => {
      const quantity = Math.max(0, Math.min(20, (current[id] ?? 0) + amount));
      return { ...current, [id]: quantity };
    });
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken, reservationId, code, note, items: Object.entries(cart).filter(([, quantity]) => quantity > 0).map(([productId, quantity]) => ({ productId: Number(productId), quantity })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not place your order.");
      setCart({}); setNote("");
      setMessage(`Order #${result.orderId} has been sent to room service. GHS ${Number(result.total).toFixed(2)} will be added to your room folio.`);
      setTrackRefresh((value) => value + 1);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  if (!products.length) return <>
    <OrderStatusControls orders={trackedOrders} error={trackingError} canTrack={canTrack} orderingEnabled={orderingEnabled} requiresStayCode={requiresStayCode} code={code} setCode={setCode} />
    <section className={styles.empty}><span>—</span><h2>The menu is resting</h2><p>There are no available items at the moment. Please contact the front desk and we’ll be happy to help.</p></section>
  </>;

  return <>
  <OrderStatusControls orders={trackedOrders} error={trackingError} canTrack={canTrack} orderingEnabled={orderingEnabled} requiresStayCode={requiresStayCode} code={code} setCode={setCode} />
  <form onSubmit={submit} className={styles.orderForm}>
    <div className={styles.menuTop}><div><p className={styles.eyebrow}>Thoughtfully prepared</p><h2>Today’s menu</h2></div><span>{products.length} selections</span></div>
    <div className={styles.orderLayout}>
      <section className={styles.menuGrid} aria-label="Room service menu">
        {products.map((product) => {
          const quantity = cart[product.id] ?? 0;
          return <article className={`${styles.productCard} ${quantity ? styles.selected : ""}`} key={product.id}>
            <div className={styles.productImage}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className={styles.imagePlaceholder}><span>THE WINFORD</span><small>PREPARED WITH CARE</small></div>}</div>
            <div className={styles.productDetails}><div className={styles.productTitle}><h3>{product.name}</h3><strong>GH₵ {Number(product.price_ghs).toFixed(2)}</strong></div>
              {product.description && <p>{product.description}</p>}
              {product.price_usd != null && <small className={styles.usdPrice}>${Number(product.price_usd).toFixed(2)} display price</small>}
              <div className={styles.productActions}>{!orderingEnabled ? <span className={styles.usdPrice}>Available to order after check-in</span> : quantity === 0 ? <button className={styles.addButton} type="button" onClick={() => changeQuantity(product.id, 1)}>Add to order <span>＋</span></button> : <div className={styles.quantityControl}><button type="button" aria-label={`Remove one ${product.name}`} onClick={() => changeQuantity(product.id, -1)}>−</button><strong>{quantity}</strong><button type="button" aria-label={`Add one ${product.name}`} disabled={quantity >= 20} onClick={() => changeQuantity(product.id, 1)}>＋</button></div>}</div>
            </div>
          </article>;
        })}
      </section>

      {orderingEnabled ? <aside className={styles.checkoutPanel}>
        <div className={styles.checkoutHeading}><div><p className={styles.eyebrow}>Your selection</p><h2>Your order</h2></div><span className={styles.roomPill}>Room {roomNumber}</span></div>
        {count ? <ul className={styles.cartList}>{products.filter((product) => cart[product.id]).map((product) => <li key={product.id}><span>{cart[product.id]} × {product.name}</span><strong>GH₵ {(Number(product.price_ghs) * cart[product.id]).toFixed(2)}</strong></li>)}</ul> : <p className={styles.cartEmpty}>Your order is empty. Add something from the menu to begin.</p>}
        <div className={styles.totalRow}><span>Estimated total</span><strong>GH₵ {total.toFixed(2)}</strong></div>
        <p className={styles.folioNote}>Charged to your room folio and settled at checkout.</p>
        {requiresStayCode && <label className={styles.field}>Stay access code<input required minLength={8} maxLength={64} autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Provided by the front desk" /></label>}
        <label className={styles.field}>A note for the team <span>Optional</span><textarea maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Allergies or delivery details" rows={3} /></label>
        <button className={styles.placeOrder} disabled={busy || total <= 0}>{busy ? "Sending your order…" : "Place order"}<span>· GH₵ {total.toFixed(2)}</span></button>
        {message && <p className={styles.message} role="status">{message}</p>}
        <small className={styles.secureNote}>{requiresStayCode ? "Your stay code keeps your room folio secure." : "Orders are linked to your signed-in guest account and active stay."}</small>
      </aside> : <aside className={styles.checkoutPanel}><div className={styles.checkoutHeading}><div><p className={styles.eyebrow}>Room service</p><h2>Browse the menu</h2></div></div><p className={styles.cartEmpty}>Place an order after check-in by scanning the QR code in your room. Your order will be added to your room folio.</p><a className={styles.placeOrder} href="/rooms">Explore our rooms <span aria-hidden="true">→</span></a></aside>}
    </div>
  </form>
  </>;
}
