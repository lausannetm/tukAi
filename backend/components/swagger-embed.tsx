"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: (): JSX.Element => (
    <p style={{ padding: 24 }}>Loading API docs…</p>
  ),
});

export function SwaggerEmbed(): JSX.Element {
  return <SwaggerUI url="/openapi.json" />;
}
