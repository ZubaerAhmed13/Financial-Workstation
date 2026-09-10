'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const Core=require('../src/finance/engine.js');
const ModelCore=require('../src/finance/model-engine.js');
const LegacyCore=require('../src/finance/legacy-hardening.js');
const RiskCore=require('../src/finance/risk-credit-core.js');
const installer=fs.readFileSync(require.resolve('../src/runtime/install.js'),'utf8');

function context(){
  const c={
    FinanceCore:Core,
    FinancialModelCore:ModelCore,
    LegacyCalculationCore:LegacyCore,
    RiskCreditCore:RiskCore,
    console,
    fmt:{money:(v)=>'$'+String(v),num:String,pct:String,x:String},
    kpi:(a,b,c)=>`${a}:${b}:${c||''}`,
    CalcEngine:{mean:(a)=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null,stdev:(a)=>{if(a.length<2)return null;const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1));}},
    CsvParser:{parse:(text)=>text.trim().split(/\r?\n/).map(r=>r.split(','))},
    LoanEngine:{},
    BondEngine:{},
    CapmWacc:{},
    ValuationEngine:{},
    FinancialRatios:{},
    FinancialModelEngine:{legacyTableHelper:true},
    XIRR:{},
    ECLV2:{},
    RiskMetricsV2:{varHTML:true},
    CreditModels:{defaultPDTable:RiskCore.DEFAULT_PD_TABLE},
    CreditCurveV2:{curveHTML:true},
    MertonDiag:{diagHTML:true},
    StressTestEngine:{PREDEFINED:[{name:'Control',rev:0,margin:0,wacc:0,pdMult:1,desc:'control'}],stressHTML:true},
    PortfolioEngine:{legacyPresentation:true},
    ValuationMatrixV2:{matrixHTML:true,driversHTML:true},
    App:{meta:{},state:{settings:{currency:'EUR'},stockData:{rf:.03},history:{prices:[]},results:{stock:{}}}},
  };
  vm.createContext(c);vm.runInContext(installer,c);return c;
}

test('runtime NPV routes through certified known-answer implementation',()=>{const c=context();assert.ok(Math.abs(c.LoanEngine.npv([-1000,1100],.1))<1e-9);});
test('runtime IRR routes through certified bracketed solver',()=>{const c=context();const r=c.LoanEngine.irr([-1000,1100]);assert.ok(r!=null&&Math.abs(r-.1)<1e-8);});
test('runtime REG-BOND-001 passes coupon frequency into modified-duration math',()=>{const c=context();const mac=7.894997340182341;assert.ok(Math.abs(c.BondEngine.modifiedDuration(mac,.06,2)-7.665045961342078)<1e-10);});
test('runtime REG-DD-001 does not recover against trough',()=>{const c=context();assert.equal(c.CalcEngine.recoveryPeriod([100,90,70,80,95,100],2),3);});
test('runtime REG-MACD-001 returns populated histogram',()=>{const c=context();const r=c.CalcEngine.macd(Array.from({length:80},(_,i)=>100+i),12,26,9);assert.ok(r.hist.some(Number.isFinite));});
test('runtime REG-FMT-001 scales 10,000 before K suffix',()=>{const c=context();assert.equal(c.fmt.big(10000),'$10K');});
test('runtime REG-CSV-001 imports Date at index zero',()=>{const c=context();const r=c.CsvParser.importPriceSeries('Date,Close,Volume\n2026-01-01,100,1000\n2026-01-02,105,1100',null);assert.equal(r.ok,true);assert.equal(r.map.date,0);assert.equal(r.series[0].close,100);});
test('runtime REG-RSI-001 no-loss RSI is 100',()=>{const c=context();assert.equal(c.CalcEngine.rsi(Array.from({length:30},(_,i)=>i+1),14).at(-1),100);});
test('runtime REG-DCF-001 blocks g = WACC',()=>{const c=context();const r=c.ValuationEngine.dcf({revenue0:100,growth:.05,ebitdaMargin:.2,tax:.2,capexPct:.05,wcPct:.02,dandaPct:.04,wacc:.08,terminalGrowth:.08,netDebt:0,shares:10,horizon:5});assert.equal(r.status,'invalid');});
test('runtime accounting layer preserves valid zeros',()=>{const c=context();const r=c.FinancialRatios.compute({revenue:0,cash:0,debt:0,assets:100,equity:100});assert.equal(r.revenue,0);assert.equal(r.cash,0);assert.equal(r.debt,0);});

