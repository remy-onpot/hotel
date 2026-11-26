import { authAction } from "@/app/_lib/actions";
import CredentialsForm from "../CredentialsForm";
import styles from "./styles.module.css";

function SigninForm() {
  return (
    <div className={`${styles.formSection} container`}>
      <aside className={styles.welcomePanel}>
        <p>THE WINFORD BOUTIQUE HOTEL</p>
        <h1>Welcome back<br /><em>to your stay.</em></h1>
        <span>Sign in to manage your reservations and guest details.</span>
      </aside>
      <CredentialsForm authAction={authAction} />
    </div>
  );
}

export default SigninForm;
