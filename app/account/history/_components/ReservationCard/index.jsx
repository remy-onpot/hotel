import Image from "next/image";
import styles from "./styles.module.css";

import Badge from "@/app/_ui/Badge";
import { auth } from "@/auth";
import { deleteReservation, getReservationByID } from "@/app/_lib/supabase/reservations";
import { revalidatePath } from "next/cache";
import ControlButtons from "../ControlButtons";
import { reservationCancelAction, reservationUpdateAction } from "@/app/_lib/actions";
import { formatToAbrFormat } from "@/app/utils/datetime";
import { differenceInDays, isFuture, isPast } from "date-fns";
import { formatMoney } from "@/app/_lib/money";
import { getRoomImageUrl } from "@/app/_lib/roomImage";
import { canEditReservation, getAccraToday } from "@/app/_lib/bookingRules";

function ReservationCard({ reservation }) {
  async function deleteReservationAction(prevState, formData) {
    "use server";

    prevState = {};

    const session = await auth();
    const active_user = session?.user;

    if (!active_user) return { ...prevState, error: "unauthorized action, please authenticate and try again" };

    const targeted_reservation = await getReservationByID(reservation.id, active_user.id);
    if (!targeted_reservation) return { ...prevState, error: "Reservation not found." };

    if (targeted_reservation.status === "confirmed")
      return { ...prevState, error: "Cannot delete active reservations! You may want to cancel it instead" };

    if (targeted_reservation.guest_id !== active_user.id) return { ...prevState, error: "unauthorized action!" };

    const result = await deleteReservation(active_user.id, reservation.id);
    if (result.error?.code === "NOT_DELETABLE") return { ...prevState, error: "This reservation can no longer be removed." };
    if (result.error) return { ...prevState, error: "Could not remove this reservation. Please try again." };
    revalidatePath("/account/history");

    return { ...prevState, status: "success" };
  }

  const arrivalDate = formatToAbrFormat(reservation.start_date);
  const departureDate = formatToAbrFormat(reservation.end_date);
  const displayStatus = reservation.status === "conflict_refund_required"
    ? "Refund review required"
    : reservation.status;
  const canManageReservation = canEditReservation(reservation, getAccraToday());

  return (
    <article className={styles.reservationItem}>
      <div className={styles.reservationThumbnail}>
        <Image fill sizes="(max-width: 779px) 100vw, 180px" src={getRoomImageUrl(reservation.rooms.thumbnail)} alt={`${reservation.rooms.name} thumbnail`} />
      </div>

      <div className={styles.reservationInfos}>
        <div className={styles.reservationOverview}>
          <h2 className={styles.reservationTitle}>
            <span>{reservation.rooms.name}</span>

            {isPast(reservation.start_date) && isFuture(reservation.end_date) ? (
              <span className={`${styles.onGoing} ${styles.reservationEstimation}`}>ON GOING</span>
            ) : isFuture(reservation.start_date) ? (
              <span className={`${styles.future} ${styles.reservationEstimation}`}>FUTURE</span>
            ) : isPast(reservation.end_date) ? (
              <span className={`${styles.past} ${styles.reservationEstimation}`}>PAST</span>
            ) : (
              ""
            )}
          </h2>
          <p>
            {formatToAbrFormat(arrivalDate)} - {formatToAbrFormat(departureDate)}
          </p>

          <p>
            <span className={styles.price}>{formatMoney(reservation.reserved_price, "GHS")}</span> - {reservation.guests_count}{" "}
            Guest(s)
          </p>

          {/* CREATE A SEPARATED COMPONENT FOR THE STATUS AS BADGE */}
          <Badge
            type={
              reservation.status == "unconfirmed" || reservation.status === "pending" || reservation.status === "conflict_refund_required"
                ? "warning"
                : reservation.status == "canceled" || reservation.status == "finished"
                ? "danger"
                : "success"
            }
          >
            {displayStatus}
          </Badge>
          {reservation.status === "conflict_refund_required" && <p role="status">The hotel is reviewing this payment. Use the payment reference shown on the payment page when contacting the hotel.</p>}
        </div>
        <div className={styles.reservationPriceContainer}>
          {/* USE 3rd PARTY API FOR CURRENCY CONVERSION */}

          <ControlButtons
            reservationUpdateAction={reservationUpdateAction}
            deleteAction={deleteReservationAction}
            reservation={reservation}
            reservationCancelAction={reservationCancelAction}
            canManageReservation={canManageReservation}
          />

          {/* <DeleteForm deleteAction={deleteReservationAction} /> */}
        </div>
      </div>
    </article>
  );
}

export default ReservationCard;
