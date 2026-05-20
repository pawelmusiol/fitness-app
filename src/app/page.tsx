import { redirect } from "next/navigation";
import { auth } from "@/auth"; // Zakładam, że używasz NextAuth/Auth.js
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function LandingPage() {
  const session = await auth();

  // Jeśli użytkownik jest zalogowany, wyślij go do dashboardu
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter">
          Fitness <span className="text-yellow-500">Pro</span>
        </h1>
        <p className="text-xl text-gray-400 font-light">
          Śledź swoje postępy, buduj siłę i kontroluj każdy kilogram. 
          Twój osobisty dziennik treningowy w nowoczesnym wydaniu.
        </p>
        
        <div className="flex gap-4 justify-center pt-8">
          <Button asChild size="lg" className="bg-white text-black hover:bg-gray-200">
            <Link href="/login">Zaloguj się</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-zinc-700 text-gray-300 hover:bg-zinc-800">
            <Link href="/register">Załóż konto</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}