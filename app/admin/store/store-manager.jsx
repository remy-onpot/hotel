"use client";

import { useState } from "react";
import styles from "./store.module.css";

async function request(url, body, method) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Could not save item.");
  return result;
}

function validateImage(image) {
  if (!image) return;
  if (!image.size) throw new Error("The selected image is empty. Choose a valid image file.");
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
  if (!allowedTypes.has(image.type)) throw new Error("Choose a JPEG, PNG, WebP, or AVIF image.");
  if (image.size > 8 * 1024 * 1024) throw new Error("Choose an image up to 8 MB.");
}

async function uploadImage(productId, image) {
  if (!image) return null;
  validateImage(image);
  const form = new FormData();
  form.set("productId", String(productId));
  form.set("image", image);
  // Leave Content-Type unset so fetch adds the multipart boundary for this FormData.
  const response = await fetch("/api/admin/store/image", { method: "POST", body: form });
  let result;
  try { result = await response.json(); }
  catch { throw new Error("The image service returned an unreadable response. Check the server log and try again."); }
  if (!response.ok) throw new Error(result.error ?? "Could not upload item photo.");
  return result;
}

function fields(form) {
  const data = new FormData(form);
  return {
    name: String(data.get("name") ?? "").trim(),
    description: String(data.get("description") ?? "").trim(),
    price_ghs: data.get("price_ghs"),
    price_usd: data.get("price_usd"),
  };
}

export default function StoreManager({ products: initial, imageStorageReady }) {
  const [products, setProducts] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveNew(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setMessage("");
    try {
      const photo = form.elements.image.files[0];
      validateImage(photo);
      const result = await request("/api/admin/store", fields(form), "POST");
      let product = { ...result.product, imageUrl: "" };
      setProducts((current) => [...current, product].sort((a, b) => a.name.localeCompare(b.name)));
      form.reset();
      if (photo) {
        try {
          const image = await uploadImage(product.id, photo);
          product = { ...product, ...image };
          setProducts((current) => current.map((item) => item.id === product.id ? product : item));
        } catch (error) {
          setMessage(`Menu item was added, but its photo was not uploaded: ${error.message}`);
          return;
        }
      }
      setMessage("Menu item saved.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function saveEdit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setMessage("");
    try {
      const values = fields(form);
      const photo = form.elements.image.files[0];
      validateImage(photo);
      await request("/api/admin/store", { ...values, id: editing.id }, "PATCH");
      let updated = { ...editing, ...values, price_ghs: Number(values.price_ghs), price_usd: values.price_usd === "" ? null : Number(values.price_usd) };
      setProducts((current) => current.map((item) => item.id === editing.id ? updated : item));
      if (photo) {
        try { updated = { ...updated, ...(await uploadImage(editing.id, photo)) }; }
        catch (error) {
          setMessage(`Item details were saved, but its photo was not uploaded: ${error.message}`);
          return;
        }
      }
      setProducts((current) => current.map((item) => item.id === editing.id ? updated : item));
      setEditing(null);
      setMessage("Menu item updated.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function toggle(item) {
    try {
      await request("/api/admin/store", { id: item.id, is_available: !item.is_available }, "PATCH");
      setProducts((current) => current.map((row) => row.id === item.id ? { ...row, is_available: !row.is_available } : row));
    } catch (error) { setMessage(error.message); }
  }

  return <>
    <section className={styles.workspace}>
      <form className={styles.formCard} onSubmit={saveNew}>
        <p className={styles.eyebrow}>Build your menu</p>
        <h2>Add an item</h2>
        <label>Item name<input name="name" required maxLength="120" placeholder="e.g. Grilled tilapia" /></label>
        <label>Description<textarea name="description" maxLength="1000" rows="3" placeholder="A short description guests can scan quickly" /></label>
        <div className={styles.priceFields}>
          <label>Price in GHS<input name="price_ghs" type="number" min="0" step="0.01" required placeholder="0.00" /></label>
          <label>USD display price<input name="price_usd" type="number" min="0" step="0.01" placeholder="Optional" /></label>
        </div>
        <label className={styles.upload}>Item photo <span>JPEG, PNG, WebP or AVIF · up to 8 MB</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={!imageStorageReady} /></label>
        {!imageStorageReady && <p className={styles.hint}>Set up the hotel image storage bucket to add photos.</p>}
        <button className={styles.primaryButton} disabled={busy}>{busy ? "Saving…" : "Add to menu"}</button>
      </form>

      <section className={styles.menuSection}>
        <div className={styles.menuHeading}><div><p className={styles.eyebrow}>Currently listed</p><h2>Menu items</h2></div><span>{products.filter((item) => item.is_available).length} available</span></div>
        {message && <p className={styles.message} role="status" aria-live="polite">{message}</p>}
        {products.length ? <div className={styles.productGrid}>{products.map((item) => <article className={`${styles.productCard} ${!item.is_available ? styles.hiddenCard : ""}`} key={item.id}>
          <div className={styles.imageFrame}>{item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <div className={styles.imagePlaceholder}><span>THE WINFORD</span><small>ROOM SERVICE</small></div>}<span className={item.is_available ? styles.available : styles.unavailable}>{item.is_available ? "Available" : "Hidden"}</span></div>
          <div className={styles.productInfo}><div><h3>{item.name}</h3><p>{item.description || "No description added."}</p></div><strong>GH₵ {Number(item.price_ghs).toFixed(2)}{item.price_usd != null && <small> · ${Number(item.price_usd).toFixed(2)}</small>}</strong>
            {editing?.id === item.id ? <form className={styles.editForm} onSubmit={saveEdit}>
              <label>Name<input name="name" required maxLength="120" defaultValue={item.name} /></label>
              <label>Description<textarea name="description" maxLength="1000" rows="2" defaultValue={item.description} /></label>
              <div className={styles.priceFields}><label>GHS<input name="price_ghs" type="number" min="0" step="0.01" required defaultValue={item.price_ghs} /></label><label>USD<input name="price_usd" type="number" min="0" step="0.01" defaultValue={item.price_usd ?? ""} /></label></div>
              <label className={styles.upload}>Replace photo<input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={!imageStorageReady} /></label>
              <div className={styles.actions}><button className={styles.primaryButton} disabled={busy}>Save changes</button><button className={styles.secondaryButton} type="button" onClick={() => setEditing(null)}>Cancel</button></div>
            </form> : <div className={styles.actions}><button className={styles.secondaryButton} type="button" onClick={() => setEditing(item)}>Edit item</button><button className={styles.textButton} type="button" onClick={() => toggle(item)}>{item.is_available ? "Hide" : "Make available"}</button></div>}
          </div>
        </article>)}</div> : <div className={styles.empty}><h3>Your menu starts here</h3><p>Add an item and its photo to show guests what room service has to offer.</p></div>}
      </section>
    </section>
  </>;
}
