"use client";
import Image from "next/image";
import styles from "./index.module.css";
import Banner from "@/app/_components/Banner";
import { format } from "date-fns";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { formatMoney } from "@/app/_lib/money";
import { getRoomImageUrl } from "@/app/_lib/roomImage";

function SuccessPage({ reservation }) {
  useEffect(() => {
    if (reservation.status?.toLowerCase() !== "confirmed") return;
    fetch("/api/clear-pending-reservation", { method: "POST" }).catch((error) => {
      console.error("Could not clear pending reservation:", error);
    });
  }, [reservation.status]);
  return (
    <>
      <Banner title={"YOUR STAY IS CONFIRMED"} />
      <div className={`container ${styles["confirmation-card"]}`}>
        <h2 className={`${styles["section-title"]}`}>Reservation Details</h2>
        <div className={`${styles["confirmation-grid"]}`}>
          <div className={`${styles["confirmation-details"]}`}>
            <div className={`${styles["detail-group"]}`}>
              <label>Booking Number</label>
              <span>#{String(reservation.id).padStart(6, "0")}</span>
            </div>
            <div className={`${styles["detail-group"]}`}>
              <label>Room Type</label>
              <span>{reservation.rooms?.name}</span>
            </div>
            <div className={`${styles["detail-group"]}`}>
              <label>Check-in Date</label>
              <span>{format(reservation.start_date, "LLL, dd yyyy")}</span>
            </div>
            <div className={`${styles["detail-group"]}`}>
              <label>Check-out Date</label>
              <span>{format(reservation.end_date, "LLL, dd yyyy")}</span>
            </div>

            <div className={`${styles["detail-group"]}`}>
              <label>Guests</label>
              <span>{reservation.guests_count} Guests</span>
            </div>
            <div className={`${styles["detail-group"]}`}>
              <label>Total Amount</label>
              <span>{formatMoney(reservation.reserved_price, "GHS")}</span>
            </div>
          </div>
          <div className={`${styles["room-preview"]}`}>
            <Image
              src={getRoomImageUrl(reservation.rooms.thumbnail)}
              alt="Room Preview"
              width={800}
              height={264}
              className={`${styles["room-image"]}`}
            />
          </div>
        </div>
        <div className={`${styles["action-buttons"]}`}>
          <button
            onClick={() => window.print()}
            className={`${styles["primary-button"]}`}
          >
            Print confirmation
          </button>
          <Link href={"/rooms"} className={`${styles["secondary-button"]}`}>
            Return to Home
          </Link>
        </div>
      </div>
      <Toaster position="top-right" />
    </>
  );
}

export default SuccessPage;
