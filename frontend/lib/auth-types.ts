import type { ServiceDTO } from "@/lib/types";

export type UserPublicDTO = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
};

export type AuthTokenResponse = {
  token: string;
  user: UserPublicDTO;
};

/** POST /auth/register — no JWT until the user confirms email. */
export type RegisterResponse = {
  user: UserPublicDTO;
  confirmationEmailSent: boolean;
};

/** GET /auth/confirm-email — JWT issued after successful confirm. */
export type ConfirmEmailApiResponse = {
  ok: true;
  email: string;
  token: string;
  user: UserPublicDTO;
};

export type AuthMeResponse = {
  user: UserPublicDTO;
  services: ServiceDTO[];
};
