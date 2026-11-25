#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const privateDir = path.join(root, 'input-private/mobile_reference');
const assetsRoot = path.join(root, 'assets/mobile-source');
const manifest = JSON.parse(await readFile(path.join(privateDir, 'manifest.json'), 'utf8'));
const urls = new Map();
for (const category of manifest.categories) {
  const data = JSON.parse(await readFile(path.join(privateDir, `${category.id}.json`), 'utf8'));
  const add = (value) => {
    if (!value) return;
    const url = new URL(value, manifest.dataBaseUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'dackytruvuong.com') {
      throw new Error(`Refusing untrusted source asset URL: ${url.href}`);
    }
    urls.set(url.href, (urls.get(url.href) || 0) + 1);
  };
  for (const row of data.muc || []) {
    add(row.a);
    for (const block of row.d || []) {
      add(block.a);
      for (const detail of block.ds || []) if (!Array.isArray(detail)) add(detail.a);
    }
  }
}

const queue = [...urls.keys()];
const results = [];
let cursor = 0;
const concurrency = Number(process.env.DACKY_ASSET_CONCURRENCY) || 12;
async function download(url) {
  const parsed = new URL(url);
  const target = path.join(assetsRoot, parsed.pathname.replace(/^\/+/, ''));
  await mkdir(path.dirname(target), { recursive: true });
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length) throw new Error('empty body');
      await writeFile(target, bytes);
      return {
        url, path: `assets/mobile-source${parsed.pathname}`, bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'), references: urls.get(url)
      };
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  throw new Error(`${url}: ${lastError?.message || 'download failed'}`);
}
async function worker() {
  while (cursor < queue.length) {
    const index = cursor++;
    const result = await download(queue[index]);
    results[index] = result;
    if ((index + 1) % 250 === 0 || index + 1 === queue.length) {
      console.log(`Downloaded ${index + 1}/${queue.length} source assets`);
    }
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
const assetManifest = {
  schemaVersion: 1,
  source: 'Dacky Mobile public catalog asset references',
  catalogVersion: manifest.catalogVersion,
  capturedDate: manifest.capturedDate,
  permission: 'Owner authorization recorded in Codex conversation dated 2026-11-25; no SPDX identifier claimed.',
  count: results.length,
  totalBytes: results.reduce((sum, row) => sum + row.bytes, 0),
  assets: results
};
await writeFile(path.join(root, 'assets/mobile-source-manifest.json'), `${JSON.stringify(assetManifest, null, 2)}\n`);
console.log(`Saved ${results.length} assets (${assetManifest.totalBytes.toLocaleString()} bytes).`);
