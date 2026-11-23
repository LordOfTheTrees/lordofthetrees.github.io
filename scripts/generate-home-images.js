// Builds 800px JPEG and WebP variants for assets/images/home.
//
// The originals stay 1600px JPEGs. A matching 1600px WebP already sits beside
// each one and is left alone. The homepage picture element points at both
// widths. This folder is separate from photography thumbnails on purpose.
//
//   npm run home:images         write any missing or out-of-date 800px files
//   npm run home:images:check   exit 1 if a variant is missing or wrong
//
// CI runs the check. photos:thumbs:check does not look here.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const HOME_DIR = path.join(ROOT, 'assets/images/home');
const WIDTH = 800;
const MAX_BYTES = 100 * 1024;

function listSources() {
  return fs.readdirSync(HOME_DIR)
    .filter((name) => /\.jpe?g$/i.test(name) && !/-800\.jpe?g$/i.test(name))
    .sort();
}

function stemOf(filename) {
  return filename.replace(/\.jpe?g$/i, '');
}

async function render(sourcePath, format, quality) {
  const pipeline = sharp(sourcePath, { failOn: 'none' })
    .rotate()
    .resize({ width: WIDTH, withoutEnlargement: true });
  if (format === 'webp') return pipeline.webp({ quality }).toBuffer();
  return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
}

async function buildVariant(sourcePath, format) {
  let quality = 75;
  let buffer = await render(sourcePath, format, quality);
  while (buffer.length > MAX_BYTES && quality > 40) {
    quality -= 8;
    buffer = await render(sourcePath, format, quality);
  }
  return buffer;
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

function problemsFor(info, label, format) {
  const problems = [];
  if (info.format !== format) problems.push(`${label} is ${info.format}, not ${format}`);
  if (info.width !== WIDTH) problems.push(`${label} width is ${info.width}, not ${WIDTH}`);
  if (!info.height) problems.push(`${label} has no height`);
  if (info.bytes > MAX_BYTES) {
    problems.push(`${label} is ${Math.round(info.bytes / 1024)} KB, over ${Math.round(MAX_BYTES / 1024)} KB`);
  }
  return problems;
}

async function main() {
  const check = process.argv.includes('--check');
  const sources = listSources();
  const expected = new Set();
  const failures = [];

  for (const name of sources) {
    const stem = stemOf(name);
    const sourcePath = path.join(HOME_DIR, name);
    for (const format of ['jpeg', 'webp']) {
      const ext = format === 'jpeg' ? 'jpg' : 'webp';
      const destName = `${stem}-800.${ext}`;
      expected.add(destName);
      const destPath = path.join(HOME_DIR, destName);

      if (check) {
        if (!fs.existsSync(destPath)) {
          failures.push(`missing ${destName} (run npm run home:images)`);
          continue;
        }
        const info = await inspect(fs.readFileSync(destPath));
        failures.push(...problemsFor(info, destName, format));
        continue;
      }

      const buffer = await buildVariant(sourcePath, format);
      const info = await inspect(buffer);
      const bad = problemsFor(info, destName, format);
      if (bad.length) {
        failures.push(...bad);
        continue;
      }
      fs.writeFileSync(destPath, buffer);
      const kb = Math.round(info.bytes / 1024);
      console.log(`${destName} ${info.width}x${info.height} ${kb} KB`);
    }
  }

  const extras = fs.readdirSync(HOME_DIR).filter((name) => {
    return /-800\.(jpe?g|webp)$/i.test(name) && !expected.has(name);
  });
  if (check) {
    for (const extra of extras) failures.push(`stale home variant ${extra}`);
  } else {
    for (const extra of extras) {
      fs.unlinkSync(path.join(HOME_DIR, extra));
      console.log(`removed stale home variant ${extra}`);
    }
  }

  if (failures.length) {
    for (const failure of failures) console.error(failure);
    process.exit(1);
  }

  if (check) {
    console.log(`${sources.length} homepage images have 800px JPEG and WebP variants`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
