import Link from "next/link";
import styles from "./styles.module.css";
import { brand } from "@/app/_lib/brand";

function Footer() {
  return (
    <footer className={styles.footer}>
      <nav className={`${styles.footerMenu} container`}>
        <div>
          <h3>Contact Us</h3>
          <ul>
            <li><Link href="/contact">Contact the hotel</Link></li>
            <li>{brand.location}</li>
            <li className={styles.icons}></li>
          </ul>
        </div>

        <div>
          <h3>Explore</h3>
          <ul>
            <li>
              <Link href="/">Homepage</Link>
            </li>
            <li>
              <Link href="/rooms">Rooms</Link>
            </li>

            {/* <li>Blog</li> */}
            <li>
              <Link href={"/contact"}>Contact Us</Link>
            </li>

            <li>
              <Link href="/signin">Guest Area</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3>Plan your arrival</h3>
          <ul>
            <li>Check-in: {brand.checkIn}</li>
            <li>Check-out: {brand.checkOut}</li>
            <li>{brand.address}</li>
          </ul>
        </div>
      </nav>
    </footer>
  );
}

export default Footer;
