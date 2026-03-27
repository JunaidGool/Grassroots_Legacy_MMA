import type { Fighter } from "@/types/fighter";
import type { Matchup, CreateMatchupInput } from "@/types/matchup";

export function autoMatchmake(
  fighters: Fighter[],
  existingMatchups: Matchup[]
): CreateMatchupInput[] {
  // Get IDs of fighters already matched
  const matchedIds = new Set<string>();
  for (const m of existingMatchups) {
    matchedIds.add(m.fighter1);
    matchedIds.add(m.fighter2);
  }

  // Filter to eligible, unmatched fighters
  const eligible = fighters.filter(
    (f) => f.medical === "cleared" && !matchedIds.has(f.id)
  );

  // Group by division: gender + ageCat + weightClass
  const groups = new Map<string, Fighter[]>();
  for (const f of eligible) {
    const key = `${f.gender}-${f.ageCat}-${f.weightClass}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }

  const nextBoutNumber =
    existingMatchups.length > 0
      ? Math.max(...existingMatchups.map((m) => m.boutNumber)) + 1
      : 1;

  const newMatchups: CreateMatchupInput[] = [];
  let boutNum = nextBoutNumber;

  for (const group of groups.values()) {
    // Sort by experience for closest matching
    group.sort((a, b) => a.priorFights - b.priorFights);

    for (let i = 0; i + 1 < group.length; i += 2) {
      const f1 = group[i];
      const f2 = group[i + 1];
      newMatchups.push({
        fighter1: f1.id,
        fighter2: f2.id,
        ageCat: f1.ageCat,
        weightClass: f1.weightClass,
        gender: f1.gender,
        boutNumber: boutNum++,
      });
    }
  }

  return newMatchups;
}
