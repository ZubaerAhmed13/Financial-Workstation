'use strict';

const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const engine=fs.readFileSync(path.join(root,'src/finance/engine.js'),'utf8');
const model=fs.readFileSync(path.join(root,'src/finance/model-engine.js'),'utf8');
const runtime=fs.readFileSync(path.join(root,'src/runtime/install.js'),'utf8');

const checks=[
  ['even median averages middle observations',/b\.length%2\s*\?\s*b\[m\]\s*:\s*\(b\[m-1\]\+b\[m\]\)\/2/.test(engine)],
  ['modified duration uses periodic yield denominator',/1\+ytm\/frequency/.test(engine)],
  ['MACD histogram is calculated',/histogram=line\.map\([^\n]*v-signal\[i\]/.test(engine)],
  ['RSI explicitly handles zero loss and zero gain',/l<=EPS\?\(g<=EPS\?50:100\):\(g<=EPS\?0:/.test(engine)],
  ['DCF rejects terminal growth at or above WACC',/terminalGrowth>=o\.wacc/.test(engine)],
  ['CSV index detection uses null checks',/map\.date==null/.test(engine)&&/map\.close==null/.test(engine)],
  ['financial ratios preserve valid zero inputs',/isFiniteNumber\(f&&f\[k\]\)\?f\[k\]:null/.test(engine)],
  ['NPV validates rate lower bound',/rate<=-1/.test(engine)],
  ['IRR requires both positive and negative cash flows',/flows\.some\(x=>x<0\).*flows\.some\(x=>x>0\)/.test(engine)],
  ['runtime routes LoanEngine NPV to certified core',runtime.includes('LoanEngine.npv=(flows,rate)=>Core.npv(flows,rate)')],
  ['runtime routes LoanEngine IRR to certified core',runtime.includes('LoanEngine.irr=(flows,_guess=.1)=>Core.irr(flows)')],
  ['runtime routes DCF to certified core',runtime.includes('ValuationEngine.dcf=(opts)=>Core.dcf(opts)')],
  ['runtime routes technical indicators to certified core',/CalcEngine\.rsi=.*Core\.rsi/.test(runtime)&&runtime.includes('Core.macd')],
  ['runtime routes financial ratios to certified core',runtime.includes('FinancialRatios.compute=(f)=>Core.financialRatios(f||{})')],
  ['runtime exposes immutable certification report',runtime.includes('Object.freeze(installReport)')],

  ['model revenue compounds per-year growth',model.includes('const revenue=Math.max(0,prevRevenue*(1+g));')],
  ['model actual EBITDA margin is derived from statement values',model.includes('const ebitda=gross-opex;const mar=ratio(ebitda,revenue);')],
  ['model working capital uses configured COGS',model.includes('const arEnd=revenue/365*m.dso[i];const invEnd=cogs/365*m.dio[i];const apEnd=cogs/365*m.dpo[i];')],
  ['model preserves zero-valued debt rates through finite-value selection',model.includes("rate:pick(r&&r.rate,.05)")],
  ['model aggregates simultaneous debt instruments',model.includes('for(let j=0;j<instruments.length;j++){')&&model.includes('opening+=op;interest+=int;repayment+=paid;ending+=end;')],
  ['model debt repayment reaches financing cash flow',model.includes('const netChange=freeCashFlow+debtDelta;const cash=prevCash+netChange;')],
  ['model current ratio uses actual current liabilities',model.includes('const currentLiabilities=balance.ap+balance.ocl;const currentAssets=balance.cash+balance.ar+balance.inv;const currentRatio=ratio(currentAssets,currentLiabilities);')],
  ['model tracks rather than hides opening balance-sheet difference',model.includes('const openingDiff=openingAssets-openingLiabEq;')&&model.includes('carriesOpeningDifference:Math.abs(diff-openingDiff)<0.01')],
  ['runtime routes three-statement build to certified model core',runtime.includes('const out=ModelCore.build(m,sd||{})')],
  ['runtime routes model defaults and default-filling to certified model core',runtime.includes('FinancialModelEngine.fillDefaults=(m,sd)=>ModelCore.fillDefaults(m,sd||{})')&&runtime.includes('return ModelCore.defaults(currency)')],
  ['runtime routes XIRR/XNPV to irregular-date certified functions',runtime.includes('XIRR.xnpv=(rate,cashflows,dates)=>Core.xnpv(rate,cashflows,dates)')&&runtime.includes('XIRR.xirr=(cashflows,dates,_guess=.1)=>Core.xirr(cashflows,dates)')],
  ['runtime ECL validates missing/out-of-range values instead of multiplying nulls',runtime.includes("return {pd,recovery,ead,lgd:null,el:null,error:'ECL requires finite PD/recovery in [0,1] and non-negative EAD.'}")],
  ['runtime ECL preserves explicit zero exposure',runtime.includes("Core.isFiniteNumber(face)?face:1000000")],
  ['runtime exposes certified model version',runtime.includes('App.meta.financialModelEngineVersion=ModelCore.VERSION')]
];

const banned=[
  ['legacy empty MACD histogram signature',/hist\s*:\s*\[\s*\]/,engine],
  ['legacy modified-duration annual-yield denominator',/macDur\s*\/\s*\(1\s*\+\s*ytm_?\s*\)/,engine],
  ['legacy CSV falsy date-index check',/if\s*\(\s*!\s*map\.date\b/,engine],
  ['legacy CSV falsy close-index check',/if\s*\(\s*!\s*map\.close\b/,engine],
  ['legacy RSI synthetic RS=100 zero-loss workaround',/l===0\s*\?\s*100\s*:\s*g\/l/,engine],
  ['runtime zero-destroying accounting field coercion',/FinancialRatios[\s\S]{0,300}\|\|\s*null/,runtime],
  ['legacy flat forecast revenue assignment',/const revenue\s*=\s*rev\s*;/,model],
  ['legacy first-row-only debt rate',/rows\[0\]\.rate\s*\|\|\s*0\.05/,model],
  ['legacy hard-coded 65 percent working-capital COGS base',/const cog\s*=\s*revenue\s*\*\s*0\.65/,model],
  ['legacy invented current-liability denominator',/ap\s*\|\|\s*1[\s\S]{0,80}ocl\s*\|\|\s*1/,model],
  ['legacy balance-sheet cash plug',/cash\s*=\s*liabEq\s*-\s*nonCashAssets/,model],
  ['legacy ECL face fallback that destroys zero',/face\s*\|\|\s*1000000/,runtime]
];

let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
for(const [name,re,text] of banned){const ok=!re.test(text);console.log(`${ok?'PASS':'FAIL'} ${name} absent`);if(!ok)failed++;}

const result={positiveChecks:checks.length,bannedPatternChecks:banned.length,total:checks.length+banned.length,failed,status:failed?'FAIL':'PASS'};
console.log(JSON.stringify(result,null,2));
if(failed)process.exit(1);