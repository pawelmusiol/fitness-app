export interface SetData {
    weight: number;
    reps: number;
  }
  
  export interface ExerciseData {
    name: string;
    sets: SetData[];
  }
  
  // Typ odzwierciedlający dane wyciągnięte z bazy i przepuszczone przez JSON (dlatego date to string)
  export interface WorkoutData {
    _id: string;
    userId: string;
    date: string; 
    type: string;
    title: string;
    exercises: ExerciseData[];
  }