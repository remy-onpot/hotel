import styles from "./styles.module.css";
import { brand } from "@/app/_lib/brand";

function LocationCard() {
  return (
    <aside className={styles.locationCard} aria-labelledby="location-title">
      <span className={styles.eyebrow}>The Winford | Achimota, Accra</span>
      <h2 id="location-title">A welcoming stay in New Achimota.</h2>
      <p>
        {brand.address}. Accra Mall is roughly a 15-minute drive away. Free
        self-parking is available, and the airport shuttle can be arranged on request.
      </p>
      <a
        className={styles.directionsLink}
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(brand.googleMapsQuery)}`}
        target="_blank"
        rel="noreferrer"
      >
        Get directions <span aria-hidden="true">&#8599;</span>
      </a>
    </aside>
  );
}

export default LocationCard;
