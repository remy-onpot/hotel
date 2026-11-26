import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ROOM_AMENITY_MAP, ROOM_AMENITY_GROUPS } from "@/app/_lib/roomAmenities";
import PropertyAmenitiesDialog from "@/app/_components/PropertyAmenitiesDialog";
import styles from "./styles.module.css";

function RoomFeaturesCatalog({ orderedGroups, roomCount }) {
  return <section className={styles.catalog} aria-labelledby="room-features-title">
    <header className={styles.catalogHeader}>
      <p className={styles.eyebrow}>Considered comforts</p>
      <h2 id="room-features-title">In-room features</h2>
      <p>Features vary by room type. Availability is shown for each amenity.</p>
    </header>
    <div className={styles.groups}>
      {orderedGroups.map(([group, amenities]) => <article className={styles.groupCard} key={group}>
        <h3>{group}</h3>
        <ul>{amenities.map(({ label, icon, count }) => <li key={label}>
          <span className={styles.icon} aria-hidden="true">{icon ? <FontAwesomeIcon icon={icon} /> : <span>✧</span>}</span>
          <span className={styles.amenityName}>{label}</span>
          <span className={styles.availability}>{count === roomCount ? "All room types" : `${count} of ${roomCount} types`}</span>
        </li>)}</ul>
      </article>)}
    </div>
  </section>;
}

function RoomFeatures({ rooms }) {
  const counts = new Map();
  for (const room of rooms) {
    const uniqueFeatures = new Set(Array.isArray(room.features) ? room.features : []);
    for (const label of uniqueFeatures) {
      const amenity = ROOM_AMENITY_MAP.get(label);
      const group = amenity?.group ?? "Additional amenities";
      const current = counts.get(label) ?? { label, group, icon: amenity?.icon, count: 0 };
      current.count += 1;
      counts.set(label, current);
    }
  }

  const groupOrder = ROOM_AMENITY_GROUPS.map(({ name }) => name);
  const groups = new Map();
  for (const amenity of counts.values()) {
    if (!groups.has(amenity.group)) groups.set(amenity.group, []);
    groups.get(amenity.group).push(amenity);
  }
  const orderedGroups = [...groups.entries()].sort(([left], [right]) => {
    const leftIndex = groupOrder.indexOf(left);
    const rightIndex = groupOrder.indexOf(right);
    return (leftIndex < 0 ? groupOrder.length : leftIndex) - (rightIndex < 0 ? groupOrder.length : rightIndex);
  });
  if (!orderedGroups.length) return null;

  const previewFeatures = [...counts.values()]
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 4);

  return <section className={styles.section} aria-labelledby="landing-room-features-title">
    <div className={styles.inner}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Considered comforts</p><h2 id="landing-room-features-title">In-room features</h2><p>Thoughtful details make it easy to settle in. Features vary by room type.</p></div>
        <PropertyAmenitiesDialog triggerClassName={styles.viewAllButton} triggerLabel="View all in-room features" dialogId="room-features-dialog" titleId="room-features-title">
          <RoomFeaturesCatalog orderedGroups={orderedGroups} roomCount={rooms.length} />
        </PropertyAmenitiesDialog>
      </header>
      <ul className={styles.previewGrid} aria-label="A few in-room features">
        {previewFeatures.map(({ label, icon, count }) => <li className={styles.previewCard} key={label}>
          <span className={styles.icon} aria-hidden="true">{icon ? <FontAwesomeIcon icon={icon} /> : <span>✧</span>}</span>
          <span className={styles.amenityName}>{label}</span>
          <span className={styles.availability}>{count === rooms.length ? "All room types" : `${count} of ${rooms.length} types`}</span>
        </li>)}
      </ul>
    </div>
  </section>;
}

export default RoomFeatures;
