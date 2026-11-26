import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const origin = 'https://dackytruvuong.com/';
const visualRoot = path.join(root, 'assets/visual');
const readUrl = (url, binary = false) => execFileSync('curl', ['-fsSL', '--connect-timeout', '15', '--retry', '2', url], { maxBuffer: 12 * 1024 * 1024, encoding: binary ? 'buffer' : 'utf8' });
const assignJson = (source, name) => {
  const match = source.match(new RegExp(`window\\.${name}\\s*=\\s*(\\{[\\s\\S]*?\\});`));
  if (!match) throw new Error(`Cannot find ${name} in current client catalog.`);
  return JSON.parse(match[1]);
};
const troopCatalog = assignJson(readUrl(new URL('mods/battle-ng-catalog.js', origin)), 'FSBattleNG');
const effectCatalog = assignJson(readUrl(new URL('mods/battle-fx-catalog.js', origin)), 'FSBattleFX');
const effectScripts = assignJson(readUrl(new URL('mods/battle-fx-script.js', origin)), 'FSBattleFXKichBan');
const refs = new Map();
const add = (file, metadata = {}, type = 'source-client') => refs.set(file, { file, metadata, type });

for (const [family, sprite] of Object.entries(troopCatalog.quan)) {
  for (const [state, frame] of Object.entries(sprite.trangThai)) {
    if (!['stand', 'run', 'attack', 'injured1', 'dead1'].includes(state)) continue;
    add(frame.file, { family, state, width: frame.w, height: frame.h, frames: frame.khung, fps: frame.fps, durationMs: frame.ms, anchor: frame.neo }, 'current-mobile-battle-sprite');
  }
}
for (const [family, sprite] of Object.entries(troopCatalog.tuong)) {
  for (const [state, frame] of Object.entries(sprite.trangThai)) {
    if (!['stand', 'run', 'attack', 'dead1', 'cheer'].includes(state)) continue;
    add(frame.file, { family, state, width: frame.w, height: frame.h, frames: frame.khung, fps: frame.fps, durationMs: frame.ms, anchor: frame.neo }, 'current-mobile-commander-sprite');
  }
}
const effectSourceMap = {
  normal: ['eff010_11', 'fire'], critical: ['eff160', 'fire'], skill: ['eff707a', 'hurt'],
  magic: ['eff717r', 'bang'], artifact: ['eff717r', 'bang']
};
for (const [kind, [effect, phase]] of Object.entries(effectSourceMap)) {
  const res = effectScripts[effect]?.[phase]?.res;
  const frame = effectCatalog[res];
  if (frame?.file) add(frame.file, { kind, effect, phase, width: frame.w, height: frame.h, frames: frame.khung, durationMs: frame.ms }, 'current-mobile-battle-vfx');
}
for (const file of [
  'flash/worldmap/allmap-bg.webp',
  'assets/battle/nen-troi.jpg', 'assets/battle/nen-thung-lung.jpg',
  'assets/blr-ui/khung.png', 'assets/blr-ui/nut-dong.png', 'assets/blr-ui/nut-vang.png', 'assets/blr-ui/nut-xanh.png', 'assets/blr-ui/nut-xam.png',
  'assets/blr-ui/tab-toi.png', 'assets/blr-ui/tab-sang.png', 'assets/blr-ui/gach.png', 'assets/blr-ui/nhan-xanh.png', 'assets/blr-ui/than-tuong/nen-muc.webp',
  'assets/blr-ui/than-tuong/hao-quang.png', 'assets/blr-ui/than-tuong/thanh-nen.png', 'assets/blr-ui/than-tuong/thanh-tu-vi.png', 'assets/blr-ui/than-tuong/vong-phep.png',
  'assets/am-thanh/tieng/bam.mp3', 'assets/am-thanh/tieng/hanh-quan.mp3', 'assets/am-thanh/nhac/tran.mp3'
]) add(file, {}, file.includes('/am-thanh/') ? 'current-client-audio' : 'current-mobile-scene-art');

