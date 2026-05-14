import type { Metadata } from "next";
import { ConfirmEmailClient } from "@/components/auth/confirm-email-client";

export const metadata: Metadata = {
  title: "Confirm email",
  description: "Confirm your email address",
};

export default function ConfirmEmailPage(): JSX.Element {
  return (
    <div className="px-3 sm:px-4 py-6 max-w-screen-md mx-auto">
      <ConfirmEmailClient />
    </div>
  );
}
