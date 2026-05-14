import type { Metadata } from "next";
import type { ReactNode } from "react";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "./globals.css";
import { PrimeProviders } from "@/components/prime-providers";

export const metadata: Metadata = {
  title: "AI Services",
  description: "Browse services and place orders",
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
