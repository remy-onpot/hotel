import styles from "./styles.module.css";

import Features from "../Features";
import RoomSlider from "../RoomSlider";
import RoomBookingForm from "../RoomBookingForm";
import RoomDescription from "../RoomDescription";
import Facilities from "../Facilities";
import BookingPolicy from "../BookingPolicy";
import { checkRoomAvailability, getRoomById, getRoomImages } from "@/app/_lib/supabase/rooms";
import { notFound, redirect } from "next/navigation";
import { bookingSchema } from "@/app/_lib/zodSchemas";
import { cookies } from "next/headers";
import { getRoomImageUrl } from "@/app/_lib/roomImage";
import { formatRoomPrice } from "@/app/_lib/money";

function parseSearchRange(range) {
  const [start, end] = String(range ?? "").split("_");
  const isDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  return isDate(start) && isDate(end) && end > start ? { start, end } : null;
}

async function RoomContainer({ params, searchRange }) {
  const { room_slug } = await params;

  if (!room_slug || !/^-?\d+$/.test(room_slug)) notFound();

  const room = await getRoomById(room_slug);

  const room_images = await getRoomImages(room_slug ?? []);

  const images = room_images.length
    ? room_images.map((item) => getRoomImageUrl(item.img_path))
    : [getRoomImageUrl(room?.thumbnail)];

  if (!room) notFound();

  const parsedRange = parseSearchRange(searchRange);
  const selectedRoomId = room.id;
  const initialAvailabilityResult = parsedRange
    ? await checkRoomAvailability(selectedRoomId, parsedRange.start, parsedRange.end)
    : { data: null, error: null };

  async function availabilityAction(start, end) {
    "use server";
    const requestedRange = parseSearchRange(`${start}_${end}`);
    if (!requestedRange) return { data: false, error: "Choose valid check-in and check-out dates." };
    const result = await checkRoomAvailability(selectedRoomId, requestedRange.start, requestedRange.end);
    return result.error ? { data: null, error: "Could not check availability. Please try again." } : { data: result.data, error: null };
  }

  async function bookingAction(prevState, formData) {
    "use server";

    prevState = { ...prevState, isBooking: true };
    const start_date = formData.get("start_date");
    const end_date = formData.get("end_date");
    const guests_count = parseInt(formData.get("guests_count"));
    const submittedRoomId = formData.get("room_id");

    // FORM VALIDATION
    let isValid = true;
    try {
      bookingSchema.parse({ start_date, end_date, guests_count });
    } catch (err) {
      isValid = false;
      err.issues.forEach((element) => {
        prevState[element?.path[0] ?? "unknown"] = element.message;
      });

      return { ...prevState, isBooking: false };
    } finally {
      prevState = { ...prevState, isBooking: false };
    }

    if (isValid) {
      if (String(submittedRoomId) !== String(selectedRoomId)) {
        return { ...prevState, isBooking: false, criticalError: "The selected room is invalid. Refresh and try again." };
      }
      if (!parseSearchRange(`${start_date}_${end_date}`)) {
        return { ...prevState, isBooking: false, dateError: "Choose a valid check-in and check-out date range." };
      }
      const availability = await checkRoomAvailability(selectedRoomId, start_date, end_date);
      if (availability.error) return { ...prevState, isBooking: false, criticalError: "Could not check room availability. Please try again." };
      if (!availability.data) return { ...prevState, isBooking: false, dateError: "Those dates are already taken. Choose another check-in or check-out date." };

      const reservation_cookies = await cookies();
      reservation_cookies.set(
        "pending_reservation",
        JSON.stringify({ start_date, end_date, guests_count, room_id: selectedRoomId }),
        {
          maxAge: 60 * 60 * 2,
          httpOnly: true,
        }
      );

      redirect(`/reservations/checkout`);
    }
  }

  return (
    <>
      <header className={styles.roomHeader}>
        <span className={styles.eyebrow}>The Winford · Rooms &amp; Suites</span>
        <h1 className={styles.heading}>{room.name}</h1>
        <p>Thoughtful comfort for your stay in Accra</p>
      </header>
      <div className={styles.roomOverview}>
        <div className={styles.galleryColumn}>
          <RoomSlider images={images} />
          <Features room={room} />
        </div>
        <aside className={styles.bookingColumn} aria-label="Room reservation">
          <div className={styles.bookingIntro}>
            <span>From {formatRoomPrice(room.price, room.price_usd)}</span>
            <span>per night</span>
          </div>
          <RoomBookingForm
            bookingAction={bookingAction}
            availabilityAction={availabilityAction}
            room={room}
            initialRange={parsedRange ? { start: parsedRange.start, end: parsedRange.end } : null}
            initialAvailability={initialAvailabilityResult.error ? null : initialAvailabilityResult.data}
            initialAvailabilityError={Boolean(initialAvailabilityResult.error)}
          />
        </aside>
      </div>
      <a className={styles.mobileBookingLink} href="#room-booking">Choose dates and book</a>
      <RoomDescription description={room.description} />
      <Facilities />
      <BookingPolicy />
    </>
  );
}

export default RoomContainer;
