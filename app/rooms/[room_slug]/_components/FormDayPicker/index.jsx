"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import styles from "./styles.module.css";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";

function FormDayPicker({ handleDateSelection, start, end }) {
  const calendarRangeRef = useRef({ start: new Date(2024, 0), end: new Date(2027, 11) });
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 719px)");
    const updateViewport = () => setIsMobile(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  const calendarVisible = !isMobile || isOpen;
  const dateSummary = start
    ? `${format(start, "MMM d")}${end ? ` – ${format(end, "MMM d")}` : " – Select check-out"}`
    : "Choose check-in and check-out";

  return (
    <div className={styles.datePickerSection}>
      <button
        className={styles.calendarToggle}
        type="button"
        aria-controls="room-date-calendar"
        aria-expanded={calendarVisible}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>
          <strong>{start && end ? "Stay dates" : "Select your stay dates"}</strong>
          <span>{dateSummary}</span>
        </span>
        <span className={styles.toggleIcon} aria-hidden="true">{calendarVisible ? "−" : "+"}</span>
      </button>
      <div
        id="room-date-calendar"
        className={`${styles.calendarPanel} ${calendarVisible ? styles.calendarOpen : ""}`}
        aria-hidden={!calendarVisible}
        inert={!calendarVisible}
      >
        <div className={styles.datepicker}>
          <div>
            <DayPicker
          captionLayout="dropdown"
          min={0}
          onSelect={(range) => handleDateSelection(range)}
          mode="range"
          selected={start && end ? { from: start, to: end } : null}
          startMonth={calendarRangeRef.current.start}
          endMonth={calendarRangeRef.current.end}
          weekStartsOn={1}
          numberOfMonths={1}
          disabled={{ before: new Date() }}
          footer={
            <p>
              <span className={styles.footerIcon}>
                <FontAwesomeIcon icon={faInfoCircle} />
              </span>
              <span>Please Pick a Range</span>
            </p>
          }
          classNames={{
            today: styles.datepickerToday,
            selected: styles.datepickerSelected,
            range_start: styles.datepickerRangeControlStart,
            range_end: styles.datepickerRangeControlEnd,
            range_middle: styles.datepickerRangeMiddle,
            chevron: styles.chevron,
            footer: styles.datepickerFooter,
          }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormDayPicker;
