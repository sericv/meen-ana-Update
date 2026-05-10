import type { GameCard } from "@/types";

/**
 * Static card definitions — no Firestore needed for card data.
 * Images are served from public/cards/*.svg
 */
export const STATIC_CARDS: GameCard[] = [
  { id: "card_phone",    nameAr: "جوال",     name: "phone",    imageUrl: "/cards/phone.svg",    categoryId: "cat_all", tags: [] },
  { id: "card_lion",     nameAr: "أسد",      name: "lion",     imageUrl: "/cards/lion.svg",     categoryId: "cat_all", tags: [] },
  { id: "card_pizza",    nameAr: "بيتزا",    name: "pizza",    imageUrl: "/cards/pizza.svg",    categoryId: "cat_all", tags: [] },
  { id: "card_car",      nameAr: "سيارة",    name: "car",      imageUrl: "/cards/car.svg",      categoryId: "cat_all", tags: [] },
  { id: "card_watch",    nameAr: "ساعة",     name: "watch",    imageUrl: "/cards/watch.svg",    categoryId: "cat_all", tags: [] },
  { id: "card_cat",      nameAr: "قطة",      name: "cat",      imageUrl: "/cards/cat.svg",      categoryId: "cat_all", tags: [] },
  { id: "card_camera",   nameAr: "كاميرا",   name: "camera",   imageUrl: "/cards/camera.svg",   categoryId: "cat_all", tags: [] },
  { id: "card_football", nameAr: "كرة قدم",  name: "football", imageUrl: "/cards/football.svg", categoryId: "cat_all", tags: [] },
  { id: "card_book",     nameAr: "كتاب",     name: "book",     imageUrl: "/cards/book.svg",     categoryId: "cat_all", tags: [] },
  { id: "card_laptop",   nameAr: "لابتوب",   name: "laptop",   imageUrl: "/cards/laptop.svg",   categoryId: "cat_all", tags: [] },
  { id: "card_airplane", nameAr: "طائرة",    name: "airplane", imageUrl: "/cards/airplane.svg", categoryId: "cat_all", tags: [] },
  { id: "card_bicycle",  nameAr: "دراجة",    name: "bicycle",  imageUrl: "/cards/bicycle.svg",  categoryId: "cat_all", tags: [] },
  { id: "card_orange",   nameAr: "برتقال",   name: "orange",   imageUrl: "/cards/orange.svg",   categoryId: "cat_all", tags: [] },
  { id: "card_coffee",   nameAr: "قهوة",     name: "coffee",   imageUrl: "/cards/coffee.svg",   categoryId: "cat_all", tags: [] },
  { id: "card_key",      nameAr: "مفتاح",    name: "key",      imageUrl: "/cards/key.svg",      categoryId: "cat_all", tags: [] },
  { id: "card_guitar",   nameAr: "جيتار",    name: "guitar",   imageUrl: "/cards/guitar.svg",   categoryId: "cat_all", tags: [] },
  { id: "card_sun",      nameAr: "شمس",      name: "sun",      imageUrl: "/cards/sun.svg",      categoryId: "cat_all", tags: [] },
  { id: "card_moon",     nameAr: "قمر",      name: "moon",     imageUrl: "/cards/moon.svg",     categoryId: "cat_all", tags: [] },
  { id: "card_fish",     nameAr: "سمكة",     name: "fish",     imageUrl: "/cards/fish.svg",     categoryId: "cat_all", tags: [] },
  { id: "card_house",    nameAr: "بيت",      name: "house",    imageUrl: "/cards/house.svg",    categoryId: "cat_all", tags: [] },
];

/** Pick two distinct cards at random from the static pool. */
export function pickTwoCards(): [GameCard, GameCard] | null {
  if (STATIC_CARDS.length < 2) return null;
  const pool = [...STATIC_CARDS];
  const i = Math.floor(Math.random() * pool.length);
  const a = pool.splice(i, 1)[0]!;
  const j = Math.floor(Math.random() * pool.length);
  const b = pool[j]!;
  return [a, b];
}
