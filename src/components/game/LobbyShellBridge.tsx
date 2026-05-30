"use client";

import type { ReactNode } from "react";
import { ShellLobbyView, type ShellLobbyPlayer } from "@/components/shell/lobby/ShellLobbyView";
import { getCategoryById } from "@/lib/game/categories";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { Room } from "@/types";
import type { LivePublicProfile } from "@/hooks/useLiveUserProfiles";

export function LobbyShellBridge({
  room,
  uid,
  displayName,
  userPhotoURL,
  cosmeticsMap,
  liveProfilesMap,
  myXp,
  myMatchWins,
  myReady,
  isHost,
  busy,
  banner,
  googleSoc,
  myReadyOptimistic,
  opponent,
  customModeActive,
  randomLobby,
  uidCardComplete,
  bothPickedCustom,
  onBack,
  onCopyCode,
  onInviteFriends,
  onToggleReady,
  onStartMatch,
  onLeave,
  customPanels,
  overlays,
}: {
  room: Room;
  uid: string;
  displayName: string;
  userPhotoURL?: string | null;
  cosmeticsMap: Record<string, PlayerCosmetic>;
  /** Live XP + wins for players in the lobby (keyed by uid). */
  liveProfilesMap?: Record<string, LivePublicProfile>;
  /** Current user's XP (from their own live profile). */
  myXp?: number;
  /** Current user's wins (from their own live profile). */
  myMatchWins?: number;
  myReady: boolean;
  isHost: boolean;
  busy: boolean;
  banner: string | null;
  googleSoc: boolean;
  myReadyOptimistic: boolean;
  opponent: Room["players"][number] | undefined;
  customModeActive: boolean;
  randomLobby: boolean;
  uidCardComplete: (pid: string) => boolean;
  bothPickedCustom: boolean;
  onBack: () => void;
  onCopyCode: () => void;
  onInviteFriends: () => void;
  onToggleReady: () => void;
  onStartMatch: () => void;
  onLeave: () => void;
  customPanels?: ReactNode;
  overlays?: ReactNode;
}) {
  const categoryLabel = getCategoryById(room.categoryId)?.nameAr ?? room.categoryId ?? "عام";
  const voiceMode = room.voiceMode === true;
  const hintsEnabled = room.hintsEnabled !== false;

  const me: ShellLobbyPlayer = {
    uid,
    displayName,
    ready: myReadyOptimistic,
    cosmetic: cosmeticsMap[uid],
    photoURL: userPhotoURL,
    xp: myXp,
    matchWins: myMatchWins,
    isHost,
  };

  const oppLive = opponent && liveProfilesMap ? liveProfilesMap[opponent.uid] : undefined;
  const opp: ShellLobbyPlayer | null = opponent
    ? {
        uid: opponent.uid,
        displayName: opponent.displayName,
        ready: opponent.ready,
        cosmetic: cosmeticsMap[opponent.uid],
        xp: oppLive?.xp,
        matchWins: oppLive?.matchWins,
        isHost: opponent.uid === room.hostUid,
      }
    : null;

  const missing: string[] = [];
  if (!randomLobby) {
    if (!opponent) missing.push("انضمام اللاعب الثاني");
    if (customModeActive) {
      if (!uidCardComplete(uid)) missing.push("حفظ بطاقتك للخصم");
      if (opponent && !uidCardComplete(opponent.uid)) missing.push("اختيار الخصم لبطاقتك");
    }
    if (!myReadyOptimistic) missing.push("تضغط أنت «جاهز»");
    if (opponent && !opponent.ready) missing.push("الخصم يضغط «جاهز»");
  }
  const canStart = missing.length === 0;

  const hostName = room.players.find((p) => p.uid === room.hostUid)?.displayName ?? displayName;
  const roomTitle = randomLobby ? "مطابقة عشوائية" : `ديوانية ${hostName}`;

  return (
    <ShellLobbyView
      roomTitle={roomTitle}
      roomSubtitle={randomLobby ? "غرفة عشوائية" : "غرفة خاصة"}
      randomLobby={randomLobby}
      roomCode={room.code}
      banner={banner}
      categoryLabel={categoryLabel}
      questionTimerSec={room.questionTimerSec ?? 20}
      answerTimerSec={room.answerTimerSec ?? 15}
      voiceMode={voiceMode}
      hintsEnabled={hintsEnabled}
      me={me}
      opponent={opp}
      myReady={myReadyOptimistic}
      isHost={isHost}
      busy={busy}
      canStart={canStart}
      startMissing={missing}
      showInviteFriends={!randomLobby && isHost && googleSoc}
      onBack={onBack}
      onCopyCode={onCopyCode}
      onInviteFriends={onInviteFriends}
      onToggleReady={onToggleReady}
      onStartMatch={onStartMatch}
      onLeave={onLeave}
      customPanels={customPanels}
      overlays={overlays}
    />
  );
}
