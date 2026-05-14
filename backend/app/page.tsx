export default function ApiLandingPage(): JSX.Element {
  const appUrl =
    process.env.FRONTEND_PUBLIC_URL?.trim() || "http://localhost:3000";

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", lineHeight: 1.55 }}>
      <h1 style={{ marginTop: 0 }}>REST API</h1>
      <p style={{ color: "#444" }}>
        This service exposes <code>GET /services</code>,{" "}
        <code>POST /services</code>, <code>POST /orders</code>, and OpenAPI at{" "}
        <code>/openapi.json</code>.
      </p>
      <ul>
        <li>
          <a href="/api-docs">Swagger UI</a>
        </li>
        <li>
          <a href={appUrl}>Customer web app (frontend)</a>
        </li>
      </ul>
    </main>
  );
}
