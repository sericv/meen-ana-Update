"use client";

import { motion } from "framer-motion";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import { GP } from "@/components/game/play/tokens";
import { canUseTacticalTool } from "@/lib/match/tactical-availability";
import { TACTICAL_SHOP_ITEMS, type TacticalToolId } from "@/lib/profile/tactical-tools";
import type { TacticalInventory } from "@/lib/profile/tactical-tools";
import type { MatchState } from "@/types";

type Props = {
  match: MatchState | null;
  uid: string | null;
  myTurn: boolean;
  phase: string;
  inventory: TacticalInventory;
  busy: TacticalToolId | null;
  onUse: (toolId: TacticalToolId) => void;
};

export function TacticalToolsBar({ match, uid, myTurn, phase, inventory, busy, onUse }: Props) {
  return (
    <div className="shrink-0 px-2 pb-1 pt-0.5" dir="rtl">
      <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: GP.inkSoft }}>
        أدوات تكتيكية
      </p>
      <motion.div
        className="grid grid-cols-4 gap-1.5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
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

          return (
            <motion.button
              key={item.id}
              type="button"
              disabled={disabled}
              whileTap={disabled ? undefined : { scale: 0.94 }}
              onClick={() => onUse(item.id)}
              className="relative flex flex-col items-center gap-1 rounded-xl border-0 px-1 py-2 disabled:opacity-45"
              style={{
                background: ok
                  ? "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,244,228,0.92))"
                  : "rgba(255,255,255,0.55)",
                boxShadow: ok
                  ? "inset 0 0 0 1px rgba(244,196,141,0.5), 0 4px 10px rgba(180,100,30,0.08)"
                  : "inset 0 0 0 1px rgba(220,200,180,0.35)",
                color: GP.ink,
              }}
              title={item.nameAr}
              aria-label={`${item.nameAr} — ${count} في المخزون`}
            >
              <span
                className="absolute left-1 top-1 min-w-[16px] rounded-full px-1 text-center text-[9px] font-black leading-4"
                style={{
                  background: count > 0 ? GP.orange : "#E8D4BC",
                  color: count > 0 ? "#fff" : GP.inkSoft,
                }}
              >
                {count}
              </span>
              <span style={{ color: ok ? GP.orangeDeep : GP.inkSoft }}>
                <TacticalToolIcon id={item.id} size={20} />
              </span>
              <span className="line-clamp-2 text-center text-[9px] font-bold leading-tight">
                {isBusy ? "…" : item.nameAr.split(" ")[0]}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
