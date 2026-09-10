'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const W=require('../src/finance/workstation-core.js');

const near=(a,b,t=1e-9)=>assert.ok(a!=null&&Math.abs(a-b)<=t,`${a} not within ${t} of ${b}`);
const sum=a=>a.reduce((s,v)=>s+v,0);

test('WC-REG-001 weight normalization rejects zero total instead of dividing by zero',()=>assert.equal(W.normalizeWeightObject({a:0,b:0}),null));
test('WC-REG-002 weight normalization preserves explicit zero weights',()=>{const x=W.normalizeWeightObject({a:0,b:2});assert.equal(x.a,0);assert.equal(x.b,1);});
test('WC-REG-003 similarity uses finite positive feature weights and standardized distance',()=>{const q={features:{x:2}},c={features:{x:1}},s={x:{m:0,s:2}};near(W.similarityScore(q,c,s,{x:1},['x']),Math.exp(-.5));});
test('WC-REG-004 similarity with no comparable weighted features is explicitly zero',()=>assert.equal(W.similarityScore({features:{}},{features:{}},{},{x:1},['x']),0));

test('WC-REG-005 preference scoring preserves a legitimate zero metric',()=>{const r=W.preferenceScore({expectedReturn:0},{return:100,safety:0,valuation:0,liquidity:0,historical:0});assert.ok(r);assert.equal(r.detail.length,1);near(r.detail[0].normalized,.375);});
test('WC-REG-006 data-quality case sample receives proportional credit rather than truthy all-or-nothing credit',()=>{const base={history:{prices:Array(120).fill(1)},financials:{assets:1,netIncome:1},dcf:{wacc:.1,perShare:1},peers:[{},{},{}],dataOk:true};const one=W.dataQualityScore({...base,caseMatches:[{}]}),ten=W.dataQualityScore({...base,caseMatches:Array(10).fill({})});assert.equal(one.score,91);assert.equal(ten.score,100);});
test('WC-REG-007 peer coverage counts legitimate zero-valued growth/margin/ROE/multiple fields as present',()=>{const x=W.peerDataCoverage([{marketCap:100,growth:0,margin:0,roe:0,multiple:0}]);assert.equal(x.score,100);});
test('WC-REG-008 moat score validates the 0-100 domain',()=>{assert.equal(W.moatScore([0,50,100]),50);assert.equal(W.moatScore([101]),null);});

test('WC-REG-009 factor exposure rejects a zero-total-weight portfolio',()=>assert.equal(W.factorExposure([{type:'stock',weight:0}]),null));
test('WC-REG-010 attribution preserves a zero benchmark return',()=>{const x=W.performanceAttribution([{name:'A',weight:1,expectedReturn:.1}],0);assert.ok(x);assert.equal(x.benchmark,0);near(x.activeReturn,.1);});
test('WC-REG-011 attribution refuses to manufacture a missing asset return',()=>assert.equal(W.performanceAttribution([{name:'A',weight:1,expectedReturn:null}],.08),null));
test('WC-REG-012 simplified attribution does not double-count the same active effect as both allocation and selection',()=>{const x=W.performanceAttribution([{name:'A',weight:1,expectedReturn:.1}],.08);near(x.allocEffect,.02);assert.equal(x.selectionEffect,null);});

test('WC-REG-013 risk contribution preserves zero volatility without a hidden 20 percent fallback',()=>{const x=W.riskContribution({items:[{name:'A',weight:.5,volatility:0},{name:'B',weight:.5,volatility:.2}]});assert.ok(x);assert.equal(x.rows[0].volatility,0);});
test('WC-REG-014 risk contribution rejects missing volatility',()=>assert.equal(W.riskContribution({items:[{name:'A',weight:.5,volatility:null},{name:'B',weight:.5,volatility:.2}]}),null));
test('WC-REG-015 correlation matrices are range, symmetry and diagonal validated',()=>{assert.equal(W.validateCorrelationMatrix([[1,.4],[.4,1]],2),true);assert.equal(W.validateCorrelationMatrix([[1,2],[.4,1]],2),false);});
test('WC-REG-016 portfolio optimizers return normalized long-only weights',()=>{const items=[{expectedReturn:.06,volatility:.1},{expectedReturn:.12,volatility:.25}];for(const w of [W.equalWeight(items),W.minimumVariance(items),W.maximumSharpe(items,undefined,.02),W.riskParity(items)]){assert.ok(w);near(sum(w),1,1e-8);assert.ok(w.every(x=>x>=0&&x<=1));}});

