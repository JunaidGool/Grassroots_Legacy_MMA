export type Gender = "M" | "F";

export type AgeCategory =
  | "Youth C"
  | "Youth B"
  | "Youth A"
  | "Adult Jnr"
  | "Adults";

export type MedicalStatus = "pending" | "cleared" | "declined";

export interface Fighter {
  id: string;
  name: string;
  nickname: string;
  age: number;
  gender: Gender;
  weight: number;
  ageCat: AgeCategory;
  weightClass: string;
  priorFights: number;
  gym: string;
  phone: string;
  medical: MedicalStatus;
  weighedIn: boolean;
  weighInKg: number | null;
}

export type CreateFighterInput = Omit<Fighter, "id" | "weighedIn" | "weighInKg">;
