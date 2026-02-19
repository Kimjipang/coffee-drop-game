export const CHARACTER_COLORS = [
  0xff4757, // red
  0x2ed573, // green
  0x1e90ff, // blue
  0xffa502, // orange
  0xa55eea, // purple
  0xff6b81, // pink
  0x2bcbba, // teal
  0xf7b731, // yellow
  0x4b7bec, // royal blue
  0xfc5c65, // watermelon
  0x45aaf2, // sky blue
  0x26de81, // lime
  0xfd9644, // tangerine
  0xa55eea, // lavender
  0x778ca3, // slate
  0xeb3b5a, // strawberry
  0x20bf6b, // mint
  0x3867d6, // blurple
  0xf7b731, // gold
  0x8854d0, // grape
];

export function getColor(index: number): number {
  return CHARACTER_COLORS[index % CHARACTER_COLORS.length];
}
