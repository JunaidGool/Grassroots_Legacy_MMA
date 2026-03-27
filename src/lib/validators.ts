import { z } from "zod/v4";

export const genderSchema = z.enum(["M", "F"]);

export const ageCategorySchema = z.enum([
  "Youth C",
  "Youth B",
  "Youth A",
  "Adult Jnr",
  "Adults",
]);

export const medicalStatusSchema = z.enum(["pending", "cleared", "declined"]);

export const outcomeSchema = z.enum(["sub", "tko", "ud", "sd", "draw", "nc"]);

export const createFighterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nickname: z.string().default(""),
  age: z.number().int().min(12, "Minimum age is 12").max(55, "Maximum age is 55"),
  gender: genderSchema,
  weight: z.number().min(20, "Weight must be at least 20kg").max(200, "Weight must be under 200kg"),
  ageCat: ageCategorySchema,
  weightClass: z.string().min(1),
  priorFights: z
    .number()
    .int()
    .min(0, "Prior fights cannot be negative")
    .max(5, "Maximum 5 prior fights"),
  gym: z.string().min(1, "Gym is required"),
  phone: z.string().default(""),
  medical: medicalStatusSchema.default("pending"),
});

export const createMatchupSchema = z.object({
  fighter1: z.string().min(1),
  fighter2: z.string().min(1),
  ageCat: ageCategorySchema,
  weightClass: z.string().min(1),
  gender: genderSchema,
  boutNumber: z.number().int().min(1),
});

export const createScoreSchema = z.object({
  matchupId: z.string().min(1),
  outcome: outcomeSchema,
  winnerId: z.string(),
  fotn: z.boolean().default(false),
  potn: z.boolean().default(false),
});

export const weighInSchema = z.object({
  fighterId: z.string().min(1),
  weight: z.number().min(20).max(200),
});

export const loginSchema = z.object({
  pin: z.string().min(1, "PIN is required"),
});
