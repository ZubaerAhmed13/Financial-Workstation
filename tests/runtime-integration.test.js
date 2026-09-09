'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const Core=require('../src/finance/engine.js');
const installer=fs.readFileSync(require.resolve('../src/runtime/install.js'),'utf8');

function context(){
  const c={
    FinanceCore:Core,
    console,
    fmt:{money:(v)=>'$'+String(v),num:String,pct:String},
    CalcEngine:{},
    CsvParser:{parse:(text)=>text.trim().split(/\r?\n/).map(r=>r.split(','))},
    BondEngine:{},
    CapmWacc:{},
    ValuationEngine:{},
    FinancialRatios:{},
    App:{meta:{}},
  };
  vm.createContext(c);vm.runInContext(installer,c);return c;
}

test('runtime REG-BOND-001 passes coupon frequency into modified-duration math',()=>{const c=context();const mac=7.894997340182341;assert.ok(Math.abs(c.BondEngine.modifiedDuration(mac,.06,2)-7.665045961342078)<1e-10);});
test('runtime REG-DD-001 does not recover against trough',()=>{const c=context();assert.equal(c.CalcEngine.recoveryPeriod([100,90,70,80,95,100],2),3);});
test('runtime REG-MACD-001 returns populated histogram',()=>{const c=context();const r=c.CalcEngine.macd(Array.from({length:80},(_,i)=>100+i),12,26,9);assert.ok(r.hist.some(Number.isFinite));});
test('runtime REG-FMT-001 scales 10,000 before K suffix',()=>{const c=context();assert.equal(c.fmt.big(10000),'$10K');});
test('runtime REG-CSV-001 imports Date at index zero',()=>{const c=context();const r=c.CsvParser.importPriceSeries('Date,Close,Volume\n2026-01-01,100,1000\n2026-01-02,105,1100',null);assert.equal(r.ok,true);assert.equal(r.map.date,0);assert.equal(r.series[0].close,100);});
test('runtime REG-RSI-001 no-loss RSI is 100',()=>{const c=context();assert.equal(c.CalcEngine.rsi(Array.from({length:30},(_,i)=>i+1),14).at(-1),100);});
test('runtime REG-DCF-001 blocks g = WACC',()=>{const c=context();const r=c.ValuationEngine.dcf({revenue0:100,growth:.05,ebitdaMargin:.2,tax:.2,capexPct:.05,wcPct:.02,dandaPct:.04,wacc:.08,terminalGrowth:.08,netDebt:0,shares:10,horizon:5});assert.equal(r.status,'invalid');});
test('runtime accounting layer preserves valid zeros',()=>{const c=context();const r=c.FinancialRatios.compute({revenue:0,cash:0,debt:0,assets:100,equity:100});assert.equal(r.revenue,0);assert.equal(r.cash,0);assert.equal(r.debt,0);});
