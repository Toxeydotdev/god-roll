export interface LeaderboardEntry {
  score: number;
  rounds: number;
  date: string; // ISO string
}

const STORAGE_KEY = "godroll_leaderboard_v1";
const MAX_ENTRIES = 5;

export function getLeaderboard(): LeaderboardEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function addLeaderboardEntry(
  entry: LeaderboardEntry
): LeaderboardEntry[] {
  const current = getLeaderboard();
  const updated = [...current, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearLeaderboard(): void {
  localStorage.removeItem(STORAGE_KEY);
}
