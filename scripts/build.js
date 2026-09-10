'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const indexPath=path.join(root,'index.html');
const distDir=path.join(root,'dist');
const distPath=path.join(distDir,'index.html');
const engine=fs.readFileSync(path.join(root,'src/finance/engine.js'),'utf8').trim();
const modelEngine=fs.readFileSync(path.join(root,'src/finance/model-engine.js'),'utf8').trim();
const legacyEngine=fs.readFileSync(path.join(root,'src/finance/legacy-hardening.js'),'utf8').trim();
const riskCreditEngine=fs.readFileSync(path.join(root,'src/finance/risk-credit-core.js'),'utf8').trim();
const workstationEngine=fs.readFileSync(path.join(root,'src/finance/workstation-core.js'),'utf8').trim();
const workstationLedgerEngine=fs.readFileSync(path.join(root,'src/finance/workstation-ledger-core.js'),'utf8').trim();
const simulationBacktestEngine=fs.readFileSync(path.join(root,'src/finance/simulation-backtest-core.js'),'utf8').trim();
const installer=fs.readFileSync(path.join(root,'src/runtime/install.js'),'utf8').trim();
const workstationInstaller=fs.readFileSync(path.join(root,'src/runtime/install-workstation.js'),'utf8').trim();
let html=fs.readFileSync(indexPath,'utf8');

const START='/* FINANCIAL_CERTIFICATION_RUNTIME_START */';
const END='/* FINANCIAL_CERTIFICATION_RUNTIME_END */';
const block=`${START}\n${engine}\n${modelEngine}\n${legacyEngine}\n${riskCreditEngine}\n${workstationEngine}\n${workstationLedgerEngine}\n${simulationBacktestEngine}\n${installer}\n${workstationInstaller}\n${END}\n`;
const existing=new RegExp(escapeRegExp(START)+'[\\s\\S]*?'+escapeRegExp(END)+'\\n?','g');
html=html.replace(existing,'');

