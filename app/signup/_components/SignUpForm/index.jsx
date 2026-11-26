import { authAction, signupAction } from "@/app/_lib/actions";
import CredentialsForm from "../CredentialsForm";
import styles from "./styles.module.css";

function SignUpForm() {
  return (
    <div className={`${styles.formSection} container`}>
      <aside className={styles.welcomePanel}>
        <p>YOUR WINFORD ACCOUNT</p>
        <h1>Make room<br /><em>for a better stay.</em></h1>
        <span>Create an account to keep your booking details together and return to them whenever you need.</span>
      </aside>
      <CredentialsForm registerAction={signupAction} authAction={authAction} />
    </div>
  );
}

export default SignUpForm;
