'use strict';
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium,firefox,webkit}=require('playwright');
(async()=>{
  const positional=process.argv.slice(2).filter(a=>!a.startsWith('--'));
  const target=path.resolve(positional[0]||'dist/index.html');
  const outArg=process.argv.find(a=>a.startsWith('--write='));
  const outPath=outArg?path.resolve(outArg.slice('--write='.length)):null;
  const browserName=(process.argv.find(a=>a.startsWith('--browser='))||'--browser=chromium').slice(10);
  const viewportName=(process.argv.find(a=>a.startsWith('--viewport='))||'--viewport=desktop').slice(11);
  const launchers={chromium,firefox,webkit};if(!launchers[browserName])throw new Error('Unsupported browser '+browserName);
  if(!fs.existsSync(target))throw new Error('Missing target '+target);
  const mobile=viewportName==='mobile';
  const browser=await launchers[browserName].launch({headless:true});
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});
  const pageErrors=[],consoleErrors=[],network=[];
  page.on('pageerror',e=>pageErrors.push(String(e&&e.stack||e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  page.on('request',r=>{if(/^https?:/i.test(r.url()))network.push(r.url());});
  await page.goto(pathToFileURL(target).href,{waitUntil:'load'});
  await page.waitForFunction(()=>globalThis.__FINANCIAL_CERTIFICATION__&&typeof WorkstationCalculationCore==='object'&&typeof WorkstationLedgerCore==='object'&&typeof SimulationBacktestCore==='object',null,{timeout:15000});
  const results=await page.evaluate(()=>{
    const near=(a,b,t=1e-8)=>a!=null&&Math.abs(a-b)<=t;
    const out={};
    try{out.versions=__FINANCIAL_CERTIFICATION__.workstationVersion==='1.0.0'&&__FINANCIAL_CERTIFICATION__.workstationLedgerVersion==='1.0.0'&&__FINANCIAL_CERTIFICATION__.simulationBacktestVersion==='1.0.0'&&App.meta.workstationCalculationCoreVersion==='1.0.0'&&App.meta.workstationLedgerCoreVersion==='1.0.0'&&App.meta.simulationBacktestCoreVersion==='1.0.0';}catch(e){out.versions=false;}
    try{const x=DataQualityEngine.score({history:{prices:Array(120).fill(1)},financials:{assets:1,netIncome:1},dcf:{wacc:.1,perShare:1},peers:[{},{},{}],caseMatches:[{}],dataOk:true});out.dataQuality=x.score===91;}catch(e){out.dataQuality=false;}
    try{const x=PeerSimilarity.score([{marketCap:1,growth:0,margin:0,roe:0,multiple:0}]);out.peerZeroCoverage=x.score===100;}catch(e){out.peerZeroCoverage=false;}
    try{const x=performanceAttribution([{name:'A',weight:1,expectedReturn:.1}],0);out.attribution=x&&x.benchmark===0&&x.selectionEffect===null&&near(x.activeReturn,.1);}catch(e){out.attribution=false;}
    try{out.riskContribution=RiskContribution.compute({items:[{weight:.5,volatility:null},{weight:.5,volatility:.2}]})===null;}catch(e){out.riskContribution=false;}
    try{const w=PortfolioOptimizers.maximumSharpe([{expectedReturn:.06,volatility:.1},{expectedReturn:.12,volatility:.2}],undefined,.02);out.optimizer=Array.isArray(w)&&near(w.reduce((s,v)=>s+v,0),1)&&w.every(v=>v>=0);}catch(e){out.optimizer=false;}
    try{const x=wsCalculateFromLedger({transactions:[{date:'2026-01-01',type:'DEPOSIT',amount:100,currency:'EUR'},{date:'2026-02-01',type:'WITHDRAWAL',amount:-25,currency:'EUR'}]});out.withdrawal=x&&x.cash&&x.cash.EUR===75;}catch(e){out.withdrawal=false;}
    try{const x=wsDividendAmounts({grossDividend:100,withholdingTax:0});out.dividend=x&&x.gross===100&&x.net===100&&x.withholding===0;}catch(e){out.dividend=false;}
    try{const s=[{date:'2024-01-01',mv:100},{date:'2024-12-31',mv:110,cashFlow:0}];out.performance=near(wsTWR(s),.1)&&near(wsMWR(s),.1)&&wsPerfRisk([.01,.02],0)===null;}catch(e){out.performance=false;}
    try{const x=WorkstationCalculationCore.segmentForecast(100,[{name:'A',share:1,growth:[.1,.1],margin:[0,0]}],2);out.segment=x&&near(x.totalRevs[0],100)&&near(x.totalRevs[1],110)&&x.totalEbitda[0]===0;}catch(e){out.segment=false;}
    try{const x=WorkstationCalculationCore.sumOfParts([{name:'A',value:0,multiple:10,metric:5}],0,10);out.sotp=x&&x.totalEV===0&&x.perShare===0;}catch(e){out.sotp=false;}
    try{const x=MonteCarlo.run({initial:100,expectedReturn:0,volatility:0,horizonYears:1,simulations:20,seed:7,target:100,stepsPerYear:12});out.monteCarlo=x&&x.median===100&&x.min===100&&x.max===100&&x.pTarget===1;}catch(e){out.monteCarlo=false;}
    try{const p=Array.from({length:30},(_,i)=>({date:Date.UTC(2026,0,1)+i*86400000,close:i===0?100:110})),sig=Array(30).fill(1);sig[0]=0;const x=BacktestEngine.run({prices:p,signal:sig,initialCapital:100000,transactionCost:0,slippage:0,rebalanceEvery:1});out.backtest=x&&x.available===true&&x.equityCurve[1]===100000&&x.annualizationFactor===252;}catch(e){out.backtest=false;}
    try{const p=Array.from({length:30},(_,i)=>({date:Date.UTC(2026,0,1)+i*7*86400000,close:100+i}));const x=BacktestEngine.run({prices:p,signal:Array(30).fill(0),transactionCost:0,slippage:0});out.backtestCadence=x&&x.available===true&&x.annualizationFactor===52;}catch(e){out.backtestCadence=false;}
    try{out.routes=__FINANCIAL_CERTIFICATION__.workstationInstalled.includes('MonteCarlo.run')&&__FINANCIAL_CERTIFICATION__.workstationInstalled.includes('BacktestEngine.run')&&__FINANCIAL_CERTIFICATION__.workstationInstalled.includes('wsCalculateFromLedger');}catch(e){out.routes=false;}
    return out;
  });
  const failures=Object.entries(results).filter(([,v])=>v!==true).map(([k])=>k);
  if(pageErrors.length)failures.push('pageErrors');if(consoleErrors.length)failures.push('consoleErrors');if(network.length)failures.push('externalNetwork');
  const report={target:path.basename(target),browser:browserName,viewport:viewportName,checks:results,checkCount:Object.keys(results).length,pageErrors,consoleErrors,externalNetworkRequests:[...new Set(network)],failures,status:failures.length?'FAIL':'PASS'};
  const json=JSON.stringify(report,null,2)+'\n';console.log(json);if(outPath){fs.mkdirSync(path.dirname(outPath),{recursive:true});fs.writeFileSync(outPath,json);}
  await browser.close();if(failures.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1);});
