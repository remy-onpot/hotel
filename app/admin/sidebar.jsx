"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./sidebar.module.css";

const links = [
  { href: "/admin/rooms", label: "Rooms & pricing" },
  { href: "/admin/front-desk", label: "Front desk" },
  { href: "/admin/room-service", label: "Room service orders" },
  { href: "/admin/store", label: "Store items" },
  { href: "/admin/inbox", label: "Guest enquiries" },
  { href: "/admin/payment-exceptions", label: "Payment exceptions" },
    { href: "/admin/gallery", label: "Property gallery" },

];

export default function AdminSidebar({ signOutAction }) {
  const pathname = usePathname();
  const [newOrderCount, setNewOrderCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function refreshOrderCount() {
      try {
        const response = await fetch("/api/admin/room-service?summary=1", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (mounted) setNewOrderCount(Number(data.newOrders) || 0);
      } catch {
        // Keep the last known count if a brief network issue interrupts polling.
      }
    }
    refreshOrderCount();
    const timer = setInterval(refreshOrderCount, 15000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  return (
    <aside className={styles.sidebar}>
      <Link className={styles.brand} href="/admin/rooms">
        <span>THE WINFORD</span>
        <small>HOTEL ADMINISTRATION</small>
      </Link>
      <nav aria-label="Hotel administration">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return <Link key={link.href} href={link.href} className={active ? styles.active : ""} aria-current={active ? "page" : undefined} aria-label={link.href === "/admin/room-service" ? `${link.label}${newOrderCount ? `, ${newOrderCount} new orders` : ""}` : undefined}>
            <span>{link.label}</span>
            {link.href === "/admin/room-service" && newOrderCount > 0 && <span className={styles.orderBadge} aria-hidden="true">{newOrderCount > 99 ? "99+" : newOrderCount}</span>}
          </Link>;
        })}
      </nav>
      <div className={styles.sidebarFooter}>
        <Link href="/">View public website</Link>
        <form action={signOutAction}><button type="submit">Sign out</button></form>
      </div>
    </aside>
  );
}
