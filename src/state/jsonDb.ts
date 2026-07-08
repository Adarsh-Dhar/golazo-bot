import fs from "node:fs";

export interface OddsTick {
  fixtureId: string;
  oddsHome: number;
  oddsDraw: number;
  oddsAway: number;
  recordedAt: string;
}

export interface MatchEvent {
  fixtureId: string;
  eventType: string;
  minute: number;
  detail: string;
  recordedAt: string;
}

export interface MatchState {
  fixtureId: string;
  homeTeam?: string;
  awayTeam?: string;
  scoreHome?: number;
  scoreAway?: number;
  phase?: string;
  lastOddsHome?: number;
  lastOddsDraw?: number;
  lastOddsAway?: number;
  updatedAt: string;
}

interface DbShape {
  matches: Record<string, MatchState>;
  oddsTicks: OddsTick[];
  events: MatchEvent[];
  chatBindings: Record<string, string>; // chatId -> fixtureId
}

const DB_PATH = "golazo.json";

function load(): DbShape {
  if (!fs.existsSync(DB_PATH)) {
    return { matches: {}, oddsTicks: [], events: [], chatBindings: {} };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function save(db: DbShape) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Simple in-process cache, flushed to disk on every mutation.
// Fine for hackathon-scale traffic (a handful of matches/chats).
let db = load();

export function withDb<T>(fn: (db: DbShape) => T): T {
  const result = fn(db);
  save(db);
  return result;
}

export function readDb(): DbShape {
  return db;
}

export function reloadDb() {
  db = load();
}
