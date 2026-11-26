"use client";

import { useMemo, useState } from "react";
import styles from "./store.module.css";

export default function RoomStore({ qrToken, roomNumber, products }) {
  const [cart, setCart] = useState({});
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const total = useMemo(() => products.reduce((sum, item) => sum + Number(item.price_ghs) * (cart[item.id] ?? 0), 0), [products, cart]);

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
        body: JSON.stringify({ qrToken, code, note, items: Object.entries(cart).filter(([, quantity]) => quantity > 0).map(([productId, quantity]) => ({ productId: Number(productId), quantity })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not place your order.");
      setCart({}); setNote("");
      setMessage(`Order #${result.orderId} has been sent to room service. GHS ${Number(result.total).toFixed(2)} will be added to your room folio.`);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  if (!products.length) return <section className={styles.empty}><span>—</span><h2>The menu is resting</h2><p>There are no available items at the moment. Please contact the front desk and we’ll be happy to help.</p></section>;

  return <form onSubmit={submit} className={styles.orderForm}>
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
              <div className={styles.productActions}>{quantity === 0 ? <button className={styles.addButton} type="button" onClick={() => changeQuantity(product.id, 1)}>Add to order <span>＋</span></button> : <div className={styles.quantityControl}><button type="button" aria-label={`Remove one ${product.name}`} onClick={() => changeQuantity(product.id, -1)}>−</button><strong>{quantity}</strong><button type="button" aria-label={`Add one ${product.name}`} disabled={quantity >= 20} onClick={() => changeQuantity(product.id, 1)}>＋</button></div>}</div>
            </div>
          </article>;
        })}
      </section>

      <aside className={styles.checkoutPanel}>
        <div className={styles.checkoutHeading}><div><p className={styles.eyebrow}>Your selection</p><h2>Your order</h2></div><span className={styles.roomPill}>Room {roomNumber}</span></div>
        {count ? <ul className={styles.cartList}>{products.filter((product) => cart[product.id]).map((product) => <li key={product.id}><span>{cart[product.id]} × {product.name}</span><strong>GH₵ {(Number(product.price_ghs) * cart[product.id]).toFixed(2)}</strong></li>)}</ul> : <p className={styles.cartEmpty}>Your order is empty. Add something from the menu to begin.</p>}
        <div className={styles.totalRow}><span>Estimated total</span><strong>GH₵ {total.toFixed(2)}</strong></div>
        <p className={styles.folioNote}>Charged to your room folio and settled at checkout.</p>
        <label className={styles.field}>Stay access code<input required minLength={8} maxLength={64} autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Provided by the front desk" /></label>
        <label className={styles.field}>A note for the team <span>Optional</span><textarea maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Allergies or delivery details" rows={3} /></label>
        <button className={styles.placeOrder} disabled={busy || total <= 0}>{busy ? "Sending your order…" : "Place order"}<span>· GH₵ {total.toFixed(2)}</span></button>
        {message && <p className={styles.message} role="status">{message}</p>}
        <small className={styles.secureNote}>Your stay code keeps your room folio secure.</small>
      </aside>
    </div>
  </form>;
}
