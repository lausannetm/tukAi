import type { Metadata } from "next";
import type { ReactNode } from "react";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "./globals.css";
import { PrimeProviders } from "@/components/prime-providers";

export const metadata: Metadata = {
  title: "TukAI - your local service provider",
  description: "Browse services and place orders",
  icons: {
    icon: [{ url: "/images/logo.png", type: "image/png" }],
    apple: "/images/logo.png",
  },
};

export default function RootLayout(props: {
  children: ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className="m-0 p-0 surface-ground">
        <PrimeProviders>{props.children}</PrimeProviders>
      </body>
    </html>
  );
}
