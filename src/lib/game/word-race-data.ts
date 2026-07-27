import type { WordRaceCategory, CategoryAnswerResult, PlayerMatchScore, LetterMode } from "@/types/word-race";

export const ARABIC_ALPHABET = [
  "أ", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "هـ", "و", "ي"
];

export const WORD_RACE_CATEGORIES: WordRaceCategory[] = [
  { id: "name", nameAr: "اسم انسان", descriptionAr: "أسماء الذكور والإناث العربية والعالمية", icon: "name", color: "text-blue-500", gradient: "from-blue-600/30 to-indigo-600/30" },
  { id: "animal", nameAr: "حيوان", descriptionAr: "جميع الثدييات، الطيور، الزواحف والأسماك", icon: "animal", color: "text-emerald-500", gradient: "from-emerald-600/30 to-teal-600/30" },
  { id: "plant", nameAr: "نبات", descriptionAr: "الأشجار، الزهور، الخضروات والفواكه", icon: "plant", color: "text-green-500", gradient: "from-green-600/30 to-emerald-600/30" },
  { id: "object", nameAr: "جماد", descriptionAr: "الأدوات، الأثاث والأشياء غير الحية", icon: "object", color: "text-amber-500", gradient: "from-amber-600/30 to-orange-600/30" },
  { id: "country", nameAr: "بلد", descriptionAr: "الدول والبلدان المعترف بها عالمياً", icon: "country", color: "text-rose-500", gradient: "from-rose-600/30 to-red-600/30" },
  { id: "city", nameAr: "مدينة", descriptionAr: "العواصم والمدن العربية والعالمية", icon: "city", color: "text-cyan-500", gradient: "from-cyan-600/30 to-blue-600/30" },
  { id: "job", nameAr: "مهنة", descriptionAr: "الوظائف، المهن والتخصصات", icon: "job", color: "text-purple-500", gradient: "from-purple-600/30 to-pink-600/30" },
  { id: "famous", nameAr: "شخصية مشهورة", descriptionAr: "المشاهير، العلماء والقادة التاريخيون", icon: "famous", color: "text-yellow-500", gradient: "from-yellow-600/30 to-amber-600/30" },
  { id: "food", nameAr: "طعام", descriptionAr: "الأطباق، المأكولات والحلويات", icon: "food", color: "text-orange-500", gradient: "from-orange-600/30 to-red-600/30" },
  { id: "car", nameAr: "سيارة / وسيلة نقل", descriptionAr: "ماركات السيارات ووسائل النقل", icon: "car", color: "text-red-500", gradient: "from-red-600/30 to-rose-600/30" },
  { id: "movie", nameAr: "فيلم / مسلسل", descriptionAr: "الأعمال السينمائية والتلفزيونية", icon: "movie", color: "text-violet-500", gradient: "from-violet-600/30 to-purple-600/30" },
  { id: "anime", nameAr: "أنمي", descriptionAr: "شخصيات وأسماء أنمي شهيرة", icon: "anime", color: "text-pink-500", gradient: "from-pink-600/30 to-rose-600/30" },
  { id: "sport", nameAr: "رياضة", descriptionAr: "أنواع الرياضات والألعاب الأولمبية", icon: "sport", color: "text-teal-500", gradient: "from-teal-600/30 to-cyan-600/30" }
];

export function getRandomArabicLetter(excludedLetters: string[] = []): string {
  const pool = ARABIC_ALPHABET.filter((l) => !excludedLetters.includes(l));
  const available = pool.length > 0 ? pool : ARABIC_ALPHABET;
  const index = Math.floor(Math.random() * available.length);
  return available[index];
}

/** Generate letter assignment for match categories, respecting excluded letters */
export function generateMatchLetters(
  categories: string[],
  mode: LetterMode,
  excludedLetters: string[] = []
): Record<string, string> {
  const pool = ARABIC_ALPHABET.filter((l) => !excludedLetters.includes(l));
  const available = pool.length > 0 ? pool : ARABIC_ALPHABET;
  const result: Record<string, string> = {};
  if (mode === "SINGLE_UNIVERSAL") {
    const universalLetter = available[Math.floor(Math.random() * available.length)];
    for (const catId of categories) {
      result[catId] = universalLetter;
    }
  } else {
    // Mode 2: Per Category unique random letters
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    for (let i = 0; i < categories.length; i++) {
      result[categories[i]] = shuffled[i % shuffled.length];
    }
  }
  return result;
}

/** Normalize Arabic text for letter comparison (handles Alef variations) */
export function normalizeArabicWord(text: string): string {
  if (!text) return "";
  let clean = text.trim();
  // Strip initial 'ال' prefix if user typed e.g. 'الأسد' for letter 'أ'
  if (clean.startsWith("ال") && clean.length > 3) {
    clean = clean.slice(2);
  }
  // Normalize alef variants: 'إ', 'أ', 'آ' -> 'ا'
  clean = clean.replace(/[أإآ]/g, "ا");
  return clean;
}

