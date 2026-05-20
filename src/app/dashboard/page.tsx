import { getWorkouts } from "@/actions/workouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WorkoutData, ExerciseData } from "@/types/workout";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardPage() {
    const res = await getWorkouts();
    const workouts = res.success || [];

    return (
        <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
            {/* Nagłówek i Szybkie Akcje */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Lewa strona: Tytuł i opis */}
                <div>
                    <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Twój Dashboard
                    </h1>
                    <LogoutButton />
                    </div>
                    <p className="text-muted-foreground mt-1">
                    Przegląd Twoich ostatnich aktywności.
                    </p>
                </div>

                {/* Prawa strona: Przycisk (na mobilkach pełna szerokość) */}
                <Link href="/workout/new" className="w-full md:w-auto">
                    <Button className="w-full md:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Nowy Trening
                    </Button>
                </Link>
                </div>

            {/* Lista Treningów */}
            <div className="space-y-4">
                {workouts.length === 0 ? (
                    <Card className="border-dashed border-2 bg-transparent">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Dumbbell className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                            <p className="text-lg font-medium">
                                Brak historii treningów
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Twój dziennik jest jeszcze pusty.
                            </p>
                            <Link href="/workout/new">
                                <Button variant="secondary">
                                    Zrób pierwszy trening
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    workouts.map((workout: WorkoutData) => (
                        <Link
                            href={`/workout/${workout._id}`}
                            key={workout._id}
                            className="block"
                        >
                            <Card
                                key={workout._id}
                                className="hover:border-primary/50 transition-colors"
                            >
                                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <Dumbbell className="w-5 h-5 text-primary" />
                                            {workout.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1.5">
                                            <Calendar className="w-4 h-4" />
                                            {/* Formatowanie daty na polski format, np. 12 maja 2026 */}
                                            {new Intl.DateTimeFormat("pl-PL", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            }).format(new Date(workout.date))}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <div className="space-y-2">
                                        {workout.exercises.map(
                                            (
                                                exercise: ExerciseData,
                                                index: number
                                            ) => {
                                                // Liczymy łączną ilość powtórzeń i ciężar dla szybkiego podglądu (opcjonalne, ale fajnie wygląda)
                                                const totalSets =
                                                    exercise.sets.length;

                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex justify-between items-center py-2 border-b last:border-0 border-border/50 text-sm"
                                                    >
                                                        <span className="font-medium">
                                                            {exercise.name}
                                                        </span>
                                                        <span className="text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">
                                                            {totalSets}{" "}
                                                            {totalSets === 1
                                                                ? "seria"
                                                                : totalSets >
                                                                      1 &&
                                                                  totalSets < 5
                                                                ? "serie"
                                                                : "serii"}
                                                        </span>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </main>
    );
}
