import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBellConcierge,
  faBriefcase,
  faBuilding,
  faChild,
  faConciergeBell,
  faGolfBallTee,
  faHotel,
  faSnowflake,
  faMugHot,
  faShirt,
  faBroom,
  faSpa,
  faUmbrella,
  faUtensils,
  faVanShuttle,
  faWifi,
} from "@fortawesome/free-solid-svg-icons";
import PropertyAmenitiesDialog from "@/app/_components/PropertyAmenitiesDialog";
import styles from "./styles.module.css";

const popularAmenities = [
  { label: "Spa", icon: faSpa },
  { label: "Free self parking", icon: faVanShuttle },
  { label: "Free WiFi", icon: faWifi },
  { label: "Restaurant", icon: faUtensils },
  { label: "Air conditioning", icon: faSnowflake },
  { label: "Breakfast available", icon: faMugHot },
  { label: "Business services", icon: faBriefcase },
  { label: "Bar", icon: faUtensils },
  { label: "Laundry", icon: faShirt },
  { label: "Room service", icon: faBellConcierge },
  { label: "Daily housekeeping", icon: faBroom },
  { label: "24/7 front desk", icon: faConciergeBell },
];

function PopularAmenities() {
  return <ul>{popularAmenities.map(({ label, icon }) => <li key={label}>
    <span><FontAwesomeIcon icon={icon} aria-hidden="true" /></span><strong>{label}</strong>
  </li>)}</ul>;
}

const groups = [
  { title: "Parking and transportation", icon: faVanShuttle, items: ["24-hour roundtrip airport shuttle available on request for a surcharge", "Free self parking on site"] },
  { title: "Food and drink", icon: faUtensils, items: ["Daily continental breakfast, 7:00 AM–9:30 AM: GHS 40 per adult and GHS 20 per child", "A bar/lounge", "A restaurant", "Couples/private dining", "Private picnics", "Snack bar/deli"] },
  { title: "Internet", icon: faWifi, items: ["Free WiFi in all rooms", "Free WiFi in some public areas"] },
  { title: "Things to do", icon: faGolfBallTee, items: ["Full-service spa", "Golf carts", "Golf clubs/equipment", "Library", "Mini golf", "Playground", "TV in common areas"] },
  { title: "Family friendly", icon: faChild, items: ["Children’s games", "Children’s toys", "Laundry facilities", "Mini golf", "Playground", "Snack bar/deli"] },
  { title: "Conveniences", icon: faConciergeBell, items: ["24-hour front desk", "Free newspapers in lobby", "Laundry facilities", "Lockers", "Luggage storage", "Vending machine"] },
  { title: "Guest services", icon: faBellConcierge, items: ["Daily housekeeping", "Proposal/romance packages", "Tour and ticket assistance"] },
  { title: "Business services", icon: faBriefcase, items: ["3 meeting rooms", "Business center", "Computer station", "Conference center with 1,300 square feet of space"] },
  { title: "Outdoors", icon: faUmbrella, items: ["Barbecue grill", "Garden", "Picnic area", "Rooftop terrace"] },
  { title: "Accessibility", icon: faBuilding, items: ["No elevator"] },
  { title: "Spa", icon: faSpa, items: ["Full-service spa", "Massage", "Spa open daily"] },
  { title: "More", icon: faHotel, items: ["3 floors", "Banquet hall", "Built in 2018", "Mosquito nets", "Smoking not allowed"] },
];

function PropertyAmenitiesCatalog({ compact = false }) {
  return <section className={`${styles.section} ${compact ? styles.compactSection : ""}`} aria-labelledby="property-amenities-dialog-title">
    <div className={styles.inner}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Everything in one place</p>
        <h2 id="property-amenities-dialog-title">Property amenities</h2>
        <p>Explore the comforts, services, and spaces available during your stay at The Winford.</p>
      </header>
      <section className={styles.popular} aria-labelledby="popular-title-dialog">
        <h3 id="popular-title-dialog">Popular amenities</h3>
        <PopularAmenities />
      </section>
      <div className={styles.grid}>
        {groups.map(({ title, icon, items }) => <article className={styles.card} key={title}>
          <div className={styles.cardHeading}><span><FontAwesomeIcon icon={icon} aria-hidden="true" /></span><h3>{title}</h3></div>
          <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>)}
      </div>
      <div className={styles.extraNotes}>
        <article><p className={styles.noteLabel}>Families love it for</p><p>Playground, miniature golf, and laundry.</p></article>
        <article><p className={styles.noteLabel}>Activities nearby</p><p>Health/beauty spa and outlet shopping mall.</p></article>
      </div>
    </div>
  </section>;
}

export default function PropertyAmenities({ compact = false }) {
  if (compact) return <PropertyAmenitiesCatalog compact />;
  return <section className={styles.preview} id="property-amenities" aria-labelledby="property-amenities-title">
    <div className={styles.inner}>
      <header className={styles.previewHeader}>
        <div><p className={styles.eyebrow}>Everything in one place</p><h2 id="property-amenities-title">Property amenities</h2><p>Comforts and services to make your stay easier.</p></div>
        <PropertyAmenitiesDialog triggerClassName={styles.viewAllButton} triggerLabel="View all amenities">
          <PropertyAmenitiesCatalog compact />
        </PropertyAmenitiesDialog>
      </header>
      <section className={`${styles.popular} ${styles.popularPreview}`} aria-labelledby="popular-title">
        <h3 id="popular-title">Popular amenities</h3>
        <PopularAmenities />
      </section>
    </div>
  </section>;
}
