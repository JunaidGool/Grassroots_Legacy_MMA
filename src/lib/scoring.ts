import type { Score, CreateScoreInput, OutcomeType } from "@/types/score";
import { OUTCOME_POINTS, FINISH_OUTCOMES } from "@/types/score";

const FOTN_BONUS = 1;
const POTN_BONUS = 2;

export function calculateScore(
  input: CreateScoreInput,
  redId: string,
  blueId: string
): Score {
  const { outcome, winnerId, fotn, potn } = input;
  const pts = OUTCOME_POINTS[outcome];

  let redPts: number;
  let bluePts: number;

  if (outcome === "draw" || outcome === "nc") {
    redPts = pts.winner;
    bluePts = pts.loser;
  } else {
    redPts = winnerId === redId ? pts.winner : pts.loser;
    bluePts = winnerId === blueId ? pts.winner : pts.loser;
  }

  // FOTN: +1 to both
  if (fotn) {
    redPts += FOTN_BONUS;
    bluePts += FOTN_BONUS;
  }

  // POTN: +2 to winner only
  if (potn && winnerId) {
    if (winnerId === redId) redPts += POTN_BONUS;
    if (winnerId === blueId) bluePts += POTN_BONUS;
  }

  return {
    matchupId: input.matchupId,
    redId,
    blueId,
    outcome,
    winnerId,
    redPts,
    bluePts,
    fotn,
    potn,
  };
}

export function isFinish(outcome: OutcomeType): boolean {
  return FINISH_OUTCOMES.includes(outcome);
}
