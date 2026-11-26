"use client";

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faUpload } from "@fortawesome/free-solid-svg-icons";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { formatRoomPrice } from "@/app/_lib/money";
import { QRCodeSVG } from "qrcode.react";
import AmenitySelector from "./amenity-selector";

function escapeXml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]);
}

function RoomQrDownload({ roomName, roomNumber, url }) {
  const qrRef = useRef(null);
  function downloadQr() {
    const svg = qrRef.current;
    if (!svg) return;
    const room = escapeXml(roomNumber);
    const type = escapeXml(roomName);
    const qrMarkup = svg.innerHTML;
    const source = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960" viewBox="0 0 720 960">
      <rect width="720" height="960" fill="#eee9dd"/>
      <rect x="24" y="24" width="672" height="912" rx="16" fill="#fffdf8" stroke="#d8c9ad" stroke-width="2"/>
      <path d="M40 40h632v218H40z" fill="#173b34"/>
      <path d="M80 253h560" stroke="#bd9a66" stroke-width="2"/>
      <text x="360" y="102" text-anchor="middle" fill="#f8f5ed" font-family="Georgia,serif" font-size="33" letter-spacing="5">THE WINFORD</text>
      <text x="360" y="132" text-anchor="middle" fill="#cbd9d1" font-family="Arial,sans-serif" font-size="12" letter-spacing="5">BOUTIQUE HOTEL</text>
      <text x="360" y="198" text-anchor="middle" fill="#d7bc8f" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="4">IN-ROOM DINING</text>
      <text x="360" y="313" text-anchor="middle" fill="#a27a45" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="4">ORDERING FOR</text>
      <text x="360" y="382" text-anchor="middle" fill="#173b34" font-family="Georgia,serif" font-size="56" letter-spacing="2">ROOM ${room}</text>
      <text x="360" y="421" text-anchor="middle" fill="#65736b" font-family="Arial,sans-serif" font-size="19">${type}</text>
      <rect x="186" y="455" width="348" height="348" rx="9" fill="#ffffff" stroke="#e6dfd2" stroke-width="2"/>
      <svg x="200" y="469" width="320" height="320" viewBox="${svg.getAttribute("viewBox") || "0 0 320 320"}" shape-rendering="crispEdges">${qrMarkup}</svg>
      <text x="360" y="850" text-anchor="middle" fill="#173b34" font-family="Georgia,serif" font-size="23">Scan to browse our room service menu</text>
      <text x="360" y="883" text-anchor="middle" fill="#737d75" font-family="Arial,sans-serif" font-size="14">Please ask the front desk for your stay access code.</text>
      <path d="M220 911h280" stroke="#bd9a66" stroke-width="1"/>
    </svg>`;
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `winford-room-${String(roomNumber).replace(/[^a-zA-Z0-9-]/g, "-")}-qr.svg`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  return <div className={styles.qrDownload}>
    <div aria-hidden="true" className={styles.hiddenQr}>
      <QRCodeSVG ref={qrRef} value={url} size={320} level="H" includeMargin />
    </div>
    <span>Room {roomNumber}</span>
    <button className={styles.qrDownloadButton} type="button" onClick={downloadQr}>Download room placard</button>
  </div>;
}

async function getResponse(response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "The request failed.");
  return result;
}

function AdminDialog({ title, message, isError, busy, onClose, children }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [busy, onClose]);

  if (!isMounted) return null;

  return createPortal(
    <div
      className={styles.dialogOverlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="room-dialog-title">
        <header className={styles.dialogHeader}>
          <h2 id="room-dialog-title">{title}</h2>
          <button className={styles.dialogClose} type="button" onClick={onClose} disabled={busy} aria-label="Close dialog">
            ×
          </button>
        </header>
        {children}
        {message && <p className={isError ? styles.error : styles.success} role={isError ? "alert" : "status"}>{message}</p>}
      </section>
    </div>,
    document.body
  );
}

export default function RoomImageManager({ rooms, appUrl }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [uploadingRoom, setUploadingRoom] = useState(null);

  function openDialog(nextDialog) {
    setMessage("");
    setIsError(false);
    setDialog(nextDialog);
  }

  function closeDialog() {
    if (!busy) setDialog(null);
  }

  async function runRequest(request, successMessage) {
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      const result = await request();
      setMessage(result.warning ?? successMessage);
      setIsError(Boolean(result.isWarning));
      router.refresh();
      return result;
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "The request failed. Try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateRoom(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(formData);
    values.features = [...formData.getAll("features"), ...String(formData.get("custom_features") ?? "").split(/\r?\n/).map((feature) => feature.trim()).filter(Boolean)];
    const result = await runRequest(async () => {
      const response = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      return getResponse(response);
    }, "Room added. Upload a thumbnail to finish setting it up.");
    if (result) {
      form.reset();
      setDialog(null);
    }
  }

  async function handleUpdateRoom(event, room) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData);
    values.features = [...formData.getAll("features"), ...String(formData.get("custom_features") ?? "").split(/\r?\n/).map((feature) => feature.trim()).filter(Boolean)];
    const result = await runRequest(async () => {
      const response = await fetch("/api/admin/rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: room.id,
          name: values.name,
          price: values.price,
          price_usd: values.price_usd,
          room_numbers: values.room_numbers,
          features: values.features,
        }),
      });
      return getResponse(response);
    }, "Room details saved.");
    if (result) setDialog(null);
  }

  async function handleDeleteRoom() {
    const room = dialog.room;
    const result = await runRequest(async () => {
      const response = await fetch(`/api/admin/rooms?id=${room.id}`, { method: "DELETE" });
      const deleted = await getResponse(response);
      return {
        ...deleted,
        warning: deleted.imageCleanupWarning
          ? `Deleted ${room.name}, but one or more stored images could not be removed.`
          : undefined,
      };
    }, `Deleted ${room.name}.`);
    if (result) setDialog(null);
  }

  async function handleDeleteImage() {
    const { room, path, label } = dialog;
    const params = new URLSearchParams({ roomId: String(room.id), path });
    const result = await runRequest(async () => {
      const response = await fetch(`/api/admin/room-images?${params}`, { method: "DELETE" });
      return getResponse(response);
    }, `${label} deleted.`);
    if (result) setDialog(null);
  }

  async function handleUpload(event, room) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    const form = input.form;
    if (!files.length || !form) return;
    if (files.length > 10) {
      setIsError(true);
      setMessage("Choose up to 10 images at a time.");
      input.value = "";
      return;
    }

    setUploadingRoom(room.id);
    const result = await runRequest(async () => {
      const response = await fetch("/api/admin/room-images", {
        method: "POST",
        body: new FormData(form),
      });
      const upload = await getResponse(response);
      const warning = upload.failures?.length
        ? `Uploaded ${upload.uploadedCount} of ${upload.totalCount} images for ${room.name}. Failed: ${upload.failures.map((failure) => failure.name).join(", ")}.`
        : `Uploaded ${upload.uploadedCount} image${upload.uploadedCount === 1 ? "" : "s"} for ${room.name}.`;
      return { ...upload, warning, isWarning: Boolean(upload.failures?.length) };
    }, "Images uploaded.");
    if (result) form.reset();
    setUploadingRoom(null);
  }

  const dialogTitle = dialog?.type === "create"
    ? "Add a room"
    : dialog?.type === "edit"
      ? "Edit room details"
      : dialog?.type === "delete-room"
        ? "Delete room?"
        : dialog?.type === "delete-image"
          ? "Delete room image?"
          : dialog?.type === "features"
            ? `Features · ${dialog.room.name}`
            : "";

  return (
    <>
      <div className={styles.toolbar}>
        <button type="button" disabled={busy} onClick={() => openDialog({ type: "create" })}>
          Add room
        </button>
      </div>

      {message && !dialog && <p className={isError ? styles.error : styles.success} role={isError ? "alert" : "status"}>{message}</p>}

      <section className={styles.roomGrid} aria-label="Room management">
        {rooms.map((room) => (
          <article className={styles.roomCard} key={room.id}>
            <div className={styles.roomCardHeader}>
              <div>
                <h2>{room.name}</h2>
                <p className={styles.roomId}>Room #{room.id}</p>
              </div>
              <div className={styles.roomActions}>
                {room.features?.length > 0 && <button className={styles.featureViewButton} type="button" disabled={busy} onClick={() => openDialog({ type: "features", room })}>
                  View features <span>{room.features.length}</span>
                </button>}
                <button className={styles.editButton} type="button" disabled={busy} onClick={() => openDialog({ type: "edit", room })}>
                  <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                  <span>Edit details</span>
                </button>
                <button className={styles.dangerButton} type="button" disabled={busy} onClick={() => openDialog({ type: "delete-room", room })}>
                  Delete room
                </button>
              </div>
            </div>

            <p className={styles.roomPrice}>Price per night: {formatRoomPrice(room.price, room.price_usd)}</p>
            <p className={styles.inventory}>{room.units?.filter((unit) => unit.is_active).length ?? 0} numbered physical room{room.units?.filter((unit) => unit.is_active).length === 1 ? "" : "s"}</p>
            <div className={styles.featureTags} aria-label={`${room.name} room numbers`}>
              {(room.units ?? []).filter((unit) => unit.is_active).map((unit) => {
                const url = `${appUrl}/store/room/${unit.qr_token}`;
                return <RoomQrDownload key={unit.id} roomName={room.name} roomNumber={unit.room_number} url={url} />;
              })}
            </div>

            <form className={styles.imageUploadControls}>
              <input type="hidden" name="roomId" value={room.id} />
              <label className={styles.thumbnailOption}>
                <input type="checkbox" name="setFirstAsThumbnail" disabled={busy} />
                Use the first successfully uploaded image as the room cover
              </label>
              <label className={`${styles.uploadButton} ${busy ? styles.uploadDisabled : ""}`}>
                <FontAwesomeIcon icon={faUpload} aria-hidden="true" />
                <span>{uploadingRoom === room.id ? "Uploading..." : "Upload images"}</span>
                <input
                  className={styles.multiFileInput}
                  name="files"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  disabled={busy}
                  onChange={(event) => handleUpload(event, room)}
                />
              </label>
              <span className={styles.helpText}>Choose up to 10 JPEG, PNG, WebP, or AVIF images (8 MB each).</span>
            </form>

            <div className={styles.imageGrid}>
              <figure>
                <div className={styles.imageFrame}>
                  <Image fill sizes="(max-width: 700px) 100vw, 320px" quality={90} src={room.thumbnailUrl || "/room-placeholder.svg"} alt={`${room.name} thumbnail`} />
                </div>
                <figcaption>Thumbnail</figcaption>
                {room.thumbnail && (
                  <button className={styles.imageDeleteButton} type="button" disabled={busy} onClick={() => openDialog({ type: "delete-image", room, path: room.thumbnail, label: "Thumbnail" })}>
                    Delete thumbnail
                  </button>
                )}
              </figure>
              {room.images
                .filter((image) => image.img_path !== room.thumbnail)
                .map((image) => (
                  <figure key={image.id}>
                    <div className={styles.imageFrame}>
                      <Image fill sizes="(max-width: 700px) 100vw, 320px" quality={90} src={image.publicUrl || "/room-placeholder.svg"} alt={`${room.name} gallery`} />
                    </div>
                    <figcaption>Gallery image</figcaption>
                    <button className={styles.imageDeleteButton} type="button" disabled={busy} onClick={() => openDialog({ type: "delete-image", room, path: image.img_path, label: "Gallery image" })}>
                      Delete image
                    </button>
                  </figure>
                ))}
            </div>
          </article>
        ))}
      </section>

      {rooms.length === 0 && <p>No rooms found. Use “Add room” to get started.</p>}

      {dialog && (
        <AdminDialog title={dialogTitle} message={message} isError={isError} busy={busy} onClose={closeDialog}>
          {dialog.type === "create" && (
            <form className={styles.dialogForm} onSubmit={handleCreateRoom}>
              <label>Room name<input name="name" required maxLength={120} autoFocus /></label>
              <label>Price per night (GHS)<input name="price" type="number" min="0" step="0.01" required /></label>
              <label>Display price per night (USD)<input name="price_usd" type="number" min="0" step="0.01" placeholder="Optional" /><span className={styles.helpText}>Entered by staff; shown as written, with no exchange-rate conversion. Bookings use the GHS price.</span></label>
              <label>Guest capacity<input name="capacity" type="number" min="1" max="50" step="1" defaultValue="2" required /></label>
              <label>Sleeps<input name="sleeps" type="number" min="1" max="50" step="1" defaultValue="2" required /></label>
              <label className={styles.wideField}>Physical room numbers<textarea name="room_numbers" rows="4" required placeholder="101&#10;102&#10;103" /><span className={styles.helpText}>Enter one existing room number per line. A permanent order QR is generated for each room.</span></label>
              <label className={styles.wideField}>Description<textarea name="description" rows="3" maxLength={5000} /></label>
              <AmenitySelector defaultAll />
              <div className={styles.dialogActions}>
                <button type="button" className={styles.secondaryButton} disabled={busy} onClick={closeDialog}>Cancel</button>
                <button type="submit" disabled={busy}>{busy ? "Saving…" : "Add room"}</button>
              </div>
            </form>
          )}

          {dialog.type === "edit" && (
            <form className={styles.dialogForm} onSubmit={(event) => handleUpdateRoom(event, dialog.room)}>
              <p>Update room details and the two nightly prices. GHS is used for bookings and payments; USD is display-only.</p>
              <label>Room name<input name="name" defaultValue={dialog.room.name} required maxLength={120} autoFocus /></label>
              <label>Price per night (GHS)<input name="price" type="number" min="0" step="0.01" defaultValue={dialog.room.price} required /></label>
              <label>Display price per night (USD)<input name="price_usd" type="number" min="0" step="0.01" defaultValue={dialog.room.price_usd ?? ""} placeholder="Optional" /><span className={styles.helpText}>Entered by staff; shown as written, with no exchange-rate conversion. Bookings use the GHS price.</span></label>
              <label className={styles.wideField}>Physical room numbers<textarea name="room_numbers" rows="5" defaultValue={(dialog.room.units ?? []).filter((unit) => unit.is_active).map((unit) => unit.room_number).join("\n")} required /><span className={styles.helpText}>One room number per line. Rooms with an upcoming or active stay cannot be removed.</span></label>
              <AmenitySelector features={dialog.room.features ?? []} />
              <div className={styles.dialogActions}>
                <button type="button" className={styles.secondaryButton} disabled={busy} onClick={closeDialog}>Cancel</button>
                <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
              </div>
            </form>
          )}

          {dialog.type === "delete-room" && (
            <div className={styles.dialogBody}>
              <p>Delete <strong>{dialog.room.name}</strong> and its stored images? This can’t be undone. A room with reservations cannot be deleted.</p>
              <div className={styles.dialogActions}>
                <button type="button" className={styles.secondaryButton} disabled={busy} onClick={closeDialog}>Cancel</button>
                <button type="button" className={styles.dangerButton} disabled={busy} onClick={handleDeleteRoom}>{busy ? "Deleting…" : "Delete room"}</button>
              </div>
            </div>
          )}

          {dialog.type === "delete-image" && (
            <div className={styles.dialogBody}>
              <p>Delete this {dialog.label.toLowerCase()} from <strong>{dialog.room.name}</strong>? This can’t be undone.</p>
              <div className={styles.dialogActions}>
                <button type="button" className={styles.secondaryButton} disabled={busy} onClick={closeDialog}>Cancel</button>
                <button type="button" className={styles.dangerButton} disabled={busy} onClick={handleDeleteImage}>{busy ? "Deleting…" : "Delete image"}</button>
              </div>
            </div>
          )}

          {dialog.type === "features" && (
            <div className={styles.featureModal}>
              <p>Features available in this room type.</p>
              <ul>{(dialog.room.features ?? []).map((feature) => <li key={feature}>{feature}</li>)}</ul>
            </div>
          )}
        </AdminDialog>
      )}
    </>
  );
}
