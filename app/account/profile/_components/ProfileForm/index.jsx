"use client";

import SubmitButton from "@/app/_ui/SubmitButton";
import styles from "./styles.module.css";
import { useActionState } from "react";

import CustomSelect from "@/app/_ui/CustomSelect";
import CountryFlag from "@/app/_ui/CountryFlag";

// import "react-toastify/dist/ReactToastify.css";

const initialState = {
  fullnameErr: "",
  nationalityErr: "",
  phoneErr: "",
  emailErr: "",
};

function ProfileForm({ guestUpdateAction, guest, countryOptions }) {
  const [state, formAction] = useActionState(guestUpdateAction, initialState);


  return (
    <form action={formAction}>
      <div className={styles.profileFormInputs}>
        <div>
          <label htmlFor="profile-fullname" className={styles.formLabel}>Fullname</label>
          <input
            id="profile-fullname"
            className={styles.formControl}
            type="text"
            placeholder="Alaoui Hassan"
            name="fullname"
            defaultValue={guest.fullname}
          />
          {state?.fullname && (
            <span className={styles.errorMessage}>{state.fullname}</span>
          )}
        </div>
        <div>
          <label htmlFor="profile-email" className={styles.formLabel}>Email Address</label>
          <input
            id="profile-email"
            className={styles.formControl}
            defaultValue={guest.email}
            type="email"
            placeholder="john.doe@mail.com"
            name="email"
            readOnly
          />
          {state?.email && (
            <span className={styles.errorMessage}>{state.email}</span>
          )}
        </div>
        <div>
          <label htmlFor="profile-nationality" className={styles.formLabel}>
            <span>Nationality</span>
            {guest.countryFlag && <span className={styles.countryFlag}>
              <CountryFlag countryFlag={guest.countryFlag} nationality={guest.nationality} />
            </span>}
          </label>

          <CustomSelect
            className={styles.formControl}
            name="nationality"
            id="profile-nationality"
            ariaLabel="Select nationality"
            options={countryOptions}
            defaultValue={countryOptions.find((country) => country.label === guest.nationality)}
            placeholder="Select country..."
            required
          />
          {state?.nationality && (
            <span className={styles.errorMessage}>{state.nationality}</span>
          )}
        </div>
        <div>
          <label htmlFor="profile-phone" className={styles.formLabel}>Phone Number</label>
          <input
            id="profile-phone"
            className={styles.formControl}
            defaultValue={guest.phone}
            type="tel"
            placeholder="+212 6 879900830"
            name="phone"
          />
          {state?.phone && (
            <span className={styles.errorMessage}>{state.phone}</span>
          )}
        </div>
        <div>
          <label htmlFor="profile-password" className={styles.formLabel}>New Password</label>
          <input
            id="profile-password"
            className={styles.formControl}
            type="password"
            placeholder="**********"
            name="password"
          />
          {state?.password && (
            <span className={styles.errorMessage}>{state.password}</span>
          )}
        </div>
        <div>
          <label htmlFor="profile-confirm-password" className={styles.formLabel}>Confirm Password</label>
          <input
            id="profile-confirm-password"
            className={styles.formControl}
            type="password"
            placeholder="**********"
            name="confirm_password"
          />
          {state?.confirm_password && (
            <span className={styles.errorMessage}>
              {state.confirm_password}
            </span>
          )}
        </div>
      </div>
      <div className={styles.formButtonContainer}>
        <SubmitButton
          type="submit"
          className={styles.formButton}
          content={{ pending: "Saving...", base: "Save" }}
        />
      </div>
      {state?.success && <p role="status">{state.success}</p>}
      {state?.error && <p role="alert">{state.error}</p>}
    </form>
  );
}

export default ProfileForm;
