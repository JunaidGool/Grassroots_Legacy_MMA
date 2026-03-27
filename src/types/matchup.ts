import type { AgeCategory, Gender } from "./fighter";

export interface Matchup {
  id: string;
  fighter1: string; // Red corner fighter ID
  fighter2: string; // Blue corner fighter ID
  ageCat: AgeCategory;
  weightClass: string;
  gender: Gender;
  boutNumber: number;
}

export type CreateMatchupInput = Omit<Matchup, "id">;
