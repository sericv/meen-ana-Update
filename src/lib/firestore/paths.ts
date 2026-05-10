export const col = {
  users: "users",
  rooms: "rooms",
  matches: "matches",
  categories: "categories",
  cards: "cards",
  matchmakingPool: "matchmakingPool",
  matchmakingResults: "matchmakingResults",
  roomCodes: "roomCodes",
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
