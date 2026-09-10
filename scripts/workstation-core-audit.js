'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const W=fs.readFileSync(path.join(root,'src/finance/workstation-core.js'),'utf8');
const L=fs.readFileSync(path.join(root,'src/finance/workstation-ledger-core.js'),'utf8');
const R=fs.readFileSync(path.join(root,'src/runtime/install-workstation.js'),'utf8');
const B=fs.readFileSync(path.join(root,'scripts/build.js'),'utf8');

const checks=[
 ['workstation calculation core is versioned',W.includes("const VERSION='1.0.0'" )],
 ['weight normalization rejects zero total',W.includes('if(!finite(total)||total<=EPS)return null;')],
 ['similarity skips invalid/non-positive feature weights',W.includes('if(!finite(w)||w<=0)continue;')],
 ['data-quality case sample is proportional',W.includes("add(10,Math.min(1,matches/10),'Small case-match sample.')")],
 ['peer coverage treats finite zeroes as present',W.includes('if(p&&finite(p.growth))covered++')&&W.includes('if(p&&finite(p.multiple))covered++')],
 ['attribution requires explicit finite benchmark',W.includes('if(!norm||!finite(benchmarkRet))return null;')],
 ['attribution does not fabricate selection',W.includes('selectionEffect:null')],
 ['risk contribution rejects missing volatility',W.includes('if(items.some(x=>!finite(x.volatility)||x.volatility<0))return null;')],
 ['correlation matrix validates range symmetry and diagonal',W.includes("corr[i][j]<-1||corr[i][j]>1")&&W.includes('Math.abs(corr[i][i]-1)>1e-8')],
 ['SOTP preserves explicit zero values',W.includes("const value=has(p,'value')?p.value:null")],
 ['SOTP requires positive shares',W.includes('!finite(shares)||shares<=EPS')],
 ['Monte Carlo validates initial capital and seed inputs',W.includes('!finite(initial)||initial<=0')&&W.includes('!Number.isInteger(seed)')],
 ['snapshot return removes external cash flow',W.includes('const r=(end-flow)/start-1;')],
 ['performance risk requires explicit positive frequency',W.includes('!finite(periodsPerYear)||periodsPerYear<=0')],
 ['capture ratios validate aligned arrays',W.includes('portRet.length!==benchRet.length')],
 ['workstation ledger core is versioned',L.includes("const VERSION='1.0.0'" )],
 ['ledger supports production grossDividend field',L.includes("finite(tx.grossDividend)" )],
 ['ledger preserves zero withholding',L.includes("has(tx,'withholdingTax')?tx.withholdingTax")],
 ['BUY validates positive quantity and price',L.includes("type==='BUY'")&&L.includes('!finite(q)||q<=0||!finite(p)||p<=0')],
 ['SELL caps oversells and emits warning',L.includes('LEDGER-OVERSELL-CAPPED')&&L.includes('Math.min(pos.quantity,q)')],
 ['withdrawal uses signed amount directly',L.includes("type==='WITHDRAWAL'")&&L.includes('addCash(cur,amount);')],
 ['split rejects non-positive ratio',L.includes('!finite(ratio)||ratio<=0')],
 ['market value separates current FX from FX basis',L.includes('baseMV=localMV*e.fxRate')&&L.includes('baseCost=p.costBasis*fxBasis')],
 ['runtime routes similarity engine',R.includes('SimilarityEngine.simScore=')&&R.includes('SimilarityEngine.matchReference=')],
 ['runtime routes scoring engines',R.includes('DataQualityEngine.score=')&&R.includes('ScoringEngine.score=')&&R.includes('PeerSimilarity.score=')],
 ['runtime routes advanced portfolio analytics',R.includes("mark('factorExposure')")&&R.includes("mark('performanceAttribution')")&&R.includes('RiskContribution.compute=')],
 ['runtime routes all four optimizers',R.includes('PortfolioOptimizers.equalWeight=')&&R.includes('PortfolioOptimizers.minimumVariance=')&&R.includes('PortfolioOptimizers.maximumSharpe=')&&R.includes('PortfolioOptimizers.riskParity=')],
 ['runtime routes transaction ledger',R.includes('wsCalculateFromLedger=')&&R.includes('L.calculateLedger')],
 ['runtime routes signed FX conversion',R.includes('wsFxConvert=')&&R.includes('W.fxConvert(amount,meta.rate)')],
 ['runtime routes portfolio market value and cash',R.includes('wsMarketValue=')&&R.includes('wsCashSummary=')],
 ['runtime routes TWR MWR risk and capture',R.includes('wsTWR=')&&R.includes('wsMWR=')&&R.includes('wsPerfRisk=')&&R.includes('wsCaptureRatios=')],
 ['runtime exposes both workstation core versions',R.includes('workstationVersion:W.VERSION')&&R.includes('workstationLedgerVersion:L?L.VERSION:null')],
 ['build embeds workstation calculation core',B.includes("src/finance/workstation-core.js")],
 ['build embeds workstation ledger core',B.includes("src/finance/workstation-ledger-core.js")],
 ['build embeds workstation runtime installer',B.includes("src/runtime/install-workstation.js")],
 ['build delegates nested segment forecast',B.includes('WorkstationCalculationCore.segmentForecast(total,segs,ny)')],
 ['build delegates nested SOTP',B.includes('WorkstationCalculationCore.sumOfParts(rawParts,netDebt,shares)')],
 ['build delegates nested snapshot returns',B.includes('WorkstationCalculationCore.periodReturnsFromSnapshots(snaps2)')],
 ['build fixes valuation uncertainty EBITDA margin key',B.includes('ebitdaMargin:m*.9')&&B.includes('ebitdaMargin:m*1.1')],
 ['build guards zero valuation uncertainty denominator',B.includes('Number.isFinite(central)&&Math.abs(central)>1e-12')],
 ['build preserves zero scenario probability',B.includes('prob:s.prob??null')]
];
const banned=[
 ['hidden 20 percent volatility fallback in workstation risk contribution',/volatility\s*:\s*0\.2|volatility\)\?[^\n]*0\.2/,W],
 ['truthy benchmark default in workstation attribution',/benchmarkRet\s*\|\|\s*0\.08/,W],
 ['duplicated selection attribution in workstation core',/selectionEffect\s*:\s*allocationProxy/,W],
 ['ledger withdrawal subtracts a signed negative amount',/WITHDRAWAL[\s\S]{0,300}addCash\(cur,-amount\)/,L],
 ['ledger synthetic split fallback through truthiness',/splitRatio\s*\|\|\s*2/,L],
 ['runtime invents 20 percent volatility',/volatility\s*\|\|\s*\.2/,R],
 ['runtime defaults benchmark to 8 percent',/benchmarkRet\s*\|\|\s*\.08/,R],
 ['build retains valuation uncertainty margin typo',/growth:g\*\.9,margin:m\*\.9|growth:g\*1\.1,margin:m\*1\.1/,B],
 ['build retains fabricated central-value denominator',/Math\.abs\(central\)\|\|1/,B],
 ['build retains truthy scenario probability coercion',/prob:s\.prob\|\|null/,B]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
for(const [name,re,text] of banned){const ok=!re.test(text);console.log(`${ok?'PASS':'FAIL'} ${name} absent`);if(!ok)failed++;}
const result={positiveChecks:checks.length,bannedPatternChecks:banned.length,total:checks.length+banned.length,failed,status:failed?'FAIL':'PASS'};
console.log(JSON.stringify(result,null,2));
if(failed)process.exit(1);
