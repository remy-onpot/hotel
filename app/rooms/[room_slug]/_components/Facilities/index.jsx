import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChild, faConciergeBell, faSpa, faSquareParking, faUtensils, faWifi } from "@fortawesome/free-solid-svg-icons";
import styles from "./styles.module.css";

const highlights = [
  { icon: faUtensils, title: "Restaurant & bar", detail: "Dining and drinks on site" },
  { icon: faSpa, title: "Full-service spa", detail: "Massage and spa services" },
  { icon: faChild, title: "Family activities", detail: "Playground and mini golf" },
  { icon: faWifi, title: "Free WiFi", detail: "Available in rooms and some public areas" },
  { icon: faSquareParking, title: "Free self parking", detail: "Parking available on site" },
  { icon: faConciergeBell, title: "24-hour front desk", detail: "Here to help throughout your stay" },
];

export default function Facilities() {
  return <section className={styles.facilitiesSection} aria-labelledby="hotel-highlights-heading">
    <div className={styles.sectionHeading}>
      <span className={styles.eyebrow}>At The Winford</span>
      <h2 id="hotel-highlights-heading">Hotel highlights</h2>
      <p>A few of the amenities available around the property.</p>
    </div>
    <div className={styles.facilitiesFrame}>
      <ul className={styles.facilitiesList} aria-label="Hotel amenity highlights">
        {highlights.map(({ icon, title, detail }) => <li key={title}>
          <span className={styles.facilityIcon} aria-hidden="true"><FontAwesomeIcon icon={icon} /></span>
          <span className={styles.facilityCopy}><strong>{title}</strong><span>{detail}</span></span>
        </li>)}
      </ul>
    </div>
    <p className={styles.allAmenities}><Link href="/#property-amenities">Explore all property amenities <span aria-hidden="true">→</span></Link></p>
  </section>;
}
