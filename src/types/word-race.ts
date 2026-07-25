import type { Timestamp } from "firebase/firestore";

export type LetterMode = "SINGLE_UNIVERSAL" | "PER_CATEGORY";

export type WordRaceRoomStatus = "lobby" | "intro" | "playing" | "revealing" | "ended";

export interface WordRaceCategory {
  id: string;
  nameAr: string;
  descriptionAr: string;
  icon: string; // SVG Key identifier
  color: string;
  gradient: string;
}

export interface WordRaceRoomPlayer {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  ready: boolean;
  isHost?: boolean;
  joinedAt: number;
}

export interface WordRaceRoomSettings {
  categories: string[]; // List of category IDs (e.g. ['name', 'animal', 'plant', 'object'])
  letterMode: LetterMode;
  timeLimitSec: number; // e.g. 60, 90, 120, 180
  maxPlayers: number; // 2 to 6
  isPrivate: boolean;
}

export interface WordRaceRoom {
  id: string;
  code: string;
  hostUid: string;
  status: WordRaceRoomStatus;
  players: WordRaceRoomPlayer[];
  playerUids: string[];
  settings: WordRaceRoomSettings;
  matchId: string | null;
  createdAt: number;
  lastActivityAt: number;
}

export interface CategoryAnswerResult {
  word: string;
  isValid: boolean;
  isDuplicate: boolean;
  points: number;
}

export interface PlayerMatchScore {
  totalPoints: number;
  validCount: number;
  duplicateCount: number;
  unansweredCount: number;
  isFinisherBonus: boolean;
  xpEarned: number;
  coinsEarned: number;
}

export interface WordRaceMatch {
  id: string;
  roomId: string;
  status: WordRaceRoomStatus;
  startedAt: number;
  durationSec?: number;
  endedAt?: number;
  finisherUid?: string | null;
  forfeitedByUid?: string | null;
  letterAssignment: Record<string, string>; // categoryId -> Arabic Letter
  answers: Record<string, Record<string, string>>; // uid -> { categoryId: word }
  progress: Record<string, number>; // uid -> count of completed categories
  results?: Record<string, Record<string, CategoryAnswerResult>>; // uid -> { categoryId: CategoryAnswerResult }
  scores?: Record<string, PlayerMatchScore>; // uid -> PlayerMatchScore
  rematchVotes?: Record<string, boolean>; // uid -> boolean
}

export interface WordRacePlayerStats {
  xp: number;
  level: number;
  rankTitleAr: string;
  rankIcon: string;
  winRate: number;
  matchesPlayed: number;
  matchesWon: number;
  bestStreak: number;
  totalWordsFound: number;
}
