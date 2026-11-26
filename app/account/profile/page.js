import styles from "./styles.module.css";
import Heading from "@/app/_ui/Heading";
import ProfileForm from "./_components/ProfileForm";
import { auth } from "@/auth";
import {
  getGuestByEmail,
  updateGuest,
  updateGuestWithPwd,
} from "@/app/_lib/supabase/guests";
import { revalidatePath } from "next/cache";
import { profileSchema } from "@/app/_lib/zodSchemas";
import { hashSync } from "bcryptjs";
import { redirect } from "next/navigation";
import { getCountries } from "@/app/_lib/services";

export const metadata = {
  title: "My Profile",
  description: "View and Edit your profile details",
};

async function Profile() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  if (session.user.role === "admin") redirect("/admin/rooms");

  const user = await getGuestByEmail(session.user.email);

  if (!user) redirect("/signin");
  const countries = await getCountries();
  const countryOptions = [
    { value: "", label: "Select country..." },
    ...(Array.isArray(countries) ? countries : []).map((country) => ({ value: `${country.name}%${country.flag}`, label: country.name })),
  ];

  async function guestUpdateAction(prevState, formData) {
    "use server";
    // TODO: ADD FORM VALIDATION FOR ALL FIELDS
    // TODO: STYLE THE TOSTSIFY COMPONENT

    prevState = {};
    const currentSession = await auth();
    if (!currentSession?.user?.id || String(currentSession.user.id) !== String(user.id)) {
      return { error: "Please sign in again before updating your profile." };
    }
    const guestID = user.id;
    const fullname = formData.get("fullname");
    const nationalityWithFlag = formData.get("nationality");
    const email = user.email;
    const phone = formData.get("phone");
    const password = formData.get("password");
    const confirm_password = formData.get("confirm_password");

    // if (fullname.length < 3) {
    //   return { ...prevState, fullnameErr: "Fullname must be at least 3 characters" };
    // }

    try {
      const z_validation = profileSchema.parse({
        fullname,
        email,
        phone,
        nationality: nationalityWithFlag,
      });
    } catch (err) {
      err.issues.forEach((element) => {
        prevState[element?.path[0] ?? "unknown"] = element.message;
      });
      return { ...prevState };
    }

    const [nationality, countryFlag] = nationalityWithFlag.split("%");

    if (password.trim() || confirm_password.trim()) {
      if (password.length < 6)
        return {
          ...prevState,
          password: "Password must be at least 6 characters",
        };
      if (password != confirm_password)
        return {
          ...prevState,
          password: "Password doesn't match confirmation",
          confirm_password: "Password doesn't match confirmation",
        };

      const hashedPassword = hashSync(password, 10);
      const result = await updateGuestWithPwd(
        guestID,
        fullname,
        nationality,
        countryFlag,
        phone,
        hashedPassword
      );
      if (result.error) return { error: "Could not update your profile. Please try again." };
    } else {
      const result = await updateGuest(
        guestID,
        fullname,
        nationality,
        countryFlag,
        phone
      );
      if (result.error) return { error: "Could not update your profile. Please try again." };
    }

    // REVALIDATE THE DATA FOR THE CACHE
    revalidatePath("/account/profile");
    return { success: "Your profile was updated." };
  }

  return (
    <>
      <section className={styles.page}>
        <header className={styles.pageHeader}><p>YOUR WINFORD ACCOUNT</p><Heading textClassName={styles.heading}>Guest profile</Heading><span>Keep your contact details up to date for a smoother stay.</span></header>
        <ProfileForm guestUpdateAction={guestUpdateAction} guest={user} countryOptions={countryOptions} />
      </section>
    </>
  );
}

export default Profile;
