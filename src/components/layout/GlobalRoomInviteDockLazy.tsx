"use client";

import dynamic from "next/dynamic";

export const GlobalRoomInviteDockLazy = dynamic(
  () => import("@/components/social/GlobalRoomInviteDock").then((m) => m.GlobalRoomInviteDock),
  { ssr: false },
);
