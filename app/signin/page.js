import { redirect } from "next/navigation";
import SigninForm from "./_components/SigninForm";
import { auth } from "@/auth";
import Banner from "../_components/Banner";
import { cookies } from "next/headers";

export const metadata = {
  title: "Sign In",
  description: "Sign in to manage your stay at The Winford Boutique Hotel Achimota.",
};

async function Page() {
  const session = await auth();
  if (session?.user?.role === "admin") redirect("/admin/rooms");
  if (session?.user) {
    const cookieStore = await cookies();
    redirect(cookieStore.has("pending_reservation") ? "/reservations/checkout" : "/account/history");
  }

  return (
    <>
      <Banner title={"My Account"} />
      <SigninForm />
    </>
  );
}

export default Page;
