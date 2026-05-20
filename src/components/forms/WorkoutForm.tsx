"use client";

import { useForm, useFieldArray, Control, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

import { saveWorkout } from "@/actions/workouts";
import { getExercises } from "@/actions/exercises";
import { cn } from "@/lib/utils";

const workoutSchema = z.object({
  title: z.string().min(2, "Nazwa treningu jest wymagana"),
  exercises: z.array(
    z.object({
      name: z.string().min(2, "Wybierz ćwiczenie z listy"),
      sets: z.array(
        z.object({
          weight: z.number().min(0),
          reps: z.number().min(1),
        })
      ).min(1),
    })
  ).min(1),
});

type WorkoutFormValues = z.infer<typeof workoutSchema>;
type Exercise = { 
  _id: string; 
  name: string; 
  category?: string;
  bodyparts?: string[]; // Dodajemy to!
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
};

interface WorkoutFormProps {
    initialData?: WorkoutFormValues;
    workoutId?: string; // Jeśli jest podane, wiemy, że jesteśmy w trybie EDYCJI
    availableExercises: Exercise[];
  }

  export function WorkoutForm({ initialData, workoutId }: WorkoutFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  
    useEffect(() => {
      async function fetchExercises() {
        const res = await getExercises();
        if (res.success) setAvailableExercises(res.success);
      }
      fetchExercises();
    }, []);
    console.log(availableExercises)
    const form = useForm<WorkoutFormValues>({
      resolver: zodResolver(workoutSchema),
      // ZMIANA TUTAJ: Jeśli mamy initialData, używamy ich. Jeśli nie, dajemy puste.
      defaultValues: initialData || {
        title: "",
        exercises: [{ name: "", sets: [{ weight: 0, reps: 0 }] }],
      },
    });
  
    const { fields: exercises, append: appendExercise, remove: removeExercise } = useFieldArray({
      control: form.control,
      name: "exercises",
    });
  
    async function onSubmit(values: WorkoutFormValues) {
    setIsSubmitting(true);
    setErrorMsg("");
    
    const response = await saveWorkout(values, workoutId);

    if (response.error) {
      setErrorMsg(response.error);
      setIsSubmitting(false);
    } else {
      // Sukces! Po prostu przekierowujemy, serwer sam zajął się wyczyszczeniem starych danych
      router.push("/dashboard"); 
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-none bg-transparent shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-3xl font-bold text-gray-300">Nowy Trening</CardTitle>
      </CardHeader>

      <CardContent className="px-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa Treningu</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Klatka + Biceps" className="text-lg bg-background" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Zmiana tutaj: Renderujemy nasz nowy komponent ExerciseItem */}
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <ExerciseItem
                  key={exercise.id}
                  control={form.control}
                  index={index}
                  removeExercise={removeExercise}
                  availableExercises={availableExercises}
                />
              ))}
            </div>

            <div className="flex flex-col gap-4">
            <Button 
              type="button" 
              variant="outline" // Zmienione z secondary
              className="w-full border-dashed border-2 bg-transparent hover:bg-zinc-800 hover:text-white  text-gray-300" 
              onClick={() => appendExercise({ name: "", sets: [{ weight: 0, reps: 0 }] })}
            >
              <Plus className="w-4 h-4 mr-2" /> Dodaj kolejne ćwiczenie
            </Button>

              {errorMsg && <p className="text-red-500 text-sm font-medium">{errorMsg}</p>}

              <Button type="submit" className="w-full text-lg h-12" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : workoutId ? "Zapisz Zmiany" : "Zapisz Trening"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

/**
 * NOWY KOMPONENT: Reprezentuje jedno ćwiczenie (Karta lub cienki pasek)
 */
