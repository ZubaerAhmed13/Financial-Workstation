'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const Core=require('../src/finance/engine.js');
const ModelCore=require('../src/finance/model-engine.js');
const installer=fs.readFileSync(require.resolve('../src/runtime/install.js'),'utf8');

function context(){
  const c={
    FinanceCore:Core,
    FinancialModelCore:ModelCore,
    console,
    fmt:{money:(v)=>'$'+String(v),num:String,pct:String,x:String},
    kpi:(a,b,c)=>`${a}:${b}:${c||''}`,
    CalcEngine:{},
    CsvParser:{parse:(text)=>text.trim().split(/\r?\n/).map(r=>r.split(','))},
    LoanEngine:{},
    BondEngine:{},
    CapmWacc:{},
    ValuationEngine:{},
    FinancialRatios:{},
    FinancialModelEngine:{legacyTableHelper:true},
    XIRR:{},
    ECLV2:{},
    App:{meta:{},state:{settings:{currency:'EUR'}}},
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
