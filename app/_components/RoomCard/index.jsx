import Image from "next/image";
import styles from "./styles.module.css";
import Card from "../Card/Card";
import { getRoomImageUrl } from "@/app/_lib/roomImage";

function RoomCard({ room }) {
  return (
    <Card>
      <Card.Thumbnail>
        <Image
          fill
          sizes="(max-width: 700px) 100vw, (max-width: 1200px) 33vw, 360px"
          quality={90}
          src={getRoomImageUrl(room.thumbnail)}
          alt=""
        />
      </Card.Thumbnail>

      <Card.Description className={styles.roomDescription}>
        <h2>{room.name}</h2>

        <p>A welcoming retreat for unhurried mornings and well-earned downtime.</p>
      </Card.Description>
    </Card>
  );
}

export default RoomCard;
