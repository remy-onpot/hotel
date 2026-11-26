"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./sidebar.module.css";

const links = [
  { href: "/admin/rooms", label: "Rooms & pricing" },
  { href: "/admin/front-desk", label: "Front desk" },
  { href: "/admin/room-service", label: "Room service orders" },
  { href: "/admin/store", label: "Store items" },
  { href: "/admin/inbox", label: "Guest enquiries" },
  { href: "/admin/payment-exceptions", label: "Payment exceptions" },
];

export default function AdminSidebar({ signOutAction }) {
  const pathname = usePathname();
  return (
    <aside className={styles.sidebar}>
      <Link className={styles.brand} href="/admin/rooms">
        <span>THE WINFORD</span>
        <small>HOTEL ADMINISTRATION</small>
      </Link>
      <nav aria-label="Hotel administration">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return <Link key={link.href} href={link.href} className={active ? styles.active : ""} aria-current={active ? "page" : undefined}>{link.label}</Link>;
        })}
      </nav>
      <div className={styles.sidebarFooter}>
        <Link href="/">View public website</Link>
        <form action={signOutAction}><button type="submit">Sign out</button></form>
      </div>
    </aside>
  );
}
