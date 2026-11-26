"use client";
import styles from "./index.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ExpirePage = ({ reference }) => {
  const router = useRouter();
  return (
    <>
      <div className={`container ${styles.expiredCard}`}>
        <div className={styles.expiredIcon}>{/* <Clock size={48} /> */}</div>
        <h2 className={styles.expiredTitle}>Payment not confirmed</h2>
        <p className={styles.expiredMessage}>
          We could not confirm this payment. If money was deducted, contact the hotel with your payment reference before
          trying again. If your room hold expired, the hotel will review the payment and arrange a refund.
        </p>
        {reference && <p className={styles.reference}>Payment reference: <strong>{reference}</strong></p>}

        <div className={styles.infoBox}>
          {/* <AlertCircle className={styles.infoIcon} size={20} /> */}
          <p>
            Reservations are confirmed only after Paystack verifies a successful payment.
          </p>
        </div>

        <div className={styles.actionButtons}>
          <Link href={"/rooms"} className={styles.primaryButton}>
            {/* <RefreshCcw size={20} /> */}
            Start New Booking
          </Link>
          <button onClick={() => router.back()} className={styles.secondaryButton}>
            {/* <ArrowLeft size={20} /> */}
            Go Back
          </button>
        </div>
      </div>
    </>
  );
};

export default ExpirePage;
