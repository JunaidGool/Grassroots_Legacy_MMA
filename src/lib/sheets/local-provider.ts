import { promises as fs } from "fs";
import path from "path";
import type { Fighter, CreateFighterInput } from "@/types/fighter";
import type { Matchup, CreateMatchupInput } from "@/types/matchup";
import type { Score, CreateScoreInput } from "@/types/score";
import type { EventConfig, ConfigKey } from "@/types/config";
import type { DataStore, FighterStore, MatchupStore, ScoreStore, ConfigStore } from "./types";
import { calculateScore } from "@/lib/scoring";

const DATA_DIR = path.join(process.cwd(), "src", "data");

async function readJson<T>(filename: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJson<T>(filename: string, data: T): Promise<void> {
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), "utf-8");
}

function generateId(prefix: string, items: { id: string }[]): string {
  const max = items.reduce((m, item) => {
    const num = parseInt(item.id.replace(`${prefix}_`, ""), 10);
    return isNaN(num) ? m : Math.max(m, num);
  }, 0);
  return `${prefix}_${String(max + 1).padStart(3, "0")}`;
}

const fighterStore: FighterStore = {
  async getAll() {
    return readJson<Fighter[]>("fighters.json");
  },

  async getById(id) {
    const fighters = await readJson<Fighter[]>("fighters.json");
    return fighters.find((f) => f.id === id) ?? null;
  },

  async create(data: CreateFighterInput) {
    const fighters = await readJson<Fighter[]>("fighters.json");
    const fighter: Fighter = {
      ...data,
      id: generateId("f", fighters),
      weighedIn: false,
      weighInKg: null,
    };
    fighters.push(fighter);
    await writeJson("fighters.json", fighters);
    return fighter;
  },

  async update(id, data) {
    const fighters = await readJson<Fighter[]>("fighters.json");
    const idx = fighters.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error(`Fighter ${id} not found`);
    fighters[idx] = { ...fighters[idx], ...data };
    await writeJson("fighters.json", fighters);
    return fighters[idx];
  },

  async remove(id) {
    let fighters = await readJson<Fighter[]>("fighters.json");
    fighters = fighters.filter((f) => f.id !== id);
    await writeJson("fighters.json", fighters);

    // Cascade: remove matchups with this fighter
    let matchups = await readJson<Matchup[]>("matchups.json");
    const removedMatchupIds = matchups
      .filter((m) => m.fighter1 === id || m.fighter2 === id)
      .map((m) => m.id);
    matchups = matchups.filter((m) => m.fighter1 !== id && m.fighter2 !== id);
    await writeJson("matchups.json", matchups);

    // Cascade: remove scores for removed matchups
    let scores = await readJson<Score[]>("scores.json");
    scores = scores.filter((s) => !removedMatchupIds.includes(s.matchupId));
    await writeJson("scores.json", scores);
  },
};

const matchupStore: MatchupStore = {
  async getAll() {
    const matchups = await readJson<Matchup[]>("matchups.json");
    return matchups.sort((a, b) => a.boutNumber - b.boutNumber);
  },

  async getById(id) {
    const matchups = await readJson<Matchup[]>("matchups.json");
    return matchups.find((m) => m.id === id) ?? null;
  },

  async create(data: CreateMatchupInput) {
    const matchups = await readJson<Matchup[]>("matchups.json");
    const matchup: Matchup = {
      ...data,
      id: generateId("m", matchups),
    };
    matchups.push(matchup);
    await writeJson("matchups.json", matchups);
    return matchup;
  },

  async update(id, data) {
    const matchups = await readJson<Matchup[]>("matchups.json");
    const idx = matchups.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error(`Matchup ${id} not found`);
    matchups[idx] = { ...matchups[idx], ...data };
    await writeJson("matchups.json", matchups);
    return matchups[idx];
  },

  async remove(id) {
    let matchups = await readJson<Matchup[]>("matchups.json");
    matchups = matchups.filter((m) => m.id !== id);
    await writeJson("matchups.json", matchups);

    // Cascade: remove score for this matchup
    let scores = await readJson<Score[]>("scores.json");
    scores = scores.filter((s) => s.matchupId !== id);
    await writeJson("scores.json", scores);
  },

  async reorder(orderedIds) {
    const matchups = await readJson<Matchup[]>("matchups.json");
    orderedIds.forEach((id, index) => {
      const m = matchups.find((m) => m.id === id);
      if (m) m.boutNumber = index + 1;
    });
    await writeJson("matchups.json", matchups);
  },
};

const scoreStore: ScoreStore = {
  async getAll() {
    return readJson<Score[]>("scores.json");
  },

  async getByMatchupId(matchupId) {
    const scores = await readJson<Score[]>("scores.json");
    return scores.find((s) => s.matchupId === matchupId) ?? null;
  },

  async create(data: CreateScoreInput) {
    const scores = await readJson<Score[]>("scores.json");
    const matchups = await readJson<Matchup[]>("matchups.json");
    const matchup = matchups.find((m) => m.id === data.matchupId);
    if (!matchup) throw new Error(`Matchup ${data.matchupId} not found`);

    const score = calculateScore(data, matchup.fighter1, matchup.fighter2);
    scores.push(score);
    await writeJson("scores.json", scores);
    return score;
  },

  async update(matchupId, data) {
    const scores = await readJson<Score[]>("scores.json");
    const matchups = await readJson<Matchup[]>("matchups.json");
    const matchup = matchups.find((m) => m.id === matchupId);
    if (!matchup) throw new Error(`Matchup ${matchupId} not found`);

    const idx = scores.findIndex((s) => s.matchupId === matchupId);
    const score = calculateScore(data, matchup.fighter1, matchup.fighter2);

    if (idx === -1) {
      scores.push(score);
    } else {
      scores[idx] = score;
    }
    await writeJson("scores.json", scores);
    return score;
  },

  async remove(matchupId) {
    let scores = await readJson<Score[]>("scores.json");
    scores = scores.filter((s) => s.matchupId !== matchupId);
    await writeJson("scores.json", scores);
  },
};

const configStore: ConfigStore = {
  async getAll() {
    return readJson<EventConfig>("config.json");
  },

  async get(key: ConfigKey) {
    const config = await readJson<EventConfig>("config.json");
    return config[key] ?? "";
  },

  async set(key: ConfigKey, value: string) {
    const config = await readJson<EventConfig>("config.json");
    config[key] = value;
    await writeJson("config.json", config);
  },
};

export const localStore: DataStore = {
  fighters: fighterStore,
  matchups: matchupStore,
  scores: scoreStore,
  config: configStore,
};
