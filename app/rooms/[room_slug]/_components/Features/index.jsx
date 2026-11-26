import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./styles.module.css";
import { faBed, faMoneyBillWave, faUsers } from "@fortawesome/free-solid-svg-icons";
import { formatRoomPrice } from "@/app/_lib/money";
import { ROOM_AMENITY_MAP } from "@/app/_lib/roomAmenities";

function Features({ room }) {
  const groups = (room.features ?? []).reduce((result, label) => {
    const amenity = ROOM_AMENITY_MAP.get(label);
    const group = amenity?.group ?? "Additional amenities";
    result[group] ??= [];
    result[group].push({ label, icon: amenity?.icon });
    return result;
  }, {});
  const allAmenities = Object.values(groups).flat();
  const previewAmenities = allAmenities.slice(0, 3);

  return (
    <>
      <ul className={styles.features}>
        <li>
          <span className={styles.featureIcon}>
            <FontAwesomeIcon icon={faBed} />
          </span>
          <span className={styles.featureLabel}>Sleeps:</span> {room.sleeps} Adults
        </li>
        <li>
          <span className={styles.featureIcon}>
            <FontAwesomeIcon icon={faUsers} />
          </span>
          <span className={styles.featureLabel}>Capacity:</span> {room.capacity}
        </li>
        <li>
          <span className={styles.featureIcon}>
            <FontAwesomeIcon icon={faMoneyBillWave} />
          </span>
          <span className={styles.featureLabel}>Price:</span> from {formatRoomPrice(room.price, room.price_usd)} / night
        </li>
      </ul>

      {room.features?.length > 0 && (
        <section className={styles.roomFeatures} aria-labelledby="room-features-heading">
          <div className={styles.featuresHeader}>
            <div>
              <span className={styles.featuresEyebrow}>Thoughtful details</span>
              <h2 id="room-features-heading">In-room features</h2>
            </div>
            <span className={styles.featureCount}>{allAmenities.length} amenities</span>
          </div>
          <ul className={styles.featurePreview} aria-label="A few in-room features">
            {previewAmenities.map(({ label, icon }) => <li className={styles.previewItem} key={label}>
              <span className={styles.amenityIcon} aria-hidden="true">{icon ? <FontAwesomeIcon icon={icon} /> : <span>✧</span>}</span>
              <span>{label}</span>
            </li>)}
            {allAmenities.length > previewAmenities.length && <li className={styles.moreCount}>+{allAmenities.length - previewAmenities.length} more</li>}
          </ul>
          <details className={styles.featureDisclosure}>
            <summary>
              <span>View all in-room features</span>
              <span className={styles.disclosureIcon} aria-hidden="true">+</span>
            </summary>
            <div className={styles.amenityGroups}>
            {Object.entries(groups).map(([group, amenities]) => <section className={styles.amenityGroup} key={group}>
              <h3>{group}</h3>
              <ul>{amenities.map(({ label, icon }) => <li key={label}>
                <span className={styles.amenityIcon} aria-hidden="true">{icon ? <FontAwesomeIcon icon={icon} /> : <span>✦</span>}</span>
                <span>{label}</span>
              </li>)}</ul>
            </section>)}
            </div>
          </details>
        </section>
      )}
    </>
  );
}

export default Features;
