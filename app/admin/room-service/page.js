import { auth } from "@/auth";
import { isAdminSession } from "@/app/_lib/admin";
import { notFound, redirect } from "next/navigation";
import OrderQueue from "./queue";
import styles from "./page.module.css";
export const metadata = { title: "Room service orders", robots: { index: false, follow: false } };
export default async function RoomServicePage() {
  const session = await auth(); if (!session?.user?.email) redirect("/signin"); if (!isAdminSession(session)) notFound();
  return <main className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>Guest experience</p><h1>Room service</h1><p>Keep every in-room order moving from request to delivery.</p></div>
      <span className={styles.live}><i aria-hidden="true" />Live order queue</span>
    </header>
    <OrderQueue />
  </main>;
}
