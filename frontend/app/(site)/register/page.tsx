import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a new account",
};

export default function RegisterPage(): JSX.Element {
  return (
    <div className="px-3 sm:px-4 py-6 max-w-screen-md mx-auto">
      <RegisterForm />
    </div>
  );
}
