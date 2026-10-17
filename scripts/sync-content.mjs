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
function safeAssetPath(assetPath) {
  if (typeof assetPath !== 'string' || !assetPath.startsWith('/') || assetPath.includes('..')) throw new Error('Unsafe content asset path: ' + assetPath);
  return assetPath.slice(1);
}

async function main() {
  const [manifestText, indexText, schemaText] = await Promise.all([
    readRemote('manifest.json'), readRemote('content-index.json'), readRemote('schema/lesson.schema.json')
  ]);
  const manifest = JSON.parse(manifestText), index = JSON.parse(indexText), schema = JSON.parse(schemaText);
  if (index.schemaVersion !== schema.properties.schemaVersion.const) throw new Error('Published index and canonical schema versions do not match.');
  const assets = await Promise.all(Object.entries(index.lessons || {}).map(async ([id, entry]) => {
    const relativePath = safeAssetPath(entry.path);
    return { id, relativePath, content: await readRemote(relativePath) };
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