const imported = [];
const troopFrameIndex = Object.fromEntries(Object.entries(troopCatalog.quan).map(([family, sprite]) => [family, Object.fromEntries(
  Object.entries(sprite.trangThai).filter(([state]) => ['stand', 'run', 'attack', 'injured1', 'dead1'].includes(state)).map(([state, frame]) => [state, {
    path: `./assets/visual/${frame.file}`, width: frame.w, height: frame.h, frames: frame.khung, durationMs: frame.ms
  }])
)]));
const commanderFrameIndex = Object.fromEntries(Object.entries(troopCatalog.tuong).map(([family, sprite]) => [family, Object.fromEntries(
  Object.entries(sprite.trangThai).filter(([state]) => ['stand', 'run', 'attack', 'dead1', 'cheer'].includes(state)).map(([state, frame]) => [state, {
    path: `./assets/visual/${frame.file}`, width: frame.w, height: frame.h, frames: frame.khung, durationMs: frame.ms
  }])
)]));
const battleWeaponFamilies = troopCatalog.binhKhi;
const battleEffects = Object.fromEntries(Object.entries(effectSourceMap).map(([kind, [effect, phase]]) => {
  const res = effectScripts[effect]?.[phase]?.res, frame = effectCatalog[res];
  return [kind, { path: `./assets/visual/${frame.file}`, width: frame.w, height: frame.h, frames: frame.khung, durationMs: frame.ms }];
}));
for (const ref of refs.values()) {
  const relative = `assets/visual/${ref.file}`;
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  const data = readUrl(new URL(ref.file, origin), true);
  await writeFile(target, data);
  const digest = createHash('sha256').update(data).digest('hex');
  imported.push({
    path: relative,
    url: new URL(ref.file, origin).href,
    bytes: data.length,
    sha256: digest,
    kind: ref.type,
    ...ref.metadata
  });
}
await writeFile(path.join(root, 'assets/visual-art-manifest.json'), `${JSON.stringify({ schemaVersion: 1, reference: origin, catalog: 'Public current Dacky Trụ Vương HTML5 client, not War of Legends legacy galleries', ownerPermission: 'OWNER_ATTESTED per project authorization dated 2026-11-26', sourceScreenshots: 'Gameplay screenshot A not captured: no authorized live game session was available in this managed workspace.', assets: imported }, null, 2)}\n`);
const runtimeCatalog = `// Generated from the public current Dacky Trụ Vương battle sprite catalog. See assets/visual-art-manifest.json for per-file source and hashes.\nexport const BATTLE_TROOP_FRAMES = ${JSON.stringify(troopFrameIndex)};\nexport const BATTLE_COMMANDER_FRAMES = ${JSON.stringify(commanderFrameIndex)};\nexport const BATTLE_WEAPON_FAMILIES = ${JSON.stringify(battleWeaponFamilies)};\nexport const BATTLE_EFFECT_FRAMES = ${JSON.stringify(battleEffects)};\n\nconst familyIndex = troop => {\n  const raw = troop?.mobileSourceId ?? troop?.sourceId ?? troop?.id ?? '';\n  const numeric = Number(String(raw).match(/\\d{4,}/)?.[0]);\n  const role = String(troop?.role || '').toLowerCase();\n  const category = Number.isFinite(numeric) && [0, 1, 2, 3].includes(numeric % 10) ? String(numeric % 10) : role.includes('xạ') ? '2' : role.includes('kỵ') ? '3' : '0';\n  const candidates = BATTLE_WEAPON_FAMILIES[category] || BATTLE_WEAPON_FAMILIES['0'];\n  const tier = Number.isFinite(numeric) ? Math.floor((numeric - 1000) / 10) : 0;\n  return candidates[Math.abs(tier) % candidates.length];\n};\n\nexport function battleTroopFrame(troop, state = 'stand') {\n  const family = familyIndex(troop);\n  const frames = BATTLE_TROOP_FRAMES[family] || BATTLE_TROOP_FRAMES.army00;\n  return { family, ...(frames[state] || frames.stand) };\n}\n\nexport function battleCommanderFrame(id, state = 'stand') {\n  const numeric = Number(String(id || '').match(/\\d+/)?.[0]) || 1;\n  const family = 'hero_' + String(((numeric - 1) % 6) + 1).padStart(2, '0');\n  const frames = BATTLE_COMMANDER_FRAMES[family] || BATTLE_COMMANDER_FRAMES.hero_01;\n  return { family, ...(frames[state] || frames.stand) };\n}\n`;
await writeFile(path.join(root, 'src/visual-art-catalog.js'), runtimeCatalog);
console.log(`Imported ${imported.length} current-client scene, battle, UI and audio assets (${imported.reduce((sum, asset) => sum + asset.bytes, 0).toLocaleString()} bytes).`);
