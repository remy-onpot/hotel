"use client";

import Alert from "@/app/_ui/Alert";
import ConfirmationButton from "../ConfirmationButton";
import styles from "./styles.module.css";
import { useActionState } from "react";

import CancelButton from "../CancelButton";
import { useTransition } from "react";
import toast, { Toaster } from "react-hot-toast";

const initialState = {
  fullname: "",
  email: "",
  phone: "",
  message: "",
  criticalError: "",
};

function CheckoutForm({ guest, createReservationAction, bookingCancelAction }) {
  const [state, formAction] = useActionState(createReservationAction, initialState);

  const [isPending, setTransition] = useTransition();

  function handleCancel() {
    setTransition(async () => await bookingCancelAction());
  }

  const errors = Object.values(state)?.filter((item) => item.length);
  if (errors.length) errors.forEach((item) => toast.error(item ?? "Failed to confirm you booking, please try again"));

  return (
    <form action={formAction} className={styles.form}>
      <h2 className={styles.formHeading}>Reservation Confirmation</h2>

      {state?.criticalError && <Alert>{state?.criticalError}</Alert>}

      <div className={styles.formControl}>
        <label htmlFor="checkout-fullname" className={styles.formLabel}>
          Full name
        </label>
        <input id="checkout-fullname" type="text" name="fullname" autoComplete="name" required defaultValue={guest.fullname} className={styles.formInput} />
        {state?.fullname && <span className={styles.errorMessage}>{state?.fullname}</span>}
      </div>

      <div className={styles.formControl}>
        <label htmlFor="checkout-email" className={styles.formLabel}>
          Email Address
        </label>
        <input id="checkout-email" type="email" name="email" autoComplete="email" required defaultValue={guest.email} className={styles.formInput} />
        {state?.email && <span className={styles.errorMessage}>{state?.email}</span>}
      </div>

      <div className={styles.formControl}>
        <label htmlFor="checkout-phone" className={styles.formLabel}>
          Phone Number
        </label>
        <input id="checkout-phone" type="tel" name="phone" autoComplete="tel" required defaultValue={guest.phone} className={styles.formInput} />
        {state?.phone && <span className={styles.errorMessage}>{state?.phone}</span>}
      </div>

      <div className={styles.formControl}>
        <label htmlFor="checkout-message" className={styles.formLabel}>
          Special requests <span className={styles.optionalLabel}>(optional)</span>
        </label>
        <textarea name="message" id="checkout-message" className={styles.formTextArea} aria-describedby="checkout-message-help" maxLength={255} rows={4} placeholder="For example, a late arrival or a room preference" />
        <span id="checkout-message-help" className={styles.fieldHelp}>Share anything you’d like us to know before your stay. We’ll do our best to accommodate.</span>
        {state?.message && <span className={styles.errorMessage}>{state?.message}</span>}
      </div>

      <div className={styles.checkOutButtons}>
        <ConfirmationButton disabled={isPending} />
        <CancelButton isLoading={isPending} handleCancel={handleCancel} />
      </div>
      <Toaster position="top-center" reverseOrder={true} />
    </form>
  );
}

export default CheckoutForm;
