import { auth } from "@/auth";
import PublicChrome from "./PublicChrome";
import styles from "./styles.css";

import { signOutAction } from "./_lib/actions";
import { brand } from "./_lib/brand";

export const metadata = {
  title: {
    default: `${brand.name} | Boutique hotel in Accra`,
    template: `%s | ${brand.name}`,
  },
  description: "Stay at The Winford Boutique Hotel Achimota in Tantra, New Achimota, Accra. Explore rooms, check availability, and plan your visit.",
};

export default async function RootLayout({ children }) {
  const session = await auth();
  return (
    <html lang="en">
      <body>
        <PublicChrome user={session?.user} signOutAction={signOutAction}>
          {children}
        </PublicChrome>
      </body>
    </html>
  );
}
