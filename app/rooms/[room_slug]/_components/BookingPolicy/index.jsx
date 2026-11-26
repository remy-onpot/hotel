import Accordion from "@/app/_components/Accordion";
import Heading from "@/app/_ui/Heading";

import styles from "./styles.module.css";

function BookingPolicy() {
  return (
    <section className={styles.BookingPolicySection}>
      <Heading className="text-center">Booking Policy</Heading>

      <hr className="decriptionDivider" />

      <div className={styles.accordion}>
        <Accordion className={styles.accordionItem} label={"What are check-in and check-out times?"}>
          <p>
            Check-in starts at 2:00 PM and check-out is by 12:00 PM. Please
            contact the hotel ahead of time if you expect to arrive late or need
            to ask about an early arrival.
          </p>
        </Accordion>
        <Accordion className={styles.accordionItem} label={"Is breakfast available?"}>
          <p>
            Continental breakfast is listed daily from 7:00 AM to 9:30 AM. The
            listed charge is GHS 40 per adult and GHS 20 per child; please
            confirm the current price with the hotel before your stay.
          </p>
        </Accordion>
        <Accordion className={styles.accordionItem} label={"Can I arrange an airport shuttle?"}>
          <p>
            An airport shuttle can be arranged on request. The listed one-way
            charge is GHS 72 per room. Please contact the hotel at least 24 hours
            before arrival to arrange it and confirm the current fee.
          </p>
        </Accordion>
        <Accordion className={styles.accordionItem} label={"What should I know about children and pets?"}>
          <p>
            Family rooms are available. Child rates can depend on age and
            bedding, so confirm the details for your party when booking. The
            hotel does not accommodate pets or service animals.
          </p>
        </Accordion>
        <Accordion className={styles.accordionItem} label={"Is a damage deposit required?"}>
          <p>
            Listings report a refundable US$10 cash damage deposit at check-in.
            Please confirm the amount and payment arrangement with the hotel
            before arrival.
          </p>
        </Accordion>
      </div>
    </section>
  );
}

export default BookingPolicy;
