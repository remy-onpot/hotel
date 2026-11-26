"use client";

import ConfirmationButton from "../ConfirmationButton";
import styles from "./styles.module.css";
import CustomSelect from "@/app/_ui/CustomSelect";

const initialState = {
  fullname: "",
  email: "",
  phone: "",
  nationalID: "",
  message: "",
  criticalError: "",
};

function ReservationForm({ capacity, setGuests, guests, handleSubmit, children }) {
  return (
    <form action={handleSubmit} className={styles.form}>
      <div>
        <div className={styles.formControl}>
          <label id="reservation-guests-label" className={styles.formLabel}>
            Guests Number:
          </label>
          <CustomSelect
            options={Array.from({ length: capacity ?? 0 }, (_, index) => ({ value: String(index + 1), label: String(index + 1) }))}
            defaultValue={guests ? { value: String(guests), label: String(guests) } : null}
            name="guests_count"
            ariaLabelledBy="reservation-guests-label"
            className={styles.formInput}
            placeholder="Select guests number"
            onChange={(option) => option && setGuests(option.value)}
          />
        </div>
        {children}
      </div>
      <div>
        <ConfirmationButton />
      </div>
    </form>
  );
}

export default ReservationForm;
