import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your account",
};

export default function LoginPage(): JSX.Element {
  return (
    <div className="px-3 sm:px-4 py-6 max-w-screen-md mx-auto">
      <LoginForm />
    </div>
  );
}
