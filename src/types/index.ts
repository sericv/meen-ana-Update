import type { Timestamp } from "firebase/firestore";

export type RoomStatus = "lobby" | "playing" | "ended";

export type MatchStatus = "active" | "ended";

export interface RoomPlayer {
  uid: string;
  displayName: string;
  ready: boolean;
  joinedAt: Timestamp | null;
}

export interface Room {
  id: string;
  code: string;
  hostUid: string;
  players: RoomPlayer[];
  playerJoinedAt?: Record<string, Timestamp | null>;
  playerUids: string[];
  status: RoomStatus;
  categoryId: string;
  matchId: string | null;
  tutorial: boolean;
  openJoin: boolean;
  /** True when created via random matchmaking (hide room code in UI) */
  randomMatch?: boolean;
  /** Lobby-only: custom timers for private rooms (seconds) */
  questionTimerSec?: number;
  answerTimerSec?: number;
  /** Set when opponent forfeits mid-match (remaining player sees & exits) */
  leftByUid?: string;
  /** Lobby: peer navigated away (optional notice) */
  lobbyLeftByUid?: string;
  createdAt: Timestamp | null;
  lastActivityAt: Timestamp | null;
  cleanupAt: Timestamp | null;
}

export type ChatPhase = "question" | "answer";

export interface MatchState {
  id: string;
  roomId: string;
  status: MatchStatus;
  playerOrder: string[];
  /** Who must speak next (ask a question or give an answer) */
  actorUid: string | null;
  chatPhase: ChatPhase;
  turnDeadline: Timestamp | null;
  /** Effective timer lengths for this match (copied from room at start) */
  questionSeconds: number;
  answerSeconds: number;
  winnerUid: string | null;
  winReason: "guess" | "forfeit" | null;
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
}

export type ChatMessageType = "chat" | "question" | "guess" | "system";

export interface ChatMessage {
  id: string;
  roomId: string;
  senderUid: string;
  senderName: string;
  type: ChatMessageType;
  text: string;
  correct?: boolean;
  createdAt: Timestamp | null;
}

export interface Category {
  id: string;
  nameAr: string;
  slug: string;
  order: number;
}

export interface GameCard {
  id: string;
  name: string;
  nameAr: string;
  imageUrl: string;
  categoryId: string;
  tags: string[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  isGuest: boolean;
  createdAt: Timestamp | null;
  lastSeen: Timestamp | null;
}

export interface OpponentCardView {
  card: GameCard;
}
