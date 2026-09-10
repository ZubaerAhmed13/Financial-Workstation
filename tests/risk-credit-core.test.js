'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const R=require('../src/finance/risk-credit-core.js');

const near=(a,b,t=1e-9)=>assert.ok(a!=null&&Math.abs(a-b)<=t,`${a} not within ${t} of ${b}`);

test('RC-REG-001 inverse normal supports arbitrary confidence levels',()=>near(R.normalInvCDF(.025),-1.959963984540054,2e-6));
test('RC-REG-002 historical VaR uses an interpolated empirical quantile',()=>near(R.historicalVaR([-.10,-.05,0,.02,.03],.80),-.06,1e-12));
test('RC-REG-003 expected shortfall averages the lower tail without fabricating observations',()=>near(R.expectedShortfall([-.10,-.05,0,.02,.03],.80),-.10,1e-12));
test('RC-REG-004 parametric VaR does not silently treat unsupported confidence as 95%',()=>{const a=R.parametricVaR(.02,0,.975),b=R.parametricVaR(.02,0,.95);assert.notEqual(a,b);near(a,-.03919927969080108,3e-7);});
test('RC-REG-005 Monte Carlo VaR rejects a zero current value denominator',()=>assert.equal(R.mcVaR([90,100,110],0,.95),null));
test('RC-REG-006 Monte Carlo expected shortfall preserves a legitimate zero terminal value',()=>{const r=R.mcES([0,50,100],100,.80);assert.ok(r!=null&&r<=-1+1e-12);});

test('RC-REG-007 timestamp cadence infers business-daily annualization',()=>{const d=[Date.UTC(2026,0,5),Date.UTC(2026,0,6),Date.UTC(2026,0,7),Date.UTC(2026,0,8)];const x=R.inferPeriodsPerYear(d);assert.equal(x.periodsPerYear,252);assert.equal(x.label,'daily');});
test('RC-REG-008 timestamp cadence infers weekly annualization',()=>{const d=[Date.UTC(2026,0,5),Date.UTC(2026,0,12),Date.UTC(2026,0,19),Date.UTC(2026,0,26)];const x=R.inferPeriodsPerYear(d);assert.equal(x.periodsPerYear,52);assert.equal(x.label,'weekly');});
test('RC-REG-009 timestamp cadence infers monthly annualization',()=>{const d=[Date.UTC(2026,0,31),Date.UTC(2026,1,28),Date.UTC(2026,2,31),Date.UTC(2026,3,30)];const x=R.inferPeriodsPerYear(d);assert.equal(x.periodsPerYear,12);assert.equal(x.label,'monthly');});
test('RC-REG-010 annualized Sharpe scales the periodic ratio by sqrt(periods/year)',()=>{const rets=[.01,-.005,.015,0,.007,-.003];const x=R.returnRiskSummary(rets,12,0);const mean=rets.reduce((s,v)=>s+v,0)/rets.length;const sd=Math.sqrt(rets.reduce((s,v)=>s+(v-mean)**2,0)/(rets.length-1));near(x.sharpe,(mean/sd)*Math.sqrt(12),1e-12);});
test('RC-REG-011 zero volatility produces null Sharpe instead of false zero precision',()=>{const x=R.returnRiskSummary([.01,.01,.01],12,0);assert.equal(x.sharpe,null);});

test('RC-REG-012 Altman Z preserves valid zero numerators',()=>{const z=R.altmanZ({workingCapital:0,retained:0,ebit:0,mve:0,revenue:0,assets:100,liabilities:50});assert.equal(z.z,0);assert.equal(z.X1,0);assert.equal(z.X4,0);});
test('RC-REG-013 Altman Z rejects a zero denominator rather than coercing it',()=>assert.equal(R.altmanZ({workingCapital:1,retained:1,ebit:1,mve:1,revenue:1,assets:100,liabilities:0}).z,null));
test('RC-REG-014 rating PD linearly interpolates 7y at the correct horizon weight',()=>near(R.ratingPD('BBB',7),.064,1e-12));
test('RC-REG-015 rating PD does not extrapolate beyond the configured curve',()=>assert.equal(R.ratingPD('BBB',15),null));
test('RC-REG-016 credit curve exposes 1/3/5/7/10y with corrected 7y interpolation',()=>{const c=R.creditCurve('BBB');assert.deepEqual(c.horiz,[1,3,5,7,10]);near(c.pd[3],.064,1e-12);});
test('RC-REG-017 expected loss preserves zero PD and zero EAD',()=>{assert.equal(R.expectedLossRate(0,.35),0);assert.equal(R.expectedLossAmount(.08,.35,0),0);});
test('RC-REG-018 expected loss rejects invalid probability inputs',()=>{assert.equal(R.expectedLossRate(null,.35),null);assert.equal(R.expectedLossRate(1.2,.35),null);assert.equal(R.expectedLossAmount(.08,.35,-1),null);});

test('RC-REG-019 Merton solver converges with tight equation residuals',()=>{const m=R.merton(100,.30,80,.03,1);assert.equal(m.converged,true);assert.ok(m.pd>=0&&m.pd<=1);assert.ok(Math.abs(m.residualEquity)<1e-7);assert.ok(Math.abs(m.residualVol)<1e-7);});
test('RC-REG-020 Merton PD rises when debt rises, all else equal',()=>{const low=R.merton(100,.30,40,.03,1),high=R.merton(100,.30,120,.03,1);assert.equal(low.converged,true);assert.equal(high.converged,true);assert.ok(high.pd>low.pd);});
test('RC-REG-021 Merton rejects a non-positive horizon rather than returning NaN',()=>{const m=R.merton(100,.30,80,.03,0);assert.equal(m.pd,null);assert.ok(m.error);});
test('RC-REG-022 Merton diagnostics carry the actual distance-to-default',()=>{const m=R.merton(100,.30,80,.03,1),d=R.mertonTrace(100,.30,80,.03,1);near(d.distanceToDefault,m.distanceToDefault,1e-12);assert.equal(d.converged,true);});
