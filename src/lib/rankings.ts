import type { Fighter } from "@/types/fighter";
import type { Matchup } from "@/types/matchup";
import type { Score } from "@/types/score";
import { isFinish } from "./scoring";

export interface RankedFighter {
  fighter: Fighter;
  rank: number;
  totalPoints: number;
  avgPoints: number;
  bouts: number;
  wins: number;
  losses: number;
  draws: number;
  finishes: number;
  titleEligible: boolean;
}

export function computeRankings(
  fighters: Fighter[],
  matchups: Matchup[],
  scores: Score[]
): RankedFighter[] {
  const fighterMap = new Map(fighters.map((f) => [f.id, f]));

  // Build stats per fighter
  const statsMap = new Map<
    string,
    {
      totalPoints: number;
      bouts: number;
      wins: number;
      losses: number;
      draws: number;
      finishes: number;
    }
  >();

  for (const score of scores) {
    const matchup = matchups.find((m) => m.id === score.matchupId);
    if (!matchup) continue;

    for (const fighterId of [score.redId, score.blueId]) {
      if (!statsMap.has(fighterId)) {
        statsMap.set(fighterId, {
          totalPoints: 0,
          bouts: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          finishes: 0,
        });
      }

      const stats = statsMap.get(fighterId)!;
      stats.bouts += 1;

      const pts = fighterId === score.redId ? score.redPts : score.bluePts;
      stats.totalPoints += pts;

      if (score.outcome === "draw") {
        stats.draws += 1;
      } else if (score.outcome === "nc") {
        // No contest — no W/L
      } else if (score.winnerId === fighterId) {
        stats.wins += 1;
        if (isFinish(score.outcome)) stats.finishes += 1;
      } else {
        stats.losses += 1;
      }
    }
  }

  // Build ranked list
  const ranked: RankedFighter[] = [];

  for (const [fighterId, stats] of statsMap) {
    const fighter = fighterMap.get(fighterId);
    if (!fighter) continue;

    ranked.push({
      fighter,
      rank: 0,
      totalPoints: stats.totalPoints,
      avgPoints: stats.bouts > 0 ? stats.totalPoints / stats.bouts : 0,
      bouts: stats.bouts,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      finishes: stats.finishes,
      titleEligible: false,
    });
  }

  // Sort: points → avg → finishes → priorFights (all descending)
  ranked.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.avgPoints !== a.avgPoints) return b.avgPoints - a.avgPoints;
    if (b.finishes !== a.finishes) return b.finishes - a.finishes;
    return b.fighter.priorFights - a.fighter.priorFights;
  });

  // Assign global ranks
  ranked.forEach((r, i) => (r.rank = i + 1));

  // Determine title eligibility per division group
  const divisionGroups = new Map<string, RankedFighter[]>();
  for (const r of ranked) {
    const key = `${r.fighter.gender}-${r.fighter.ageCat}-${r.fighter.weightClass}`;
    if (!divisionGroups.has(key)) divisionGroups.set(key, []);
    divisionGroups.get(key)!.push(r);
  }

  for (const group of divisionGroups.values()) {
    // Group is already sorted by overall ranking order
    group.forEach((r, idx) => {
      r.titleEligible = r.bouts >= 2 && idx < 2;
    });
  }

  return ranked;
}
