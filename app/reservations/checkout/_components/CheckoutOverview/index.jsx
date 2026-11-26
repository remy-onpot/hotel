import { daysDifferCount, formatToAbrFormat } from "@/app/utils/datetime";
import styles from "./styles.module.css";
import Card from "@/app/_components/Card/Card";
import Image from "next/image";

import { bookingTotalPrice, extraGuestCount, INCLUDED_GUESTS, nightTotalPrice } from "@/app/utils/reservationsCalcs";
import { formatMoney, formatRoomPrice } from "@/app/_lib/money";
import { getRoomImageUrl } from "@/app/_lib/roomImage";

function CheckoutOverview({ room, pending_reservation }) {
  const totalNights = daysDifferCount(pending_reservation.end_date, pending_reservation.start_date);
  const totalPerNight = nightTotalPrice(room.price, pending_reservation.guests_count);
  const additionalGuests = extraGuestCount(pending_reservation.guests_count);
  const guestsPrice = additionalGuests * (room.price / 2);
  const totalPrice = bookingTotalPrice(room.price, pending_reservation.guests_count, totalNights);
  return (
    <div>
      <Card>
        <Card.Thumbnail>
          <Image fill sizes="(max-width: 700px) 100vw, 40vw" src={getRoomImageUrl(room.thumbnail)} alt={`${room.name} thumbnail`} />
        </Card.Thumbnail>

        <Card.Description className={styles.overviewDescription}>
          <h2>{room.name}</h2>
          <div className={styles.bookingSummary}>
            <h3>Booking Summary</h3>
            <p>
              <span>Arrival</span>
              <span>{formatToAbrFormat(pending_reservation.start_date)}</span>
            </p>
            <p>
              <span>Departure</span>
              <span>{formatToAbrFormat(pending_reservation.end_date)}</span>
            </p>
            <p>
              <span>Guests</span>
              <span>{String(pending_reservation.guests_count).padStart(2, "0")}</span>
            </p>
          </div>

          <div className={styles.bookingSummary}>
            <h3>Pricing Breakdown</h3>
            <p>The USD room rate is for display only. The amount payable is shown in GHS.</p>
            <p>
              <span>Room rate per night (includes up to {INCLUDED_GUESTS} guests)</span>
              <span>{formatRoomPrice(room.price, room.price_usd)}</span>
            </p>
            {additionalGuests > 0 && <p>
              <span>Additional guests ({additionalGuests} × {formatMoney(room.price / 2, "GHS")} per guest, per night)</span>
              <span>{formatMoney(guestsPrice, "GHS")}</span>
            </p>}
            <p>
              <span>Total per Night: </span>
              <span>{formatMoney(totalPerNight, "GHS")}</span>
            </p>
          </div>

          <div className={styles.totalPrice}>
            <span>Total Without Taxes ({totalNights} Nights)</span>
            <span>{formatMoney(totalPrice, "GHS")}</span>
          </div>
        </Card.Description>
      </Card>
    </div>
  );
}

export default CheckoutOverview;
