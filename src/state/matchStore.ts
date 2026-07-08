import { withDb } from "./jsonDb";

export function upsertMatch(fixtureId: string, fields: Partial<{
  homeTeam: string; awayTeam: string; scoreHome: number; scoreAway: number; phase: string;
  oddsHome: number; oddsDraw: number; oddsAway: number;
}>) {
  withDb((db) => {
    const existing = db.matches[fixtureId] ?? { fixtureId, updatedAt: new Date().toISOString() };
    db.matches[fixtureId] = {
      ...existing,
      homeTeam: fields.homeTeam ?? existing.homeTeam,
      awayTeam: fields.awayTeam ?? existing.awayTeam,
      scoreHome: fields.scoreHome ?? existing.scoreHome,
      scoreAway: fields.scoreAway ?? existing.scoreAway,
      phase: fields.phase ?? existing.phase,
      lastOddsHome: fields.oddsHome ?? existing.lastOddsHome,
      lastOddsDraw: fields.oddsDraw ?? existing.lastOddsDraw,
      lastOddsAway: fields.oddsAway ?? existing.lastOddsAway,
      updatedAt: new Date().toISOString(),
    };
  });
}

export function recordOddsTick(fixtureId: string, odds: { home: number; draw: number; away: number }) {
  withDb((db) => {
    db.oddsTicks.push({
      fixtureId,
      oddsHome: odds.home,
      oddsDraw: odds.draw,
      oddsAway: odds.away,
      recordedAt: new Date().toISOString(),
    });
    if (db.oddsTicks.length > 5000) db.oddsTicks.splice(0, db.oddsTicks.length - 5000);
  });
}

export function recordEvent(fixtureId: string, eventType: string, minute: number, detail: string) {
  withDb((db) => {
    db.events.push({ fixtureId, eventType, minute, detail, recordedAt: new Date().toISOString() });
  });
}

export function getRecentOddsTicks(fixtureId: string, limit = 2) {
  return withDb((db) =>
    db.oddsTicks
      .filter((t) => t.fixtureId === fixtureId)
      .slice(-limit)
      .reverse()
  );
}

export function getMatch(fixtureId: string) {
  return withDb((db) => db.matches[fixtureId]);
}

export function bindChatToFixture(chatId: string, fixtureId: string) {
  withDb((db) => {
    db.chatBindings[chatId] = fixtureId;
  });
}

export function getFixtureForChat(chatId: string): string | undefined {
  return withDb((db) => db.chatBindings[chatId]);
}

export function getChatIdsForFixture(fixtureId: string): string[] {
  return withDb((db) =>
    Object.entries(db.chatBindings)
      .filter(([, fid]) => fid === fixtureId)
      .map(([chatId]) => chatId)
  );
}

export function getRecentEvents(fixtureId: string, limit = 10) {
  return withDb((db) =>
    db.events
      .filter((e) => e.fixtureId === fixtureId)
      .slice(-limit)
      .reverse()
  );
}
