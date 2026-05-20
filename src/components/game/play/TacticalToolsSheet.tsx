"use client";

import { AnimatePresence } from "framer-motion";
import { GameplaySheet } from "@/components/game/play/GameplaySheets";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import { GP } from "@/components/game/play/tokens";
import { canUseTacticalTool } from "@/lib/match/tactical-availability";
import {
  TACTICAL_SHOP_ITEMS,
  TACTICAL_TOOL_IDS,
  type TacticalInventory,
  type TacticalToolId,
} from "@/lib/profile/tactical-tools";
import type { MatchState } from "@/types";

type Props = {
  open: boolean;
  match: MatchState | null;
  uid: string | null;
  myTurn: boolean;
  phase: string;
  inventory: TacticalInventory;
  busy: TacticalToolId | null;
  error?: string | null;
  onClose: () => void;
  onUse: (toolId: TacticalToolId) => void;
};

export function TacticalToolsSheet({
  open,
  match,
  uid,
  myTurn,
  phase,
  inventory,
  busy,
  error,
  onClose,
  onUse,
}: Props) {
  const myTactical = uid ? match?.tacticalByUid?.[uid] : undefined;
  const extraQActive =
    myTurn &&
    phase === "question" &&
    (myTactical?.questionQuota ?? 1) >= 2 &&
    (myTactical?.questionsThisTurn ?? 0) < (myTactical?.questionQuota ?? 1);

  const totalOwned = TACTICAL_TOOL_IDS.reduce((s, id) => s + (inventory[id] ?? 0), 0);

  return (
    <AnimatePresence>
      {open ? (
        <GameplaySheet title="الأدوات التكتيكية" accent="#3d6a9e" onClose={onClose}>
          <p className="text-xs font-semibold" style={{ color: GP.inkSoft }}>
            {totalOwned > 0
              ? `${totalOwned} أداة في المخزون · مرة واحدة لكل أداة في المباراة`
              : "لا توجد أدوات — اشترِها من المتجر"}
          </p>

          {extraQActive ? (
            <p
              className="mt-2 rounded-xl px-3 py-2 text-center text-[11px] font-extrabold"
              style={{ background: "rgba(255,159,10,0.15)", color: GP.orangeDeep }}
            >
              سؤالان هذا الدور — اسأل مرتين ثم يجيب الخصم
            </p>
          ) : null}

          {error ? (
            <p
              className="mt-2 rounded-xl px-3 py-2 text-center text-[11px] font-bold"
              style={{ background: "rgba(255,240,235,0.95)", color: GP.roseDeep }}
            >
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-2.5">
            {TACTICAL_SHOP_ITEMS.map((item) => {
              const count = inventory[item.id] ?? 0;
              const { ok } = canUseTacticalTool({
                toolId: item.id,
                match,
                uid,
                myTurn,
                phase,
                inventory,
              });
              const disabled = !ok || busy !== null || count < 1;
              const isBusy = busy === item.id;
              const stockLabel =
                count > 0 ? `×${count} في المخزون` : "غير متوفر — المتجر";

              return (
                <TacticalOption
                  key={item.id}
                  toolId={item.id}
                  title={item.nameAr}
                  subtitle={item.subtitleAr}
                  rules={item.rulesAr}
                  stockLabel={stockLabel}
                  ready={ok && count > 0}
                  disabled={disabled}
                  busy={isBusy}
                  onClick={() => onUse(item.id)}
                />
              );
            })}
          </div>
        </GameplaySheet>
      ) : null}
    </AnimatePresence>
  );
}

function TacticalOption({
  toolId,
  title,
  subtitle,
  rules,
  stockLabel,
  ready,
  disabled,
  busy,
  onClick,
}: {
  toolId: TacticalToolId;
  title: string;
  subtitle: string;
  rules: string;
  stockLabel: string;
  ready: boolean;
  disabled: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="relative flex w-full items-center gap-3 rounded-2xl border p-3.5 text-right disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        background: ready
          ? "linear-gradient(180deg, #eef4fc 0%, #dce8f6 100%)"
          : "rgba(255,255,255,0.9)",
        borderColor: ready ? "rgba(90,140,200,0.5)" : "rgba(244,196,141,0.35)",
      }}
    >
      {ready ? (
        <span
          className="absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[9px] font-extrabold"
          style={{ background: "#5a8fc4", color: "#fff" }}
        >
          جاهزة
        </span>
      ) : null}
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={{
          background: ready
            ? "linear-gradient(180deg, #8eb8e8 0%, #5a8fc4 100%)"
            : GP.cream,
          color: ready ? "#fff" : GP.inkSoft,
        }}
      >
        <TacticalToolIcon id={toolId} size={24} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold" style={{ color: GP.ink }}>
          {busy ? "جاري التفعيل…" : title}
        </p>
        <p className="text-xs leading-snug" style={{ color: GP.inkSoft }}>
          {subtitle}
        </p>
        <p className="mt-0.5 text-[10px] leading-snug opacity-80" style={{ color: GP.inkSoft }}>
          {rules}
        </p>
      </div>
      <span className="shrink-0 text-[11px] font-extrabold" style={{ color: ready ? "#3d6a9e" : GP.inkSoft }}>
        {stockLabel}
      </span>
    </button>
  );
}
