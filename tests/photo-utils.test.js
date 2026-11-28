const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadBrowserScript } = require('./helpers');

const win = loadBrowserScript('assets/js/util.js');
loadBrowserScript('assets/js/photo-utils.js', win);
const { escapeHtml, debounce, photos } = win.TreePage;

describe('escapeHtml', () => {
  test('neutralizes every HTML-significant character', () => {
    assert.equal(escapeHtml(`<img src=x onerror="alert('1')">&`),
      '&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;&amp;');
  });

  test('coerces non-strings', () => {
    assert.equal(escapeHtml(42), '42');
    assert.equal(escapeHtml(null), 'null');
  });
});

describe('debounce', () => {
  test('collapses a burst into the final call', async () => {
    const calls = [];
    const fn = debounce((v) => calls.push(v), 10);
    fn(1); fn(2); fn(3);
    await new Promise((r) => setTimeout(r, 30));
    assert.deepEqual(calls, [3]);
  });
});

describe('parsePhotoFilename', () => {
  const parse = photos.parsePhotoFilename;

  test('date_location_parts_title', () => {
    const r = parse('2023-08-18_Cape_Town_Table.jpg');
    assert.equal(r.date.toISOString().slice(0, 10), '2023-08-18');
    assert.equal(r.location, 'Cape, Town');
    assert.equal(r.title, 'Table');
  });

  test('date and a single word: title only, no location', () => {
    const r = parse('2024-01-01_Sunset.jpg');
    assert.equal(r.title, 'Sunset');
    assert.equal(r.location, undefined);
  });

  test('no date: undefined date, parts still parsed', () => {
    const r = parse('Paris_Eiffel.png');
    assert.equal(r.date, undefined);
    assert.equal(r.location, 'Paris');
    assert.equal(r.title, 'Eiffel');
  });

  test('single token: nothing parsed', () => {
    assert.deepEqual(parse('photo.jpg'), {});
  });

  test('hyphen after the date still attaches to the first part', () => {
    // The Columbia file on disk was renamed to use an underscore. This case
    // only documents the parser, which still treats a hyphen as part of the date token.
    const r = parse('2020-01-01-Old_Town_Square.jpg');
    assert.equal(r.location, 'Town');
    assert.equal(r.title, 'Square');
  });

  test('renamed Columbia file parses the place and the title', () => {
    const r = parse('2024-10-15_New_York_Columbia.jpg');
    assert.equal(r.date.toISOString().slice(0, 10), '2024-10-15');
    assert.equal(r.location, 'New, York');
    assert.equal(r.title, 'Columbia');
  });

  test('renamed Neuschwanstein file parses the place and the title', () => {
    const r = parse('2022-08-01_Neuschwanstein_Castle.jpg');
    assert.equal(r.date.toISOString().slice(0, 10), '2022-08-01');
    assert.equal(r.location, 'Neuschwanstein');
    assert.equal(r.title, 'Castle');
  });

  test('output is data, not markup: a hostile filename parses to inert strings', () => {
    const r = parse('2024-01-01_<b>Bold</b>_<script>x</script>.jpg');
    assert.equal(r.location, '<b>Bold</b>');
    assert.equal(escapeHtml(r.title), '&lt;script&gt;x&lt;/script&gt;');
  });
});

describe('thumbnailUrl', () => {
  test('returns empty string when downloadUrl is missing', () => {
    assert.equal(photos.thumbnailUrl('', '2024-10-15_New_York_Columbia.jpg'), '');
    assert.equal(photos.thumbnailUrl(null, 'shot.png'), '');
  });

  test('points at the sibling thumbs folder and a jpeg name', () => {
    const original = 'https://raw.githubusercontent.com/LordOfTheTrees/TreePage/main/assets/images/photography/2024-10-15_New_York_Columbia.jpg';
    const thumb = photos.thumbnailUrl(original, '2024-10-15_New_York_Columbia.jpg');
    assert.equal(
      thumb,
      'https://raw.githubusercontent.com/LordOfTheTrees/TreePage/main/assets/images/photography-thumbs/2024-10-15_New_York_Columbia.jpg'
    );
  });

  test('a non-jpeg original still gets a jpeg thumbnail url', () => {
    const original = 'https://example.com/assets/images/photography/shot.png';
    assert.equal(
      photos.thumbnailUrl(original, 'shot.png'),
      'https://example.com/assets/images/photography-thumbs/shot.jpg'
    );
  });
});

describe('fetchPhotosFromGitHub', () => {
  /** @type {typeof fetch | undefined} */
  let originalFetch;

  test.before(() => {
    originalFetch = globalThis.fetch;
  });

  test.after(() => {
    globalThis.fetch = originalFetch;
  });

  test('throws on API failure so callers can show an error instead of demo photos', async () => {
    globalThis.fetch = async () => ({ ok: false, status: 403 });
    await assert.rejects(
      () => photos.fetchPhotosFromGitHub(),
      /GitHub API error: 403/
    );
  });

  test('requests the lordofthetrees.github.io contents API and returns sorted, filtered photos', async () => {
    let requestedUrl = '';
    globalThis.fetch = async (url) => {
      requestedUrl = String(url);
      return {
        ok: true,
        json: async () => [
          {
            type: 'dir',
            name: 'ignored-dir',
          },
          {
            type: 'file',
            name: 'notes.txt',
            download_url: 'https://cdn.example/assets/images/photography/notes.txt',
            sha: '00000000',
            size: 1,
            html_url: 'https://github.com/x',
          },
          {
            type: 'file',
            name: '2024-01-01_Winter.jpg',
            download_url: 'https://cdn.example/assets/images/photography/2024-01-01_Winter.jpg',
            sha: 'aaaaaaaa',
            size: 2,
            html_url: 'https://github.com/x',
          },
          {
            type: 'file',
            name: '2024-06-01_Summer.jpg',
            download_url: 'https://cdn.example/assets/images/photography/2024-06-01_Summer.jpg',
            sha: 'bbbbbbbb',
            size: 3,
            html_url: 'https://github.com/x',
          },
        ],
      };
    };

    const result = await photos.fetchPhotosFromGitHub();

    assert.match(
      requestedUrl,
      /^https:\/\/api\.github\.com\/repos\/LordOfTheTrees\/lordofthetrees\.github\.io\/contents\/assets\/images\/photography$/
    );
    assert.equal(result.length, 2);
    assert.equal(result[0].filename, '2024-06-01_Summer.jpg');
    assert.equal(result[1].filename, '2024-01-01_Winter.jpg');
    assert.equal(
      result[0].thumbUrl,
      'https://cdn.example/assets/images/photography-thumbs/2024-06-01_Summer.jpg'
    );
    assert.equal(result[0].title, 'Summer');
    assert.equal(result[0].location, 'Unknown');
    assert.equal(result[1].id, 'aaaaaaaa');
  });
});

