import Heading from "@/app/_ui/Heading";

import styles from "./styles.module.css";
import RoomCard from "../RoomCard";
import { getAllRooms } from "@/app/_lib/supabase/rooms";

async function Rooms() {
  const results = await getAllRooms();
  const rooms = Array.isArray(results) ? results.slice(0, 6) : [];
  return (
    <section className={styles.roomsSection}>
      <div className="container">
        <Heading className="text-center">Our Rooms</Heading>
        <p className="text-center">
          Explore our rooms and suites at The Winford Boutique Hotel Achimota.
        </p>
        <div className={styles.roomsGrid}>
          {rooms.map((item, index) => (
            <RoomCard key={index} room={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Rooms;
