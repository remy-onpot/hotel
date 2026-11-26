import Heading from "@/app/_ui/Heading";
import styles from "./styles.module.css";
import Card from "../Card/Card";
import Image from "next/image";
function Blog() {
  return (
    <section className={styles.blogSection}>
      <div className="container">
        <Heading className={styles.heading}>Make the most of your stay</Heading>
        <p className={styles.description}>A few of the comforts and experiences waiting at The Winford.</p>

        <div className={styles.blogGrid}>
          <Card>
            <Card.Thumbnail>
              <Image
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1200px) 33vw, 360px"
                quality={90}
                src="/The%20Winford%20Boutique%20Hotel%20Achimota%20-%20Google%20Maps/landing/e874a3f9-4acf-4cfe-a44e-b7fa6a050a4a.png"
                alt="Seating on the rooftop terrace at The Winford"
              />
            </Card.Thumbnail>
            <Card.Description className={styles.blogDescriptionContainer}>
              <h2 className={styles.blogHeading}>A view from above</h2>
              <p className={styles.blogLabel}>Rooftop terrace</p>
              <p className={styles.blogDescription}>
                Take a break on the rooftop terrace and enjoy a different perspective on your time in Accra.
              </p>
            </Card.Description>
          </Card>
          <Card>
            <Card.Thumbnail>
              <Image fill sizes="(max-width: 700px) 100vw, (max-width: 1200px) 33vw, 360px" quality={90} src="/winford-bar.jpg" alt="Bar and seating at The Winford" />
            </Card.Thumbnail>
            <Card.Description className={styles.blogDescriptionContainer}>
              <h2 className={styles.blogHeading}>Dining at The Winford</h2>
              <p className={styles.blogLabel}>Restaurant and bar</p>
              <p className={styles.blogDescription}>
                Settle in for a meal or a drink at the on-site restaurant and bar during your stay.
              </p>
            </Card.Description>
          </Card>

          <Card>
            <Card.Thumbnail>
              <Image
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1200px) 33vw, 360px"
                quality={90}
                src="/The%20Winford%20Boutique%20Hotel%20Achimota%20-%20Google%20Maps/landing/8aec8d32-d0a1-42f6-ad51-532056072aab.png"
                alt="Guest bedroom at The Winford"
              />
            </Card.Thumbnail>
            <Card.Description className={styles.blogDescriptionContainer}>
              <h2 className={styles.blogHeading}>Time to unwind</h2>
              <p className={styles.blogLabel}>Ayiwa Spa</p>
              <p className={styles.blogDescription}>
                Make room in your itinerary for a massage at Ayiwa Spa, the on-site spa.
              </p>
            </Card.Description>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default Blog;
