"use client";
import Slider from "../Slider";
import BookingForm from "../BookingForm";
import styles from "./index.module.css";
import BookingButton from "../BookingButton";
import Modal from "@/app/_components/Modal/Modal";
const landingImages = "/The%20Winford%20Boutique%20Hotel%20Achimota%20-%20Google%20Maps/landing";
const images = [
  `${landingImages}/Winford%20Hotel%20Under%20Blue%20Skies.png`,
  `${landingImages}/8aec8d32-d0a1-42f6-ad51-532056072aab.png`,
  `${landingImages}/e874a3f9-4acf-4cfe-a44e-b7fa6a050a4a.png`,
  `${landingImages}/The%20Winford%20Hotel%20at%20Night.png`,
];

function HeroSection({ bookingSearchAction }) {
  return (
    <Slider images={images} imgPriority height="780px" className={styles.hero}>
      <div className={`container ${styles.wrapper}`}>
        <div className={styles.heroTitle}>
          <div className={styles.eyebrow}>The Winford | Accra, Ghana</div>
          <h1>A quieter kind of stay in the heart of Accra.</h1>
          <p>Settle into warm hospitality, considered comforts and rooftop evenings in New Achimota.</p>
          <div className={styles.heroDetails}>
            <span>Rooftop dining</span>
            <span>Thoughtful rooms</span>
            <span>Tantra, Achimota</span>
          </div>
          <div className={styles.heroCTA}>
            <Modal>
              <Modal.ToggleOpen>
                <BookingButton />
              </Modal.ToggleOpen>
              <Modal.Overlay>
                <Modal.Wrapper>
                  <BookingForm bookingSearchAction={bookingSearchAction} idPrefix="mobile-home">
                    <div>
                      <Modal.ToggleClose>
                        <button type="button" className={styles.closeButton}>
                          Cancel
                        </button>
                      </Modal.ToggleClose>
                    </div>
                  </BookingForm>
                </Modal.Wrapper>
              </Modal.Overlay>
            </Modal>
          </div>
        </div>
        <div className={styles.bookingFormContainer}>
          <BookingForm bookingSearchAction={bookingSearchAction} idPrefix="desktop-home" />
        </div>
      </div>
    </Slider>
  );
}

export default HeroSection;