test('runtime exposes model certification version',()=>{const c=context();assert.equal(c.__FINANCIAL_CERTIFICATION__.modelVersion,ModelCore.VERSION);assert.equal(c.App.meta.financialModelEngineVersion,ModelCore.VERSION);});
test('runtime FinancialModelEngine keeps legacy presentation helpers while replacing calculation methods',()=>{const c=context();assert.equal(c.FinancialModelEngine.legacyTableHelper,true);assert.equal(typeof c.FinancialModelEngine.build,'function');assert.equal(typeof c.FinancialModelEngine.fillDefaults,'function');});
test('runtime FM-REG-001 compounds forecast growth through production model path',()=>{const c=context();const m=c.FinancialModelEngine.defaults();m.years=2;m.startYear=2027;m.bs0={revenue:100,cash:10,equity:10};m.growth=[.1,.1];m.tax=[0,0];m.capexPct=[0,0];m.daPct=[0,0];m.dso=[0,0];m.dio=[0,0];m.dpo=[0,0];m.ocaPct=[0,0];m.oclPct=[0,0];m.cogsPct=[.65,.65];m.sgaPct=[.12,.12];m.rndPct=[.03,.03];const r=c.FinancialModelEngine.build(m,{});assert.ok(Math.abs(r.income[0].revenue-110)<1e-9);assert.ok(Math.abs(r.income[1].revenue-121)<1e-9);});
test('runtime FM-REG-005 preserves an explicit zero debt rate',()=>{const c=context();const m=c.FinancialModelEngine.defaults();m.years=1;m.bs0={revenue:100,cash:110,debt:100,equity:10};m.debt={rows:[{opening:100,rate:0,repayment:0}]};const r=c.FinancialModelEngine.build(m,{});assert.equal(r.income[0].interest,0);});
test('runtime FM-REG-007 debt repayment reaches cash and balance sheet',()=>{const c=context();const m=c.FinancialModelEngine.defaults();m.years=1;m.bs0={revenue:100,cash:110,debt:100,equity:10};m.growth=[0];m.tax=[0];m.capexPct=[0];m.daPct=[0];m.dso=[0];m.dio=[0];m.dpo=[0];m.ocaPct=[0];m.oclPct=[0];m.cogsPct=[.65];m.sgaPct=[.12];m.rndPct=[.03];m.debt={rows:[{opening:100,rate:0,repayment:25}]};const r=c.FinancialModelEngine.build(m,{});assert.equal(r.balance[0].debt,75);assert.equal(r.cash[0].debtDelta,-25);});
test('runtime XIRR routes irregular dates through certified solver',()=>{const c=context();const d0=Date.UTC(2024,0,1),d1=Date.UTC(2024,11,31);const r=c.XIRR.xirr([-1000,1100],[d0,d1]);assert.ok(r!=null&&Math.abs(r-.1)<1e-8);});
test('runtime XIRR rejects cash flows without a sign change',()=>{const c=context();assert.equal(c.XIRR.xirr([100,200],[Date.UTC(2024,0,1),Date.UTC(2025,0,1)]),null);});
test('runtime ECL preserves a valid zero exposure rather than defaulting to one million',()=>{const c=context();assert.equal(c.ECLV2.eadDefault(0,'loan'),0);assert.equal(c.ECLV2.compute(.08,.35,0).el,0);});
test('runtime ECL does not convert missing PD into zero expected loss',()=>{const c=context();const r=c.ECLV2.compute(null,.35,1000);assert.equal(r.el,null);assert.ok(r.error);});

test('runtime exposes legacy calculation hardening version',()=>{const c=context();assert.equal(c.__FINANCIAL_CERTIFICATION__.legacyVersion,LegacyCore.VERSION);assert.equal(c.App.meta.legacyCalculationCoreVersion,LegacyCore.VERSION);});
test('runtime stress route accepts revenue without revenue0',()=>{const c=context();const r=c.StressTestEngine.run({revenue:100,growth:.1,ebitdaMargin:.2,tax:.2,capexPct:.05,wcPct:.02,dandaPct:.04,wacc:.1,terminalGrowth:.02,netDebt:0,shares:10,horizon:5});assert.ok(r);assert.equal(r.base.revenue0,100);});
test('runtime stress route preserves zero PD from current analysis',()=>{const c=context();c.App.state.results.stock.defaultPD=0;const r=c.StressTestEngine.run({revenue:100,growth:.1,ebitdaMargin:.2,tax:.2,capexPct:.05,wcPct:.02,dandaPct:.04,wacc:.1,terminalGrowth:.02,netDebt:0,shares:10,horizon:5});assert.equal(r.out[0].pd,0);});
test('runtime portfolio route rejects zero total weight',()=>{const c=context();assert.equal(c.PortfolioEngine.build([{name:'A',weight:0,expectedReturn:.1,volatility:.2}]),null);});
test('runtime portfolio stress preserves zero bond volatility',()=>{const c=context();const p=c.PortfolioEngine.build([{name:'Bond',assetClass:'bond',weight:1,expectedReturn:.03,volatility:0}]);const s=c.PortfolioEngine.stress(p,{rate:.02,bondSpread:.03,eq:0,earnings:0});assert.equal(s.totalImpact,0);});
test('runtime comparable valuation no longer collapses to current price',()=>{const c=context();c.App.state.results.stock={comps:{impliedMean:2,peers:[10,11,12,13]}};const mx=c.ValuationMatrixV2.build({price:100});const comp=mx.methods.find(m=>m.method==='Comparable');assert.equal(comp.value,50);assert.equal(comp.upside,-.5);});
test('runtime valuation matrix preserves legacy presentation helper',()=>{const c=context();assert.equal(c.ValuationMatrixV2.matrixHTML,true);assert.equal(typeof c.ValuationMatrixV2.driversHTML,'function');});
test('runtime portfolio engine preserves non-calculation presentation fields',()=>{const c=context();assert.equal(c.PortfolioEngine.legacyPresentation,true);assert.equal(typeof c.PortfolioEngine.build,'function');assert.equal(typeof c.PortfolioEngine.stress,'function');});