test('WC-REG-017 segment forecast compounds each segment and preserves zero margin',()=>{const x=W.segmentForecast(100,[{name:'A',share:1,growth:[.1,.1],margin:[0,.2]}],2);assert.ok(x);near(x.totalRevs[0],100);near(x.totalRevs[1],110);assert.equal(x.totalEbitda[0],0);});
test('WC-REG-018 segment forecast explicitly reports whether shares reconcile to 100 percent',()=>{const x=W.segmentForecast(100,[{name:'A',share:.8,growth:[0],margin:[.1]}],1);assert.equal(x.shareReconciles,false);near(x.shareTotal,.8);});
test('WC-REG-019 SOTP treats explicit zero value as a real value rather than a signal to multiply metric',()=>{const x=W.sumOfParts([{name:'A',value:0,multiple:10,metric:50}],0,10);assert.equal(x.parts[0].value,0);assert.equal(x.parts[0].source,'explicit');assert.equal(x.perShare,0);});
test('WC-REG-020 SOTP rejects zero diluted shares',()=>assert.equal(W.sumOfParts([{multiple:2,metric:50}],0,0),null));

test('WC-REG-021 Monte Carlo preserves explicit zero return and zero volatility',()=>{const x=W.monteCarloGBM({initial:100,expectedReturn:0,volatility:0,years:1,steps:12,paths:5,seed:7});assert.deepEqual(x.terminal,[100,100,100,100,100]);});
test('WC-REG-022 Monte Carlo is reproducible for a supplied seed',()=>{const a=W.monteCarloGBM({initial:100,expectedReturn:.05,volatility:.2,years:1,steps:12,paths:8,seed:77});const b=W.monteCarloGBM({initial:100,expectedReturn:.05,volatility:.2,years:1,steps:12,paths:8,seed:77});assert.deepEqual(a.terminal,b.terminal);});
test('WC-REG-023 Monte Carlo rejects non-positive initial capital instead of silently replacing zero with 100',()=>assert.equal(W.monteCarloGBM({initial:0,expectedReturn:0,volatility:0}),null));

test('WC-REG-024 dividend math preserves explicit zero withholding tax',()=>{const x=W.dividendAmounts({gross:100,withholdingTax:0});assert.deepEqual(x,{gross:100,withholding:0,net:100});});
test('WC-REG-025 FX conversion preserves a legitimate zero amount',()=>assert.equal(W.fxConvert(0,1.1),0));
test('WC-REG-026 unrealized P&L uses market value minus cost basis and guards zero cost denominator',()=>{const x=W.positionUnrealized({qty:2,costBasis:0},50);assert.equal(x.marketValue,100);assert.equal(x.unrealizedPnl,100);assert.equal(x.returnOnCost,null);});

test('WC-REG-027 snapshot period return removes the current-period external cash flow',()=>{const r=W.periodReturnsFromSnapshots([{date:'2025-01-01',mv:100},{date:'2025-12-31',mv:120,cashFlow:10}]);near(r[0],.1);});
test('WC-REG-028 TWR compounds certified sub-period returns',()=>{const r=W.timeWeightedReturnFromSnapshots([{date:'2024-01-01',mv:100},{date:'2024-06-30',mv:110,cashFlow:0},{date:'2024-12-31',mv:121,cashFlow:0}]);near(r,.21);});
test('WC-REG-029 MWR/XIRR routes snapshot cash flows through irregular-date solver',()=>{const r=W.moneyWeightedReturnFromSnapshots([{date:'2024-01-01',mv:100},{date:'2024-12-31',mv:110,cashFlow:0}]);near(r,.1,1e-8);});
test('WC-REG-030 performance risk builds the correct wealth path for maximum drawdown',()=>{const r=W.performanceRisk([.1,-.1],12,0);near(r.mdd,-.1,1e-12);});
test('WC-REG-031 performance risk requires an explicit positive annualization factor',()=>assert.equal(W.performanceRisk([.01,.02],0),null));
test('WC-REG-032 capture ratios use aligned equal-length return arrays and annualized active risk',()=>{const x=W.captureRatios([.12,-.05,.06,-.02],[.1,-.1,.05,-.04],12);assert.ok(x);assert.ok(x.upside>1);assert.ok(x.downside<1);assert.ok(Number.isFinite(x.te));});
