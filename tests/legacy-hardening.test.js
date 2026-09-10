'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../src/finance/engine.js');
const Legacy=require('../src/finance/legacy-hardening.js');

const validStress={revenue:100,growth:.10,ebitdaMargin:.20,tax:.21,capexPct:.06,wcPct:.02,dandaPct:.05,wacc:.09,terminalGrowth:.025,netDebt:0,shares:10,horizon:5};
const noShock=[{name:'No shock',rev:0,margin:0,wacc:0,pdMult:1,desc:'control'}];

test('LC-REG-001 stress accepts revenue when revenue0 is absent',()=>{
  const r=Legacy.stressRun(validStress,noShock,{defaultPD:.05});
  assert.ok(r);assert.equal(r.base.revenue0,100);assert.equal(r.out.length,1);
});

test('LC-REG-002 stress preserves an explicit zero tax rate',()=>{
  const r=Legacy.stressRun({...validStress,tax:0},noShock,{defaultPD:.05});
  assert.ok(r);assert.equal(r.base.tax,0);
});

test('LC-REG-003 stress preserves explicit zero growth and zero margin',()=>{
  const r=Legacy.stressRun({...validStress,growth:0,ebitdaMargin:0},noShock,{defaultPD:.05});
  assert.ok(r);assert.equal(r.base.growth,0);assert.equal(r.base.ebitdaMargin,0);
});

test('LC-REG-004 stress preserves a legitimate zero base PD',()=>{
  const r=Legacy.stressRun(validStress,[{name:'credit',rev:0,margin:0,wacc:0,pdMult:3}],{defaultPD:0});
  assert.ok(r);assert.equal(r.out[0].pd,0);
});

test('LC-REG-005 zero stress shocks reproduce the base DCF value',()=>{
  const r=Legacy.stressRun(validStress,noShock,{defaultPD:.05});
  assert.ok(r);assert.ok(Math.abs(r.out[0].value-r.baseVal)<1e-10);assert.ok(Math.abs(r.out[0].downside)<1e-12);
});

test('LC-REG-006 invalid zero share count is rejected rather than defaulted to one',()=>{
  assert.equal(Legacy.stressRun({...validStress,shares:0},noShock,{defaultPD:.05}),null);
});

test('LC-REG-007 portfolio rejects zero total weight instead of dividing by zero',()=>{
  assert.equal(Legacy.portfolioBuild([{name:'A',weight:0,expectedReturn:.1,volatility:.2}]),null);
});

test('LC-REG-008 portfolio preserves explicit zero volatility',()=>{
  const p=Legacy.portfolioBuild([{name:'Cash',assetClass:'cash',weight:1,expectedReturn:.02,volatility:0}],{riskFreeRate:.02});
  assert.ok(p);assert.equal(p.vol,0);assert.equal(p.sharpe,null);assert.equal(p.maxW,1);
});

test('LC-REG-009 portfolio rejects missing volatility rather than inventing one',()=>{
  assert.equal(Legacy.portfolioBuild([{name:'A',weight:1,expectedReturn:.1,volatility:null}]),null);
});

test('LC-REG-010 portfolio rejects negative weights',()=>{
  assert.equal(Legacy.portfolioBuild([{name:'A',weight:1.1,expectedReturn:.1,volatility:.2},{name:'B',weight:-.1,expectedReturn:.1,volatility:.2}]),null);
});

test('LC-REG-011 portfolio variance uses normalized weights and stated correlation',()=>{
  const p=Legacy.portfolioBuild([
    {name:'A',weight:.6,expectedReturn:.10,volatility:.20},
    {name:'B',weight:.4,expectedReturn:.05,volatility:.10}
  ],{riskFreeRate:.03,correlation:.4});
  assert.ok(p);assert.ok(Math.abs(p.expRet-.08)<1e-12);assert.ok(Math.abs(p.vol-Math.sqrt(.01984))<1e-12);
});

test('LC-REG-012 bond stress does not replace zero volatility with a 5% fallback',()=>{
  const p=Legacy.portfolioBuild([{name:'Bond',assetClass:'bond',weight:1,expectedReturn:.03,volatility:0}],{riskFreeRate:.03});
  const s=Legacy.portfolioStress(p,{rate:.02,bondSpread:.03,eq:0,earnings:0});
  assert.ok(s);assert.equal(s.totalImpact,0);assert.equal(s.details[0].shock,0);
});

test('LC-REG-013 comparable valuation converts the relative multiple into fair price',()=>{
  const mx=Legacy.valuationMatrix({price:100},{comps:{impliedMean:2,peers:[10,11,12,13]}});
  const c=mx.methods.find(m=>m.method==='Comparable');
  assert.ok(c);assert.equal(c.value,50);assert.equal(c.upside,-.5);
});

test('LC-REG-014 residual-income valuation is converted from total equity value to per-share value',()=>{
  const sd={price:10,equity:1000,netIncome:120,shares:100};
  const costEquity=.12;
  const mx=Legacy.valuationMatrix(sd,{costEquity});
  const riMethod=mx.methods.find(m=>m.method==='Residual Income');
  const ri=Core.residualIncome({bookValue0:1000,roe:.12,costEquity,horizon:5,terminalRoe:.10,payoutRatio:0,terminalGrowth:0});
  assert.ok(riMethod);assert.ok(Math.abs(riMethod.value-ri.value/100)<1e-12);
});
