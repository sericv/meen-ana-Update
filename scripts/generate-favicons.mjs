import fs from "fs";
import path from "path";
import sharp from "sharp";

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Playful Shadow -->
  <rect x="112" y="76" width="320" height="400" rx="48" ry="48" fill="#2C1A04" opacity="0.2" />
  
  <!-- Yellow Card -->
  <rect x="96" y="56" width="320" height="400" rx="48" ry="48" fill="#FFE600" stroke="#2C1A04" stroke-width="24" stroke-linejoin="round" />
  
  <!-- Diagonal Gloss Reflection Highlight (Top-left inside border) -->
  <path d="M 130 84 A 12 12 0 0 1 142 72 L 200 72 A 12 12 0 0 0 188 84 L 142 84 A 12 12 0 0 1 130 84 Z" fill="#FFFFFF" opacity="0.25" />

  <!-- Cartoon Question Mark Outline -->
  <path d="M210 170 C210 130, 302 130, 302 180 C302 220, 256 230, 256 270" stroke="#2C1A04" stroke-width="80" stroke-linecap="round" fill="none" />
  <circle cx="256" cy="350" r="40" fill="#2C1A04" />
  
  <!-- Cartoon Question Mark Inner Purple Fill -->
  <path d="M210 170 C210 130, 302 130, 302 180 C302 220, 256 230, 256 270" stroke="#7C3AED" stroke-width="48" stroke-linecap="round" fill="none" />
  <circle cx="256" cy="350" r="24" fill="#7C3AED" />

  <!-- Tiny highlight reflection circles -->
  <circle cx="140" cy="100" r="14" fill="#FFFFFF" />
  <circle cx="164" cy="116" r="7" fill="#FFFFFF" />
</svg>`;

const targets = [
  { name: "favicon-16x16.png", size: 16, dest: "public" },
  { name: "favicon-32x32.png", size: 32, dest: "public" },
  { name: "apple-touch-icon.png", size: 180, dest: "public" },
  { name: "android-chrome-192x192.png", size: 192, dest: "public" },
  { name: "android-chrome-512x512.png", size: 512, dest: "public" },
  { name: "icon.png", size: 512, dest: "public" },
  { name: "icon.png", size: 512, dest: "src/app" },
];

function makeIco(pngBuffer) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // width 32
  entry.writeUInt8(32, 1); // height 32
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, pngBuffer]);
}

async function run() {
  console.log("Generating favicons...");
  
  // Write master SVG
  fs.writeFileSync(path.join("public", "favicon.svg"), svgContent);
  console.log("✓ Saved public/favicon.svg");

  const svgBuffer = Buffer.from(svgContent);

  // Write PNG files
  for (const t of targets) {
    const destPath = path.join(t.dest, t.name);
    fs.mkdirSync(t.dest, { recursive: true });
    await sharp(svgBuffer)
      .resize(t.size, t.size)
      .png()
      .toFile(destPath);
    console.log(`✓ Generated ${destPath} (${t.size}x${t.size})`);
  }

  // Generate ICO (32x32 source)
  const icoPng = await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toBuffer();
  
  const icoBuffer = makeIco(icoPng);
  fs.writeFileSync(path.join("public", "favicon.ico"), icoBuffer);
  fs.writeFileSync(path.join("src", "app", "favicon.ico"), icoBuffer);
  console.log("✓ Generated public/favicon.ico and src/app/favicon.ico");

  console.log("Favicons generated successfully!");
}

run().catch((e) => {
  console.error("Failed to generate favicons", e);
  process.exit(1);
});
