import { auth } from "@/auth";
import { isAdminSession } from "@/app/_lib/admin";
import { notFound, redirect } from "next/navigation";
import OrderQueue from "./queue";
export const metadata = { title: "Room service orders", robots: { index: false, follow: false } };
export default async function RoomServicePage() {
  const session = await auth(); if (!session?.user?.email) redirect("/signin"); if (!isAdminSession(session)) notFound();
  return <main style={{ padding: 28 }}><h1>Room service orders</h1><p>New orders refresh automatically while this page is open.</p><OrderQueue /></main>;
}