/** Check if answer begins with assigned letter (must be > 1 character) */
export function validateAnswer(answerRaw: string, targetLetter: string): boolean {
  if (!answerRaw) return false;
  const clean = answerRaw.trim();
  // Answers must be > 1 character long (lone single letters score 0)
  if (clean.length <= 1 || clean === "لم أعرف" || clean === "لم يجب") return false;
  const normalizedAns = normalizeArabicWord(clean);
  const normalizedTarget = normalizeArabicWord(targetLetter);
  return normalizedAns.startsWith(normalizedTarget);
}

/** Calculate scores and validation results for both players */
export function evaluateWordRaceMatch(
  categories: string[],
  letterAssignment: Record<string, string>,
  playerAnswers: Record<string, Record<string, string>>,
  finisherUid?: string | null
): {
  results: Record<string, Record<string, CategoryAnswerResult>>;
  scores: Record<string, PlayerMatchScore>;
} {
  const playerUids = Object.keys(playerAnswers);
  const results: Record<string, Record<string, CategoryAnswerResult>> = {};
  const scores: Record<string, PlayerMatchScore> = {};

  for (const uid of playerUids) {
    results[uid] = {};
    scores[uid] = {
      totalPoints: 0,
      validCount: 0,
      duplicateCount: 0,
      unansweredCount: 0,
      isFinisherBonus: uid === finisherUid,
      xpEarned: 0,
      coinsEarned: 0,
    };
  }

  for (const catId of categories) {
    const targetLetter = letterAssignment[catId] || "أ";
    const answersInCat: Record<string, { raw: string; norm: string; isValid: boolean }> = {};

    // 1. Evaluate validity for each player
    for (const uid of playerUids) {
      const raw = playerAnswers[uid]?.[catId] || "";
      const isValid = validateAnswer(raw, targetLetter);
      answersInCat[uid] = { raw, norm: normalizeArabicWord(raw), isValid };
    }

    // 2. Check for duplicate valid answers between players
    for (const uid of playerUids) {
      const pAns = answersInCat[uid];
      if (!pAns.isValid) {
        const clean = (pAns.raw || "").trim();
        const isUnanswered = !clean || clean.length <= 1 || clean === "لم أعرف" || clean === "لم يجب";
        results[uid][catId] = {
          word: "لم يجب",
          isValid: false,
          isDuplicate: false,
          points: 0,
        };
        scores[uid].unansweredCount += 1;
        continue;
      }

      // Check if another player wrote the exact same normalized word
      const isDuplicate = playerUids.some(
        (otherUid) => otherUid !== uid && answersInCat[otherUid].isValid && answersInCat[otherUid].norm === pAns.norm
      );

      const points = isDuplicate ? 5 : 10;
      results[uid][catId] = {
        word: pAns.raw,
        isValid: true,
        isDuplicate,
        points,
      };

      scores[uid].totalPoints += points;
      if (isDuplicate) {
        scores[uid].duplicateCount += 1;
      } else {
        scores[uid].validCount += 1;
      }
    }
  }

  // 3. Calculate XP & Coins (totalPoints is strictly sum of category points)
  for (const uid of playerUids) {
    const finisherXpBonus = uid === finisherUid ? 25 : 0;
    scores[uid].xpEarned = Math.round(scores[uid].totalPoints * 1.5 + (scores[uid].validCount * 5) + finisherXpBonus);
    scores[uid].coinsEarned = Math.round(scores[uid].totalPoints / 2);
  }

  return { results, scores };
}

/** Compute cumulative scores across completed round history + optional current round */
export function computeCumulativeScores(
  roundHistory: Array<{ scores: Record<string, PlayerMatchScore> }>,
  currentScores?: Record<string, PlayerMatchScore>
): Record<string, PlayerMatchScore> {
  const cumulative: Record<string, PlayerMatchScore> = {};

  const allSources = [...roundHistory];
  if (currentScores) {
    allSources.push({ scores: currentScores });
  }

  for (const roundData of allSources) {
    for (const [uid, score] of Object.entries(roundData.scores || {})) {
      if (!cumulative[uid]) {
        cumulative[uid] = {
          totalPoints: 0,
          validCount: 0,
          duplicateCount: 0,
          unansweredCount: 0,
          isFinisherBonus: false,
          xpEarned: 0,
          coinsEarned: 0,
        };
      }
      cumulative[uid].totalPoints += score.totalPoints || 0;
      cumulative[uid].validCount += score.validCount || 0;
      cumulative[uid].duplicateCount += score.duplicateCount || 0;
      cumulative[uid].unansweredCount += score.unansweredCount || 0;
    }
  }

  for (const uid of Object.keys(cumulative)) {
    const totalPts = cumulative[uid].totalPoints;
    const validCnt = cumulative[uid].validCount;
    cumulative[uid].xpEarned = Math.round(totalPts * 1.5 + validCnt * 5);
    cumulative[uid].coinsEarned = Math.round(totalPts / 2);
  }

  return cumulative;
}
