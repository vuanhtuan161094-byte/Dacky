import test from 'node:test';
import assert from 'node:assert/strict';
import {advance, createNewGame, doAction, migrateSave} from '../src/engine.js';
import {LEGACY_ELFLAND_LOCATIONS} from '../src/legacy-elfland-catalog.js';
import {LEGACY_STRONGPOINTS, LEGACY_ADVANCED_FIELDS} from '../src/legacy-endgame-catalog.js';
import {getEndgameBattles, getMountainBattles} from '../src/pve-campaign.js';

const start = 1_800_000_000_000;

test('all linked source floors, strongpoints and bosses resolve to valid army opponents', () => {
  const floors = LEGACY_ELFLAND_LOCATIONS.flatMap(place => getMountainBattles(place.ElflandID));
  assert.equal(floors.length, 8992);
  const endgame = getEndgameBattles();
  assert.equal(endgame.length, 52);
  assert.equal(endgame.filter(row => row.kind === 'Boss').length, 25);
  for (const row of [...floors, ...endgame]) assert.ok(row.enemy.formation.length > 0);
  for (const row of LEGACY_STRONGPOINTS) assert.equal(Object.hasOwn(row, 'OwnerGuildID'), false);
  for (const row of LEGACY_ADVANCED_FIELDS) assert.equal(Object.hasOwn(row, 'LastRefreshTime'), false);
});

test('normal march owns settlement after reload and conserves the sent army', () => {
  const fresh = createNewGame('Tân chủ', start);
  const [troopId, count] = Object.entries(fresh.army)[0];
  const queued = doAction(fresh, {type:'march', nodeId:'node-011', troopId, count}, start);
  const finish = Math.ceil(queued.queues.march.finishAt);
  const loaded = migrateSave(JSON.parse(JSON.stringify(queued)), start);
  const settled = advance(loaded, finish).state;
  const battle = settled.reports[0];
  assert.ok(battle.victory);
  assert.ok(battle.events.length > 0);
  assert.equal((settled.army[troopId] || 0) + (battle.wounded[troopId] || 0) + (battle.dead[troopId] || 0), count);
  assert.equal(settled.combatReceipts.length, 1);
  assert.equal(advance(settled, finish + 1000).state.stats.battles, 1);
});

test('daily reward is limited by day across repeated save imports', () => {
  let save = createNewGame('Tân chủ', start);
  save = doAction(save, {type:'dailyReward'}, start);
  const loaded = migrateSave(JSON.parse(JSON.stringify(save)), start);
  assert.throws(() => doAction(loaded, {type:'dailyReward'}, start), /đã hoàn thành/);
  assert.doesNotThrow(() => doAction(loaded, {type:'dailyReward'}, start + 86400000));
});
