// src/app/register/page.tsx
import { RegisterForm } from "@/components/forms/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      {/* Tutaj renderujemy Twój gotowy formularz */}
      <RegisterForm />
    </main>
  );
}