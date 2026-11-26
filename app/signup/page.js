import { redirect } from "next/navigation";
import SignUpForm from "@/app/signup/_components/SignUpForm";
import { auth } from "@/auth";
import Banner from "../_components/Banner";
import { cookies } from "next/headers";

export const metadata = {
  title: "Sign Up",
  description: "Create an account to plan and manage your stays at The Winford Boutique Hotel Achimota.",
};

async function Page() {
  const session = await auth();
  const cookieStore = await cookies();
  const redirectURL = cookieStore.has("pending_reservation") ? "/reservations/checkout" : "/account/history";
  if (session?.user) redirect(redirectURL);

  return (
    <>
      <Banner title={"Your stay, all in one place"} />
      <SignUpForm />
    </>
  );
}

export default Page;
