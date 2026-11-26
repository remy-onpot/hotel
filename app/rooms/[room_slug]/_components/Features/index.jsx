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
          <h2 id="room-features-heading">In-room features</h2>
          <div className={styles.amenityGroups}>
            {Object.entries(groups).map(([group, amenities]) => <section className={styles.amenityGroup} key={group}>
              <h3>{group}</h3>
              <ul>{amenities.map(({ label, icon }) => <li key={label}>
                <span className={styles.amenityIcon} aria-hidden="true">{icon ? <FontAwesomeIcon icon={icon} /> : <span>✦</span>}</span>
                <span>{label}</span>
              </li>)}</ul>
            </section>)}
          </div>
        </section>
      )}
    </>
  );
}

export default Features;
