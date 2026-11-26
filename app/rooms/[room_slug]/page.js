import { Suspense } from "react";
import RoomContainer from "./_components/RoomContainer";
import LoadingSpinner from "@/app/_ui/LoadingSpinner";
import styles from "./_components/RoomContainer/styles.module.css";

export const metadata = {
  title: "Rooms at The Winford Boutique Hotel Achimota",
  description: "Explore room details and plan your stay at The Winford Boutique Hotel Achimota in Accra.",
};

async function RoomDetails({ params, searchParams }) {
  const resolvedSearchParams = await searchParams;
  return (
    <section className={`container ${styles.roomPage}`}>
      <Suspense
        fallback={
          <div className="global-loading">
            <LoadingSpinner />
          </div>
        }
      >
        <RoomContainer params={params} searchRange={resolvedSearchParams?.range ?? ""} />
      </Suspense>
    </section>
  );
}

export default RoomDetails;
