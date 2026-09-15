import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputImagePath = 'C:/Users/pc_it/.gemini/antigravity-ide/brain/cc9cd1eb-1f58-445f-87b7-8a383f4f8490/.user_uploaded/media_1789023926255.png';
const mediaDir = path.resolve(__dirname, '../public/media');

const baseFilename = 'Toyota Avanza 2026.webp';

async function generateAvanzaMedia() {
  console.log('Generating new Toyota Avanza 2026 webp images from user upload...');

  const image = sharp(inputImagePath);
  const metadata = await image.metadata();
  console.log('Input metadata:', metadata);

  // 1. Save original as webp
  const originalBuffer = await sharp(inputImagePath)
    .webp({ quality: 85 })
    .toBuffer();
  fs.writeFileSync(path.join(mediaDir, baseFilename), originalBuffer);
  console.log(`Saved original: ${baseFilename} (${originalBuffer.length} bytes)`);

  // 2. Generate sizes
  const sizes = [
    { name: 'Toyota Avanza 2026-300x285.webp', width: 300 },
    { name: 'Toyota Avanza 2026-300x375.webp', width: 300 },
    { name: 'Toyota Avanza 2026-500x500.webp', width: 500, height: 500 },
    { name: 'Toyota Avanza 2026-600x569.webp', width: 600 },
    { name: 'Toyota Avanza 2026-600x750.webp', width: 600 },
    { name: 'Toyota Avanza 2026-900x1125.webp', width: 900 },
    { name: 'Toyota Avanza 2026-1200x630.webp', width: 1200, height: 630, fit: 'cover' },
    { name: 'Toyota Avanza 2026-1400x1750.webp', width: 1400 },
    { name: 'Toyota Avanza 2026-1920x2400.webp', width: 1920 }
  ];

  for (const s of sizes) {
    let pipeline = sharp(inputImagePath);
    if (s.height) {
      pipeline = pipeline.resize(s.width, s.height, { fit: s.fit || 'inside' });
    } else {
      pipeline = pipeline.resize(s.width);
    }
    const buf = await pipeline.webp({ quality: 80 }).toBuffer();
    fs.writeFileSync(path.join(mediaDir, s.name), buf);
    console.log(`Saved size: ${s.name} (${buf.length} bytes)`);
  }

  console.log('✅ Successfully updated all Toyota Avanza 2026 image assets!');
}

generateAvanzaMedia();
