// src/actions/workouts.ts
"use server";

import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";
import { ObjectId } from "mongodb";

// Kopia schematu dla bezpieczeństwa (backend zawsze musi ufać tylko sobie)
const workoutSchema = z.object({
  title: z.string().min(2),
  exercises: z.array(
    z.object({
      name: z.string().min(2),
      sets: z.array(
        z.object({
          weight: z.number().min(0),
          reps: z.number().min(1),
        })
      ).min(1),
    })
  ).min(1),
});

export async function saveWorkout(formData: z.infer<typeof workoutSchema>, workoutId?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji." };

  const validatedFields = workoutSchema.safeParse(formData);
  if (!validatedFields.success) return { error: "Błędne dane treningu." };

  try {
    const client = await clientPromise;
    const db = client.db();

    // Jeśli przekazano workoutId, robimy UPDATE
    if (workoutId) {
      await db.collection("workouts").updateOne(
        { _id: new ObjectId(workoutId), userId: session.user.id },
        { $set: { ...validatedFields.data, type: "GYM" } } // Aktualizujemy tylko dane z formularza
      );
      return { success: true };
    } 
    
    revalidatePath("/dashboard");

    // Jeśli nie ma workoutId, robimy standardowy INSERT (tak jak do tej pory)
    const workoutDocument = {
      ...validatedFields.data,
      userId: session.user.id,
      date: new Date(), 
      type: "GYM",
    };
    
    const result = await db.collection("workouts").insertOne(workoutDocument);

    revalidatePath("/dashboard");

    return { success: true, id: result.insertedId.toString() };
    
  } catch (error) {
    return { error: "Błąd serwera przy zapisie." };
  }
}

export async function getWorkouts() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const client = await clientPromise;
    const db = client.db();

    const workouts = await db
      .collection("workouts")
      .find({ userId: session.user.id })
      .sort({ date: -1 }) // -1 oznacza sortowanie malejące (najnowsze na górze)
      .toArray();

    return { success: JSON.parse(JSON.stringify(workouts)) };
  } catch (error) {
    console.error("Błąd pobierania treningów:", error);
    return { error: "Nie udało się pobrać historii treningów." };
  }
}

export async function getWorkoutById(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Brak autoryzacji" };

  try {
    const client = await clientPromise;
    const db = client.db();

    const workout = await db.collection("workouts").findOne({
      _id: new ObjectId(id),
      userId: session.user.id // Zabezpieczenie: nikt nie podejrzy cudzego treningu
    });

    if (!workout) return { error: "Nie znaleziono treningu" };

    return { success: JSON.parse(JSON.stringify(workout)) };
  } catch (error) {
    return { error: "Błąd bazy danych" };
  }
}