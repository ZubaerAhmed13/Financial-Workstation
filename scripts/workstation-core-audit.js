'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const W=fs.readFileSync(path.join(root,'src/finance/workstation-core.js'),'utf8');
const L=fs.readFileSync(path.join(root,'src/finance/workstation-ledger-core.js'),'utf8');
const S=fs.readFileSync(path.join(root,'src/finance/simulation-backtest-core.js'),'utf8');
const R=fs.readFileSync(path.join(root,'src/runtime/install-workstation.js'),'utf8');
const B=fs.readFileSync(path.join(root,'scripts/build.js'),'utf8');

const backtestApply=S.indexOf('stratVal=Math.max(0,stratVal*(1+curPos*marketReturn));');
const backtestRebalance=S.indexOf('if(i%rebalanceEvery===0)');
const checks=[
 ['workstation calculation core is versioned',W.includes("const VERSION='1.0.0'")],
 ['weight normalization rejects zero total',W.includes('if(!finite(total)||total<=EPS)return null;')],
 ['similarity skips invalid/non-positive feature weights',W.includes('if(!finite(w)||w<=0)continue;')],
 ['data-quality case sample is proportional',W.includes("add(10,Math.min(1,matches/10),'Small case-match sample.')")],
 ['peer coverage treats finite zeroes as present',W.includes('if(p&&finite(p.growth))covered++')&&W.includes('if(p&&finite(p.multiple))covered++')],
 ['attribution requires explicit finite benchmark',W.includes('if(!norm||!finite(benchmarkRet))return null;')],
 ['attribution does not fabricate selection',W.includes('selectionEffect:null')],
 ['risk contribution rejects missing volatility',W.includes('if(items.some(x=>!finite(x.volatility)||x.volatility<0))return null;')],
 ['correlation matrix validates range symmetry and diagonal',W.includes('corr[i][j]<-1||corr[i][j]>1')&&W.includes('Math.abs(corr[i][i]-1)>1e-8')],
 ['SOTP preserves explicit zero values',W.includes("if(has(p,'value')&&p.value!=null)")],
 ['SOTP requires positive shares',W.includes('!finite(shares)||shares<=0')],
 ['snapshot return removes external cash flow',W.includes('out.push((cur.mv-flow)/prev.mv-1);')],
 ['performance risk requires explicit positive frequency',W.includes('!finite(annualFactor)||annualFactor<=0')],
 ['capture ratios validate aligned arrays',W.includes('portReturns.length!==benchReturns.length')],
 ['workstation ledger core is versioned',L.includes("const VERSION='1.0.0'")],
 ['ledger supports production grossDividend field',L.includes('finite(tx.grossDividend)')],
 ['ledger preserves zero withholding',L.includes("has(tx,'withholdingTax')?tx.withholdingTax")],
 ['BUY validates positive quantity and price',L.includes("type==='BUY'")&&L.includes('!finite(q)||q<=0||!finite(p)||p<=0')],
 ['SELL caps oversells and emits warning',L.includes('LEDGER-OVERSELL-CAPPED')&&L.includes('Math.min(pos.quantity,q)')],
 ['withdrawal uses signed amount directly',L.includes("type==='WITHDRAWAL'")&&L.includes('addCash(cur,amount);')],
 ['split rejects non-positive ratio',L.includes('!finite(ratio)||ratio<=0')],
 ['market value separates current FX from FX basis',L.includes('baseMV=localMV*e.fxRate')&&L.includes('baseCost=p.costBasis*fxBasis')],
 ['simulation/backtest core is versioned',S.includes("const VERSION='1.0.0'")],
 ['Monte Carlo preserves explicit zero return and volatility',S.includes("has(cfg,'expectedReturn')?cfg.expectedReturn:.10")&&S.includes("has(cfg,'volatility')?cfg.volatility:.25")],
 ['Monte Carlo rejects non-positive initial capital',S.includes('!finite(initial)||initial<=0')],
 ['Monte Carlo validates deterministic integer seed',S.includes('!Number.isInteger(seed)')&&S.includes('mulberry32(seed)')],
 ['backtest rejects non-positive initial capital and rebalance interval',S.includes('initialCapital<=0')&&S.includes('!Number.isInteger(rebalanceEvery)||rebalanceEvery<=0')],
 ['backtest applies held position before observing current-close rebalance',backtestApply>=0&&backtestRebalance>backtestApply],
 ['backtest keeps filtered signal aligned to original price indices',S.includes('userSignal[entry.originalIndex]')],
 ['backtest charges two-sided turnover on position flips',S.includes('Math.abs(newPos-curPos)')&&S.includes('stratVal=Math.max(0,stratVal-cost)')],
 ['backtest infers annualization from timestamp cadence',S.includes('const cadence=inferPeriodsPerYear(series)')&&S.includes('annualizationFactor=cadence.periodsPerYear||252')],
 ['benchmark active return compares CAGR on matching units',S.includes('activeRet=cagr==null?null:cagr-benchmarkCagr')],
 ['runtime routes similarity engine',R.includes('SimilarityEngine.simScore=')&&R.includes('SimilarityEngine.matchReference=')],
 ['runtime routes scoring engines',R.includes('DataQualityEngine.score=')&&R.includes('ScoringEngine.score=')&&R.includes('PeerSimilarity.score=')],
 ['runtime routes advanced portfolio analytics',R.includes("mark('factorExposure')")&&R.includes("mark('performanceAttribution')")&&R.includes('RiskContribution.compute=')],
 ['runtime routes all four optimizers',R.includes('PortfolioOptimizers.equalWeight=')&&R.includes('PortfolioOptimizers.minimumVariance=')&&R.includes('PortfolioOptimizers.maximumSharpe=')&&R.includes('PortfolioOptimizers.riskParity=')],
 ['runtime routes Monte Carlo and Backtest',R.includes('MonteCarlo.run=cfg=>S.monteCarloRun(cfg)')&&R.includes('BacktestEngine.run=cfg=>S.backtestRun(cfg)')],
 ['runtime routes transaction ledger',R.includes('wsCalculateFromLedger=')&&R.includes('L.calculateLedger')],
 ['runtime routes signed FX conversion',R.includes('wsFxConvert=')&&R.includes('W.fxConvert(amount,meta.rate)')],
 ['runtime routes portfolio market value and cash',R.includes('wsMarketValue=')&&R.includes('wsCashSummary=')],
 ['runtime routes TWR MWR risk and capture',R.includes('wsTWR=')&&R.includes('wsMWR=')&&R.includes('wsPerfRisk=')&&R.includes('wsCaptureRatios=')],
 ['runtime exposes all final core versions',R.includes('workstationVersion:W.VERSION')&&R.includes('workstationLedgerVersion:L?L.VERSION:null')&&R.includes('simulationBacktestVersion:S?S.VERSION:null')],
 ['build embeds workstation calculation core',B.includes('src/finance/workstation-core.js')],
 ['build embeds workstation ledger core',B.includes('src/finance/workstation-ledger-core.js')],
 ['build embeds simulation/backtest core',B.includes('src/finance/simulation-backtest-core.js')&&B.includes('${simulationBacktestEngine}')],
 ['build embeds workstation runtime installer',B.includes('src/runtime/install-workstation.js')],
 ['build delegates nested segment forecast',B.includes('WorkstationCalculationCore.segmentForecast(total,segs,ny)')],
 ['build delegates nested SOTP',B.includes('WorkstationCalculationCore.sumOfParts(rawParts,netDebt,shares)')],
 ['build delegates nested snapshot returns',B.includes('WorkstationCalculationCore.periodReturnsFromSnapshots(snaps2)')],
 ['build defines valuation uncertainty EBITDA margin repair',B.includes("'growth:g*.9,margin:m*.9','growth:g*.9,ebitdaMargin:m*.9'")&&B.includes("'growth:g*1.1,margin:m*1.1','growth:g*1.1,ebitdaMargin:m*1.1'")],
 ['build defines zero-safe valuation denominator repair',B.includes('Number.isFinite(central)&&Math.abs(central)>1e-12')],
 ['build defines zero-preserving scenario probability repair',B.includes("safeScenarioProbability='prob:s.prob??null'")]
];
const banned=[
 ['hidden 20 percent volatility fallback in workstation risk contribution',/volatility\s*:\s*0\.2|volatility\)\?[^\n]*0\.2/,W],
 ['truthy benchmark default in workstation attribution',/benchmarkRet\s*\|\|\s*0\.08/,W],
 ['duplicated selection attribution in workstation core',/selectionEffect\s*:\s*allocationProxy/,W],
 ['ledger withdrawal subtracts a signed negative amount',/WITHDRAWAL[\s\S]{0,300}addCash\(cur,-amount\)/,L],
 ['ledger synthetic split fallback through truthiness',/splitRatio\s*\|\|\s*2/,L],
 ['Monte Carlo truthy initial-capital fallback',/initial\s*\|\|\s*100/,S],
 ['backtest truthy initial-capital fallback',/initialCapital\s*\|\|\s*100000/,S],
 ['backtest truthy rebalance fallback',/rebalanceEvery\s*\|\|\s*1/,S],
 ['runtime invents 20 percent volatility',/volatility\s*\|\|\s*\.2/,R],
 ['runtime defaults benchmark to 8 percent',/benchmarkRet\s*\|\|\s*\.08/,R]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
for(const [name,re,text] of banned){const ok=!re.test(text);console.log(`${ok?'PASS':'FAIL'} ${name} absent`);if(!ok)failed++;}
const result={positiveChecks:checks.length,bannedPatternChecks:banned.length,total:checks.length+banned.length,failed,status:failed?'FAIL':'PASS'};
console.log(JSON.stringify(result,null,2));
if(failed)process.exit(1);
