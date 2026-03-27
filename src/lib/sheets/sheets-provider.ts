import type { Fighter, CreateFighterInput } from "@/types/fighter";
import type { Matchup, CreateMatchupInput } from "@/types/matchup";
import type { Score, CreateScoreInput } from "@/types/score";
import type { EventConfig, ConfigKey } from "@/types/config";
import type { DataStore, FighterStore, MatchupStore, ScoreStore, ConfigStore } from "./types";
import { calculateScore } from "@/lib/scoring";
import {
  readSheet,
  appendRow,
  updateRow,
  deleteRow,
  getSheetId,
} from "@/lib/google-sheets";

// --- Column mappings ---
// These must match the header row in each Google Sheet exactly.

// Fighters: id, name, nickname, age, gender, weight, ageCat, weightClass, priorFights, gym, phone, medical, weighedIn, weighInKg
const FIGHTERS_SHEET = "Fighters";
function rowToFighter(row: string[]): Fighter {
  return {
    id: row[0] ?? "",
    name: row[1] ?? "",
    nickname: row[2] ?? "",
    age: parseInt(row[3]) || 0,
    gender: (row[4] as Fighter["gender"]) ?? "M",
    weight: parseFloat(row[5]) || 0,
    ageCat: (row[6] as Fighter["ageCat"]) ?? "Adults",
    weightClass: row[7] ?? "",
    priorFights: parseInt(row[8]) || 0,
    gym: row[9] ?? "",
    phone: row[10] ?? "",
    medical: (row[11] as Fighter["medical"]) ?? "pending",
    weighedIn: row[12] === "true" || row[12] === "True",
    weighInKg: row[13] ? parseFloat(row[13]) : null,
  };
}

function fighterToRow(f: Fighter): (string | number | boolean | null)[] {
  return [
    f.id,
    f.name,
    f.nickname,
    f.age,
    f.gender,
    f.weight,
    f.ageCat,
    f.weightClass,
    f.priorFights,
    f.gym,
    f.phone,
    f.medical,
    String(f.weighedIn),
    f.weighInKg,
  ];
}

// Matchups: id, fighter1, fighter2, ageCat, weightClass, gender, boutNumber
const MATCHUPS_SHEET = "Matchups";
function rowToMatchup(row: string[]): Matchup {
  return {
    id: row[0] ?? "",
    fighter1: row[1] ?? "",
    fighter2: row[2] ?? "",
    ageCat: (row[3] as Matchup["ageCat"]) ?? "Adults",
    weightClass: row[4] ?? "",
    gender: (row[5] as Matchup["gender"]) ?? "M",
    boutNumber: parseInt(row[6]) || 0,
  };
}

function matchupToRow(m: Matchup): (string | number | boolean | null)[] {
  return [m.id, m.fighter1, m.fighter2, m.ageCat, m.weightClass, m.gender, m.boutNumber];
}

// Scores: matchupId, redId, blueId, outcome, winnerId, redPts, bluePts, fotn, potn
const SCORES_SHEET = "Scores";
function rowToScore(row: string[]): Score {
  return {
    matchupId: row[0] ?? "",
    redId: row[1] ?? "",
    blueId: row[2] ?? "",
    outcome: (row[3] as Score["outcome"]) ?? "nc",
    winnerId: row[4] ?? "",
    redPts: parseInt(row[5]) || 0,
    bluePts: parseInt(row[6]) || 0,
    fotn: row[7] === "true" || row[7] === "True",
    potn: row[8] === "true" || row[8] === "True",
  };
}

function scoreToRow(s: Score): (string | number | boolean | null)[] {
  return [
    s.matchupId,
    s.redId,
    s.blueId,
    s.outcome,
    s.winnerId,
    s.redPts,
    s.bluePts,
    String(s.fotn),
    String(s.potn),
  ];
}

// Config: key, value (key-value pairs)
const CONFIG_SHEET = "Config";

// --- Helpers ---

function generateId(prefix: string, items: { id: string }[]): string {
  const max = items.reduce((m, item) => {
    const num = parseInt(item.id.replace(`${prefix}_`, ""), 10);
    return isNaN(num) ? m : Math.max(m, num);
  }, 0);
  return `${prefix}_${String(max + 1).padStart(3, "0")}`;
}

