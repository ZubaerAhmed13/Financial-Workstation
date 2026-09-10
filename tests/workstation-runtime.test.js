'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const W=require('../src/finance/workstation-core.js');
const L=require('../src/finance/workstation-ledger-core.js');
const addon=fs.readFileSync(require.resolve('../src/runtime/install-workstation.js'),'utf8');
const near=(a,b,t=1e-9)=>assert.ok(a!=null&&Math.abs(a-b)<=t,`${a} not within ${t} of ${b}`);

function context(){
  const ws={
    transactions:[{date:'2026-01-01',type:'DEPOSIT',amount:100,currency:'EUR'},{date:'2026-02-01',type:'WITHDRAWAL',amount:-25,currency:'EUR'}],
    holdings:{ABC:{quantity:2,costBasis:80,fxBasis:1,currency:'USD'}},
    prices:{ABC:50},fxRates:{USD:{rate:1.2}},cashAccounts:{EUR:{balance:0},USD:{balance:100}}
  };
  const c={
    console,WorkstationCalculationCore:W,WorkstationLedgerCore:L,
    SimilarityEngine:{FEATURES:['x'],defaultWeights:{x:1}},
    DataQualityEngine:{},ScoringEngine:{DEFAULT_W:W.DEFAULT_PREFERENCE_WEIGHTS},PeerSimilarity:{},
    factorExposure:()=>null,performanceAttribution:()=>null,RiskContribution:{html:true},
    PortfolioOptimizers:{htmlOptimizer:true},
    wsDividendAmounts:()=>null,wsCalculateFromLedger:()=>null,wsFxConvert:()=>null,wsPositionBaseValue:()=>null,wsMarketValue:()=>null,wsCashSummary:()=>null,wsUnrealized:()=>null,
    wsTWR:()=>null,wsMWR:()=>null,wsAnnualized:()=>null,wsCaptureRatios:()=>null,wsPerfRisk:()=>null,wsPeriodReturns:()=>null,
    wsPortfolio:()=>ws,wsBaseCurrency:()=> 'EUR',
    wsGetPrice:(k)=>k==='ABC'?{price:50}:null,
    wsFxRateMeta:(currency)=>currency==='EUR'?{rate:1}:currency==='USD'?{rate:1.2}:null,
    wsFxRate:(currency)=>currency==='EUR'?1:currency==='USD'?1.2:null,
    App:{meta:{}},__FINANCIAL_CERTIFICATION__:{version:'1.1.0',installed:['prior']}
  };
  vm.createContext(c);vm.runInContext(addon,c);return c;
}

test('WR-REG-001 runtime exposes workstation calculation and ledger versions',()=>{const c=context();assert.equal(c.__FINANCIAL_CERTIFICATION__.workstationVersion,W.VERSION);assert.equal(c.__FINANCIAL_CERTIFICATION__.workstationLedgerVersion,L.VERSION);assert.equal(c.App.meta.workstationCalculationCoreVersion,W.VERSION);assert.equal(c.App.meta.workstationLedgerCoreVersion,L.VERSION);});
test('WR-REG-002 similarity public route uses hardened standardized distance',()=>{const c=context(),stats=c.SimilarityEngine.standardize([{features:{x:1}},{features:{x:3}}]);near(c.SimilarityEngine.simScore({features:{x:2}},{features:{x:1}},stats,{x:1}),Math.exp(-Math.SQRT1_2));});
test('WR-REG-003 data quality public route awards proportional case coverage',()=>{const c=context(),base={history:{prices:Array(120).fill(1)},financials:{assets:1,netIncome:1},dcf:{wacc:.1,perShare:1},peers:[{},{},{}],dataOk:true};assert.equal(c.DataQualityEngine.score({...base,caseMatches:[{}]}).score,91);});
test('WR-REG-004 scoring public route preserves legitimate zero metrics',()=>{const c=context(),r=c.ScoringEngine.score({expectedReturn:0},{return:100,safety:0,valuation:0,liquidity:0,historical:0});assert.equal(r.detail.length,1);});
test('WR-REG-005 peer coverage public route counts zero-valued fields as present',()=>{const c=context();assert.equal(c.PeerSimilarity.score([{marketCap:1,growth:0,margin:0,roe:0,multiple:0}]).score,100);});
test('WR-REG-006 attribution public route preserves zero benchmark and avoids double counting',()=>{const c=context(),r=c.performanceAttribution([{name:'A',weight:1,expectedReturn:.1}],0);assert.equal(r.benchmark,0);assert.equal(r.selectionEffect,null);near(r.activeReturn,.1);});
test('WR-REG-007 risk contribution public route refuses missing volatility',()=>{const c=context();assert.equal(c.RiskContribution.compute({items:[{weight:.5,volatility:null},{weight:.5,volatility:.2}]}),null);});
test('WR-REG-008 optimizer public routes preserve normalized long-only weights',()=>{const c=context(),items=[{expectedReturn:.06,volatility:.1},{expectedReturn:.12,volatility:.2}],w=c.PortfolioOptimizers.maximumSharpe(items,undefined,.02);near(w.reduce((s,v)=>s+v,0),1,1e-8);assert.ok(w.every(v=>v>=0));});
test('WR-REG-009 ledger production route fixes negative-withdrawal cash direction',()=>{const c=context(),r=c.wsCalculateFromLedger(c.wsPortfolio());assert.equal(r.cash.EUR,75);});
test('WR-REG-010 dividend production route understands grossDividend',()=>{const c=context();assert.deepEqual(JSON.parse(JSON.stringify(c.wsDividendAmounts({grossDividend:100,withholdingTax:0}))),{gross:100,withholding:0,net:100});});
test('WR-REG-011 FX production route supports signed amounts',()=>{const c=context();assert.equal(c.wsFxConvert(-10,'USD'),-12);});
test('WR-REG-012 market-value route applies current FX and cost-basis FX independently',()=>{const c=context(),r=c.wsMarketValue();assert.equal(r.mv,120);assert.equal(r.cost,80);assert.equal(r.unreal,40);});
test('WR-REG-013 cash summary preserves zero base cash',()=>{const c=context(),r=c.wsCashSummary();assert.equal(r.localCash.EUR,0);assert.equal(r.cash,120);assert.equal(r.total,240);});
test('WR-REG-014 TWR/MWR routes use certified snapshot functions',()=>{const c=context(),s=[{date:'2024-01-01',mv:100},{date:'2024-12-31',mv:110,cashFlow:0}];near(c.wsTWR(s),.1);near(c.wsMWR(s),.1,1e-8);});
test('WR-REG-015 performance-risk route requires explicit positive annualization',()=>{const c=context();assert.equal(c.wsPerfRisk([.01,.02],0),null);});
test('WR-REG-016 certification report records final installed route set',()=>{const c=context();assert.ok(c.__FINANCIAL_CERTIFICATION__.workstationInstalled.includes('wsCalculateFromLedger'));assert.ok(c.__FINANCIAL_CERTIFICATION__.workstationInstalled.includes('PortfolioOptimizers'));});
