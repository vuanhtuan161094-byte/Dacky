import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGame, doAction, migrateSave } from '../src/engine.js';
const now=1800000000000;
test('voucher redemption cannot mint jade from zero or fractional balance',()=>{
  for(const amount of [0,1,999]){
    const s=createNewGame('Triều Ca',now);s.gameplay.questVouchers=amount;
    assert.throws(()=>doAction(s,{type:'redeemQuestVouchers',count:1},now),/1.000 thẻ/);
    assert.equal(s.gameplay.questVouchers,amount);
  }
  const s=createNewGame('Triều Ca',now);s.gameplay.questVouchers=2500;
  const result=doAction(s,{type:'redeemQuestVouchers',count:99},now);
  assert.equal(result.gameplay.questVouchers,500);
  assert.equal(result.resources.jade,s.resources.jade+2);
});
test('labor tax is daily and survives save migration',()=>{
  const s=createNewGame('Triều Ca',now);
  const a=doAction(s,{type:'collectLaborTaxes'},now);
  assert.ok(a.resources.gold>s.resources.gold);
  const b=migrateSave(a,now);
  assert.throws(()=>doAction(b,{type:'collectLaborTaxes'},now),/Đã trưng thu/);
  assert.equal(b.gameplay.worldDays.laborTax,Math.floor(now/86400000));
  assert.doesNotThrow(()=>doAction(b,{type:'collectLaborTaxes'},now+86400000));
});
