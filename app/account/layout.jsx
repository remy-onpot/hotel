import Link from "next/link";
import styles from "./styles.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHistory, faSignOut, faUser, faUtensils } from "@fortawesome/free-solid-svg-icons";
import { signOutAction } from "../_lib/actions";

function Layout({ children }) {
  return (
    <section className={styles.accountLayout}>
      <aside className={styles.accountSidebar}>
        <nav aria-label="Guest account" className={styles.accountNavigation}>
          <ul className={styles.sidebarList}>
            <li>
              <Link href={"/account/history"} className={styles.sidebarLink}>
                <span>
                  <FontAwesomeIcon icon={faHistory} />
                </span>
                <span>History</span>
              </Link>
            </li>
            <li>
              <Link href="/store" className={styles.sidebarLink}>
                <span><FontAwesomeIcon icon={faUtensils} /></span>
                <span>Room service</span>
              </Link>
            </li>
            <li>
              <Link href={"/account/profile"} className={styles.sidebarLink}>
                <span>
                  <FontAwesomeIcon icon={faUser} />
                </span>
                <span>Profile</span>
              </Link>
            </li>
            <li>
              <form action={signOutAction}>
                <button className={styles.sidebarButton}>
                  <span>
                    <FontAwesomeIcon icon={faSignOut} />
                  </span>
                  <span>Sign out</span>
                </button>
              </form>
            </li>
          </ul>
        </nav>
      </aside>
      <div className={styles.content}>{children}</div>
    </section>
  );
}

export default Layout;
