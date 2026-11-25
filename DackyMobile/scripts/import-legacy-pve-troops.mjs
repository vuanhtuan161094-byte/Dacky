import { readFile, writeFile } from 'node:fs/promises';

const snapshot = '13d969fc88c141553535c70943aaa98cf9f86616';
const fields = {id:'SoldierID', name:'Name', attack:'Att', defense:'Def', life:'Life', speed:'Speed', population:'Population'};
const profiles = new Map();
for (const table of ['147-soldierinfo', 'soldierinfo']) {
  const file = new URL(`../input-private/normalized_legacy/${table}.json`, import.meta.url);
  const source = JSON.parse(await readFile(file, 'utf8'));
  if (source.sourceCommit !== snapshot || source.sourceTable !== table) throw new Error('Invalid troop snapshot');
  const schema = new Map(source.schema.map(col => [col.name, col.provenance]));
  const fieldProvenance = Object.fromEntries(Object.entries(fields).map(([key, field]) => {
    const value = schema.get(field);
    if (value?.sourceCommit !== snapshot || value?.sourceTable !== table) throw new Error(`Unknown column ${field}`);
    return [key, value];
  }));
  source.records.forEach((row, i) => {
    const id = Number(row.SoldierID);
    if (profiles.has(id)) return;
    const values = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, row[field]]));
    for (const key of ['id','attack','defense','life','speed','population']) {
      if (!Number.isSafeInteger(values[key]) || values[key] < 0) throw new Error(`Invalid value: ${table} row ${i + 1} ${key}`);
    }
    profiles.set(id, {...values, sourceRowIndex: i + 1, sourceTable: table, fieldProvenance});
  });
}
const data = 'export const LEGACY_PVE_TROOPS = ' + JSON.stringify([...profiles.values()]) + ';\n';
await writeFile(new URL('../src/legacy-pve-troops.js', import.meta.url), data);
