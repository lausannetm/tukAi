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
  confirmationEmailSent?: boolean;
};

export type AuthMeResponse = {
  user: UserPublicDTO;
  services: ServiceDTO[];
};
