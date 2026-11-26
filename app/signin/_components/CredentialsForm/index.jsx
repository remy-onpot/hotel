"use client";

import Alert from "@/app/_ui/Alert";
import SignInButton from "../SignInButton";
import styles from "./styles.module.css";
import { useActionState, useEffect } from "react";
import { usePathname } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

const initialState = {
  email: "",
  password: "",
  criticalError: "",
};

function CredentialsForm({ authAction }) {
  const [state, formAction] = useActionState(authAction, initialState);
  const pathname = usePathname();

  useEffect(() => {
    const errors = Object.values(state).filter(
      (item) => typeof item === "string" && item.length > 0
    );
    errors.forEach((item) => toast.error(item));
  }, [state]);

  return (
    <form action={formAction} className={styles.form}>
      <h2 className={styles.loginHeading}>Login</h2>

      {state.criticalError && <Alert>{state.criticalError}</Alert>}
      {pathname === "/reservations/checkout" && (
        <Alert type="warning">Please sign in before confirming your booking!</Alert>
      )}

      <div className={styles.formControl}>
        <label htmlFor="signin-email" className={styles.loginLabel}>
          Email Address
        </label>
        <input id="signin-email" type="email" name="email" autoComplete="email" required className={styles.loginInput} />
        {/* {state.email && <span className={styles.errorMessage}>{state.email}</span>} */}
      </div>
      <div className={styles.formControl}>
        <label htmlFor="signin-password" className={styles.loginLabel}>
          Password
        </label>
        <input id="signin-password" type="password" name="password" autoComplete="current-password" required className={styles.loginInput} />
        {/* {state.password && <span className={styles.errorMessage}>{state.password}</span>} */}
      </div>

      <SignInButton />

      <p className={styles.helpText}>Need help accessing your account? <Link href="/contact">Contact the hotel</Link></p>
      <p className={styles.switchText}>
        Don't have an account? <Link href="/signup">Sign Up</Link>
      </p>
      <Toaster position="top-center" reverseOrder={false} />
    </form>
  );
}

export default CredentialsForm;
