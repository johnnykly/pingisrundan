// Generates PWA icons. Run: node scripts/icons.mjs
import sharp from "sharp";

const INK = "#171617";
const ORANGE = "#ff902d";

// Ping pong ball (HEAR orange) on HEAR ink. `pad` keeps maskable icons inside the safe zone.
const svg = (size, pad) => {
  const r = (size / 2) * (1 - pad) * 0.62;
  const c = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${INK}"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="${ORANGE}"/>
</svg>`;
};

const out = [
  ["public/icons/icon-192.png", 192, 0],
  ["public/icons/icon-512.png", 512, 0],
  ["public/icons/maskable-512.png", 512, 0.2],
  ["public/icons/apple-touch-icon.png", 180, 0.05],
];
for (const [file, size, pad] of out) {
  await sharp(Buffer.from(svg(size, pad))).png().toFile(file);
}
await sharp(Buffer.from(svg(64, 0))).resize(32, 32).png().toFile("src/app/icon.png");
console.log("icons written");
