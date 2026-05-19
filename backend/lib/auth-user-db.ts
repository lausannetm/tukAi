import { query } from "@/lib/db";
import { toIsoTimestamp } from "@/lib/iso-timestamp";

export type UserPublicRow = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: Date;
  email_verified_at: Date | null;
};

export type UserWithSecretRow = UserPublicRow & {
  password_hash: string | null;
};

export async function insertRegisteredUser(params: {
  email: string;
  passwordHash: string;
  fullName: string | null;
}): Promise<UserPublicRow> {
  const rows = await query<UserPublicRow>(
    `INSERT INTO users (email, full_name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, email, full_name, created_at, email_verified_at`,
    [params.email, params.fullName, params.passwordHash]
  );
  const row = rows[0];
  if (!row) {
    throw new Error("Could not create user");
  }
  return row;
}

export async function setUserEmailConfirmationChallenge(params: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await query(
    `UPDATE users
     SET email_confirmation_token_hash = $1,
         email_confirmation_expires_at = $2
     WHERE id = $3::uuid`,
    [params.tokenHash, params.expiresAt, params.userId]
  );
}

export type ConfirmedUserRow = { id: string; email: string };

export async function confirmUserEmailByTokenHash(
  tokenHash: string
): Promise<ConfirmedUserRow | null> {
  const rows = await query<ConfirmedUserRow>(
    `UPDATE users
     SET email_verified_at = now(),
         email_confirmation_token_hash = NULL,
         email_confirmation_expires_at = NULL
     WHERE email_confirmation_token_hash = $1
       AND email_confirmation_expires_at IS NOT NULL
       AND email_confirmation_expires_at > now()
     RETURNING id, email`,
    [tokenHash]
  );
  return rows[0] ?? null;
}

export async function findUserWithSecretByEmail(
  email: string
): Promise<UserWithSecretRow | null> {
  const rows = await query<UserWithSecretRow>(
    `SELECT id, email, full_name, password_hash, created_at, email_verified_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function findUserPublicById(
  id: string
): Promise<UserPublicRow | null> {
  const rows = await query<UserPublicRow>(
    `SELECT id, email, full_name, created_at, email_verified_at
     FROM users
     WHERE id = $1::uuid
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export function mapUserPublicToJson(row: UserPublicRow): {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
} {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    created_at: toIsoTimestamp(row.created_at),
  };
}
