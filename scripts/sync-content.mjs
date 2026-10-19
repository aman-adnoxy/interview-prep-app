import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ref = process.env.CONTENT_REF || 'main';
const base = 'https://raw.githubusercontent.com/aman-adnoxy/interview-prep/' + encodeURIComponent(ref) + '/dist';

async function readRemote(relativePath) {
  // Avoid stale raw.githubusercontent.com CDN responses immediately after content publishes.
  const response = await fetch(base + '/' + relativePath + '?sync=' + Date.now(), { cache: 'no-store' });
  if (!response.ok) throw new Error('Canonical content fetch failed for ' + relativePath + ' (HTTP ' + response.status + ', ref ' + ref + ').');
  return response.text();
}

// Legacy aliases are repository-root relative (they predate the dist reorganization).
const rootBase = base.replace(/\/dist$/, '');
async function readLegacyAsset(rootRelativePath) {
  const response = await fetch(rootBase + '/' + rootRelativePath + '?sync=' + Date.now(), { cache: 'no-store' });
  if (!response.ok) throw new Error('Canonical content fetch failed for ' + rootRelativePath + ' (HTTP ' + response.status + ', ref ' + ref + ').');
  return response.text();
}

function safeAssetPath(assetPath) {
  if (typeof assetPath !== 'string' || !assetPath.startsWith('/') || assetPath.includes('..')) throw new Error('Unsafe content asset path: ' + assetPath);
  return assetPath.slice(1);
}

// The upstream content generator still publishes an index path that predates
// the unified-tracks reorganization for this lesson id; the canonical asset
// lives at the pre-unification source path. The generated index path is tried
// first, so a listed alias becomes inert as soon as upstream regenerates its
// index. Validation is unchanged: assets still come from canonical
// interview-prep and every published section still resolves to an asset.
const LEGACY_ASSET_PATHS = {
  'http-rest-apis-contracts': ['lessons/ai-engineering-python-data-backend/http-rest-apis-contracts.json'],
};

async function readPublishedLesson(id, entry) {
  // The canonical write path is always the published index path; legacy
  // aliases are only fetch fallbacks for stale upstream generations.
  const relativePath = safeAssetPath(entry.path);
  const fetchOrder = [[readRemote, relativePath]];
  for (const alias of LEGACY_ASSET_PATHS[id] || []) {
    fetchOrder.push([readLegacyAsset, alias]);
  }
  let lastError = null;
  for (const [read, candidate] of fetchOrder) {
    try {
      return { id, relativePath, content: await read(candidate) };
    } catch (error) {
      // Only fall through on missing assets; any other failure is fatal.
      if (!/^Canonical content fetch failed for .*HTTP 404/.test(error.message)) throw error;
      lastError = error;
    }
  }
  throw lastError || new Error('Canonical asset not found for lesson ' + id + '.');
}

async function main() {
  const [manifestText, indexText, schemaText] = await Promise.all([
    readRemote('manifest.json'), readRemote('content-index.json'), readRemote('schema/lesson.schema.json')
  ]);
  const manifest = JSON.parse(manifestText), index = JSON.parse(indexText), schema = JSON.parse(schemaText);
  if (index.schemaVersion !== schema.properties.schemaVersion.const) throw new Error('Published index and canonical schema versions do not match.');
  const assets = await Promise.all(Object.entries(index.lessons || {}).map(async ([id, entry]) => {
    return readPublishedLesson(id, entry);
  }));
  const publicDir = path.join(root, 'public');
  await fs.writeFile(path.join(publicDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  await fs.writeFile(path.join(publicDir, 'content-index.json'), JSON.stringify(index, null, 2) + '\n');
  await fs.writeFile(path.join(root, 'schema/lesson.schema.json'), JSON.stringify(schema, null, 2) + '\n');
  const lessonsDir = path.join(publicDir, 'lessons');
  await fs.rm(lessonsDir, { recursive: true, force: true });
  for (const asset of assets) {
    const target = path.join(publicDir, asset.relativePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, JSON.stringify(JSON.parse(asset.content), null, 2) + '\n');
  }
  console.log('Synced ' + assets.length + ' published lesson(s) from interview-prep@' + ref + '.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
