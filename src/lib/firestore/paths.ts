export const col = {
  users: "users",
  rooms: "rooms",
  matches: "matches",
  categories: "categories",
  cards: "cards",
  matchmakingPool: "matchmakingPool",
  matchmakingResults: "matchmakingResults",
  roomCodes: "roomCodes",
  /** Doc id = usernameLower; fields: uid, usernameLower, usernameDisplay */
  usernameClaims: "usernameClaims",
} as const;

/** Path to a player's match history subcollection. Doc ids are matchIds. */
export function userMatchHistoryCol(uid: string) {
  return `${col.users}/${uid}/matchHistory` as const;
}

/** Subcollections under `users/{uid}` — social graph (writes via Admin API). */
export const userSub = {
  friends: "friends",
  friendInbox: "friendInbox",
  /** Outgoing friend requests (sender's view) — server-maintained. */
  friendOutbox: "friendOutbox",
  roomInvites: "roomInvites",
  socialInbox: "socialInbox",
  /** Persistent match history — one doc per match, keyed by matchId. */
  matchHistory: "matchHistory",
} as const;

export function roomMessagesCol(roomId: string) {
  return `${col.rooms}/${roomId}/messages` as const;
}

export function roomPresenceCol(roomId: string) {
  return `${col.rooms}/${roomId}/presence` as const;
}

export function roomPlayerCardsCol(roomId: string) {
  return `${col.rooms}/${roomId}/playerCards` as const;
}

export function roomTypingCol(roomId: string) {
  return `${col.rooms}/${roomId}/typing` as const;
}
