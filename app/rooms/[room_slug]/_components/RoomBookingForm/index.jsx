"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./styles.module.css";
import { faBed, faCalendar, faUsers } from "@fortawesome/free-solid-svg-icons";
import { formatISO } from "date-fns";
import FormDayPicker from "../FormDayPicker";

import { useActionState } from "react";
import ReservationButton from "../ReservationButton";
import { useCallback, useEffect, useState, useTransition } from "react";
import toast, { Toaster } from "react-hot-toast";
import CustomSelect from "@/app/_ui/CustomSelect";

const initialState = {
  dateError: "",
  guestsError: "",
  criticalError: "",
  isBooking: false,
};

function RoomBookingForm({ bookingAction, availabilityAction, room, initialRange, initialAvailability, initialAvailabilityError }) {
  const [state, formAction] = useActionState(bookingAction, initialState);
  const [startDate, setStartDate] = useState(initialRange?.start ?? "");
  const [endDate, setEndDate] = useState(initialRange?.end ?? "");
  const [availability, setAvailability] = useState(initialRange ? initialAvailability : null);
  const [availabilityError, setAvailabilityError] = useState(initialAvailabilityError ? "Could not check availability. Please try again." : "");
  const [, startAvailabilityTransition] = useTransition();

  const [guests, setGuests] = useState("");

  const handleDateSelection = useCallback((range) => {
    if (!range?.from) return;
    const from = formatISO(range.from, { representation: "date" });
    const to = range.to ? formatISO(range.to, { representation: "date" }) : "";
    setStartDate(from);
    setEndDate(to);
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) {
      setAvailability(null);
      setAvailabilityError("");
      return;
    }
    let active = true;
    setAvailability(null);
    setAvailabilityError("");
    startAvailabilityTransition(async () => {
      try {
        const result = await availabilityAction(startDate, endDate);
        if (!active) return;
        setAvailability(result.data);
        setAvailabilityError(result.error ?? "");
      } catch {
        if (active) setAvailabilityError("Could not check availability. Please try again.");
      }
    });
    return () => { active = false; };
  }, [startDate, endDate, availabilityAction, startAvailabilityTransition]);

  function handleSubmit() {
    if (!(startDate && endDate)) {
      toast.error("Please select a date range from the calendar");
      return;
    }

    if (availability === false) {
      toast.error("Those dates are already taken. Choose another date range.");
      return;
    }
    if (availability !== true || availabilityError) {
      toast.error(availabilityError || "Checking availability. Please try again in a moment.");
      return;
    }

    if (!guests || parseInt(guests) < 1 || parseInt(guests) > room.capacity) {
      toast.error("Please provide guests number");
      return;
    }

    const newForm = new FormData();
    newForm.set("start_date", startDate);
    newForm.set("end_date", endDate);
    newForm.set("guests_count", guests);
    newForm.set("room_id", room.id);
    formAction(newForm);
  }

  return (
    <form id="room-booking" action={handleSubmit} className={styles.roomBookingForm}>
      <FormDayPicker start={startDate ? new Date(`${startDate}T00:00:00`) : undefined} end={endDate ? new Date(`${endDate}T00:00:00`) : undefined} handleDateSelection={handleDateSelection} />
      {availability === false && <p className={styles.availabilityError} role="alert">Those dates are taken for this room. Select another date range to continue.</p>}
      {availabilityError && <p className={styles.availabilityError} role="alert">{availabilityError}</p>}
      {state?.dateError && <p className={styles.availabilityError} role="alert">{state.dateError}</p>}

      <div className={styles.formItem}>
        <div className={styles.formInput}>
          <div className={styles.formIcon}>
            <FontAwesomeIcon icon={faBed} />
          </div>
          <div className={styles.formControl}>
            <label>Room Type</label>
            <input type="text" value={room.name} readOnly disabled />
          </div>
        </div>
        <div className={styles.formInput}>
          <div className={styles.formIcon}>
            <FontAwesomeIcon icon={faCalendar} />
          </div>
          <div className={styles.formControl}>
            <label>Check In</label>
            <input type="date" value={startDate} disabled />
          </div>
        </div>
        <div className={styles.formInput}>
          <div className={styles.formIcon}>
            <FontAwesomeIcon icon={faCalendar} />
          </div>
          <div className={styles.formControl}>
            <label>Check Out</label>
            <input type="date" value={endDate} disabled />
          </div>
        </div>
        <div className={styles.formInput}>
          <div className={styles.formIcon}>
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className={styles.formControl}>
            <label id="booking-guests-label">Guests</label>
            <CustomSelect
              options={Array.from({ length: room?.capacity ?? 0 }, (_, index) => ({ value: String(index + 1), label: String(index + 1) }))}
              value={guests ? { value: guests, label: guests } : null}
              onChange={(option) => setGuests(option?.value ?? "")}
              ariaLabelledBy="booking-guests-label"
              placeholder="Select guests number"
            />
          </div>
        </div>

        {/* <button type="submit" className={styles.formButton} disabled={state.isBooking}>
          {state.isBooking ? "Booking..." : "Book Now"}
        </button> */}
        <ReservationButton disabled={!startDate || !endDate || !guests || availability !== true || Boolean(availabilityError)} />
      </div>
      <Toaster position="top-center" reverseOrder={false} />
    </form>
  );
}

export default RoomBookingForm;
