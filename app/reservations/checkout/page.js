import Banner from "@/app/_components/Banner";
import CheckoutForm from "./_components/CheckoutSection";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Complete your booking",
  description: "Review your reservation details and complete your Winford Boutique Hotel Achimota booking.",
};

async function Page() {
  const session = await auth();

  if (!session) return redirect("/signin");

  return (
    <>
      <Banner title={"Complete your booking"} />
      <CheckoutForm />
    </>
  );
}

export default Page;
