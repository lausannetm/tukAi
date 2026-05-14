import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Services Platform API",
};

export default function RootLayout(props: {
  children: ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body>{props.children}</body>
    </html>
  );
}
