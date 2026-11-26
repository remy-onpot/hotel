import Heading from "@/app/_ui/Heading";
import styles from "./styles.module.css";
import Image from "next/image";
import { brand } from "@/app/_lib/brand";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUtensils, faUmbrellaBeach, faSpa, faChild, faWifi, faBellConcierge, faSquareParking, faShirt } from "@fortawesome/free-solid-svg-icons";

const amenities = [
  { icon: faUtensils, title: "Dining & lounge", detail: "Restaurant, bar and room service" },
  { icon: faUmbrellaBeach, title: "Outdoor escapes", detail: "Rooftop, garden and picnic area" },
  { icon: faSpa, title: "Ayiwa Spa", detail: "Full-service spa and massage" },
  { icon: faChild, title: "For everyone", detail: "Playground, mini golf and children's games" },
  { icon: faWifi, title: "Stay connected", detail: "Complimentary WiFi" },
  { icon: faSquareParking, title: "Easy arrivals", detail: "Free self parking" },
  { icon: faBellConcierge, title: "Here for you", detail: "24-hour front desk and airport shuttle on request" },
  { icon: faShirt, title: "Everyday comforts", detail: "Daily housekeeping and laundry facilities" },
];

function About() {
  return (
    <section className={styles.aboutSection}>
      <div className={`container ${styles.aboutContainer}`}>
        <div className={styles.description}>
          <Heading>Welcome to The Winford</Heading>
          <p>
            The Winford Boutique Hotel Achimota is a contemporary, family-friendly
            hotel off Mile-7 Road in Tantra, New Achimota. Its 10 rooms span three
            floors, and Accra Mall is roughly a 15-minute drive away, depending on
            traffic. Room options include Standard and Superior Queen/King rooms,
            a Deluxe King Suite, an Executive Suite, and a Deluxe Family Suite.
          </p>
        </div>
        <div className={styles.gallery}>
          <div>
          <Image
            fill
            sizes="(max-width: 719px) 100vw, 55vw"
            quality={90}
            src="/The%20Winford%20Boutique%20Hotel%20Achimota%20-%20Google%20Maps/landing/8aec8d32-d0a1-42f6-ad51-532056072aab.png"
            alt="A guest bedroom at The Winford Boutique Hotel Achimota"
          />
          </div>
        </div>
        <div className={styles.hotelDetails} aria-label="Check-in and check-out times">
          <span><strong>Check-in</strong><span>From {brand.checkIn}</span></span>
          <span className={styles.timeDivider} aria-hidden="true" />
          <span><strong>Check-out</strong><span>By {brand.checkOut}</span></span>
        </div>
        <ul className={styles.amenities} aria-label="Hotel amenities">
          {amenities.map(({ icon, title, detail }) => (
            <li key={title}>
              <span className={styles.amenityIcon} aria-hidden="true">
                <FontAwesomeIcon icon={icon} />
              </span>
              <span className={styles.amenityCopy}>
                <span className={styles.amenityTitle}>{title}</span>
                <span className={styles.amenityDetail}>{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default About;
