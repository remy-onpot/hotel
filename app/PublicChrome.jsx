"use client";

import { usePathname } from "next/navigation";
import Footer from "./_components/Footer";
import Navbar from "./_ui/Navbar";

export default function PublicChrome({ children, user, signOutAction }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return children;

  return (
    <>
      <Navbar user={user} signOutAction={signOutAction} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
