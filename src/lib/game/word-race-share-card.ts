/**
 * Word Race Dedicated 1:1 Light-Theme Share Card Generator (1080x1080px)
 * High-definition custom graphics canvas engine formatted with Baloo Bhaijaan 2 font & zero emojis.
 * Domain: saeer.xyz
 */

export interface WordRaceCategoryReportItem {
  catName: string;
  letter: string;
  myWord: string;
  oppWord: string;
  myPoints: number;
}

export interface WordRaceShareCardParams {
  playerName: string;
  totalPoints: number;
  myRoundPoints: number;
  oppRoundPoints: number;
  validCount: number;
  duplicateCount: number;
  roundNumber?: number | "grand";
  totalRounds: number;
  heroLetter?: string;
  isWinner: boolean;
  isTie: boolean;
  opponentName?: string;
  opponentPoints?: number;
  categoryReports?: WordRaceCategoryReportItem[];
}

const FONT_FAMILY = "'Baloo Bhaijaan 2', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

/** Helper to draw a rounded rectangle on 2D canvas context */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Helper to draw 3D game logo tiles */
function drawLogoTile(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  bgColor: string,
  textColor: string,
  rotationDeg: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotationDeg * Math.PI) / 180);

  // Tile Shadow
  ctx.shadowColor = "rgba(124, 58, 237, 0.12)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  // Tile Body
  ctx.fillStyle = bgColor;
  roundRect(ctx, -w / 2, -h / 2, w, h, 12);
  ctx.fill();

  // Reset shadow for stroke
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Text
  ctx.fillStyle = textColor;
  ctx.font = `900 24px ${FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "rtl";
  ctx.fillText(text, 0, 2);

  ctx.restore();
}

export async function generateWordRaceShareCardBlob(
  params: WordRaceShareCardParams
): Promise<Blob> {
  const width = 1080;
  const height = 1080;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d context");

  // 1. Light Theme Gradient Background (#FAF9FF to #EDE0FF)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#FAF9FF");
  bgGrad.addColorStop(0.4, "#F5EEFF");
  bgGrad.addColorStop(1, "#ECE0FD");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Soft Ambient Glow Orbs
  const glow1 = ctx.createRadialGradient(540, 160, 20, 540, 160, 400);
  glow1.addColorStop(0, "rgba(124, 58, 237, 0.10)");
  glow1.addColorStop(1, "rgba(124, 58, 237, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, width, height);

  const glow2 = ctx.createRadialGradient(850, 850, 20, 850, 850, 360);
  glow2.addColorStop(0, "rgba(14, 165, 233, 0.08)");
  glow2.addColorStop(1, "rgba(14, 165, 233, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  // Decorative Dots
  ctx.fillStyle = "rgba(124, 58, 237, 0.06)";
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 5; row++) {
      ctx.beginPath();
      ctx.arc(50 + col * 18, 50 + row * 18, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Header Zone (Branding & Logo Tiles)
  drawLogoTile(ctx, "اسم", 460, 65, 72, 82, "#22C55E", "#FFFFFF", -8);
  drawLogoTile(ctx, "س", 540, 60, 72, 82, "#FFE600", "#000000", 6);
  drawLogoTile(ctx, "أ", 620, 68, 72, 82, "#00F0FF", "#000000", 2);

  // App Title Subtitle (NO EMOJIS)
  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillStyle = "#7C3AED";
  ctx.font = `800 20px ${FONT_FAMILY}`;
  ctx.fillText("تحدي اسم حيوان جماد نبات", 540, 130);
  ctx.restore();

  // 3. Round & Hero Letter Zone (y = 150 to 240)
  const isGrandTab = params.roundNumber === "grand";
  const roundTitle = isGrandTab
    ? `المجموع الكلي الكبـير ( ${params.totalRounds} جولات )`
    : `الجولة ${params.roundNumber || 1} من ${params.totalRounds}`;

  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Round Title Pill
  const rPillW = 340;
  const rPillH = 38;
  const rPillX = 540 - rPillW / 2;
  const rPillY = 152;

  ctx.fillStyle = "rgba(124, 58, 237, 0.12)";
  roundRect(ctx, rPillX, rPillY, rPillW, rPillH, 19);
  ctx.fill();

  ctx.fillStyle = "#6D28D9";
  ctx.font = `800 18px ${FONT_FAMILY}`;
  ctx.fillText(roundTitle, 540, rPillY + rPillH / 2 + 1);

  // HERO LETTER BADGE (The visual star of the card)
  if (params.heroLetter && !isGrandTab) {
    const heroBoxW = 200;
    const heroBoxH = 50;
    const heroBoxX = 540 - heroBoxW / 2;
    const heroBoxY = 200;

    // Glowing Hero Badge Body
    ctx.shadowColor = "rgba(124, 58, 237, 0.25)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;

    const heroGrad = ctx.createLinearGradient(heroBoxX, heroBoxY, heroBoxX + heroBoxW, heroBoxY + heroBoxH);
    heroGrad.addColorStop(0, "#7C3AED");
    heroGrad.addColorStop(1, "#6D28D9");
    ctx.fillStyle = heroGrad;
    roundRect(ctx, heroBoxX, heroBoxY, heroBoxW, heroBoxH, 25);
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.strokeStyle = "#DDD6FE";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hero Letter Text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `900 24px ${FONT_FAMILY}`;
    ctx.fillText(`حرف  [ ${params.heroLetter} ]`, 540, heroBoxY + heroBoxH / 2 + 1);
  }
  ctx.restore();

  // 4. Score & Outcome Banner Zone (x: 50, y: 265, w: 980, h: 125)
  const scoreCardX = 50;
  const scoreCardY = 265;
  const scoreCardW = 980;
  const scoreCardH = 125;

  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, scoreCardX, scoreCardY, scoreCardW, scoreCardH, 22);
  ctx.shadowColor = "rgba(124, 58, 237, 0.08)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "#E9D5FF";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Outcome Badge (NO EMOJIS)
  let badgeText = "فوز مستحق بالمركز الأول";
  let badgeBg = "#FEF08A";
  let badgeTextColor = "#854D0E";

  if (params.isTie) {
    badgeText = "مباراة متعادلة";
    badgeBg = "#CFFAFE";
    badgeTextColor = "#155E75";
  } else if (!params.isWinner) {
    badgeText = "أداء ممتاز في المباراة";
    badgeBg = "#F3E8FF";
    badgeTextColor = "#6B21A8";
  }

  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const bW = 300;
  const bH = 34;
  const bX = 540 - bW / 2;
  const bY = scoreCardY + 14;

  ctx.fillStyle = badgeBg;
  roundRect(ctx, bX, bY, bW, bH, 17);
  ctx.fill();

  ctx.fillStyle = badgeTextColor;
  ctx.font = `800 18px ${FONT_FAMILY}`;
  ctx.fillText(badgeText, 540, bY + bH / 2 + 1);

  // Side-by-Side Scores
  const myScoreDisplay = `${params.playerName} (أنت): ${params.myRoundPoints} ن`;
  ctx.fillStyle = "#7C3AED";
  ctx.font = `900 26px ${FONT_FAMILY}`;
  ctx.textAlign = "right";
  ctx.fillText(myScoreDisplay, scoreCardX + scoreCardW - 35, scoreCardY + 86);

  if (params.opponentName && typeof params.oppRoundPoints === "number") {
    const oppScoreDisplay = `${params.opponentName}: ${params.oppRoundPoints} ن`;
    ctx.fillStyle = "#475569";
    ctx.font = `800 24px ${FONT_FAMILY}`;
    ctx.textAlign = "left";
    ctx.fillText(oppScoreDisplay, scoreCardX + 35, scoreCardY + 86);
  }
  ctx.restore();

  // 5. Detailed Category & Answer Report Table (x: 50, y: 405, w: 980, h: 620)
  const tableX = 50;
  const tableY = 405;
  const tableW = 980;
  const tableH = 620;

  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, tableX, tableY, tableW, tableH, 22);
  ctx.shadowColor = "rgba(124, 58, 237, 0.06)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Table Header Bar (h = 52)
  ctx.fillStyle = "#F8FAFC";
  roundRect(ctx, tableX + 2, tableY + 2, tableW - 4, 52, 20);
  ctx.fill();

  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tableX, tableY + 54);
  ctx.lineTo(tableX + tableW, tableY + 54);
  ctx.stroke();

  // Table Header Labels (NO EMOJIS)
  ctx.save();
  ctx.direction = "rtl";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#64748B";
  ctx.font = `800 20px ${FONT_FAMILY}`;

  ctx.textAlign = "right";
  ctx.fillText("الفئة والحرف", tableX + tableW - 30, tableY + 27);

  ctx.textAlign = "center";
  ctx.fillText(`إجابتك (${params.playerName})`, tableX + 550, tableY + 27);

  if (params.opponentName) {
    ctx.textAlign = "center";
    ctx.fillText(`إجابة ${params.opponentName}`, tableX + 270, tableY + 27);
  }

  ctx.textAlign = "left";
  ctx.fillText("النقاط", tableX + 30, tableY + 27);

  // Table Rows Rendering
  const reports = params.categoryReports || [];
  const maxRows = Math.min(reports.length, 7);
  const rowHeight = 76;

  for (let i = 0; i < maxRows; i++) {
    const item = reports[i];
    const rowY = tableY + 55 + i * rowHeight;

    // Alternating Row Background
    if (i % 2 === 1) {
      ctx.fillStyle = "#FAFAFE";
      ctx.fillRect(tableX + 2, rowY, tableW - 4, rowHeight);
    }

    // Row Divider Line
    if (i < maxRows - 1) {
      ctx.strokeStyle = "#F1F5F9";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tableX + 20, rowY + rowHeight);
      ctx.lineTo(tableX + tableW - 20, rowY + rowHeight);
      ctx.stroke();
    }

    const rowMidY = rowY + rowHeight / 2;

    // Col 1: Category Name + Assigned Letter
    ctx.textAlign = "right";
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 20px ${FONT_FAMILY}`;
    const displayCatLetter = item.letter ? `${item.catName} (${item.letter})` : item.catName;
    ctx.fillText(displayCatLetter, tableX + tableW - 30, rowMidY);

    // Col 2: Player's Answer
    const myAnswer = (item.myWord || "").trim();
    const isMyUnanswered = !myAnswer || myAnswer === "لم يجب" || myAnswer === "لم أعرف" || myAnswer.length <= 1;

    ctx.textAlign = "center";
    if (isMyUnanswered) {
      const pillW = 95;
      const pillH = 32;
      ctx.fillStyle = "#FEE2E2";
      roundRect(ctx, tableX + 550 - pillW / 2, rowMidY - pillH / 2, pillW, pillH, 16);
      ctx.fill();
      ctx.fillStyle = "#991B1B";
      ctx.font = `800 16px ${FONT_FAMILY}`;
      ctx.fillText("لم يجب", tableX + 550, rowMidY + 1);
    } else {
      ctx.fillStyle = "#1E1B4B";
      ctx.font = `800 20px ${FONT_FAMILY}`;
      ctx.fillText(myAnswer, tableX + 550, rowMidY);
    }

    // Col 3: Opponent's Answer
    if (params.opponentName) {
      const oppAnswer = (item.oppWord || "").trim();
      const isOppUnanswered = !oppAnswer || oppAnswer === "لم يجب" || oppAnswer === "لم أعرف" || oppAnswer.length <= 1;

      ctx.textAlign = "center";
      if (isOppUnanswered) {
        const pillW = 95;
        const pillH = 32;
        ctx.fillStyle = "#FEE2E2";
        roundRect(ctx, tableX + 270 - pillW / 2, rowMidY - pillH / 2, pillW, pillH, 16);
        ctx.fill();
        ctx.fillStyle = "#991B1B";
        ctx.font = `800 16px ${FONT_FAMILY}`;
        ctx.fillText("لم يجب", tableX + 270, rowMidY + 1);
      } else {
        ctx.fillStyle = "#475569";
        ctx.font = `700 20px ${FONT_FAMILY}`;
        ctx.fillText(oppAnswer, tableX + 270, rowMidY);
      }
    }

    // Col 4: Points Earned
    ctx.textAlign = "left";
    ctx.fillStyle = item.myPoints > 0 ? "#7C3AED" : "#94A3B8";
    ctx.font = `900 20px ${FONT_FAMILY}`;
    ctx.fillText(`+${item.myPoints} ن`, tableX + 30, rowMidY);
  }

  ctx.restore();

  // 6. Footer Watermark (Domain: saeer.xyz - NO EMOJIS)
  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillStyle = "#64748B";
  ctx.font = `700 20px ${FONT_FAMILY}`;
  ctx.fillText("لعبة اسم حيوان جماد نبات  •  saeer.xyz", 540, 1048);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to export canvas to PNG blob"));
      }
    }, "image/png", 1.0);
  });
}

/**
 * Triggers native mobile share sheet (if supported) or downloads PNG image on desktop.
 */
export async function shareOrDownloadWordRaceResult(
  params: WordRaceShareCardParams
): Promise<{ success: boolean; method: "share" | "download" }> {
  const blob = await generateWordRaceShareCardBlob(params);
  const fileName = `word-race-result-${Date.now()}.png`;
  const file = new File([blob], fileName, { type: "image/png" });

  const roundContextText = params.roundNumber === "grand"
    ? `نتيجتي الكلية في تحدي اسم حيوان جماد نبات (${params.totalPoints} نقطة)!`
    : `نتيجتي في الجولة ${params.roundNumber} (${params.myRoundPoints} نقطة) - حرف [${params.heroLetter || "أ"}]!`;

  const shareData = {
    title: "نتيجة مباراة اسم حيوان جماد نبات",
    text: `${roundContextText} على saeer.xyz`,
    files: [file],
  };

  // Try native Web Share API with file support
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share(shareData);
      return { success: true, method: "share" };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { success: false, method: "share" };
      }
      console.warn("Native share failed, falling back to download:", err);
    }
  }

  // Desktop or fallback download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  return { success: true, method: "download" };
}
