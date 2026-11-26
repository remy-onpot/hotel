"use client";

import { useState } from "react";
import styles from "./styles.module.css";

async function parseResponse(response) {
  let result;
  try { result = await response.json(); } catch { throw new Error("The gallery service returned an unreadable response."); }
  if (!response.ok) throw new Error(result.error ?? "The gallery could not be updated.");
  return result;
}

async function updateImage(payload) {
  return parseResponse(await fetch("/api/admin/gallery", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

export default function GalleryManager({ initialImages, imageStorageReady }) {
  const [images, setImages] = useState(initialImages);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function addImage(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/gallery", { method: "POST", body: data });
      const result = await parseResponse(response);
      setImages((current) => [...current, result.image].sort((left, right) => left.display_order - right.display_order));
      form.reset();
      setMessage("Gallery image uploaded and published.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function saveImage(image, values) {
    setBusy(true);
    setMessage("");
    try {
      await updateImage({ id: image.id, ...values });
      setImages((current) => current.map((item) => item.id === image.id ? { ...item, ...values } : item));
      setMessage("Gallery image updated.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function moveImage(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const updates = reordered.map((image, position) => ({ ...image, display_order: position }));
    setBusy(true);
    setMessage("");
    try {
      await Promise.all([index, targetIndex].map((position) => updateImage({ id: updates[position].id, display_order: position })));
      setImages(updates);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function removeImage(image) {
    if (!window.confirm(`Remove “${image.title || image.alt_text}” from the property gallery?`)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/gallery?id=${encodeURIComponent(image.id)}`, { method: "DELETE" });
      const result = await parseResponse(response);
      setImages((current) => current.filter((item) => item.id !== image.id));
      setMessage(result.cleanupWarning ? "Image removed. Storage cleanup needs attention." : "Image removed from the gallery.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  return <>
    <div className={styles.workspace}>
      <form className={styles.uploadCard} onSubmit={addImage}>
        <div className={styles.uploadIntro}><span className={styles.uploadIcon} aria-hidden="true">＋</span><div><p className={styles.eyebrow}>Add to the collection</p><h2>Upload a property photo</h2><p>Show guests the spaces beyond their room.</p></div></div>
        <label>Photo title <span>Optional, shown below the image</span><input name="title" maxLength="120" placeholder="Rooftop terrace at sunset" /></label>
        <label>Image description <span>Required for accessibility</span><input name="alt_text" required maxLength="180" placeholder="Guests relaxing on the rooftop terrace" /></label>
        <label className={styles.fileField}>Choose photo <span>JPEG, PNG, WebP, or AVIF · up to 8 MB</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required disabled={!imageStorageReady} /></label>
        <button className={styles.primaryButton} type="submit" disabled={busy || !imageStorageReady}>{busy ? "Saving…" : "Upload photo"}</button>
      </form>

      <section className={styles.collection} aria-labelledby="gallery-collection-title">
        <div className={styles.collectionHeading}><div><p className={styles.eyebrow}>Curated for your guests</p><h2 id="gallery-collection-title">Gallery collection</h2></div><span>{images.filter((image) => image.is_published).length} published</span></div>
        {message && <p className={styles.message} role="status" aria-live="polite">{message}</p>}
        {images.length ? <div className={styles.grid}>{images.map((image, index) => <article key={image.id} className={`${styles.imageCard} ${!image.is_published ? styles.hiddenCard : ""}`}>
          <div className={styles.imageFrame}>{image.imageUrl ? <img src={image.imageUrl} alt={image.alt_text} /> : <div className={styles.imageFallback}>Image preview unavailable</div>}<span className={image.is_published ? styles.publishedBadge : styles.hiddenBadge}>{image.is_published ? "Published" : "Hidden"}</span></div>
          <form className={styles.imageDetails} onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const title = String(formData.get("title") ?? "").trim();
            const alt_text = String(formData.get("alt_text") ?? "").trim();
            return saveImage(image, { title, alt_text });
          }}>
            <label>Photo title<input name="title" maxLength="120" defaultValue={image.title} placeholder="Add a caption" /></label>
            <label>Image description<input name="alt_text" required maxLength="180" defaultValue={image.alt_text} /></label>
            <div className={styles.cardActions}>
              <button className={styles.primaryButton} disabled={busy}>Save details</button>
              <button type="button" onClick={() => saveImage(image, { is_published: !image.is_published })} disabled={busy}>{image.is_published ? "Hide" : "Publish"}</button>
            </div>
            <div className={styles.cardFooter}>
              <div><button type="button" aria-label={`Move ${image.title || "image"} up`} onClick={() => moveImage(index, -1)} disabled={busy || index === 0}>↑</button><button type="button" aria-label={`Move ${image.title || "image"} down`} onClick={() => moveImage(index, 1)} disabled={busy || index === images.length - 1}>↓</button></div>
              <button className={styles.deleteButton} type="button" onClick={() => removeImage(image)} disabled={busy}>Remove</button>
            </div>
          </form>
        </article>)}</div> : <div className={styles.empty}><span aria-hidden="true">✦</span><h3>Your gallery starts here</h3><p>Upload property photos to help guests picture their stay.</p></div>}
      </section>
    </div>
  </>;
}
