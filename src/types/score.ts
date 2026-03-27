export type OutcomeType = "sub" | "tko" | "ud" | "sd" | "draw" | "nc";

export interface Score {
  matchupId: string;
  redId: string;
  blueId: string;
  outcome: OutcomeType;
  winnerId: string;
  redPts: number;
  bluePts: number;
  fotn: boolean;
  potn: boolean;
}

export type CreateScoreInput = {
  matchupId: string;
  outcome: OutcomeType;
  winnerId: string;
  fotn: boolean;
  potn: boolean;
};

export const OUTCOME_LABELS: Record<OutcomeType, string> = {
  sub: "Submission",
  tko: "TKO/KO",
  ud: "Unanimous Decision",
  sd: "Split Decision",
  draw: "Draw",
  nc: "No Contest",
};

export const OUTCOME_POINTS: Record<OutcomeType, { winner: number; loser: number }> = {
  sub: { winner: 5, loser: 1 },
  tko: { winner: 4, loser: 1 },
  ud: { winner: 3, loser: 1 },
  sd: { winner: 2, loser: 1 },
  draw: { winner: 2, loser: 2 },
  nc: { winner: 0, loser: 0 },
};

export const FINISH_OUTCOMES: OutcomeType[] = ["sub", "tko"];
