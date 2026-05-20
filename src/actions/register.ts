// src/actions/register.ts
"use server";

import clientPromise from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { registerSchema } from "@/lib/schemas";

export async function registerUser(values: z.infer<typeof registerSchema>) {
  const { name, email, password } = values;

  if (!email || !password || !name) {
    return { error: "Wypełnij wszystkie pola!" };
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // Sprawdzamy, czy email jest już w bazie
    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      return { error: "Użytkownik o tym adresie email już istnieje." };
    }

    // Szyfrujemy hasło
    const hashedPassword = await bcrypt.hash(password, 10);

    // Zapisujemy użytkownika
    await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return { success: "Konto zostało pomyślnie utworzone!" };
  } catch (error) {
    console.log(error);
    
    return { error: "Wystąpił błąd podczas rejestracji." };
  }
}