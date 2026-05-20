"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Błędny adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setError(null);
    
    // Logowanie klasyczne
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false, // sami obsłużymy przekierowanie
    });

    if (result?.error) {
      setError("Nieprawidłowy email lub hasło");
    } else {
      router.push("/dashboard"); // lub gdziekolwiek chcesz
      router.refresh();
    }
  }

  return (
    <Card className="w-[400px] mx-auto">
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>Witaj z powrotem w aplikacji fitness!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasło</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full">Zaloguj się</Button>
          </form>
        </Form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Lub kontynuuj przez</span>
          </div>
        </div>

        {/* Logowanie przez Google */}
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        >
          Zaloguj przez Google
        </Button>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Nie masz jeszcze konta?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Zarejestruj się
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}