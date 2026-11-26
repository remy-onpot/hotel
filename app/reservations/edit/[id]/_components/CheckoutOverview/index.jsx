import { daysDifferCount, formatToAbrFormat } from "@/app/utils/datetime";
import styles from "./styles.module.css";
import Card from "@/app/_components/Card/Card";
import Image from "next/image";

import { bookingTotalPrice, nightTotalPrice } from "@/app/utils/reservationsCalcs";
import { formatMoney } from "@/app/_lib/money";
import { getRoomImageUrl } from "@/app/_lib/roomImage";

function CheckoutOverview({ reservation, guests, start, end }) {
  const totalNights = daysDifferCount(end, start);
  const totalPerNight = nightTotalPrice(reservation.rooms.price, guests);
  const guestsPrice = (guests - 1) * (reservation.rooms.price / 2);
  const currency = reservation.currency ?? "GHS";
  const formatPrice = (amount) => formatMoney(amount, currency);
  const totalPrice = bookingTotalPrice(reservation.rooms.price, guests, totalNights);
  // return <h1>OVERVIEW CARD</h1>;
  return (
    <div>
      <Card>
        <Card.Thumbnail>
          <Image
            fill
            sizes="(max-width: 700px) 100vw, 40vw"
            src={getRoomImageUrl(reservation.rooms.thumbnail)}
            alt={`${reservation.rooms.name} thumbnail`}
          />
        </Card.Thumbnail>

        <Card.Description className={styles.overviewDescription}>
          <h2>{reservation.rooms.name}</h2>
          <div className={styles.bookingSummary}>
            <h3>Booking Summary</h3>
            <p>
              <span>Arrival</span>
              <span>{formatToAbrFormat(new Date(start))}</span>
            </p>
            <p>
              <span>Departure</span>
              <span>{formatToAbrFormat(new Date(end))}</span>
            </p>
            <p>
              <span>Guests</span>
              <span>{String(guests).padStart(2, "0")}</span>
            </p>
          </div>

          <div className={styles.bookingSummary}>
            <h3>Pricing Breakdown</h3>
            <p>
              <span>{formatPrice(reservation.rooms.price)} x night (Base Rate for 1 Guest)</span>
              <span>{formatPrice(reservation.rooms.price)}</span>
            </p>
            <p>
              <span>
                Additional Guests ({guests - 1} x {formatPrice(reservation.rooms.price / 2)} per night)
              </span>
              <span>{formatPrice(guestsPrice)}</span>
            </p>
            <p>
              <span>Total per Night: </span>
              <span>{formatPrice(totalPerNight)}</span>
            </p>
          </div>

          <div className={styles.totalPrice}>
            <span>Total Without Taxes ({totalNights} Nights)</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
        </Card.Description>
      </Card>
    </div>
  );
}

export default CheckoutOverview;