// Find a row's 1-based index by matching column A (id)
function findRowIndex(rows: string[][], id: string): number {
  // rows[0] = header, data starts at rows[1]
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) return i + 1; // +1 because Sheets is 1-based
  }
  return -1;
}

// --- Stores ---

const fighterStore: FighterStore = {
  async getAll() {
    const rows = await readSheet(FIGHTERS_SHEET);
    return rows.slice(1).filter((r) => r[0]).map(rowToFighter);
  },

  async getById(id) {
    const fighters = await fighterStore.getAll();
    return fighters.find((f) => f.id === id) ?? null;
  },

  async create(data: CreateFighterInput) {
    const existing = await fighterStore.getAll();
    const fighter: Fighter = {
      ...data,
      id: generateId("f", existing),
      weighedIn: false,
      weighInKg: null,
    };
    await appendRow(FIGHTERS_SHEET, fighterToRow(fighter));
    return fighter;
  },

  async update(id, data) {
    const rows = await readSheet(FIGHTERS_SHEET);
    const rowIdx = findRowIndex(rows, id);
    if (rowIdx === -1) throw new Error(`Fighter ${id} not found`);

    const current = rowToFighter(rows[rowIdx - 1]);
    const updated = { ...current, ...data };
    await updateRow(FIGHTERS_SHEET, rowIdx, fighterToRow(updated));
    return updated;
  },

  async remove(id) {
    const rows = await readSheet(FIGHTERS_SHEET);
    const rowIdx = findRowIndex(rows, id);
    if (rowIdx === -1) return;

    const sheetId = await getSheetId(FIGHTERS_SHEET);
    await deleteRow(FIGHTERS_SHEET, sheetId, rowIdx - 1); // deleteRow uses 0-based index

    // Cascade: remove matchups with this fighter
    const matchupRows = await readSheet(MATCHUPS_SHEET);
    const matchupSheetId = await getSheetId(MATCHUPS_SHEET);
    const scoreRows = await readSheet(SCORES_SHEET);
    const scoreSheetId = await getSheetId(SCORES_SHEET);

    // Find matchups to remove (iterate backwards to preserve row indices)
    const matchupIndicesToRemove: number[] = [];
    const matchupIdsToRemove = new Set<string>();

    for (let i = matchupRows.length - 1; i >= 1; i--) {
      if (matchupRows[i][1] === id || matchupRows[i][2] === id) {
        matchupIndicesToRemove.push(i);
        matchupIdsToRemove.add(matchupRows[i][0]);
      }
    }

    // Find scores to remove
    const scoreIndicesToRemove: number[] = [];
    for (let i = scoreRows.length - 1; i >= 1; i--) {
      if (matchupIdsToRemove.has(scoreRows[i][0])) {
        scoreIndicesToRemove.push(i);
      }
    }

    // Delete rows backwards (highest index first) to avoid index shifting
    for (const idx of scoreIndicesToRemove) {
      await deleteRow(SCORES_SHEET, scoreSheetId, idx);
    }
    for (const idx of matchupIndicesToRemove) {
      await deleteRow(MATCHUPS_SHEET, matchupSheetId, idx);
    }
  },
};

const matchupStore: MatchupStore = {
  async getAll() {
    const rows = await readSheet(MATCHUPS_SHEET);
    return rows
      .slice(1)
      .filter((r) => r[0])
      .map(rowToMatchup)
      .sort((a, b) => a.boutNumber - b.boutNumber);
  },

  async getById(id) {
    const matchups = await matchupStore.getAll();
    return matchups.find((m) => m.id === id) ?? null;
  },

  async create(data: CreateMatchupInput) {
    const existing = await matchupStore.getAll();
    const matchup: Matchup = {
      ...data,
      id: generateId("m", existing),
    };
    await appendRow(MATCHUPS_SHEET, matchupToRow(matchup));
    return matchup;
  },

  async update(id, data) {
    const rows = await readSheet(MATCHUPS_SHEET);
    const rowIdx = findRowIndex(rows, id);
    if (rowIdx === -1) throw new Error(`Matchup ${id} not found`);

    const current = rowToMatchup(rows[rowIdx - 1]);
    const updated = { ...current, ...data };
    await updateRow(MATCHUPS_SHEET, rowIdx, matchupToRow(updated));
    return updated;
  },

  async remove(id) {
    const rows = await readSheet(MATCHUPS_SHEET);
    const rowIdx = findRowIndex(rows, id);
    if (rowIdx === -1) return;

    const sheetId = await getSheetId(MATCHUPS_SHEET);
    await deleteRow(MATCHUPS_SHEET, sheetId, rowIdx - 1);

    // Cascade: remove score for this matchup
    const scoreRows = await readSheet(SCORES_SHEET);
    const scoreSheetId = await getSheetId(SCORES_SHEET);
    for (let i = scoreRows.length - 1; i >= 1; i--) {
      if (scoreRows[i][0] === id) {
        await deleteRow(SCORES_SHEET, scoreSheetId, i);
      }
    }
  },

  async reorder(orderedIds) {
    const rows = await readSheet(MATCHUPS_SHEET);

    for (let boutNum = 0; boutNum < orderedIds.length; boutNum++) {
      const id = orderedIds[boutNum];
      const rowIdx = findRowIndex(rows, id);
      if (rowIdx === -1) continue;

      const current = rowToMatchup(rows[rowIdx - 1]);
      current.boutNumber = boutNum + 1;
      await updateRow(MATCHUPS_SHEET, rowIdx, matchupToRow(current));
      // Update in-memory rows too for subsequent lookups
      rows[rowIdx - 1][6] = String(boutNum + 1);
    }
  },
};

