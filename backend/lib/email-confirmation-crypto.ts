import { createHash, randomBytes } from "node:crypto";

const HEX = "hex" as const;

export function generateEmailConfirmationToken(): string {
  return randomBytes(32).toString(HEX);
}

export function hashEmailConfirmationToken(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest(HEX);
}
