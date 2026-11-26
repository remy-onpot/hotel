"use client";

import Alert from "@/app/_ui/Alert";
import SignUpButton from "../SignUpButton";
import styles from "./styles.module.css";
import { useActionState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Link from "next/link";

const initialState = {
  email: "",
  password: "",
  critical: "",
};

function CredentialsForm({ registerAction, authAction }) {
  const [state, formAction] = useActionState(registerAction, initialState);

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const errors = Object.values(state).filter(
      (item) => typeof item === "string" && item.length > 0
    );
    errors.forEach((item) => toast.error(item));
  }, [state]);

  return (
    <form action={formAction} className={styles.form}>
      <h2 className={styles.loginHeading}>Sign Up</h2>

      {state.critical && <Alert>{state.critical}</Alert>}

      <div className={styles.formControl}>
        <label htmlFor="signup-fullname" className={styles.loginLabel}>
          Fullname
        </label>
        <input id="signup-fullname" type="text" name="fullname" autoComplete="name" required className={styles.loginInput} />
        {state.fullname && <span className={styles.errorMessage}>{state.fullname}</span>}
      </div>

      <div className={styles.formControl}>
        <label htmlFor="signup-email" className={styles.loginLabel}>
          Email Address
        </label>
        <input id="signup-email" type="email" name="email" autoComplete="email" required className={styles.loginInput} />
        {state.email && <span className={styles.errorMessage}>{state.email}</span>}
      </div>
      <div className={styles.formControl}>
        <label htmlFor="signup-password" className={styles.loginLabel}>
          Password
        </label>
        <div className={styles.passwordContainer}>
          <input id="signup-password" type={showPassword ? "text" : "password"} name="password" autoComplete="new-password" required className={styles.loginInput} />
          <button type="button" className={styles.pwdToggler} onClick={() => setShowPassword((current) => !current)}>
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
        </div>
        {state.password && <span className={styles.errorMessage}>{state.password}</span>}
      </div>

      <div className={styles.formControl}>
        <label htmlFor="signup-confirm-password" className={styles.loginLabel}>
          Confirm Password
        </label>
        <div className={styles.passwordContainer}>
          <input id="signup-confirm-password" type={showPassword ? "text" : "password"} name="confirm_password" autoComplete="new-password" required className={styles.loginInput} />
          <button type="button" className={styles.pwdToggler} onClick={() => setShowPassword((current) => !current)}>
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
        </div>
        {state.confirm_password && <span className={styles.errorMessage}>{state.confirm_password}</span>}
      </div>

      <SignUpButton />

      <br />

      <p className={styles.switchText}>
        Already have an account? <Link href="/signin">Sign In</Link>
      </p>
      <Toaster position="top-center" reverseOrder={false} />
    </form>
  );
}

export default CredentialsForm;