// Remove an injected Cloudflare challenge payload found in the repository artifact.
html=html.replace(/\n?<script>\(function\(\)\{function c\(\)\{var b=a\.contentDocument[\s\S]*?<\/script>(?=<\/body>)/g,'');

const legacySvgFactory='const el=(tag,attrs)=>Object.assign(document.createElementNS(NS,tag),attrs);';
const safeSvgFactory='const el=(tag,attrs={})=>{ const node=document.createElementNS(NS,tag); for(const [k,v] of Object.entries(attrs)){ if(v!=null) node.setAttribute(k,String(v)); } return node; };';
let svgFactoryPatches=0;
html=html.replace(legacySvgFactory,()=>{svgFactoryPatches++;return safeSvgFactory;});
if(svgFactoryPatches<1 && !html.includes(safeSvgFactory)) throw new Error('Build refused: ChartManager SVG factory was not found or already hardened in an unexpected form.');

const legacyMixColor=/function mixColor\(a,b,t\)\{ const p=hex=>\[parseInt\(hex\.slice\(1,3\),16\),parseInt\(hex\.slice\(3,5\),16\),parseInt\(hex\.slice\(5,7\),16\)\]; const ca=p\(a\),cb=p\(b\); return "rgb\("\+Math\.round\(lerp\(ca\[0\],cb\[0\],t\)\)\+","\+Math\.round\(lerp\(ca\[1\],cb\[1\],t\)\)\+","\+Math\.round\(lerp\(ca\[2\],cb\[2\],t\)\)\+"\)"; \}/g;
const safeMixColor='function mixColor(a,b,t){ const p=hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]; const ca=p(a),cb=p(b); const lerp=(x,y,u)=>x+(y-x)*u; return "rgb("+Math.round(lerp(ca[0],cb[0],t))+","+Math.round(lerp(ca[1],cb[1],t))+","+Math.round(lerp(ca[2],cb[2],t))+")"; }';
let mixColorPatches=0;
html=html.replace(legacyMixColor,()=>{mixColorPatches++;return safeMixColor;});
if(mixColorPatches<1 && !html.includes(safeMixColor)) throw new Error('Build refused: heatmap mixColor scope defect was not found or already hardened in an unexpected form.');

let durationPatches=0;
html=html.replace(/BondEngine\.modifiedDuration\(mac,ytm\)/g,()=>{durationPatches++;return 'BondEngine.modifiedDuration(mac,ytm,freq)';});
html=html.replace(/rec\+"d"/g,'rec+" obs"');
html=html.replace(/<tr><td>EBITDA margin %<\/td>/g,'<tr><td>EBITDA margin target %</td>');

const legacyDebtRead='rate:(Number($("#d_"+i+"_r").value)||5)/100';
const safeDebtRead='rate:(()=>{const v=Number($("#d_"+i+"_r").value);return Number.isFinite(v)?v/100:.05;})()';
let debtRatePatches=0;
html=html.replaceAll(legacyDebtRead,safeDebtRead);debtRatePatches=(html.includes(safeDebtRead)?1:0);
if(!debtRatePatches)throw new Error('Build refused: zero-preserving debt-rate reader was not installed.');

const legacyCov='function readCov(){ const fm=App.state.fm; fm.covenants={debtEbitda:Number($("#cov_de").value)||4, ic:Number($("#cov_ic").value)||3, currentRatio:Number($("#cov_cr").value)||1, minCash:Number($("#cov_mc").value)||0}; }';
const safeCov='function readCov(){ const fm=App.state.fm; const n=(id,fb)=>{const el=$(id);const raw=el?el.value:null;if(raw==null||String(raw).trim()==="")return fb;const v=Number(raw);return Number.isFinite(v)?v:fb;}; fm.covenants={debtEbitda:n("#cov_de",4), ic:n("#cov_ic",3), currentRatio:n("#cov_cr",1), minCash:n("#cov_mc",0)}; }';
let covenantPatches=0;
if(html.includes(legacyCov)){html=html.replace(legacyCov,safeCov);covenantPatches=1;}else if(html.includes(safeCov)){covenantPatches=1;}
if(!covenantPatches)throw new Error('Build refused: zero-preserving covenant reader was not installed.');

const legacyPortfolioRead='const w=(Number($("#pw_"+i).value)||0)/100; return {name:inv.name,type:inv.type,assetClass:inv.type,weight:w,expectedReturn:inv.metrics.expectedReturn||0,volatility:inv.metrics.volatility||.2,sector:inv.type,country:"—",currency:App.state.settings.currency};';
const safePortfolioRead='const rawW=Number($("#pw_"+i).value); const w=Number.isFinite(rawW)?rawW/100:NaN; return {name:inv.name,type:inv.type,assetClass:inv.type,weight:w,expectedReturn:inv.metrics.expectedReturn!=null?inv.metrics.expectedReturn:null,volatility:inv.metrics.volatility!=null?inv.metrics.volatility:null,sector:inv.type,country:"—",currency:App.state.settings.currency};';
let portfolioInputPatches=0;
if(html.includes(legacyPortfolioRead)){html=html.replace(legacyPortfolioRead,safePortfolioRead);portfolioInputPatches=1;}else if(html.includes(safePortfolioRead)){portfolioInputPatches=1;}
if(!portfolioInputPatches)throw new Error('Build refused: portfolio numeric input boundary was not hardened.');

const legacyPortfolioRender='function renderPortfolio(port){ if(!port)return; ';
const safePortfolioRender='function renderPortfolio(port){ if(!port){ const o=$("#pfOut"); if(o)o.innerHTML=`<div class="banner warn">Portfolio calculation requires positive total weight and finite expected-return/volatility inputs for every included asset.</div>`; return; } ';
let portfolioRenderPatches=0;
if(html.includes(legacyPortfolioRender)){html=html.replace(legacyPortfolioRender,safePortfolioRender);portfolioRenderPatches=1;}else if(html.includes(safePortfolioRender)){portfolioRenderPatches=1;}
if(!portfolioRenderPatches)throw new Error('Build refused: portfolio validation feedback was not installed.');

const legacyRiskBlock=/const vol=CalcEngine\.annualizeVol\(CalcEngine\.stdev\(rets\),252\); const mdd=CalcEngine\.maxDrawdown\(closes\);\s*res\.risk\.volatility=vol; res\.risk\.annualizedReturn=CalcEngine\.annualize\(CalcEngine\.mean\(rets\),252\); res\.risk\.maxDrawdown=mdd\.mdd; res\.risk\.periods=rets\.length;\s*res\.risk\.sharpe=CalcEngine\.sharpe\(rets,\(d\.rf\?\?\.03\)\/252\); res\.risk\.sortino=CalcEngine\.sortino\(rets,\(d\.rf\?\?\.03\)\/252\);\s*res\.risk\.volReturns=rets; res\.risk\.closes=closes;\s*if\(b\)\{ res\.risk\.beta=CalcEngine\.beta\(rets,b\); res\.risk\.alpha=CalcEngine\.alpha\(rets,b,\(d\.rf\?\?\.03\)\/252\); \}\s*res\.risk\.benchmarkReturns=b;/g;
const safeRiskBlock='const periodicity=CalcEngine.inferPeriodsPerYear(App.state.history.prices); const ppy=periodicity.periodsPerYear||252; const riskSummary=CalcEngine.riskSummary(rets,ppy,d.rf??.03,b); const vol=riskSummary?riskSummary.annualizedVolatility:null; const mdd=CalcEngine.maxDrawdown(closes);\n    res.risk.volatility=vol; res.risk.annualizedReturn=riskSummary?riskSummary.annualizedReturn:null; res.risk.maxDrawdown=mdd.mdd; res.risk.periods=rets.length; res.risk.periodsPerYear=ppy; res.risk.periodLabel=periodicity.periodsPerYear?periodicity.label:"daily-fallback"; res.risk.frequencySource=periodicity.periodsPerYear?periodicity.source:"fallback-252";\n    res.risk.sharpe=riskSummary?riskSummary.sharpe:null; res.risk.sortino=riskSummary?riskSummary.sortino:null;\n    res.risk.volReturns=rets; res.risk.closes=closes;\n    if(b&&riskSummary){ res.risk.beta=riskSummary.beta; res.risk.alpha=riskSummary.alpha; }\n    res.risk.benchmarkReturns=b;';
let riskFrequencyPatches=0;
html=html.replace(legacyRiskBlock,()=>{riskFrequencyPatches++;return safeRiskBlock;});
if(!riskFrequencyPatches && html.includes('frequencySource=periodicity.periodsPerYear?periodicity.source:"fallback-252"'))riskFrequencyPatches=1;
if(!riskFrequencyPatches)throw new Error('Build refused: timestamp-aware risk annualization boundary was not installed.');

const legacyEclPd='(r.merton&&r.merton.pd? r.merton.pd: CreditModels.ratingPD(rating,1))';
const safeEclPd='(r.merton&&r.merton.pd!=null? r.merton.pd: CreditModels.ratingPD(rating,1))';
const legacyEclEad='const ead= App.state.stockData&&App.state.stockData.debt!=null? App.state.stockData.debt:1000000;';
const safeEclEad='const ead= App.state.stockData&&App.state.stockData.debt!=null? App.state.stockData.debt:null;';
const legacyEclPct='fmt.pct(ecl.el/ecl.ead,2)+" of EAD"';
const safeEclPct='ecl.el!=null&&ecl.ead>0?fmt.pct(ecl.el/ecl.ead,2)+" of EAD":ecl.ead===0?"0 exposure":"—"';
let eclBoundaryPatches=0;
if(html.includes(legacyEclPd)){html=html.replaceAll(legacyEclPd,safeEclPd);eclBoundaryPatches++;}
if(html.includes(legacyEclEad)){html=html.replaceAll(legacyEclEad,safeEclEad);eclBoundaryPatches++;}
if(html.includes(legacyEclPct)){html=html.replaceAll(legacyEclPct,safeEclPct);eclBoundaryPatches++;}
if(!html.includes(safeEclPd)||!html.includes(safeEclEad)||!html.includes(safeEclPct))throw new Error('Build refused: zero/missing-safe ECL UI boundary was not installed.');

const legacyMertonWaterfall='pr.mertonDiag?{distanceToDefault:pr.mertonDiag?0:0,pd:pr.pd}:null';
const safeMertonWaterfall='pr.mertonDiag?{distanceToDefault:pr.mertonDiag.distanceToDefault,pd:pr.pd}:null';
let mertonWaterfallPatches=0;
if(html.includes(legacyMertonWaterfall)){html=html.replaceAll(legacyMertonWaterfall,safeMertonWaterfall);mertonWaterfallPatches=1;}else if(html.includes(safeMertonWaterfall)){mertonWaterfallPatches=1;}
if(!mertonWaterfallPatches)throw new Error('Build refused: Merton distance-to-default report propagation was not installed.');

// Scenario probabilities: zero is a real probability, not missing data.
const legacyScenarioProbability='prob:s.prob||null';
const safeScenarioProbability='prob:s.prob??null';
let scenarioProbabilityPatches=0;
if(html.includes(legacyScenarioProbability)){html=html.replaceAll(legacyScenarioProbability,safeScenarioProbability);scenarioProbabilityPatches=1;}else if(html.includes(safeScenarioProbability)){scenarioProbabilityPatches=1;}
if(!scenarioProbabilityPatches)throw new Error('Build refused: zero-preserving scenario probability route was not installed.');

// Valuation uncertainty previously passed `margin`, which certified DCF ignores; route the
// intended EBITDA-margin shocks and refuse a fabricated denominator at zero central value.
const valuationMarginRepairs=[
  ['growth:g*.9,margin:m*.9','growth:g*.9,ebitdaMargin:m*.9'],
  ['growth:g*1.1,margin:m*1.1','growth:g*1.1,ebitdaMargin:m*1.1'],
  ['growth:g,margin:m,wacc:w','growth:g,ebitdaMargin:m,wacc:w']
];
let valuationUncertaintyPatches=0;
for(const [bad,good] of valuationMarginRepairs){if(html.includes(bad)){html=html.replaceAll(bad,good);valuationUncertaintyPatches++;}else if(html.includes(good))valuationUncertaintyPatches++;}
const legacyDisp='const disp=(bull.hi-bear.lo)/(Math.abs(central)||1);';
const safeDisp='const disp=Number.isFinite(central)&&Math.abs(central)>1e-12?(bull.hi-bear.lo)/Math.abs(central):null;';
if(html.includes(legacyDisp)){html=html.replaceAll(legacyDisp,safeDisp);valuationUncertaintyPatches++;}else if(html.includes(safeDisp))valuationUncertaintyPatches++;
const legacyConf='const conf= Math.max(0,Math.min(100,Math.round(80 - disp*20 + (suff-50)*0.3)));';
const safeConf='const conf= disp==null?0:Math.max(0,Math.min(100,Math.round(80 - disp*20 + (suff-50)*0.3)));';
if(html.includes(legacyConf)){html=html.replaceAll(legacyConf,safeConf);valuationUncertaintyPatches++;}else if(html.includes(safeConf))valuationUncertaintyPatches++;
if(valuationUncertaintyPatches<5)throw new Error('Build refused: valuation-uncertainty EBITDA-margin/denominator repairs were not installed.');

// Final calculation-layer boundary: nested calculations inside render closures.
const legacyPeriodReturns='function periodReturnsArray(snaps2){ const a=[]; for(let i=1;i<snaps2.length;i++){ const s=snaps2[i-1].mv||0; const e=snaps2[i].mv||0; const f=snaps2[i].cashFlow||0; if(s>0)a.push((e-f)/s-1); } return a; }';
const safePeriodReturns='function periodReturnsArray(snaps2){ return (typeof WorkstationCalculationCore!=="undefined"?WorkstationCalculationCore.periodReturnsFromSnapshots(snaps2):null)||[]; }';
let periodReturnPatches=0;if(html.includes(legacyPeriodReturns)){html=html.replaceAll(legacyPeriodReturns,safePeriodReturns);periodReturnPatches=1;}else if(html.includes(safePeriodReturns)){periodReturnPatches=1;}
if(!periodReturnPatches)throw new Error('Build refused: nested portfolio period-return route was not installed.');
const legacyBenchmarkReturns='const portRets=[]; for(let i=1;i<snaps.length;i++){ const start=snaps[i-1].mv||0, end=snaps[i].mv||0, flow=snaps[i].cashFlow||0; if(start>0)portRets.push((end-flow)/start-1); }';
const safeBenchmarkReturns='const portRets=(typeof WorkstationCalculationCore!=="undefined"?WorkstationCalculationCore.periodReturnsFromSnapshots(snaps):null)||[];';
let benchmarkReturnPatches=0;if(html.includes(legacyBenchmarkReturns)){html=html.replaceAll(legacyBenchmarkReturns,safeBenchmarkReturns);benchmarkReturnPatches=1;}else if(html.includes(safeBenchmarkReturns)){benchmarkReturnPatches=1;}
if(!benchmarkReturnPatches)throw new Error('Build refused: benchmark portfolio-return route was not installed.');

const legacySegmentCalc='const out=segs.map(s=>{ const revs=[]; let r=total*s.share; for(let y=0;y<ny;y++){ revs.push(r); r*=(1+(s.growth[y]||0)); } return {name:s.name,revs,margins:s.margin}; });\n    // total forecast\n    const totalRevs=Array(ny).fill(0); const totalEbitda=Array(ny).fill(0);\n    out.forEach(s=>{ s.revs.forEach((v,y)=>{ totalRevs[y]+=v; totalEbitda[y]+=v*(s.margins[y]||0); }); });\n    App.state.segmentForecast={segments:out,totalRevs,totalEbitda,startYear:seg.startYear};';
const safeSegmentCalc='const segCalc=WorkstationCalculationCore.segmentForecast(total,segs,ny);\n    if(!segCalc){ $("#segOut").innerHTML=`<div class="banner warn">Segment forecast requires finite non-negative revenue/shares and finite growth/margin assumptions for every year.</div>`; return; }\n    const out=segCalc.segments,totalRevs=segCalc.totalRevs,totalEbitda=segCalc.totalEbitda;\n    App.state.segmentForecast={segments:out,totalRevs,totalEbitda,startYear:seg.startYear,shareTotal:segCalc.shareTotal,shareReconciles:segCalc.shareReconciles};';
let segmentCalcPatches=0;if(html.includes(legacySegmentCalc)){html=html.replace(legacySegmentCalc,safeSegmentCalc);segmentCalcPatches=1;}else if(html.includes(safeSegmentCalc)){segmentCalcPatches=1;}
if(!segmentCalcPatches)throw new Error('Build refused: segment forecast core delegation was not installed.');

const legacySotpBlock='const shares=Number($("#sotp_shares").value)||1;\n    const parts=sotp.parts.map((p,i)=>{ const value=Number($("#sotp_"+i+"_value")?.value)||0; const mult=Number($("#sotp_"+i+"_mult")?.value)||1; const metric=Number($("#sotp_"+i+"_metric")?.value)||0; return {name:$("#sotp_"+i+"_name")?.value||p.name, value: value!==0? value: mult*metric, mult, metric}; });\n    sotp.parts=parts; sotp.shares=shares;\n    const totalEV=parts.reduce((a,b)=>a+b.value,0);\n    const equityValue=totalEV-(sd.netDebt||0);\n    const perShare= shares>0? equityValue/shares:0;\n    App.state.sotpResult={parts,totalEV,equityValue,perShare,shares};';
const safeSotpBlock='const sharesRaw=$("#sotp_shares").value; const shares=String(sharesRaw).trim()===""?NaN:Number(sharesRaw);\n    const rawParts=sotp.parts.map((p,i)=>{ const raw=$("#sotp_"+i+"_value")?.value; const value=raw==null||String(raw).trim()===""?null:Number(raw); const mult=Number($("#sotp_"+i+"_mult")?.value); const metric=Number($("#sotp_"+i+"_metric")?.value); return {name:$("#sotp_"+i+"_name")?.value||p.name,value:Number.isFinite(value)?value:null,multiple:mult,metric}; });\n    const netDebt=Number.isFinite(sd.netDebt)?sd.netDebt:((Number.isFinite(sd.debt)?sd.debt:0)-(Number.isFinite(sd.cash)?sd.cash:0));\n    const sotpCalc=WorkstationCalculationCore.sumOfParts(rawParts,netDebt,shares);\n    if(!sotpCalc){ $("#sotpOut").innerHTML=`<div class="banner warn">SOTP requires positive diluted shares and a finite explicit value or finite multiple × metric for every part.</div>`; return; }\n    const parts=sotpCalc.parts,totalEV=sotpCalc.totalEV,equityValue=sotpCalc.equityValue,perShare=sotpCalc.perShare;\n    sotp.parts=parts; sotp.shares=shares;\n    App.state.sotpResult={parts,totalEV,equityValue,perShare,shares,netDebt};';
let sotpCalcPatches=0;if(html.includes(legacySotpBlock)){html=html.replace(legacySotpBlock,safeSotpBlock);sotpCalcPatches=1;}else if(html.includes(safeSotpBlock)){sotpCalcPatches=1;}
if(!sotpCalcPatches)throw new Error('Build refused: SOTP core delegation was not installed.');
html=html.replaceAll('fmt.money(sd.netDebt||0)','fmt.money(netDebt)');

const initNeedle='window.addEventListener("DOMContentLoaded",init);';
if(!html.includes(initNeedle)) throw new Error('Build refused: DOMContentLoaded init anchor not found.');
html=html.replace(initNeedle,block+initNeedle);
if(durationPatches<1 && !html.includes('BondEngine.modifiedDuration(mac,ytm,freq)')) throw new Error('Build refused: modified-duration UI call site was not patched.');

fs.mkdirSync(distDir,{recursive:true});
fs.writeFileSync(distPath,html);
if(process.argv.includes('--write-root')) fs.writeFileSync(indexPath,html);
console.log(JSON.stringify({output:path.relative(root,distPath),bytes:Buffer.byteLength(html),durationPatches,svgFactoryPatches,mixColorPatches,debtRatePatches,covenantPatches,portfolioInputPatches,portfolioRenderPatches,riskFrequencyPatches,eclBoundaryPatches,mertonWaterfallPatches,scenarioProbabilityPatches,valuationUncertaintyPatches,periodReturnPatches,benchmarkReturnPatches,segmentCalcPatches,sotpCalcPatches,simulationBacktestEmbedded:true,rootUpdated:process.argv.includes('--write-root')},null,2));

function escapeRegExp(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
