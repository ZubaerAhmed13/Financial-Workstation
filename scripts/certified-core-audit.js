'use strict';

const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const engine=fs.readFileSync(path.join(root,'src/finance/engine.js'),'utf8');
const model=fs.readFileSync(path.join(root,'src/finance/model-engine.js'),'utf8');
const legacy=fs.readFileSync(path.join(root,'src/finance/legacy-hardening.js'),'utf8');
const risk=fs.readFileSync(path.join(root,'src/finance/risk-credit-core.js'),'utf8');
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
  ['runtime ECL preserves explicit zero exposure',runtime.includes("Core.isFiniteNumber(face)&&face>=0?face:null")],
  ['runtime exposes certified model version',runtime.includes('App.meta.financialModelEngineVersion=ModelCore.VERSION')],

  ['stress normalization accepts revenue when revenue0 is absent',legacy.includes("const revenue0=has(sd,'revenue0')?sd.revenue0:sd.revenue;")],
  ['stress defaults preserve explicit zero-valued assumptions',legacy.includes("const pick=(o,k,fallback)=>has(o,k)?o[k]:fallback;")],
  ['stress PD preserves an explicit zero base probability',legacy.includes("const defaultPD=has(options,'defaultPD')?options.defaultPD:.05;")],
  ['stress downside guards a zero base valuation denominator',legacy.includes('Math.abs(basePerShare)>EPS?val/basePerShare-1:null')],
  ['portfolio rejects a zero total weight before normalization',legacy.includes('if(!finite(totalWeight)||totalWeight<=EPS)return null;')],
  ['portfolio validates finite non-negative weight return and volatility inputs',legacy.includes('!finite(item.weight)||item.weight<0||!finite(item.expectedReturn)||!finite(item.volatility)||item.volatility<0')],
  ['portfolio variance explicitly uses the stated pairwise correlation',legacy.includes('variance+=2*rho*weights[i]*weights[j]*clean[i].volatility*clean[j].volatility;')],
  ['portfolio stress uses actual volatility without a synthetic fallback',legacy.includes('shock-=rate*item.volatility;')&&legacy.includes('shock-=bondSpread*item.volatility;')],
  ['comparable valuation converts the relative multiple to fair price',legacy.includes('const value=finite(implied)&&implied>EPS?price/implied:null;')],
  ['residual-income valuation converts total equity value to per-share value',legacy.includes('const value=ri.value/shares;')],
  ['value-driver sensitivity uses explicit base values and a real base-value denominator',legacy.includes('[key]:base[key]-delta')&&legacy.includes('Math.abs(high.perShare-low.perShare)/Math.abs(baseDCF.perShare)')],
  ['runtime routes stress portfolio and valuation matrix to legacy hardening core and exposes its version',runtime.includes('LegacyCore.stressRun')&&runtime.includes('LegacyCore.portfolioBuild')&&runtime.includes('LegacyCore.portfolioStress')&&runtime.includes('LegacyCore.valuationMatrix')&&runtime.includes('App.meta.legacyCalculationCoreVersion=LegacyCore.VERSION')],

  ['risk core supports arbitrary confidence through inverse-normal quantile',risk.includes('function normalInvCDF(p)')&&risk.includes('const z=normalInvCDF(1-confidence);')],
  ['historical VaR uses interpolated empirical quantiles',risk.includes('const h=(a.length-1)*p')&&risk.includes('return quantile(returns,1-confidence);')],
  ['expected shortfall handles fractional tail mass',risk.includes('const mass=(1-confidence)*a.length;')&&risk.includes('if(frac>EPS)sum+=a[Math.min(whole,a.length-1)]*frac;')],
  ['Monte Carlo risk validates a positive current-value denominator',risk.includes('!finite(currentValue)||currentValue<=0')],
  ['risk cadence is inferred from timestamp spacing',risk.includes("periodsPerYear=252;label='daily';")&&risk.includes("periodsPerYear=52;label='weekly';")&&risk.includes("periodsPerYear=12;label='monthly';")],
  ['risk summary annualizes Sharpe by square-root frequency',risk.includes('(mu-rfPerPeriod)/sd*Math.sqrt(periodsPerYear)')],
  ['risk summary preserves zero-volatility Sharpe as missing',risk.includes('sd!=null&&sd>EPS?')],
  ['Altman ratios use finite zero-preserving division',risk.includes('function ratio(n,d){return finite(n)&&finite(d)&&Math.abs(d)>EPS?n/d:null;}')],
  ['credit PD interpolation uses actual horizon weight',risk.includes('const w=(horizon-h0)/(h1-h0);return p0+w*(p1-p0);')],
  ['credit PD does not extrapolate outside configured horizons',risk.includes('horizon<pts[0][0]||horizon>pts[pts.length-1][0]')],
  ['Merton validates finite positive horizon and core inputs',risk.includes('![E,sigmaE,D,r,T].every(finite)||E<=0||D<=0||sigmaE<=0||T<=0')],
  ['Merton solves asset value with bounded bisection',risk.includes('function solveAssetValue(E,sigmaV,D,r,T)')&&risk.includes('for(let i=0;i<160;i++){')],
  ['Merton requires residual convergence before returning PD',risk.includes("if(!converged)return {error:'Merton solver did not converge to the requested tolerance.'")&&risk.includes('Math.abs(residualEquity)<1e-7&&Math.abs(residualVol)<1e-7')],
  ['Merton diagnostics carry real distance-to-default and PD',risk.includes('distanceToDefault:finite(x.distanceToDefault)?x.distanceToDefault:null')&&risk.includes('pd:finite(x.pd)?x.pd:null')],
  ['runtime routes VaR and Expected Shortfall to RiskCreditCore',runtime.includes('RiskMetricsV2.historicalVaR=(returns,conf)=>RiskCore.historicalVaR(returns,conf)')&&runtime.includes('RiskMetricsV2.expectedShortfall=(returns,conf)=>RiskCore.expectedShortfall(returns,conf)')],
  ['runtime routes Altman Merton and rating PD to RiskCreditCore',runtime.includes('CreditModels.altmanZ=(f)=>RiskCore.altmanZ(f||{})')&&runtime.includes('CreditModels.merton=(E,sigmaE,D,r,T)=>RiskCore.merton(E,sigmaE,D,r,T)')&&runtime.includes('CreditModels.ratingPD=(rating,horizon,table)=>RiskCore.ratingPD')],
  ['runtime routes credit curve and Merton diagnostics to RiskCreditCore',runtime.includes('CreditCurveV2.curve=(rating)=>RiskCore.creditCurve')&&runtime.includes('MertonDiag.trace=(E,sigmaE,D,r,T)=>RiskCore.mertonTrace(E,sigmaE,D,r,T)')],
  ['runtime ECL no longer invents missing exposure',runtime.includes("ECLV2.eadDefault=(face,_exposureType)=>Core.isFiniteNumber(face)&&face>=0?face:null")],
  ['runtime exposes risk-credit core version',runtime.includes('riskCreditVersion:RiskCore?RiskCore.VERSION:null')&&runtime.includes('App.meta.riskCreditCoreVersion=RiskCore.VERSION')]
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
  ['legacy ECL face fallback that destroys zero',/face\s*\|\|\s*1000000/,runtime],
  ['legacy stress revenue0-only eligibility guard',/sd\.revenue0==null/,legacy],
  ['legacy stress truthy tax default',/sd\.tax\s*\|\|\s*\.21/,legacy],
  ['legacy stress truthy PD fallback',/basePD\s*\|\|\s*\.05/,legacy],
  ['legacy portfolio synthetic five-percent volatility fallback',/volatility\s*\|\|\s*0\.05/,legacy],
  ['legacy comparable valuation current-price collapse',/impliedMean>0\?\s*sd\.price/,legacy],
  ['legacy residual-income total-value versus per-share comparison',/ri\.value\s*\/\s*sd\.price/,legacy],
  ['legacy value-driver unit denominator fallback',/baseVal\s*\|\|\s*1/,legacy],
  ['risk core hard-coded 95/99 normal quantile branch',/conf===0\.99\?2\.326/,risk],
  ['risk core unguarded Monte Carlo current-value division',/return \(val\/currentValue\)-1/,risk],
  ['risk core midpoint-only 7-year PD interpolation',/\(p5\+p10\)\/2/,risk],
  ['risk core Merton truthiness-only input guard',/!E\|\|!D\|\|!sigmaE/,risk],
  ['runtime synthetic one-million EAD fallback',/:1000000/,runtime]
];

let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
for(const [name,re,text] of banned){const ok=!re.test(text);console.log(`${ok?'PASS':'FAIL'} ${name} absent`);if(!ok)failed++;}

const result={positiveChecks:checks.length,bannedPatternChecks:banned.length,total:checks.length+banned.length,failed,status:failed?'FAIL':'PASS'};
console.log(JSON.stringify(result,null,2));
if(failed)process.exit(1);
