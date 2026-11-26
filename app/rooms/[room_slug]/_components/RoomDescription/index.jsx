import Heading from "@/app/_ui/Heading";
import styles from "./styles.module.css";

function RoomDescription({ description }) {
  return (
    <div className={styles.description}>
      <Heading className="text-center">Settle into something special</Heading>

      <hr className="decriptionDivider" />

      <div className={styles.descriptionContent}>
        {description && <p>{description}</p>}
        <p>
          Each room is individually decorated and includes air conditioning, a
          private bathroom, a 32-inch LED TV with satellite channels and
          streaming, free Wi-Fi, and a laptop-friendly workspace. Rooms have
          Tempur-Pedic mattresses and Frette Italian sheets.
        </p>
        <p>
          Minibars, slippers, and rainfall showers are available. Connecting or
          adjoining rooms can be requested. Review the in-room features listed
          above for this room before booking.
        </p>
      </div>
    </div>
  );
}

export default RoomDescription;
