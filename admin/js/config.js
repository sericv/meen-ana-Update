// ═══════════════════════════════════════════════════════
//  Firebase Configuration & App Constants
// ═══════════════════════════════════════════════════════

export const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyD91ZuZTiQp7hDos-djjZisxkINB1xlItQ",
  authDomain:        "whoami-76238.firebaseapp.com",
  projectId:         "whoami-76238",
  storageBucket:     "whoami-76238.firebasestorage.app",
  messagingSenderId: "1025205037441",
  appId:             "1:1025205037441:web:277d3ee3fcdd0903d6a080",
};

/** Default hardcoded categories (mirrors src/lib/game/categories.ts). */
export const DEFAULT_CATEGORIES = [
  { id: "cat_general",     nameAr: "عام",       slug: "general",     emoji: "🌐", order: 10 },
  { id: "cat_celebrities", nameAr: "مشاهير",    slug: "celebrities", emoji: "⭐", order: 20 },
  { id: "cat_animals",     nameAr: "حيوانات",   slug: "animals",     emoji: "🐾", order: 30 },
  { id: "cat_games",       nameAr: "ألعاب",     slug: "games",       emoji: "🎮", order: 40 },
  { id: "cat_anime",       nameAr: "أنمي",      slug: "anime",       emoji: "🌸", order: 50 },
];

export const DIFFICULTY_LABELS = {
  easy:   "سهل",
  medium: "متوسط",
  hard:   "صعب",
};

export const CATEGORY_EMOJIS = [
  "🌐","⭐","🐾","🎮","🌸","🎬","🎵","⚽","🏀","🍕","🚗","🏆",
  "🎯","💡","🌍","🎨","📚","🔬","🎪","🌺","🦁","🐉","🚀","💎",
];
