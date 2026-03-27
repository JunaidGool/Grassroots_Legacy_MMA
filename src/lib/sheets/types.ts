import type { Fighter, CreateFighterInput } from "@/types/fighter";
import type { Matchup, CreateMatchupInput } from "@/types/matchup";
import type { Score, CreateScoreInput } from "@/types/score";
import type { EventConfig, ConfigKey } from "@/types/config";

export interface FighterStore {
  getAll(): Promise<Fighter[]>;
  getById(id: string): Promise<Fighter | null>;
  create(data: CreateFighterInput): Promise<Fighter>;
  update(id: string, data: Partial<Fighter>): Promise<Fighter>;
  remove(id: string): Promise<void>;
}

export interface MatchupStore {
  getAll(): Promise<Matchup[]>;
  getById(id: string): Promise<Matchup | null>;
  create(data: CreateMatchupInput): Promise<Matchup>;
  update(id: string, data: Partial<Matchup>): Promise<Matchup>;
  remove(id: string): Promise<void>;
  reorder(orderedIds: string[]): Promise<void>;
}

export interface ScoreStore {
  getAll(): Promise<Score[]>;
  getByMatchupId(matchupId: string): Promise<Score | null>;
  create(data: CreateScoreInput): Promise<Score>;
  update(matchupId: string, data: CreateScoreInput): Promise<Score>;
  remove(matchupId: string): Promise<void>;
}

export interface ConfigStore {
  getAll(): Promise<EventConfig>;
  get(key: ConfigKey): Promise<string>;
  set(key: ConfigKey, value: string): Promise<void>;
}

export interface DataStore {
  fighters: FighterStore;
  matchups: MatchupStore;
  scores: ScoreStore;
  config: ConfigStore;
}
