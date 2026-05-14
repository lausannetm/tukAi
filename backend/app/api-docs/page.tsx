import { SwaggerEmbed } from "@/components/swagger-embed";

function appHref(): string {
  return (
    process.env.FRONTEND_PUBLIC_URL?.trim() || "http://localhost:3000"
  );
}

export default function ApiDocsPage(): JSX.Element {
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <nav
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid #e5e5e5",
          background: "#fff",
          fontFamily: "system-ui",
        }}
      >
        <a href={appHref()}>Frontend app</a>
        <span style={{ marginLeft: 12, color: "#666", fontSize: 14 }}>
          OpenAPI at <code>/openapi.json</code>
        </span>
      </nav>
      <SwaggerEmbed />
    </div>
  );
}
