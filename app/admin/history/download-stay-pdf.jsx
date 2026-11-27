"use client";

import styles from "./history.module.css";

function createStayPdf(stay, transactions, orders, reservationCurrency) {
  const clean = (value) => String(value ?? "—").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7e]/g, "?");
  const escapePdf = (value) => clean(value).replace(/([\\()])/g, "\\$1");
  const rgb = (hex) => hex.match(/[0-9a-f]{2}/gi).map((part) => (parseInt(part, 16) / 255).toFixed(3)).join(" ");
  const colors = {
    green: rgb("#173b34"), greenMid: rgb("#315b46"), gold: rgb("#b28a56"),
    ink: rgb("#293a33"), muted: rgb("#6c776f"), pale: rgb("#f5f3ee"),
    line: rgb("#e5e3dc"), white: "1 1 1", amber: rgb("#805519"), red: rgb("#a53225"),
  };
  const text = (x, y, value, size = 9, color = colors.ink, font = "F1") => `BT /${font} ${size} Tf ${color} rg ${x} ${y} Td (${escapePdf(value)}) Tj ET`;
  const rect = (x, y, width, height, fill, stroke = null) => `${fill ? `${fill} rg ` : ""}${stroke ? `${stroke} RG 0.7 w ` : ""}${x} ${y} ${width} ${height} re ${fill && stroke ? "B" : fill ? "f" : "S"}`;
  const rule = (x1, y1, x2, y2, color = colors.line, width = 0.7) => `${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`;
  const wrap = (value, limit = 42) => {
    const words = clean(value).split(/\s+/);
    const lines = [];
    let current = "";
    for (const word of words) {
      if (word.length > limit) {
        if (current) lines.push(current);
        current = "";
        for (let index = 0; index < word.length; index += limit) lines.push(word.slice(index, index + limit));
      } else if (!current) current = word;
      else if (`${current} ${word}`.length <= limit) current += ` ${word}`;
      else { lines.push(current); current = word; }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  };
  const shortDateTime = (value) => value
    ? new Intl.DateTimeFormat("en-GH", { timeZone: "Africa/Accra", dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "Not recorded";
  const shortDate = (value) => new Intl.DateTimeFormat("en-GH", { timeZone: "Africa/Accra", dateStyle: "medium" }).format(new Date(`${value}T12:00:00Z`));
  const nightCount = Math.max(0, Math.round((new Date(`${stay.end_date}T00:00:00Z`) - new Date(`${stay.start_date}T00:00:00Z`)) / 86400000));
  const statusColor = stay.status === "finished" ? colors.greenMid : ["cancelled", "canceled", "expired"].includes(stay.status) ? colors.muted : colors.amber;
  const pages = [];
  let commands;
  let y;
  const newPage = (continued = false) => {
    commands = [
      rect(0, 658, 612, 134, colors.green),
      text(42, 756, "THE WINFORD", 11, colors.white, "F2"),
      text(42, 739, "BOUTIQUE HOTEL ACHIMOTA", 7.5, "0.820 0.866 0.831", "F2"),
      rect(42, 729, 54, 2, colors.gold),
      text(42, 695, continued ? "Stay record / continued" : "Guest stay record", 24, colors.white, "F3"),
      text(42, 674, `RESERVATION #${stay.id}`, 7.5, "0.820 0.866 0.831", "F2"),
      rect(455, 724, 115, 24, colors.white),
      text(465, 733, stay.status.replaceAll("_", " ").toUpperCase(), 7, colors.green, "F2"),
      rect(0, 654, 612, 4, colors.gold),
    ];
    y = 632;
    pages.push(commands);
  };
  const ensureSpace = (height) => { if (y - height < 58) newPage(true); };
  const section = (title, detail = "") => {
    ensureSpace(28);
    commands.push(rect(42, y - 2, 3, 12, colors.gold));
    commands.push(text(53, y, title.toUpperCase(), 8, colors.green, "F2"));
    if (detail) commands.push(text(360, y, detail, 7, colors.muted));
    y -= 19;
  };
  const keyValue = (x, labelY, label, value, maxChars = 36) => {
    commands.push(text(x, labelY, label.toUpperCase(), 6.4, colors.muted, "F2"));
    const valueLines = wrap(value, maxChars).slice(0, 2);
    valueLines.forEach((valueLine, index) => commands.push(text(x, labelY - 13 - index * 10, valueLine, 8.2, colors.ink, "F2")));
  };
  const infoCard = (height, cells) => {
    ensureSpace(height + 8);
    const top = y;
    commands.push(rect(42, top - height, 528, height, colors.white, colors.line));
    cells.forEach((cell) => keyValue(cell.x, top - 16, cell.label, cell.value, cell.maxChars ?? 38));
    y = top - height - 12;
  };
  const footer = (page, index) => {
    page.push(rule(42, 45, 570, 45, colors.line));
    page.push(text(42, 29, "THE WINFORD  /  HOTEL ADMINISTRATION  /  ACCRA, GHANA", 7, colors.muted, "F2"));
    page.push(text(520, 29, `${index + 1} / ${pages.length}`, 7, colors.muted));
  };

  newPage();
  // Guest banner and stay summary.
  commands.push(rect(42, y - 66, 528, 60, colors.pale));
  commands.push(rect(42, y - 66, 4, 60, colors.gold));
  commands.push(text(58, y - 25, stay.guests?.fullname ?? "Guest", 16, colors.green, "F3"));
  commands.push(text(58, y - 44, `${stay.rooms?.name ?? "Room type"}${stay.room_units?.room_number ? `  /  Room ${stay.room_units.room_number}` : ""}`, 8.5, colors.muted));
  y -= 79;

  const summaryWidth = 168;
  const summaryCards = [
    { x: 42, label: "LENGTH OF STAY", value: `${nightCount} night${nightCount === 1 ? "" : "s"}` },
    { x: 222, label: "GUESTS", value: String(stay.guests_count ?? "—") },
    { x: 402, label: "ROOM STATUS", value: stay.status.replaceAll("_", " ").toUpperCase() },
  ];
  summaryCards.forEach((card) => {
    commands.push(rect(card.x, y - 47, summaryWidth, 47, colors.white, colors.line));
    commands.push(text(card.x + 11, y - 17, card.label, 6.5, colors.muted, "F2"));
    commands.push(text(card.x + 11, y - 36, card.value, 9, card.label === "ROOM STATUS" ? statusColor : colors.green, "F2"));
  });
  y -= 65;

  section("Guest information");
  infoCard(65, [
    { x: 54, label: "Full name", value: stay.guests?.fullname ?? "Not recorded" },
    { x: 316, label: "Phone", value: stay.guests?.phone ?? "Not recorded" },
    { x: 54, label: "Email", value: stay.guests?.email ?? "Not recorded", maxChars: 40 },
    { x: 316, label: "Reservation created", value: shortDateTime(stay.created_at), maxChars: 34 },
  ]);

  section("Stay timeline");
  infoCard(69, [
    { x: 54, label: "Arrival / check-in", value: shortDate(stay.start_date) },
    { x: 316, label: "Departure / check-out", value: shortDate(stay.end_date) },
    { x: 54, label: "Checked in", value: shortDateTime(stay.checked_in_at) },
    { x: 316, label: "Checked out", value: shortDateTime(stay.checked_out_at) },
  ]);

  section("Reservation amount", stay.currency ?? "Currency recorded with payment transaction");
  const currency = reservationCurrency ? `${reservationCurrency} ` : "";
  infoCard(48, [
    { x: 54, label: "Room reservation total", value: `${currency}${Number(stay.reserved_price ?? 0).toFixed(2)}`, maxChars: 30 },
    { x: 316, label: "Room", value: `${stay.rooms?.name ?? "Room type"}${stay.room_units?.room_number ? ` / ${stay.room_units.room_number}` : ""}`, maxChars: 36 },
  ]);

  section("Payment transactions", `${transactions.length} record${transactions.length === 1 ? "" : "s"}`);
  if (transactions.length) {
    ensureSpace(24);
    commands.push(rect(42, y - 18, 528, 20, colors.green));
    commands.push(text(52, y - 11, "TYPE / PROVIDER", 6.3, colors.white, "F2"));
    commands.push(text(220, y - 11, "DATE", 6.3, colors.white, "F2"));
    commands.push(text(355, y - 11, "AMOUNT", 6.3, colors.white, "F2"));
    commands.push(text(465, y - 11, "STATUS", 6.3, colors.white, "F2"));
    y -= 20;
    transactions.forEach((transaction, index) => {
      ensureSpace(31);
      const rowBottom = y - 28;
      if (index % 2 === 0) commands.push(rect(42, rowBottom, 528, 28, colors.pale));
      commands.push(text(52, y - 12, `${transaction.transaction_type} / ${transaction.provider}`, 7, colors.ink, "F2"));
      commands.push(text(220, y - 12, shortDateTime(transaction.paid_at ?? transaction.created_at), 6.8, colors.muted));
      commands.push(text(355, y - 12, `${transaction.currency} ${(Number(transaction.amount_minor ?? 0) / 100).toFixed(2)}`, 7, colors.ink, "F2"));
      commands.push(text(465, y - 12, transaction.status.replaceAll("_", " "), 6.8, colors.muted, "F2"));
      y -= 28;
      if (transaction.method || transaction.provider_reference) {
        const meta = [transaction.method && `Method: ${transaction.method}`, transaction.provider_reference && `Ref: ${transaction.provider_reference}`].filter(Boolean).join("  /  ");
        commands.push(text(52, y - 10, wrap(meta, 90)[0], 6.6, colors.muted));
        y -= 16;
      }
    });
  } else {
    infoCard(38, [{ x: 54, label: "Payment history", value: "No transaction records are available for this stay." }]);
  }

  section("Room-service folio", `GHS ${orders.reduce((sum, order) => sum + Number(order.total_ghs ?? 0), 0).toFixed(2)} total`);
  if (!orders.length) {
    infoCard(38, [{ x: 54, label: "Room service", value: "No room-service orders were recorded." }]);
  } else {
    orders.forEach((order) => {
      ensureSpace(44);
      commands.push(rect(42, y - 31, 528, 31, colors.pale));
      commands.push(text(53, y - 13, `ORDER #${order.id}  /  ${order.status.replaceAll("_", " ").toUpperCase()}`, 7, colors.green, "F2"));
      commands.push(text(53, y - 25, `${shortDateTime(order.created_at)}  /  ${order.payment_status}${order.payment_method ? `  /  ${order.payment_method}` : ""}`, 6.8, colors.muted));
      commands.push(text(470, y - 18, `GHS ${Number(order.total_ghs ?? 0).toFixed(2)}`, 7.5, colors.ink, "F2"));
      y -= 31;
      const items = order.room_service_order_items ?? [];
      if (items.length) items.forEach((item) => {
        const itemLines = wrap(`${item.quantity} x ${item.product_name}`, 62).slice(0, 2);
        itemLines.forEach((itemLine, index) => {
          ensureSpace(15);
          commands.push(text(59, y - 10, itemLine, 7.2, colors.ink, index === 0 ? "F1" : "F1"));
          if (index === 0) commands.push(text(480, y - 10, `GHS ${Number(item.line_total_ghs ?? 0).toFixed(2)}`, 7.2, colors.muted));
          y -= 15;
        });
      });
      if (order.guest_note) {
        wrap(`Guest note: ${order.guest_note}`, 88).forEach((noteLine) => {
          ensureSpace(14);
          commands.push(text(59, y - 10, noteLine, 6.8, colors.muted));
          y -= 14;
        });
      }
      y -= 9;
    });
  }

  pages.forEach(footer);
  const objects = [null, "<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>"];
  const pageRefs = [];
  pages.forEach((page, index) => {
    const pageId = 6 + index * 2;
    const contentId = pageId + 1;
    pageRefs.push(`${pageId} 0 R`);
    const content = page.join("\n");
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

export default function DownloadStayPdf({ stay, transactions, orders, reservationCurrency }) {
  function download() {
    const url = URL.createObjectURL(createStayPdf(stay, transactions, orders, reservationCurrency));
    const link = document.createElement("a");
    link.href = url;
    link.download = `winford-stay-${stay.id}.pdf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <button type="button" className={styles.pdfButton} onClick={download}>Download PDF</button>;
}
