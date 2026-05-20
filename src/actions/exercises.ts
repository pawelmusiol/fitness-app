"use server";

import clientPromise from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";

const exerciseSchema = z.object({
  name: z.string().min(2),
  category: z.enum(["Chest", "Back", "Legs", "Shoulders", "Arms", "Abs", "Cardio", "Other"]),
});

/**
 * Pobiera listę ćwiczeń dostępnych dla użytkownika:
 * 1. Ćwiczenia globalne (brak userId)
 * 2. Ćwiczenia własne użytkownika (userId pasujące do sesji)
 */
export async function getExercises() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const client = await clientPromise;
    const db = client.db();

    const exercises = await db
      .collection("exercises")
      .find({
        $or: [
          { userId: session.user.id },     // Własne ćwiczenia
          { userId: { $exists: false } },  // Ćwiczenia globalne (np. wgrane przez Ciebie)
        ],
      })
      .sort({ name: 1 }) // Alfabetycznie
      .toArray();

    // JSON.parse/stringify to najszybszy sposób na pozbycie się obiektów ObjectId 
    // i zastąpienie ich stringami, co jest wymogiem Server Actions.
    return { success: JSON.parse(JSON.stringify(exercises)) };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to fetch exercises" };
  }
}

export async function addExerciseToLibrary(formData: z.infer<typeof exerciseSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const validatedFields = exerciseSchema.safeParse(formData);
  if (!validatedFields.success) return { error: "Invalid fields" };

  try {
    const client = await clientPromise;
    const db = client.db();

    const newExercise = {
      ...validatedFields.data,
      userId: session.user.id,
      isCustom: true,
      createdAt: new Date()
    };

    const result = await db.collection("exercises").insertOne(newExercise);
    return { success: result.insertedId.toString() };
  } catch (error) {
    return { error: "Failed to add exercise" };
  }
}