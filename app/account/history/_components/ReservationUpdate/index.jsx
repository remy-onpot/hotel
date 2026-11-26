"use client";
import styles from "./styles.module.css";
import Card from "@/app/_components/Card/Card";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import DatePicker from "react-datepicker";
import { useState } from "react";

import "react-datepicker/dist/react-datepicker.css";
import { addMonths, formatISO, isAfter } from "date-fns";
import CustomSelect from "@/app/_ui/CustomSelect";

function ReservationUpdate({ reservation }) {
  const [startDate, setStartDate] = useState(new Date(reservation.start_date));
  const [endDate, setEndDate] = useState(new Date(reservation.end_date));
  const [rangeError, setRangeError] = useState("");

  function handleArrivalSelect(date) {
    setStartDate(date);
  }

  function handleDepartureSelect(date) {
    setRangeError("");
    const selectedDateRange = { start: new Date(formatISO(startDate)), end: new Date(formatISO(date)) };
    const isReversedRange = isAfter(selectedDateRange.start, selectedDateRange.end);

    if (isReversedRange) {
      setRangeError("Invalid! Please select a valid date range");
    }
  }

  async function handleSubmit() {
    const updateFormData = new Form();
    updateFormData.set("start_date", startDate);
    updateFormData.set("end_date", endDate);
    updateFormData.set("guests_count", guests);
  }

  return (
    <>
      <Card>
        <Card.Description className={styles.overviewDescription}>
          <h2>Edit Reservation</h2>
          <form className={styles.formControl}>
            <div>
              <label id="reservation-update-guests-label">Guests</label>
              <CustomSelect
                options={Array.from({ length: reservation.rooms?.capacity ?? 0 }, (_, index) => ({ value: String(index + 1), label: String(index + 1) }))}
                defaultValue={{ value: String(reservation.guests_count), label: String(reservation.guests_count) }}
                ariaLabelledBy="reservation-update-guests-label"
                placeholder="Select guests number"
              />
            </div>
            <div className="modal-update-form">
              <label htmlFor="reservation-arrival">Arrival</label>
              <DatePicker
                selected={startDate}
                id="reservation-arrival"
                onChange={(date) => setStartDate(date)}
                selectsStart
                showDisabledMonthNavigation
                onSelect={(date) => handleArrivalSelect(date)}
                minDate={new Date()}
                maxDate={addMonths(new Date(), 10)}
                startDate={startDate}
                dateFormat={"dd/MM/yyyy"}
              />
            </div>
            <div className="modal-update-form">
              <label htmlFor="reservation-departure">Departure</label>
              <DatePicker
                selected={endDate}
                id="reservation-departure"
                onChange={(date) => setEndDate(date)}
                selectsEnd
                showDisabledMonthNavigation
                onSelect={(date) => handleDepartureSelect(date)}
                minDate={new Date()}
                maxDate={addMonths(new Date(), 10)}
                startDate={startDate}
                endDate={endDate}
                dateFormat={"dd/MM/yyyy"}
              />
              {rangeError && <span className={styles.errorMessage}>{rangeError}</span>}
            </div>
          </form>

          <div className={styles.actionsContainer}>
            <h2>Actions</h2>
            <button className={styles.editButton}>
              <FontAwesomeIcon icon={faEdit} />
            </button>
            {/* <DeleteForm deleteAction={deleteAction} /> */}
          </div>
        </Card.Description>
      </Card>
    </>
  );
}

export default ReservationUpdate;
