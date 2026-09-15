import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mediaDir = path.resolve(__dirname, '../public/media');
const sourcePng = path.join(mediaDir, 'about-img.png');

async function convertAboutImg() {
  if (!fs.existsSync(sourcePng)) {
    console.error('Source about-img.png not found');
    return;
  }

  console.log('Converting about-img.png to WebP...');

  // Original webp
  const webpBuffer = await sharp(sourcePng)
    .webp({ quality: 80 })
    .toBuffer();
  fs.writeFileSync(path.join(mediaDir, 'about-img.webp'), webpBuffer);
  console.log(`Saved about-img.webp (${webpBuffer.length} bytes)`);

  // Small size 600px
  const smallBuffer = await sharp(sourcePng)
    .resize(600)
    .webp({ quality: 78 })
    .toBuffer();
  fs.writeFileSync(path.join(mediaDir, 'about-img-600x426.webp'), smallBuffer);
  console.log(`Saved about-img-600x426.webp (${smallBuffer.length} bytes)`);

  // Thumbnail 300px
  const thumbBuffer = await sharp(sourcePng)
    .resize(300)
    .webp({ quality: 78 })
    .toBuffer();
  fs.writeFileSync(path.join(mediaDir, 'about-img-300x213.webp'), thumbBuffer);
  console.log(`Saved about-img-300x213.webp (${thumbBuffer.length} bytes)`);

  console.log('✅ About image conversion completed!');
}

convertAboutImg();
