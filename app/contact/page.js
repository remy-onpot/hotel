import Banner from "../_components/Banner";
import ContactSection from "../_components/ContactSection";

export const metadata = {
  title: "Contact The Winford Boutique Hotel Achimota",
  description: "Contact The Winford Boutique Hotel Achimota in Tantra, New Achimota, Accra, Ghana.",
};

async function Page() {
  return (
    <>
      <Banner title={"We’re here to help"} />
      <ContactSection />
    </>
  );
}

export default Page;
