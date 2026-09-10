'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'dist/index.html');
if(!fs.existsSync(file))throw new Error('Missing dist/index.html');
const html=fs.readFileSync(file,'utf8');
const checks=[
 ['WorkstationCalculationCore embedded',html.includes('root.WorkstationCalculationCore=api')],
 ['WorkstationLedgerCore embedded',html.includes('root.WorkstationLedgerCore=api')],
 ['workstation runtime installer embedded',html.includes('workstationInstalled:Object.freeze(installed.slice())')],
 ['workstation calculation version exposed',html.includes('App.meta.workstationCalculationCoreVersion=W.VERSION')],
 ['workstation ledger version exposed',html.includes('App.meta.workstationLedgerCoreVersion=L.VERSION')],
 ['similarity engine routed',html.includes('SimilarityEngine.simScore=')&&html.includes('SimilarityEngine.matchReference=')],
 ['data quality and preference scoring routed',html.includes('DataQualityEngine.score=ctx=>W.dataQualityScore(ctx)')&&html.includes('ScoringEngine.score=')],
 ['peer coverage routed',html.includes('PeerSimilarity.score=peers=>W.peerDataCoverage(peers)')],
 ['advanced factor exposure routed',html.includes('factorExposure=items=>W.factorExposure(items)')],
 ['performance attribution routed',html.includes('performanceAttribution=(items,benchmarkRet)=>W.performanceAttribution(items,benchmarkRet)')],
 ['risk contribution routed',html.includes('RiskContribution.compute=(port,corr)=>W.riskContribution(port,corr)')],
 ['portfolio optimizers routed',html.includes('PortfolioOptimizers.minimumVariance=')&&html.includes('PortfolioOptimizers.maximumSharpe=')&&html.includes('PortfolioOptimizers.riskParity=')],
 ['ledger calculation routed',html.includes('wsCalculateFromLedger=(ws,_opts)=>L.calculateLedger')],
 ['signed FX conversion routed',html.includes('W.fxConvert(amount,meta.rate)')],
 ['market value and cash summary routed',html.includes('wsMarketValue=()=>')&&html.includes('wsCashSummary=()=>')],
 ['TWR and MWR routed',html.includes('wsTWR=snapshots=>W.timeWeightedReturnFromSnapshots(snapshots)')&&html.includes('wsMWR=snapshots=>W.moneyWeightedReturnFromSnapshots(snapshots)')],
 ['performance risk and capture routed',html.includes('wsPerfRisk=(returns,annualFactor)=>W.performanceRisk')&&html.includes('wsCaptureRatios=(p,b,a)=>')],
 ['nested period-return helper delegated',html.includes('WorkstationCalculationCore.periodReturnsFromSnapshots(snaps2)')],
 ['benchmark period returns delegated',html.includes('WorkstationCalculationCore.periodReturnsFromSnapshots(snaps)')],
 ['segment forecast delegated',html.includes('WorkstationCalculationCore.segmentForecast(total,segs,ny)')],
 ['segment invalid-input warning embedded',html.includes('Segment forecast requires finite non-negative revenue/shares and finite growth/margin assumptions for every year.')],
 ['SOTP delegated',html.includes('WorkstationCalculationCore.sumOfParts(rawParts,netDebt,shares)')],
 ['SOTP invalid-input warning embedded',html.includes('SOTP requires positive diluted shares and a finite explicit value or finite multiple × metric for every part.')],
 ['scenario probability preserves zero',html.includes('prob:s.prob??null')],
 ['truthy scenario probability removed',!html.includes('prob:s.prob||null')],
 ['valuation uncertainty uses EBITDA-margin parameter',html.includes('growth:g*.9,ebitdaMargin:m*.9')&&html.includes('growth:g*1.1,ebitdaMargin:m*1.1')],
 ['valuation uncertainty margin typo removed',!html.includes('growth:g*.9,margin:m*.9')&&!html.includes('growth:g*1.1,margin:m*1.1')],
 ['valuation uncertainty zero denominator guarded',html.includes('Number.isFinite(central)&&Math.abs(central)>1e-12?(bull.hi-bear.lo)/Math.abs(central):null')],
 ['withdrawal correction code embedded',html.includes("type==='WITHDRAWAL'")&&html.includes('addCash(cur,amount);')],
 ['oversell protection embedded',html.includes('LEDGER-OVERSELL-CAPPED')],
 ['production dividend grossDividend support embedded',html.includes('finite(tx.grossDividend)')],
 ['legacy and workstation installers occur inside certification block',html.indexOf('root.WorkstationCalculationCore=api')>html.indexOf('FINANCIAL_CERTIFICATION_RUNTIME_START')&&html.indexOf('workstationInstalled:Object.freeze(installed.slice())')<html.indexOf('FINANCIAL_CERTIFICATION_RUNTIME_END')],
 ['workstation installer follows legacy certification installer',html.indexOf('workstationInstalled:Object.freeze(installed.slice())')>html.indexOf('Object.freeze(installReport)')]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
const result={checks:checks.length,failed,status:failed?'FAIL':'PASS',bytes:Buffer.byteLength(html)};
console.log(JSON.stringify(result,null,2));if(failed)process.exit(1);
