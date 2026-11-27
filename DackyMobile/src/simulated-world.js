// Local rules for three unrecovered tables. These values have no source-table parity.
export const WORLD_RULE_EVIDENCE = Object.freeze({
  recruitment: {status:'SIMULATED', sourceHold:'generalrefreshlevellimitinfo'},
  experience: {status:'SIMULATED', sourceHold:'upgradeexp'},
  field: {status:'SIMULATED', sourceHold:'fieldrandeventcfginfo'}
});

export const experienceForLevel = level => 100 + 34 * level * level;
const dayAt = now => Math.floor(now / 86400000);

export function worldOffer(state, now, kind) {
  const day = dayAt(now);
  const previous = state.gameplay?.worldDays?.[kind];
  const seed = ((day ^ Math.floor(state.profile.createdAt / 1000)) >>> 0);
  const chapter = Math.max(1, Math.min(8, 1 + Math.floor(state.world.storyStage / 3)));
  const common = {day, available: previous == null || previous < day};
  if (kind === 'daily') return {...common, name:'Lương bổng ngày', cost:{}, reward:{food:180, gold:120 + chapter * 20}};
  if (kind === 'field') {
    const trips=state.gameplay?.fieldTrips,used=trips?.day===day?trips.used:(previous===day?1:0),bonus=Math.max(0,Math.floor(Number(state.gameplay?.fieldTripBonus)||0));
    return {...common,available:used<1+bonus,used,quota:1+bonus,bonusTickets:bonus,name:['Đội tuần lương','Thương đoàn lạc đường','Tuần tra biên giới'][seed%3],cost:{food:75+chapter*15},reward:[{timber:180+chapter*30},{gold:120+chapter*30},{stone:120+chapter*30,iron:80}][seed%3]};
  }
  const band = seed % 3;
  return {...common, name:['Đội tuần lương','Thương đoàn lạc đường','Tuần tra biên giới'][band],
    cost:{food:75 + chapter * 15},
    reward:[{timber:180 + chapter * 30}, {gold:120 + chapter * 30}, {stone:120 + chapter * 30, iron:80}][band]};
}

export function recruitmentPromotion(state, now) {
  const day = dayAt(now);
  const refresh = state.gameplay?.recruitmentRefresh === day ? 1 : 0;
  return (Math.imul(day, 31) + state.levels.hostel + refresh * 17) >>> 0;
}
