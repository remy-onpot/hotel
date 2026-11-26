import Heading from "@/app/_ui/Heading";
import styles from "./styles.module.css";
import Image from "next/image";
import { getAllRooms } from "@/app/_lib/supabase/rooms";
import { getPublishedGalleryImages } from "@/app/_lib/supabase/gallery";
import { getRoomImageUrl } from "@/app/_lib/roomImage";
async function Gallery() {
  const [results, propertyImages] = await Promise.all([getAllRooms(), getPublishedGalleryImages()]);
  const rooms = Array.isArray(results) ? results.slice(0, 8) : [];
  const photos = [
    ...propertyImages.map((item) => ({ id: `property-${item.id}`, title: item.title, alt: item.alt_text, src: getRoomImageUrl(item.image_path), type: "The property" })),
    ...rooms.map((item) => ({ id: `room-${item.id}`, title: item.name, alt: `${item.name} room at The Winford`, src: getRoomImageUrl(item.thumbnail), type: "Guest rooms" })),
  ];
  return (
    <section className={styles.gallerySection}>
      <div className="container">
        <Heading className="text-center">Gallery</Heading>
        <p className={styles.intro}>A closer look at the spaces and details that make a stay at The Winford special.</p>
        <div className={styles.galleryGrid}>
          {photos.map((item) => (
            <figure key={item.id} className={styles.thumbnail}>
              <Image
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1200px) 33vw, 280px"
                quality={90}
                src={item.src}
                alt={item.alt}
              />
              <figcaption><span>{item.type}</span>{item.title && <strong>{item.title}</strong>}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Gallery;
