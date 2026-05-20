export type ExerciseCategory = 
  | "Chest" 
  | "Back" 
  | "Legs" 
  | "Shoulders" 
  | "Arms" 
  | "Abs" 
  | "Cardio" 
  | "Other";

export interface ExerciseLibraryItem {
  _id?: string;
  name: string;
  category: ExerciseCategory;
  userId?: string; 
  isCustom: boolean;
}