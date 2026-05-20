import { getExercises } from "@/actions/exercises";
import { WorkoutForm } from "@/components/forms/WorkoutForm";
import { notFound } from "next/navigation";

export default async function NewWorkoutPage() {
    const availableExercises = await getExercises()

    if (availableExercises.error) {
        notFound()
    }
  return (
    <main className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <WorkoutForm availableExercises={availableExercises.success} />
    </main>
  );
}