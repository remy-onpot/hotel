import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { isAdminSession } from "@/app/_lib/admin";
import { signOutAction } from "@/app/_lib/actions";
import AdminSidebar from "./sidebar";
import styles from "./layout.module.css";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  if (!isAdminSession(session)) notFound();

  return (
    <div className={styles.adminShell}>
      <AdminSidebar signOutAction={signOutAction} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
