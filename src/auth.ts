// src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./lib/db";
import bcrypt from "bcryptjs";

if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
    throw new Error("Brak kluczy Google w zmiennych środowiskowych!");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: MongoDBAdapter(clientPromise),
    session: {
        // Ważne: Przy korzystaniu z Credentials i bazy danych, Auth.js wymusza JWT
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
        Credentials({
            name: "Email i Hasło",
            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                    placeholder: "jan@kowalski.pl",
                },
                password: { label: "Hasło", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Brakujące dane logowania.");
                }

                const client = await clientPromise;
                const db = client.db(); // Używa bazy zdefiniowanej w MONGODB_URI

                // Szukamy użytkownika po adresie email
                const user = await db
                    .collection("users")
                    .findOne({ email: credentials.email });

                // Sprawdzamy, czy użytkownik istnieje i czy ma ustawione hasło
                // (może go nie mieć, jeśli logował się tylko przez Google)
                if (!user || !user.password) {
                    throw new Error(
                        "Nie znaleziono użytkownika lub brak hasła."
                    );
                }

                // Porównujemy hasło z formularza z zaszyfrowanym hasłem w bazie
                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Nieprawidłowe hasło.");
                }

                // Jeśli wszystko się zgadza, zwracamy obiekt użytkownika
                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                };
            },
        }),
    ],
    callbacks: {
        // 1. Zapisujemy ID użytkownika do tokena JWT podczas logowania
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        // 2. Kopiujemy ID z tokena do obiektu sesji, z którego korzysta nasza aplikacja
        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
});
