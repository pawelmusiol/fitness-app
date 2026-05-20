"use server";

import clientPromise from "@/lib/db";

export async function seedExercises() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const sampleExercises = [
      { name: "Wyciskanie sztangi leżąc", category: "Chest", isCustom: false },
      { name: "Przysiad ze sztangą", category: "Legs", isCustom: false },
      { name: "Martwy ciąg", category: "Back", isCustom: false },
      { name: "Wyciskanie żołnierskie", category: "Shoulders", isCustom: false },
      { name: "Podciąganie na drążku", category: "Back", isCustom: false },
      { name: "Uginanie ramion z hantlami", category: "Arms", isCustom: false },
      { name: "Wyciskanie francuskie", category: "Arms", isCustom: false },
      { name: "Wykroki", category: "Legs", isCustom: false },
    ];

    // Sprawdzamy, czy baza jest pusta, żeby nie dodać tego 100 razy
    const count = await db.collection("exercises").countDocuments();
    if (count === 0) {
      await db.collection("exercises").insertMany(sampleExercises);
      return { success: "Dodano ćwiczenia startowe!" };
    } else {
      return { error: "Baza już zawiera ćwiczenia." };
    }
  } catch (error) {
    return { error: "Błąd podczas dodawania ćwiczeń." };
  }
}