test('runtime exposes risk-credit certification version',()=>{const c=context();assert.equal(c.__FINANCIAL_CERTIFICATION__.riskCreditVersion,RiskCore.VERSION);assert.equal(c.App.meta.riskCreditCoreVersion,RiskCore.VERSION);assert.equal(c.App.meta.riskEngineVersion,RiskCore.VERSION);});
test('runtime RC-REG-004 parametric VaR supports confidence levels beyond 95 and 99 percent',()=>{const c=context();const a=c.RiskMetricsV2.parametricVaR(.02,0,.975),b=c.RiskMetricsV2.parametricVaR(.02,0,.95);assert.notEqual(a,b);assert.ok(Math.abs(a+0.03919927969080108)<3e-7);});
test('runtime RC-REG-005 Monte Carlo VaR rejects zero current-value denominator',()=>{const c=context();assert.equal(c.RiskMetricsV2.mcVaR([90,100,110],0,.95),null);assert.equal(c.RiskMetricsV2.mcES([90,100,110],0,.95),null);});
test('runtime RC-REG-008 infers weekly cadence rather than hard-coding 252',()=>{const c=context();const d=[Date.UTC(2026,0,5),Date.UTC(2026,0,12),Date.UTC(2026,0,19)];const x=c.CalcEngine.inferPeriodsPerYear(d);assert.equal(x.periodsPerYear,52);assert.equal(x.label,'weekly');});
test('runtime RC-REG-010 risk summary annualizes Sharpe',()=>{const c=context();const x=c.CalcEngine.riskSummary([.01,-.005,.015,0,.007,-.003],12,0);assert.ok(Number.isFinite(x.sharpe));assert.equal(x.periodsPerYear,12);});
test('runtime RC-REG-012 Altman preserves zero numerators',()=>{const c=context();const z=c.CreditModels.altmanZ({workingCapital:0,retained:0,ebit:0,mve:0,revenue:0,assets:100,liabilities:50});assert.equal(z.z,0);});
test('runtime RC-REG-014 credit curve uses correctly weighted 7-year interpolation',()=>{const c=context();const curve=c.CreditCurveV2.curve('BBB');assert.ok(curve);assert.ok(Math.abs(curve.pd[3]-.064)<1e-12);});
test('runtime RC-REG-019 Merton solver converges and returns bounded PD',()=>{const c=context();const m=c.CreditModels.merton(100,.30,80,.03,1);assert.equal(m.converged,true);assert.ok(m.pd>=0&&m.pd<=1);assert.ok(Math.abs(m.residualEquity)<1e-7);assert.ok(Math.abs(m.residualVol)<1e-7);});
test('runtime RC-REG-022 Merton diagnostics retain actual distance-to-default',()=>{const c=context();const m=c.CreditModels.merton(100,.30,80,.03,1),d=c.MertonDiag.trace(100,.30,80,.03,1);assert.equal(d.converged,true);assert.ok(Math.abs(d.distanceToDefault-m.distanceToDefault)<1e-12);assert.notEqual(d.distanceToDefault,0);});
test('runtime ECL no longer manufactures one-million exposure when EAD is missing',()=>{const c=context();assert.equal(c.ECLV2.eadDefault(null,'loan'),null);assert.equal(c.ECLV2.compute(.08,.35,null).el,null);});
test('runtime risk/credit presentation helpers remain available',()=>{const c=context();assert.equal(c.RiskMetricsV2.varHTML,true);assert.equal(c.CreditCurveV2.curveHTML,true);assert.equal(c.MertonDiag.diagHTML,true);});
