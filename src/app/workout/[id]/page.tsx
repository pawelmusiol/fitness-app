import { getWorkoutById } from "@/actions/workouts";
import { getExercises } from "@/actions/exercises"; // Przywracamy import pobierania ćwiczeń
import { WorkoutForm } from "@/components/forms/WorkoutForm";
import { notFound } from "next/navigation";
import { ExerciseData, SetData } from "@/types/workout";
import { DetailedBodyMap } from "@/components/DetailedBodyMap";

// Definiujemy typ z pełnymi danymi z bazy ćwiczeń
type FullExercise = {
  _id: string;
  name: string;
  category?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
};

export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Pobieramy RÓWNOLEGLE nasz zapisany trening ORAZ całą bazę ćwiczeń
  const [workoutRes, exercisesRes] = await Promise.all([
    getWorkoutById(id),
    getExercises()
  ]);

  if (workoutRes.error || !workoutRes.success) {
    notFound(); 
  }

  const workout = workoutRes.success;
  const availableExercises: FullExercise[] = exercisesRes.success || [];

  const initialData = {
    title: workout.title,
    exercises: workout.exercises.map((ex: ExerciseData) => ({
      name: ex.name,
      sets: ex.sets.map((set: SetData) => ({
        weight: set.weight,
        reps: set.reps,
      })),
    })),
  };

  // --- LOGIKA ŁĄCZENIA TRENINGU Z BAZĄ ĆWICZEŃ ---
  const primarySet = new Set<string>();
  const secondarySet = new Set<string>();

  // Lecimy po ćwiczeniach zapisanych w treningu
  workout.exercises.forEach((savedEx: ExerciseData) => {
    // Szukamy pełnego ćwiczenia w bazie na podstawie nazwy
    const dbExercise = availableExercises.find((ex) => ex.name === savedEx.name);

    // Jeśli znaleźliśmy, dorzucamy jego mięśnie do naszych Setów (aby usunąć duplikaty)
    if (dbExercise) {
      if (dbExercise.primaryMuscles) {
        dbExercise.primaryMuscles.forEach((m) => primarySet.add(m));
      }
      if (dbExercise.secondaryMuscles) {
        dbExercise.secondaryMuscles.forEach((m) => secondarySet.add(m));
      }
    }
  });

  const extractedPrimary = Array.from(primarySet);
  const extractedSecondary = Array.from(secondarySet);

  return (
    <main className="min-h-screen bg-zinc-950 p-4 md:p-8">
      
      <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row gap-8 items-start">
        
        {/* LEWA KOLUMNA: Formularz treningu */}
        <div className="w-full lg:w-2/3">
          {/* Przekazujemy listę ćwiczeń do formularza, więc on sam już nie musi ich fetchować! */}
          <WorkoutForm 
            initialData={initialData} 
            workoutId={id} 
            availableExercises={availableExercises} 
          />
        </div>

        {/* PRAWA KOLUMNA: Mapa Ciała */}
        <div className="w-full lg:w-1/3 bg-zinc-900 border border-zinc-800 rounded-xl p-6 lg:sticky lg:top-8">
          <h3 className="text-xl font-bold text-white mb-6 text-center">
            Zaangażowane mięśnie
          </h3>
          
          <DetailedBodyMap 
            primaryMuscles={extractedPrimary} 
            secondaryMuscles={extractedSecondary} 
          />
          
          <div className="mt-8 flex flex-col gap-2 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#cc0000]"></div>
              <span>Główne partie (Primary)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#fbbc04]"></div>
              <span>Wspomagające (Secondary)</span>
            </div>
          </div>
        </div>

      </div>

    </main>
  );
}