import FilterSection from "./_components/FilterSection";

import styles from "./styles.module.css";
import Banner from "../_components/Banner";
import RoomsSection from "./_components/RoomsSection";
import { Suspense } from "react";
import Loader from "../_ui/Loader";

export const metadata = {
  title: "Rooms & Suites",
  description: "Explore rooms and suites at The Winford Boutique Hotel Achimota in Accra, Ghana.",
};

async function Rooms({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const filter = resolvedSearchParams?.sort ?? "default";
  const range = resolvedSearchParams?.range ?? "";
  return (
    <>
      <Banner title={"Rooms & Suites"} variant="rooms" />

      <div className={`container ${styles.roomsHolder}`}>
        <FilterSection filters={{ filter, range }} />

        <Suspense
          key={`${filter}-${range}`}
          fallback={
            <div className={styles.loader}>
              <Loader />
            </div>
          }
        >
          <RoomsSection filter={filter} range={range} />
        </Suspense>
      </div>
    </>
  );
}

export default Rooms;
