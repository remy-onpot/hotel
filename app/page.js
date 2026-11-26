import { Suspense } from "react";
import About from "./_components/About";
import PropertyAmenities from "./_components/PropertyAmenities";
import Blog from "./_components/Blog/Blog";

import Gallery from "./_components/Gallery";
import HeroSection from "./_components/HeroSection";
import Rooms from "./_components/Rooms";
import LoadingSpinner from "./_ui/LoadingSpinner";
import { redirect } from "next/navigation";
import ContactSection from "./_components/ContactSection";

import { brand } from "./_lib/brand";

export const metadata = {
  title: `${brand.name} | ${brand.tagline}`,
  description: "Discover The Winford Boutique Hotel Achimota in Accra, Ghana. Explore rooms, check availability, and plan your stay.",
};

export default async function Home() {
  async function bookingSearchAction(formatedRange) {
    "use server";
    redirect(`/rooms?range=${formatedRange}`);
  }
  return (
    <>
      <HeroSection bookingSearchAction={bookingSearchAction} />
      <About />
      <PropertyAmenities />
      <Suspense
        fallback={
          <div className="global-loading">
            <LoadingSpinner />
          </div>
        }
      >
        <Rooms />
        <Gallery />
      </Suspense>
      <Blog />
      <ContactSection />
    </>
  );
}
