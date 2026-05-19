import type { UserPublicDTO } from "@/lib/auth-types";

export function userDisplayName(user: UserPublicDTO): string {
  const fullName = user.full_name?.trim();
  if (fullName) {
    return fullName;
  }
  const localPart = user.email.split("@")[0]?.trim();
  return localPart || "there";
}
