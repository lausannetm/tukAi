import type { ReactNode } from "react";
import { AnimatedBackground } from "./animated-background";
import { HeroSearchBar } from "./hero-search-bar";


/**
 * Home microfrontend content: animated background + centered search hero.
 * Header/nav lives in `@/components/shell/site-shell-layout` (single shell for all routes).
 */
export function HomeMicrofrontendMain(props: {
  heroSlot?: ReactNode;
  children?: ReactNode;
}): JSX.Element {
  const hero =
    props.heroSlot ?? (
      <>
        <AnimatedBackground />
        <HeroSearchBar />
      </>
    );

  return (
    <div className="flex-grow-1 flex flex-column relative overflow-hidden home-hero-main min-h-[calc(100vh-5rem)]">
      {hero}
      {props.children}
    </div>
  );
}
