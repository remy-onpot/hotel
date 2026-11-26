import styles from "./styles.module.css";

/**
 * A small, reusable loading indicator.
 *
 * Copy this component together with styles.module.css into another project.
 */
function LoadingSpinner({ label = "Loading" }) {
  return (
    <span className={styles.loader} role="status" aria-label={label}>
      <span className={styles.visuallyHidden}>{label}</span>
    </span>
  );
}

export default LoadingSpinner;
