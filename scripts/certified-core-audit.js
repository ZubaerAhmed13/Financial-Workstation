'use strict';

const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const engine=fs.readFileSync(path.join(root,'src/finance/engine.js'),'utf8');
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
  ['runtime routes LoanEngine NPV to certified core',/LoanEngine\.npv=\(flows,rate\)=>Core\.npv\(flows,rate\)/.test(runtime)],
  ['runtime routes LoanEngine IRR to certified core',/LoanEngine\.irr=\(flows,_guess=\.1\)=>Core\.irr\(flows\)/.test(runtime)],
  ['runtime routes DCF to certified core',/ValuationEngine\.dcf=\(opts\)=>Core\.dcf\(opts\)/.test(runtime)],
  ['runtime routes technical indicators to certified core',/CalcEngine\.rsi=.*Core\.rsi/.test(runtime)&&/Core\.macd/.test(runtime)],
  ['runtime routes financial ratios to certified core',/FinancialRatios\.compute=\(f\)=>Core\.financialRatios/.test(runtime)],
  ['runtime exposes immutable certification report',/Object\.freeze\(installReport\)/.test(runtime)]
];

const banned=[
  ['legacy empty MACD histogram signature',/hist\s*:\s*\[\s*\]/,engine],
  ['legacy modified-duration annual-yield denominator',/macDur\s*\/\s*\(1\s*\+\s*ytm_?\s*\)/,engine],
  ['legacy CSV falsy date-index check',/if\s*\(\s*!\s*map\.date\b/,engine],
  ['legacy CSV falsy close-index check',/if\s*\(\s*!\s*map\.close\b/,engine],
  ['legacy RSI synthetic RS=100 zero-loss workaround',/l===0\s*\?\s*100\s*:\s*g\/l/,engine],
  ['runtime zero-destroying accounting field coercion',/FinancialRatios[\s\S]{0,300}\|\|\s*null/,runtime]
];

let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
for(const [name,re,text] of banned){const ok=!re.test(text);console.log(`${ok?'PASS':'FAIL'} ${name} absent`);if(!ok)failed++;}

const result={positiveChecks:checks.length,bannedPatternChecks:banned.length,total:checks.length+banned.length,failed,status:failed?'FAIL':'PASS'};
console.log(JSON.stringify(result,null,2));
if(failed)process.exit(1);
