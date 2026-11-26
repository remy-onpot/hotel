import { filterRoomsByDate, getAllRooms } from "@/app/_lib/supabase/rooms";
import styles from "./styles.module.css";
import RoomItem from "../RoomItem";
import { isValid } from "date-fns";

function isDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return isValid(parsed) && parsed.toISOString().slice(0, 10) === value;
}

function sortBySelection(rooms, sort) {
  return [...rooms].sort((a, b) => {
    switch (sort) {
      case "high-price": return b.price - a.price;
      case "low-price": return a.price - b.price;
      case "min-guests": return b.capacity - a.capacity;
      case "max-guests": return a.capacity - b.capacity;
      default: return 0;
    }
  });
}

async function RoomsSection({ filter, range }) {
  const rooms = await getAllRooms();
  let availabilityError = false;
  let filteredRooms = rooms.map((room) => ({ ...room, isAvailable: true }));

  const [arrivalDate, departureDate] = String(range ?? "").split("_");
  if (range && isDateOnly(arrivalDate) && isDateOnly(departureDate) && departureDate > arrivalDate) {
    const result = await filterRoomsByDate(arrivalDate, departureDate);
    availabilityError = Boolean(result.error);
    filteredRooms = result.data ?? rooms.map((room) => ({ ...room, isAvailable: null }));
  }

  const availableRooms = sortBySelection(filteredRooms.filter((room) => room.isAvailable === true), filter);
  const unavailableRooms = sortBySelection(filteredRooms.filter((room) => room.isAvailable !== true), filter);
  const orderedRooms = [...availableRooms, ...unavailableRooms];
  const allUnavailable = Boolean(range) && !availabilityError && orderedRooms.length > 0 && unavailableRooms.length === orderedRooms.length;

  return (
    <>
      {availabilityError && (
        <p role="alert" className={styles.availabilityNotice}>
          Room availability could not be checked. Please refresh or contact the hotel.
        </p>
      )}
      {allUnavailable && (
        <p role="status" className={styles.availabilityNotice}>
          All rooms are booked for your selected dates &mdash; try adjusting your check-in or check-out dates
        </p>
      )}
      <div className={styles.roomsGrid}>
        {orderedRooms.map((room) => (
          <RoomItem
            key={room.id}
            id={room.id}
            title={room.name}
            price={room.price}
            priceUsd={room.price_usd}
            imgPath={room.thumbnail}
            isAvailable={room.isAvailable}
            range={range}
          />
        ))}
      </div>
    </>
  );
}

export default RoomsSection;