function ExerciseItem({
    control,
    index,
    removeExercise,
    availableExercises,
  }: {
    control: Control<WorkoutFormValues>;
    index: number;
    removeExercise: (index: number) => void;
    availableExercises: Exercise[];
  }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
  
    // Podglądamy wartości na żywo, żeby zaktualizować pasek
    const currentExercise = useWatch({
      control,
      name: `exercises.${index}`,
    });
  
    const name = currentExercise?.name || "Brak nazwy";
    const sets = currentExercise?.sets || [];
  
    // Obliczamy podsumowanie. Grupujemy po ciężarze i powtórzeniach.
    const setGroups = sets.reduce((acc, set) => {
      const w = set.weight || 0;
      const r = set.reps || 0;
      const key = `${w}-${r}`; // Unikalny klucz dla kombinacji, np. "100-12"
  
      if (!acc[key]) {
        acc[key] = { weight: w, reps: r, count: 0 };
      }
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { weight: number; reps: number; count: number }>);
  
    const summaryWeights = Object.values(setGroups)
      .map(({ weight, reps, count }) => {
        const weightLabel = weight === 0 ? "CC" : `${weight}kg`;
        
        // Jeśli zrobiliśmy 3 takie same serie: "3x 12x100kg"
        // Jeśli zrobiliśmy 1 taką serię: "12x100kg"
        const prefix = count > 1 ? `${count}x ` : "";
        return `${prefix}${reps}x${weightLabel}`;
      })
      .join(", ");
  
    const setsLabel = sets.length === 1 ? "seria" : sets.length >= 2 && sets.length <= 4 ? "serie" : "serii";
  
    // WIDOK ZWINIĘTY (Cienki pasek)
    if (isCollapsed) {
      return (
        <div
          onClick={() => setIsCollapsed(false)}
          className="flex items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-card hover:border-primary/50 cursor-pointer transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <span className="font-semibold">{name}</span>
            <span className="hidden sm:inline text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground font-medium">
              {sets.length} {setsLabel} ({summaryWeights})
            </span>
          </div>
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-red-500 h-8 w-8 shrink-0"
            onClick={(e) => {
              e.stopPropagation(); // Zapobiega otwarciu karty przy kliknięciu usuwania
              removeExercise(index);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      );
    }
  
    // WIDOK ROZWINIĘTY (Normalna karta)
    return (
      <Card className="bg-card/50 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <ExerciseCombobox control={control} index={index} exercisesList={availableExercises} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeExercise(index)}
              className="text-red-500 hover:text-red-700 hover:bg-red-500/10 shrink-0"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
          <SetsManager 
            control={control} 
            exerciseIndex={index} 
            onCollapse={() => setIsCollapsed(true)} 
          />
        </CardContent>
      </Card>
    );
  }

// Słownik tłumaczący angielskie tagi z bazy na ładne polskie nagłówki
const CATEGORY_TRANSLATIONS: Record<string, string> = {
  "chest": "Klatka piersiowa",
  "back": "Plecy",
  "upper legs": "Uda i Pośladki",
  "lower legs": "Łydki",
  "shoulders": "Barki",
  "upper arms": "Ramiona (Biceps/Triceps)",
  "lower arms": "Przedramiona",
  "waist": "Brzuch i Core",
  "neck": "Kark",
  "cardio": "Cardio",
  "inne": "Pozostałe"
};

function ExerciseCombobox({ control, index, exercisesList }: { control: Control<WorkoutFormValues>, index: number, exercisesList: Exercise[] }) {
  const [open, setOpen] = useState(false);

  // --- LOGIKA GRUPOWANIA ĆWICZEŃ (WIELOKROTNE PRZYPISANIE) ---
  const groupedExercises = exercisesList.reduce((acc, ex) => {
    // 1. Zbieramy wszystkie kategorie dla danego ćwiczenia
    let rawCategories: string[] = [];
    
    if (ex.bodyparts && ex.bodyparts.length > 0) {
      rawCategories = ex.bodyparts; // bierzemy całą tablicę!
    } else if (ex.category) {
      rawCategories = [ex.category]; // fallback do starego pola
    } else {
      rawCategories = ["inne"]; // brak danych
    }

    // 2. Dodajemy ćwiczenie do KAŻDEJ z przypisanych grup
    rawCategories.forEach((rawCat) => {
      const groupName = CATEGORY_TRANSLATIONS[rawCat.toLowerCase()] || rawCat;
      
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      
      // Dodajemy do grupy (upewniając się, że nie powielamy w ramach jednej grupy)
      if (!acc[groupName].some(e => e._id === ex._id)) {
        acc[groupName].push(ex);
      }
    });

    return acc;
  }, {} as Record<string, Exercise[]>);

  // Sortujemy nazwy grup alfabetycznie
  const sortedGroupNames = Object.keys(groupedExercises).sort();

  return (
    <FormField
      control={control}
      name={`exercises.${index}.name`}
      render={({ field }) => (
        <FormItem className="flex-1 flex flex-col justify-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn("w-full justify-between bg-background", !field.value && "text-muted-foreground")}
                >
                  {field.value
                    ? exercisesList.find((ex) => ex.name === field.value)?.name || field.value
                    : "Wybierz ćwiczenie..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Szukaj ćwiczenia..." />
                <CommandList>
                  <CommandEmpty>Nie znaleziono ćwiczenia.</CommandEmpty>
                  
                  {sortedGroupNames.map((groupName) => (
                    <CommandGroup key={groupName} heading={groupName} className="text-muted-foreground font-semibold">
                      {groupedExercises[groupName].map((ex) => (
                        <CommandItem
                          value={ex.name}
                          // BARDZO WAŻNE: Klucz łączy nazwę grupy z ID ćwiczenia, by uniknąć błędów duplikatów!
                          key={`${groupName}-${ex._id}`} 
                          onSelect={() => {
                            field.onChange(ex.name);
                            setOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check className={cn("mr-2 h-4 w-4", ex.name === field.value ? "opacity-100 text-yellow-400" : "opacity-0")} />
                          <span className="text-foreground font-normal">{ex.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                  
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}


/**
 * KOMPONENT SETS MANAGER 
 */
function SetsManager({ 
  control, 
  exerciseIndex, 
  onCollapse 
}: { 
  control: Control<WorkoutFormValues>; 
  exerciseIndex: number;
  onCollapse: () => void; // Nowy props!
}) {
  const { fields: sets, append: appendSet, remove: removeSet } = useFieldArray({
    control, name: `exercises.${exerciseIndex}.sets`,
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_1fr_40px] gap-2 px-1">
        <div className="text-xs font-medium text-gray-200 uppercase">Ciężar (kg)</div>
        <div className="text-xs font-medium text-gray-200 uppercase">Powtórzenia</div>
        <div></div>
      </div>
      {sets.map((set, setIndex) => (
        <div key={set.id} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-start">
          <FormField
            control={control}
            name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
            render={({ field }) => (
              <FormItem><FormControl>
                  <Input type="number" min="0" step="0.5" placeholder="0" className="h-9 placeholder:text-gray-500 text-gray-300" {...field} value={field.value === 0 ? "" : field.value} onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
              </FormControl><FormMessage /></FormItem>
            )}
          />
          <FormField
            control={control}
            name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
            render={({ field }) => (
              <FormItem><FormControl>
                  <Input type="number" min="0" placeholder="0" className="h-9 placeholder:text-gray-500 text-gray-300" {...field} value={field.value === 0 ? "" : field.value} onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
              </FormControl><FormMessage /></FormItem>
            )}
          />
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-500" onClick={() => removeSet(setIndex)} disabled={sets.length === 1}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      
      {/* Tutaj zrobiliśmy układ flex dla dwóch przycisków */}
      <div className="flex items-center justify-between mt-4">
        <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => appendSet({ weight: 0, reps: 0 })}>
          <Plus className="w-3 h-3 mr-1" /> Dodaj serię
        </Button>
        
        {/* Przycisk do zwijania ćwiczenia */}
        <Button type="button" variant="secondary" size="sm" onClick={onCollapse}>
          <Check className="w-4 h-4 mr-2" /> Zakończ ćwiczenie
        </Button>
      </div>
    </div>
  );
}