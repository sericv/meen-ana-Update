/** Visual tokens aligned with gameplay.jsx / voice.jsx reference */
export const GP = {
  orange: "#FF8A3D",
  orangeDeep: "#F26A1F",
  orangeSoft: "#FFC58A",
  cream: "#FFF1DD",
  creamDeep: "#FBE0BD",
  ink: "#3A2517",
  inkSoft: "#7A5A45",
  gold: "#F2B544",
  goldDeep: "#D8941F",
  rose: "#E5524D",
  roseDeep: "#B8332E",
  green: "#3FB87A",
} as const;

export function splitNameLetters(name: string): string[] {
  return [...name.replace(/\s/g, "")].filter(Boolean);
}
