import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";


/** Shared chrome for every page (header + landmark main). */
export function SiteShellLayout(props: {
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="surface-ground flex flex-column min-h-screen">
      <SiteHeader />
      <main id="site-main" className="flex-grow-1 flex flex-column min-h-0">
        {props.children}
      </main>
    </div>
  );
}
