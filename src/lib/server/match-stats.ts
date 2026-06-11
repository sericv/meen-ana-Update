export type StoredMatchPlayerStats = {
  hintsUsed: number;
  tacticalToolsUsed: number;
  totalToolsUsed: number;
};

export function emptyMatchStats(): StoredMatchPlayerStats {
  return { hintsUsed: 0, tacticalToolsUsed: 0, totalToolsUsed: 0 };
}

export function parseMatchStatsByUid(raw: unknown): Record<string, StoredMatchPlayerStats> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, StoredMatchPlayerStats> = {};
  for (const [uid, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!val || typeof val !== "object" || Array.isArray(val)) continue;
    const o = val as Record<string, unknown>;
    const hintsUsed =
      typeof o.hintsUsed === "number" && Number.isFinite(o.hintsUsed)
        ? Math.max(0, Math.floor(o.hintsUsed))
        : 0;
    const tacticalToolsUsed =
      typeof o.tacticalToolsUsed === "number" && Number.isFinite(o.tacticalToolsUsed)
        ? Math.max(0, Math.floor(o.tacticalToolsUsed))
        : 0;
    const totalToolsUsed =
      typeof o.totalToolsUsed === "number" && Number.isFinite(o.totalToolsUsed)
        ? Math.max(0, Math.floor(o.totalToolsUsed))
        : hintsUsed + tacticalToolsUsed;
    out[uid] = { hintsUsed, tacticalToolsUsed, totalToolsUsed };
  }
  return out;
}

export function initMatchStatsForPlayers(uids: string[]): Record<string, StoredMatchPlayerStats> {
  const out: Record<string, StoredMatchPlayerStats> = {};
  for (const uid of uids) out[uid] = emptyMatchStats();
  return out;
}

export function incrementHintUsed(
  map: Record<string, StoredMatchPlayerStats>,
  uid: string,
): Record<string, StoredMatchPlayerStats> {
  const prev = map[uid] ?? emptyMatchStats();
  const hintsUsed = prev.hintsUsed + 1;
  return {
    ...map,
    [uid]: {
      hintsUsed,
      tacticalToolsUsed: prev.tacticalToolsUsed,
      totalToolsUsed: hintsUsed + prev.tacticalToolsUsed,
    },
  };
}

export function incrementTacticalUsed(
  map: Record<string, StoredMatchPlayerStats>,
  uid: string,
): Record<string, StoredMatchPlayerStats> {
  const prev = map[uid] ?? emptyMatchStats();
  const tacticalToolsUsed = prev.tacticalToolsUsed + 1;
  return {
    ...map,
    [uid]: {
      hintsUsed: prev.hintsUsed,
      tacticalToolsUsed,
      totalToolsUsed: prev.hintsUsed + tacticalToolsUsed,
    },
  };
}
