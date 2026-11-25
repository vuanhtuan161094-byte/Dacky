import {advance, createNewGame, doAction, migrateSave, productionPerHour, marchTroopCapacity, quoteBuilding, quoteResearch, quoteTraining, unlockedChapter} from '../src/engine.js';
import {BUILDINGS, HEROES, TECHNOLOGIES, WORLD_NODES} from '../src/catalog.js';
import {gameplayQuestList, questQuote} from '../src/gameplay-p15.js';
import {getEndgameBattles, getMountainBattles, pveLock} from '../src/pve-campaign.js';
import {LEGACY_ELFLAND_LOCATIONS} from '../src/legacy-elfland-catalog.js';

const start = 1_800_000_000_000;
const hour = 3600000;
const fresh = createNewGame('Tân chủ', start);
let state = fresh, now = start;
const [troopId] = Object.keys(state.army);
const failures = {};
const attempted = {};
const history = [];
const quests = gameplayQuestList();
const affordable = cost => Object.entries(cost).every(([key, amount]) => state.resources[key] >= amount);
function act(type, data = {}) {
  try { state = doAction(state, {type, ...data}, now); return true; }
  catch (error) { const key = type + ': ' + error.message; failures[key] = (failures[key] || 0) + 1; return false; }
}
const fronts = LEGACY_ELFLAND_LOCATIONS.flatMap(place => getMountainBattles(place.ElflandID).slice(0, 1)).sort((a,b)=>a.power-b.power);
const cityOrder = ['lumber', 'quarry', 'mine', 'altar', 'storehouse', 'farm', 'citadel', 'granary', 'barracks', 'training', 'academy', 'manor', 'housing', 'workshop'];
for (let day = 1; day <= 90; day++) {
  for (let part = 0; part < 3; part++) {
    now += 8 * hour;
    state = advance(state, now).state;
    if (part === 0) {
      act('dailyReward');
      if (state.world.storyStage >= 3) act('fieldEvent');
      if (state.levels.altar && state.heroes.length < 3) {
        const candidate = HEROES.slice(1,3).find(h => !state.heroes.some(x => x.id === h.id));
        if (candidate) act('recruit', {heroId:candidate.id});
      }
      const hero = state.heroes.find(row => row.assigned);
      if (hero && !hero.equipment.weapon && state.items.includes('item-01')) act('equip', {heroId:hero.id, itemId:'item-01'});
      if (hero && day % 5 === 0) act('trainHero', {heroId:hero.id});
      for (const q of quests.slice(0,100)) {
        if (!state.gameplay.questClaims.includes(q.id) && questQuote(state,q.id,productionPerHour)?.ready) {
          if (act('claimSourceQuest', {questId:q.id})) break;
        }
      }
    }
    if (!state.queues.construction) {
      const priority = cityOrder.filter(id => BUILDINGS.some(row => row.id === id)).sort((a,b) => state.levels[a]-state.levels[b]);
      const id = priority.slice(0,day < 3 ? 6 : priority.length).find(id => {
        const q = quoteBuilding(state,id);
        return !q.maxed && !q.locked && affordable(q.cost);
      });
      if (id) act('upgrade', {buildingId:id});
    }
    if (!state.queues.research) {
      const ids = TECHNOLOGIES.map(row => row.id);
      const id = ids.sort((a,b)=>state.technologies[a]-state.technologies[b]).find(id => {
        const q = quoteResearch(state,id);
        return !q.maxed && q.requirementSatisfied && affordable(q.cost);
      });
      if (id) act('research', {techId:id});
    }
    const wounded = state.wounded[troopId] || 0;
    if (wounded && affordable({food:wounded*8,gold:wounded*2})) act('heal',{count:wounded});
    if (!state.queues.march && (state.army[troopId] || 0) >= 17) {
      const chapter = unlockedChapter(state);
      const count = Math.min(marchTroopCapacity(state), state.army[troopId]);
      const enough = node => node && count >= Math.ceil(node.enemy.formation.reduce((sum, row)=>sum+row.count,0)*1.65);
      const available = WORLD_NODES.filter(n => n.chapter <= chapter && !n.isBoss && !state.world.captures.includes(n.id));
      const nextField = available.find(n=>n.chapter === chapter && n.kind === 'Dã địa');
      const city = available.find(n=>n.kind === 'Danh thành' && (attempted[n.id] ?? 0) < 3);
      const frontier = fronts.find(n=>!pveLock(state,n,chapter) && (attempted[n.id] ?? 0) < 2);
      const special = getEndgameBattles().find(n=>!pveLock(state,n,chapter) && (attempted[n.id] ?? 0) < 2);
      const finale = chapter === 8 && state.stats.victories >= 20 && state.stats.citiesCaptured >= 7 &&
        !state.world.campaignComplete ? WORLD_NODES.find(n=>n.isBoss) : null;
      const target = !state.stats.victories ? available.find(n=>n.id==='node-011') :
        part === 0 && chapter < 8 && nextField && count >= 12 + nextField.enemy.formation.reduce((sum,row)=>sum+row.count,0)*4 ? nextField :
        part === 1 && finale && enough(finale) && (attempted[finale.id] ?? 0) < 3 ? finale :
        part === 1 && day % 2 === 0 && count >= (day > 35 ? 340 : 45) ? city :
        part === 0 && day % 3 === 0 && enough(frontier) ? frontier :
        part === 2 && day % 5 === 0 && enough(special) ? special : null;
      if (target && act('march',{nodeId:target.id,troopId,count})) attempted[target.id]=(attempted[target.id]||0)+1;
    }
    if (!state.queues.march && part === 2) act('duel',{mode:day%3===0?'buzhou':'tower'});
    if (!state.queues.training && (state.army[troopId] || 0) < (day > 35 ? 3800 : 360)) {
      const n = (day > 35 ? [180,100,50,25,15,8,4,1] : [25,15,8,4,1]).find(n=>{
        const q=quoteTraining(state,troopId,n);return !q.locked && affordable(q.cost);
      });
      if (n) act('train',{troopId,count:n});
    }
  }
  if ([1,7,30,90].includes(day)) {
    state = migrateSave(JSON.parse(JSON.stringify(state)), now);
    history.push({day, chapter:unlockedChapter(state), upgrades:state.stats.upgrades,
      research:Object.values(state.technologies).reduce((a,b)=>a+b,0), trained:state.stats.troopsTrained,
      readyArmy:Object.values(state.army).reduce((a,b)=>a+b,0), heroes:state.heroes.map(x=>[x.id,x.level,x.xp]),
      equipped:state.stats.itemsEquipped, battles:state.stats.battles, wins:state.stats.victories,
      cities:state.stats.citiesCaptured, tower:state.world.towerFloor, buzhou:state.world.buzhouFloor,
      campaignComplete:state.world.campaignComplete, pveWins:Object.keys(state.world.pveWins).length, sourceQuests:state.gameplay.questClaims.length,
      settledReceipts:state.combatReceipts.length});
  }
}
console.log(JSON.stringify({history,attempted,failures},null,2));