const scoreStore: ScoreStore = {
  async getAll() {
    const rows = await readSheet(SCORES_SHEET);
    return rows.slice(1).filter((r) => r[0]).map(rowToScore);
  },

  async getByMatchupId(matchupId) {
    const scores = await scoreStore.getAll();
    return scores.find((s) => s.matchupId === matchupId) ?? null;
  },

  async create(data: CreateScoreInput) {
    const matchupRows = await readSheet(MATCHUPS_SHEET);
    let redId = "", blueId = "";
    for (let i = 1; i < matchupRows.length; i++) {
      if (matchupRows[i][0] === data.matchupId) {
        redId = matchupRows[i][1];
        blueId = matchupRows[i][2];
        break;
      }
    }
    if (!redId) throw new Error(`Matchup ${data.matchupId} not found`);

    const score = calculateScore(data, redId, blueId);
    await appendRow(SCORES_SHEET, scoreToRow(score));
    return score;
  },

  async update(matchupId, data) {
    const rows = await readSheet(SCORES_SHEET);
    // Scores use matchupId in column A
    let rowIdx = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === matchupId) {
        rowIdx = i + 1; // 1-based
        break;
      }
    }

    // Find matchup to get fighter IDs
    const matchupRows = await readSheet(MATCHUPS_SHEET);
    let redId = "", blueId = "";
    for (let i = 1; i < matchupRows.length; i++) {
      if (matchupRows[i][0] === matchupId) {
        redId = matchupRows[i][1];
        blueId = matchupRows[i][2];
        break;
      }
    }
    if (!redId) throw new Error(`Matchup ${matchupId} not found`);

    const score = calculateScore(data, redId, blueId);

    if (rowIdx === -1) {
      // Doesn't exist yet, append
      await appendRow(SCORES_SHEET, scoreToRow(score));
    } else {
      await updateRow(SCORES_SHEET, rowIdx, scoreToRow(score));
    }
    return score;
  },

  async remove(matchupId) {
    const rows = await readSheet(SCORES_SHEET);
    const scoreSheetId = await getSheetId(SCORES_SHEET);
    for (let i = rows.length - 1; i >= 1; i--) {
      if (rows[i][0] === matchupId) {
        await deleteRow(SCORES_SHEET, scoreSheetId, i);
      }
    }
  },
};

const configStore: ConfigStore = {
  async getAll() {
    const rows = await readSheet(CONFIG_SHEET);
    const config: Record<string, string> = {};
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0]) {
        config[rows[i][0]] = rows[i][1] ?? "";
      }
    }
    return config as unknown as EventConfig;
  },

  async get(key: ConfigKey) {
    const config = await configStore.getAll();
    return config[key] ?? "";
  },

  async set(key: ConfigKey, value: string) {
    const rows = await readSheet(CONFIG_SHEET);
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) {
        await updateRow(CONFIG_SHEET, i + 1, [key, value]);
        return;
      }
    }
    // Key doesn't exist yet, append
    await appendRow(CONFIG_SHEET, [key, value]);
  },
};

export const sheetsStore: DataStore = {
  fighters: fighterStore,
  matchups: matchupStore,
  scores: scoreStore,
  config: configStore,
};
