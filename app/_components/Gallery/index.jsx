import Heading from "@/app/_ui/Heading";
import styles from "./styles.module.css";
import Image from "next/image";
import { getAllRooms } from "@/app/_lib/supabase/rooms";
import { getRoomImageUrl } from "@/app/_lib/roomImage";
async function Gallery() {
  const results = await getAllRooms();
  const rooms = Array.isArray(results) ? results.slice(0, 8) : [];
  return (
    <section className={styles.gallerySection}>
      <div className="container">
        <Heading className="text-center">Gallery</Heading>
        <div className={styles.galleryGrid}>
          {rooms.map((item) => (
            <div key={item.id} className={styles.thumbnail}>
              <Image
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1200px) 33vw, 280px"
                quality={90}
                src={getRoomImageUrl(item.thumbnail)}
                alt=""
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Gallery;
