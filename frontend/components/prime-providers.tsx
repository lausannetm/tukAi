"use client";

import type { ReactNode } from "react";
import { PrimeReactProvider } from "primereact/api";

export function PrimeProviders(props: { children: ReactNode }): JSX.Element {
  return (
    <PrimeReactProvider value={{ ripple: true }}>{props.children}</PrimeReactProvider>
  );
}
