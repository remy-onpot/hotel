import Image from "next/image";
import styles from "./styles.module.css";
import Link from "next/link";
import { formatRoomPrice } from "@/app/_lib/money";
import { getRoomImageUrl } from "@/app/_lib/roomImage";

function RoomItem({ id, imgPath, price, priceUsd, title, isAvailable, range }) {
  const detailUrl = `/rooms/${id}${range ? `?range=${encodeURIComponent(range)}` : ""}`;
  return (
      <article className={`${styles.roomItem} ${isAvailable === false ? styles.unavailable : ""}`}>
        <Link href={detailUrl} className={styles.imageLink} aria-label={`View ${title}`}>
          <div className={styles.imgOverlay}>
          <Image
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 360px"
            quality={90}
            src={getRoomImageUrl(imgPath)}
            alt=""
          />
          </div>
        </Link>
        {isAvailable === false && <span className={styles.unavailableBadge}>Unavailable for selected dates</span>}
        <div className={styles.roomDescription}>
          <div className={styles.roomMeta}>
            <h2 className={styles.roomTitle}>{title}</h2>
            <span className={styles.price}><span>From</span> {formatRoomPrice(price, priceUsd)} <span>/ night</span></span>
          </div>
          <Link href={detailUrl} className={styles.roomLink}>{isAvailable === false ? "View room & choose dates" : "View room & book"}</Link>
        </div>
      </article>
  );
}

export default RoomItem;
