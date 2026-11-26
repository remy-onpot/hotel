"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ROOM_AMENITY_GROUPS, ROOM_AMENITY_MAP } from "@/app/_lib/roomAmenities";
import styles from "./styles.module.css";

export default function AmenitySelector({ features = [], defaultAll = false }) {
  const hasSavedCatalogAmenities = features.some((feature) => ROOM_AMENITY_MAP.has(feature));
  const selectAllByDefault = defaultAll || !hasSavedCatalogAmenities;
  const selected = new Set(selectAllByDefault ? ROOM_AMENITY_MAP.keys() : features.filter((feature) => ROOM_AMENITY_MAP.has(feature)));
  const custom = features.filter((feature) => !ROOM_AMENITY_MAP.has(feature));
  return <fieldset className={`${styles.wideField} ${styles.amenityFieldset}`}>
    <legend>Room amenities</legend>
    <p className={styles.helpText}>{selectAllByDefault ? "Amenities start selected. Untick anything this room type does not offer." : "Select the amenities available in this room type. Guests see them grouped with matching icons."}</p>
    <div className={styles.amenityGroups}>
      {ROOM_AMENITY_GROUPS.map((group) => <section className={styles.amenityGroup} key={group.name}>
        <h3>{group.name}</h3>
        <div className={styles.amenityOptions}>{group.items.map((item) => <label className={styles.amenityOption} key={item.label}>
          <input type="checkbox" name="features" value={item.label} defaultChecked={selected.has(item.label)} />
          <FontAwesomeIcon icon={item.icon} aria-hidden="true" />
          <span>{item.label}</span>
        </label>)}</div>
      </section>)}
    </div>
    <label className={styles.customAmenities}>Additional amenities<textarea name="custom_features" rows="3" defaultValue={custom.join("\n")} placeholder="Add one extra amenity per line" /><span className={styles.helpText}>Use this for an amenity that is not in the list above.</span></label>
  </fieldset>;
}
