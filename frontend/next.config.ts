import fs from "node:fs";
import path from "path";
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const monorepoRoot = path.join(__dirname, "..");
const useMonorepoTracingRoot =
  fs.existsSync(path.join(monorepoRoot, "package-lock.json")) ||
  fs.existsSync(path.join(monorepoRoot, "pnpm-lock.yaml")) ||
  fs.existsSync(path.join(monorepoRoot, "yarn.lock"));

/**
 * `output: "standalone"` is required for the Docker image, but it triggers a
 * Next.js dev bug (`clientReferenceManifest` invariant) on some routes.
 * Enable standalone only outside `next dev`.
 */
export default function getNextConfig(phase: string): NextConfig {
  const shared: NextConfig = {
    transpilePackages: ["primereact"],
    /**
     * Only widen the tracing root when a real repo root exists (local monorepo).
     * In the Docker build context, `frontend/` is copied alone — `..` would point at
     * the image filesystem root and can break the standalone server at runtime (500s).
     */
    ...(useMonorepoTracingRoot ? { outputFileTracingRoot: monorepoRoot } : {}),
  };

  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return shared;
  }

  return {
    ...shared,
    output: "standalone",
  };
}
