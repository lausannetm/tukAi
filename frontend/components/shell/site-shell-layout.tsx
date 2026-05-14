import type { ReactNode } from "react";
import { Suspense } from "react";
import { SiteHeader } from "./site-header";

function SiteHeaderFallback(): JSX.Element {
  return (
    <header
      className="surface-section border-bottom-1 surface-border sticky top-0 z-5 shadow-1"
      aria-hidden
    >
      <div className="h-3rem max-w-screen-xl mx-auto px-3 sm:px-4" />
    </header>
  );
}

/** Shared chrome for every page (header + landmark main). */
export function SiteShellLayout(props: {
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="surface-ground flex flex-column min-h-screen">
      <Suspense fallback={<SiteHeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main id="site-main" className="flex-grow-1 flex flex-column min-h-0">
        {props.children}
      </main>
    </div>
  );
}
