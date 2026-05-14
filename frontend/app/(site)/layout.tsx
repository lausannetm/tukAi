import type { ReactNode } from "react";

import { SiteShellLayout } from "@/components/shell/site-shell-layout";

export default function SiteLayout(props: {
  children: ReactNode;
}): JSX.Element {
  return <SiteShellLayout>{props.children}</SiteShellLayout>;
}
