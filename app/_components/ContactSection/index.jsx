import Heading from "@/app/_ui/Heading";
import ContactForm from "../ContactForm";
import LocationCard from "../LocationCard";
import styles from "./styles.module.css";
import { contactAction } from "@/app/_lib/actions";

function ContactSection() {
  return (
    <section className={styles.contactSection}>
      <div className="container">
        <Heading className={`text-center ${styles.heading}`}>
          Plan your stay at The Winford
        </Heading>
        <div className={`${styles.contactContainer}`}>
          <ContactForm contactAction={contactAction} />
          <LocationCard />
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
