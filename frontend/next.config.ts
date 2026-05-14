import fs from "node:fs";
import path from "path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "..");
const useMonorepoTracingRoot =
  fs.existsSync(path.join(monorepoRoot, "package-lock.json")) ||
  fs.existsSync(path.join(monorepoRoot, "pnpm-lock.yaml")) ||
  fs.existsSync(path.join(monorepoRoot, "yarn.lock"));

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["primereact"],
  /**
   * Only widen the tracing root when a real repo root exists (local monorepo).
   * In the Docker build context, `frontend/` is copied alone — `..` would point at
   * the image filesystem root and can break the standalone server at runtime (500s).
   */
  ...(useMonorepoTracingRoot ? { outputFileTracingRoot: monorepoRoot } : {}),
};

export default nextConfig;
