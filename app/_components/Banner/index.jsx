import styles from "./styles.module.css";

function Banner({ title, variant }) {
  return (
    <div className={`${styles.banner} ${variant === "rooms" ? styles.roomsBanner : ""}`}>
      <div className={styles.overlay}>
        <h1 className={styles.bannerHeading}>{title}</h1>
      </div>
    </div>
  );
}

export default Banner;
