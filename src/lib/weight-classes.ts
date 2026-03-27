import type { Gender, AgeCategory } from "@/types/fighter";

export interface WeightClassDef {
  name: string;
  maxKg: number;
}

// Youth C (12-13) — same for boys & girls
const YOUTH_C_CLASSES: WeightClassDef[] = [
  { name: "Under 31kg", maxKg: 31.0 },
  { name: "34kg", maxKg: 34.0 },
  { name: "37kg", maxKg: 37.0 },
  { name: "40kg", maxKg: 40.0 },
  { name: "44kg", maxKg: 44.0 },
  { name: "48kg", maxKg: 48.0 },
  { name: "52kg", maxKg: 52.0 },
  { name: "57kg", maxKg: 57.0 },
  { name: "Over 57kg", maxKg: 63.0 },
];

// Youth B (14-15) — same for boys & girls
const YOUTH_B_CLASSES: WeightClassDef[] = [
  { name: "40kg", maxKg: 40.0 },
  { name: "44kg", maxKg: 44.0 },
  { name: "48kg", maxKg: 48.0 },
  { name: "52kg", maxKg: 52.0 },
  { name: "57kg", maxKg: 57.0 },
  { name: "62kg", maxKg: 62.0 },
  { name: "67kg", maxKg: 67.0 },
  { name: "72kg", maxKg: 72.0 },
  { name: "Over 72kg", maxKg: 77.1 },
];

// Youth A / Adult Jnr / Adults — Men
const SENIOR_MALE_CLASSES: WeightClassDef[] = [
  { name: "Strawweight", maxKg: 52.2 },
  { name: "Flyweight", maxKg: 56.7 },
  { name: "Bantamweight", maxKg: 61.2 },
  { name: "Featherweight", maxKg: 65.8 },
  { name: "Lightweight", maxKg: 70.3 },
  { name: "Welterweight", maxKg: 77.1 },
  { name: "Middleweight", maxKg: 83.9 },
  { name: "Light Heavyweight", maxKg: 93.0 },
  { name: "Heavyweight", maxKg: 120.2 },
  { name: "Super Heavyweight", maxKg: 999 },
];

// Youth A / Adult Jnr / Adults — Women
const SENIOR_FEMALE_CLASSES: WeightClassDef[] = [
  { name: "Atomweight", maxKg: 47.6 },
  { name: "Strawweight", maxKg: 52.2 },
  { name: "Flyweight", maxKg: 56.7 },
  { name: "Bantamweight", maxKg: 61.2 },
  { name: "Featherweight", maxKg: 65.8 },
  { name: "Lightweight", maxKg: 70.3 },
];

export function getWeightClasses(
  gender: Gender,
  ageCat: AgeCategory
): WeightClassDef[] {
  if (ageCat === "Youth C") return YOUTH_C_CLASSES;
  if (ageCat === "Youth B") return YOUTH_B_CLASSES;
  return gender === "M" ? SENIOR_MALE_CLASSES : SENIOR_FEMALE_CLASSES;
}

export function detectWeightClass(
  gender: Gender,
  ageCat: AgeCategory,
  weightKg: number
): string | null {
  const classes = getWeightClasses(gender, ageCat);
  for (const wc of classes) {
    if (weightKg <= wc.maxKg) return wc.name;
  }
  return null; // Out of range
}

export function getMaxWeight(
  gender: Gender,
  ageCat: AgeCategory,
  weightClass: string
): number | null {
  const classes = getWeightClasses(gender, ageCat);
  const wc = classes.find((c) => c.name === weightClass);
  return wc?.maxKg ?? null;
}

export const ROUND_STRUCTURE: Record<AgeCategory, string> = {
  "Youth C": "1 × 3 min",
  "Youth B": "1 × 4 min",
  "Youth A": "3 × 2 min",
  "Adult Jnr": "3 × 3 min",
  Adults: "3 × 3 min",
};
