'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Model=require('../src/finance/model-engine.js');

function baseModel(){
  const m=Model.defaults('EUR');
  m.years=2;m.startYear=2027;
  m.bs0={revenue:100,cash:10,ar:0,inventory:0,oca:0,ppne:0,otherAssets:0,ap:0,debt:0,ocl:0,otherLiab:0,equity:10};
  m.growth=[.10,.10];m.margin=[.20,.20];m.tax=[0,0];m.capexPct=[0,0];m.daPct=[0,0];
  m.dso=[0,0];m.dio=[0,0];m.dpo=[0,0];m.ocaPct=[0,0];m.oclPct=[0,0];
  m.cogsPct=[.65,.65];m.sgaPct=[.12,.12];m.rndPct=[.03,.03];
  return m;
}

test('FM-REG-001 forecast revenue compounds the per-year growth assumptions',()=>{
  const r=Model.build(baseModel(),{});
  assert.ok(Math.abs(r.income[0].revenue-110)<1e-9);
  assert.ok(Math.abs(r.income[1].revenue-121)<1e-9);
});

test('FM-REG-002 explicit zero growth is preserved',()=>{
  const m=baseModel();m.growth=[0,0];const r=Model.build(m,{});
  assert.deepEqual(r.income.map(x=>x.revenue),[100,100]);
});

test('FM-REG-003 default detailed costs reconcile to the 20% EBITDA margin target',()=>{
  const m=Model.defaults();m.years=1;Model.fillDefaults(m,{});
  assert.equal(m.cogsPct[0],.65);assert.equal(m.sgaPct[0],.12);assert.equal(m.rndPct[0],.03);assert.equal(m.margin[0],.20);
});

test('FM-REG-004 reported EBITDA margin is calculated from the detailed income statement',()=>{
  const m=baseModel();m.cogsPct=[.60,.60];const r=Model.build(m,{});
  assert.ok(Math.abs(r.income[0].mar-.25)<1e-12);
  assert.ok(Math.abs(r.income[0].marginVariance-.05)<1e-12);
  assert.ok(r.warnings.some(w=>w.code==='FM-MARGIN-001'));
});

test('FM-REG-005 zero-percent debt rate remains zero',()=>{
  const m=baseModel();m.bs0={...m.bs0,cash:110,debt:100};m.debt={rows:[{name:'Interest free',opening:100,rate:0,repayment:0}]};
  const r=Model.build(m,{});assert.equal(r.income[0].interest,0);assert.equal(r.debtSchedule[0].rate,0);
});

test('FM-REG-006 multiple debt instruments are aggregated in the same forecast year',()=>{
  const m=baseModel();m.bs0={...m.bs0,cash:110,debt:100};m.debt={rows:[{name:'A',opening:60,rate:0,repayment:20},{name:'B',opening:40,rate:.10,repayment:10}]};
  const r=Model.build(m,{});
  assert.equal(r.debtSchedule[0].opening,100);assert.equal(r.debtSchedule[0].interest,4);assert.equal(r.debtSchedule[0].repayment,30);assert.equal(r.debtSchedule[0].ending,70);
  assert.equal(r.debtSchedule[1].opening,70);assert.equal(r.debtSchedule[1].interest,3);assert.equal(r.debtSchedule[1].ending,40);
});

test('FM-REG-007 debt principal repayment reduces both ending debt and cash',()=>{
  const noDebt=baseModel();noDebt.growth=[0,0];noDebt.bs0={...noDebt.bs0,cash:110,debt:100,equity:10};
  const withRepay=structuredClone(noDebt);withRepay.debt={rows:[{opening:100,rate:0,repayment:25}]};
  const r=Model.build(withRepay,{});
  assert.equal(r.balance[0].debt,75);assert.equal(r.cash[0].debtDelta,-25);
  assert.equal(r.cash[0].netChange,r.cash[0].freeCashFlow-25);
});

test('FM-REG-008 working-capital inventory and payable calculations use configured COGS',()=>{
  const m=baseModel();m.growth=[0,0];m.cogsPct=[.50,.50];m.dio=[36.5,36.5];m.dpo=[36.5,36.5];
  const r=Model.build(m,{});
  assert.ok(Math.abs(r.wc[0].inv-5)<1e-12);assert.ok(Math.abs(r.wc[0].ap-5)<1e-12);
});

test('FM-REG-009 explicit zero tax rate is preserved',()=>{
  const m=baseModel();m.tax=[0,0];const r=Model.build(m,{});assert.equal(r.income[0].taxes,0);
});

test('FM-REG-010 current-ratio covenant does not invent a denominator when current liabilities are zero',()=>{
  const m=baseModel();m.covenants={currentRatio:1};const r=Model.build(m,{});
  assert.equal(r.covenants.some(c=>c.name==='Current ratio'),false);
});

test('FM-REG-011 current-ratio covenant uses actual current liabilities',()=>{
  const m=baseModel();m.growth=[0,0];m.bs0={...m.bs0,cash:20,ap:10,equity:10};m.dpo=[36.5,36.5];m.cogsPct=[1,1];m.covenants={currentRatio:1};
  const r=Model.build(m,{});const c=r.covenants.find(x=>x.name==='Current ratio');assert.ok(c);assert.ok(Number.isFinite(c.value));
});

test('FM-REG-012 model does not hide an opening balance-sheet difference with a cash plug',()=>{
  const m=baseModel();m.bs0={...m.bs0,cash:0,equity:100};const r=Model.build(m,{});
  assert.equal(r.check.ok,false);assert.ok(Math.abs(r.check.diff-r.check.openingDiff)<.01);assert.equal(r.check.carriesOpeningDifference,true);
});

test('FM-REG-013 a balanced opening balance sheet remains balanced through the forecast',()=>{
  const r=Model.build(baseModel(),{});assert.equal(r.check.ok,true);assert.equal(r.check.cashFlowTies,true);
});

test('FM-REG-014 debt cannot amortize below zero',()=>{
  const m=baseModel();m.bs0={...m.bs0,cash:20,debt:10,equity:10};m.debt={rows:[{opening:10,rate:.05,repayment:100}]};
  const r=Model.build(m,{});assert.equal(r.debtSchedule[0].repayment,10);assert.equal(r.debtSchedule[0].ending,0);assert.equal(r.debtSchedule[1].ending,0);
});

test('FM-REG-015 fillDefaults mutates existing model for legacy UI compatibility while preserving valid zeros',()=>{
  const m={years:1,startYear:2027,growth:[0],tax:[0],debt:{rows:[]},bs0:{},covenants:{}};const same=Model.fillDefaults(m,{growth:.2,tax:.3});
  assert.equal(same,m);assert.equal(m.growth[0],0);assert.equal(m.tax[0],0);
});
