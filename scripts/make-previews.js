// Builds web-size previews for assets/images/photography.
//
// Originals stay byte-for-byte in that folder. This script only writes JPEGs
// in the sibling folder assets/images/photography-previews: 1600px on the long
// side, quality near 80, and well under 500 KB. The photography lightbox
// embeds those previews and links to the original. The folder is a sibling on
// purpose: the gallery lists assets/images/photography through the GitHub
// contents API, which does not recurse, so previews are never extra photos.
//
//   npm run photos:previews         write any missing or out-of-date previews
//   npm run photos:previews:check   exit 1 if a preview is missing or wrong
//
// CI runs the check. After adding a photo, run the writer and commit the JPEG.
// Grid thumbnails are a separate, smaller derivative: npm run photos:thumbs.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'assets/images/photography');
const PREVIEW_DIR = path.join(ROOT, 'assets/images/photography-previews');
const LONG_SIDE = 1600;
const START_QUALITY = 80;
// Stay well under the 500 KB ceiling the check enforces.
const TARGET_BYTES = 450 * 1024;
const MAX_BYTES = 500 * 1024;
const SOURCE_EXT = /\.(jpe?g|png|gif|webp)$/i;

function listSources() {
  return fs.readdirSync(SOURCE_DIR)
    .filter((name) => SOURCE_EXT.test(name))
    .sort();
}

function previewName(filename) {
  return filename.replace(/\.[^.]+$/i, '.jpg');
}

async function render(sourcePath, quality) {
  return sharp(sourcePath, { failOn: 'none' })
    .rotate()
    .resize({
      width: LONG_SIDE,
      height: LONG_SIDE,
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}

// Start at quality 80 and drop only when the file would exceed the target.
async function buildPreview(sourcePath) {
  let quality = START_QUALITY;
  let buffer = await render(sourcePath, quality);
  while (buffer.length > TARGET_BYTES && quality > 45) {
    quality -= 5;
    buffer = await render(sourcePath, quality);
  }
  return { buffer, quality };
}

async function inspect(buffer) {
  const meta = await sharp(buffer).metadata();
  return {
    width: meta.width,
    height: meta.height,
    format: meta.format,
    bytes: buffer.length
  };
}

function problemsFor(info, label) {
  const problems = [];
  const longSide = Math.max(info.width || 0, info.height || 0);
  if (info.format !== 'jpeg') problems.push(`${label} is ${info.format}, not jpeg`);
  if (longSide > LONG_SIDE) problems.push(`${label} long side is ${longSide}, over ${LONG_SIDE}`);
  if (info.bytes > MAX_BYTES) {
    problems.push(`${label} is ${Math.round(info.bytes / 1024)} KB, over ${Math.round(MAX_BYTES / 1024)} KB`);
  }
  return problems;
}

function assertOutsideOriginals(destPath) {
  const sourceRoot = path.resolve(SOURCE_DIR) + path.sep;
  const resolved = path.resolve(destPath);
  if (resolved.startsWith(sourceRoot) || resolved === path.resolve(SOURCE_DIR)) {
    throw new Error(`refusing to write into the originals folder: ${destPath}`);
  }
}

async function main() {
  sharp.cache(false);
  sharp.concurrency(1);
  const check = process.argv.includes('--check');
  const sources = listSources();
  if (!check) fs.mkdirSync(PREVIEW_DIR, { recursive: true });

  const expected = new Set(sources.map(previewName));
  const failures = [];

  for (const name of sources) {
    const destName = previewName(name);
    const destPath = path.join(PREVIEW_DIR, destName);
    const sourcePath = path.join(SOURCE_DIR, name);
    assertOutsideOriginals(destPath);

    if (check) {
      if (!fs.existsSync(destPath)) {
        failures.push(`missing preview for ${name} (run npm run photos:previews)`);
        continue;
      }
      const info = await inspect(fs.readFileSync(destPath));
      failures.push(...problemsFor(info, destName));
      continue;
    }

    const { buffer, quality } = await buildPreview(sourcePath);
    const info = await inspect(buffer);
    const bad = problemsFor(info, destName);
    if (bad.length) {
      failures.push(...bad);
      continue;
    }
    fs.writeFileSync(destPath, buffer);
    const kb = Math.round(info.bytes / 1024);
    const sourceKb = Math.round(fs.statSync(sourcePath).size / 1024);
    console.log(`${destName} ${info.width}x${info.height} q${quality} ${kb} KB (original ${sourceKb} KB)`);
  }

  if (!check) {
    const extras = fs.readdirSync(PREVIEW_DIR).filter((name) => !expected.has(name));
    for (const extra of extras) {
      fs.unlinkSync(path.join(PREVIEW_DIR, extra));
      console.log(`removed stale preview ${extra}`);
    }
  } else if (fs.existsSync(PREVIEW_DIR)) {
    const extras = fs.readdirSync(PREVIEW_DIR).filter((name) => !expected.has(name));
    for (const extra of extras) failures.push(`stale preview ${extra}`);
  }

  if (failures.length) {
    for (const failure of failures) console.error(failure);
    process.exit(1);
  }

  if (check) {
    console.log(`${sources.length} photography previews ok (1600px long side, under ${MAX_BYTES / 1024} KB)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
