import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const ISSUER = "uglugai-backend";
const AUDIENCE = "uglugai-frontend";
const ALG = "HS256";
const EXPIRY = "7d";

function getSecretKey(): Uint8Array {
  const raw = process.env.JWT_SECRET?.trim();
  if (!raw) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(raw);
}

export type AccessTokenPayload = JWTPayload & { sub: string };

export async function signAccessToken(userId: string): Promise<string> {
  const key = getSecretKey();
  return new SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(EXPIRY)
    .sign(key);
}

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const key = getSecretKey();
  const { payload } = await jwtVerify(token, key, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: [ALG],
  });
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("Invalid token subject");
  }
  return payload as AccessTokenPayload;
}
