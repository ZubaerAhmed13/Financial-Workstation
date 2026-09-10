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
  const browserArg=(process.argv.find(a=>a.startsWith('--browser='))||'--browser=chromium').slice('--browser='.length);
  const viewportArg=(process.argv.find(a=>a.startsWith('--viewport='))||'--viewport=desktop').slice('--viewport='.length);
  const launchers={chromium,firefox,webkit};
  if(!launchers[browserArg])throw new Error(`Unsupported browser: ${browserArg}`);
  if(!['desktop','mobile'].includes(viewportArg))throw new Error(`Unsupported viewport: ${viewportArg}`);
  if(!fs.existsSync(target)) throw new Error(`Missing browser-smoke target: ${target}`);

  const browser=await launchers[browserArg].launch({headless:true});
  const mobile=viewportArg==='mobile';
  const page=await browser.newPage({
    viewport:mobile?{width:390,height:844}:{width:1440,height:1000},
    isMobile:mobile,
    hasTouch:mobile
  });
  const pageErrors=[];
  const consoleErrors=[];
  const networkRequests=[];

  page.on('pageerror',err=>pageErrors.push(String(err&&err.stack||err)));
  page.on('console',msg=>{ if(msg.type()==='error') consoleErrors.push(msg.text()); });
  page.on('request',req=>{
    const u=req.url();
    if(/^https?:/i.test(u)) networkRequests.push(u);
  });

  await page.goto(pathToFileURL(target).href,{waitUntil:'load'});
  try{
    await page.waitForFunction(()=>typeof App!=='undefined' && !!globalThis.__FINANCIAL_CERTIFICATION__,null,{timeout:15000});
  }catch(err){
    const readiness=await page.evaluate(()=>({
      appLexical:typeof App!=='undefined',
      appWindow:Object.prototype.hasOwnProperty.call(globalThis,'App'),
      financeCore:typeof FinanceCore!=='undefined',
      financialModelCore:typeof FinancialModelCore!=='undefined',
      legacyCalculationCore:typeof LegacyCalculationCore!=='undefined',
      certification:!!globalThis.__FINANCIAL_CERTIFICATION__,
      readyState:document.readyState,
      bodyChildren:document.body?document.body.children.length:null
    })).catch(e=>({evaluationError:String(e&&e.stack||e)}));
    const failure={status:'FAIL',phase:'readiness',browser:browserArg,viewport:viewportArg,error:String(err&&err.stack||err),readiness,pageErrors,consoleErrors,externalNetworkRequests:[...new Set(networkRequests)]};
    const json=JSON.stringify(failure,null,2)+'\n';
    console.error(json);
    if(outPath){fs.mkdirSync(path.dirname(outPath),{recursive:true});fs.writeFileSync(outPath,json);}
    await browser.close();
    process.exitCode=1;
    return;
  }

  const cert=await page.evaluate(()=>globalThis.__FINANCIAL_CERTIFICATION__);
  if(!cert || !cert.version) throw new Error('Financial certification runtime did not install.');

  const viewIds=await page.$$eval('.view[id^="view-"]',els=>els.map(e=>e.id.slice(5)));
  if(viewIds.length<10) throw new Error(`Expected a substantial workstation; found only ${viewIds.length} views.`);

  let viewsVisited=0;
  let tabsActivated=0;
  const failures=[];

  for(const view of viewIds){
    const result=await page.evaluate((view)=>{
      try{
        if(typeof AppInit==='undefined'||typeof AppInit.go!=='function') return {ok:false,reason:'AppInit.go unavailable'};
        AppInit.go(view);
        const el=document.getElementById(`view-${view}`);
        if(!el) return {ok:false,reason:'view element missing'};
        const style=getComputedStyle(el);
        const visible=!el.classList.contains('hidden') && style.display!=='none' && style.visibility!=='hidden';
        return {ok:visible,reason:visible?'':'view not visible after navigation'};
      }catch(e){ return {ok:false,reason:String(e&&e.stack||e)}; }
    },view);
    await page.waitForTimeout(15);
    if(!result.ok) failures.push(`${view}: ${result.reason}`); else viewsVisited++;

    const tabs=await page.evaluate((view)=>{
      const host=document.getElementById(`view-${view}`);
      return host?Array.from(host.querySelectorAll('.tab')).map((e,i)=>({i,tab:e.dataset.tab||'',text:(e.textContent||'').trim().slice(0,80)})):[];
    },view);
    for(const tab of tabs){
      const r=await page.evaluate(({view,index})=>{
        try{
          const host=document.getElementById(`view-${view}`);
          const els=host?Array.from(host.querySelectorAll('.tab')):[];
          const el=els[index];
          if(!el)return {ok:false,reason:'tab missing'};
          el.click();
          return {ok:el.classList.contains('active'),reason:el.classList.contains('active')?'':'tab did not become active'};
        }catch(e){return {ok:false,reason:String(e&&e.stack||e)};}
      },{view,index:tab.i});
      await page.waitForTimeout(10);
      if(r.ok) tabsActivated++; else failures.push(`${view} tab ${tab.tab||tab.text||tab.i}: ${r.reason}`);
    }
  }

  const criticalGlobals=await page.evaluate(()=>({
    app:typeof App==='object',
    calc:typeof CalcEngine==='object',
    loan:typeof LoanEngine==='object',
    bond:typeof BondEngine==='object',
    valuation:typeof ValuationEngine==='object',
    csv:typeof CsvParser==='object',
    ratios:typeof FinancialRatios==='object',
    financeCore:typeof FinanceCore==='object',
    financialModelCore:typeof FinancialModelCore==='object',
    legacyCalculationCore:typeof LegacyCalculationCore==='object',
    financialModelEngine:typeof FinancialModelEngine==='object',
    stressEngine:typeof StressTestEngine==='object',
    portfolioEngine:typeof PortfolioEngine==='object',
    valuationMatrix:typeof ValuationMatrixV2==='object',
    xirr:typeof XIRR==='object',
    ecl:typeof ECLV2==='object',
    cert:!!globalThis.__FINANCIAL_CERTIFICATION__
  }));
  for(const [k,v] of Object.entries(criticalGlobals)) if(!v) failures.push(`critical global missing: ${k}`);

  const runtimeChecks=await page.evaluate(()=>{
    const out={};
    try{ out.median=FinanceCore.median([1,2,3,4])===2.5; }catch(e){out.median=false;}
    try{ out.npv=Math.abs(LoanEngine.npv([-1000,1100],.1))<1e-9; }catch(e){out.npv=false;}
    try{ const r=LoanEngine.irr([-1000,1100]); out.irr=r!=null&&Math.abs(r-.1)<1e-8; }catch(e){out.irr=false;}
    try{ const d=BondEngine.modifiedDuration(8,0.06,2); out.duration=Math.abs(d-(8/1.03))<1e-12; }catch(e){out.duration=false;}
    try{ const d=CalcEngine.maxDrawdown([100,90,70,80,95,100]); out.recovery=d.recoveryPeriod===3; }catch(e){out.recovery=false;}
    try{ const m=CalcEngine.macd(Array.from({length:80},(_,i)=>100+i),12,26,9); out.macd=Array.isArray(m.hist)&&m.hist.some(Number.isFinite); }catch(e){out.macd=false;}
    try{ const r=CalcEngine.rsi(Array.from({length:30},(_,i)=>i+1),14); out.rsi=r[r.length-1]===100; }catch(e){out.rsi=false;}
    try{ const d=ValuationEngine.dcf({revenue0:100,growth:.05,ebitdaMargin:.2,tax:.2,capexPct:.04,wcPct:.01,dandaPct:.03,wacc:.08,terminalGrowth:.08,netDebt:0,shares:1,horizon:5}); out.dcf=!!d.error; }catch(e){out.dcf=false;}
    try{
      const m=FinancialModelEngine.defaults();m.years=2;m.startYear=2027;m.bs0={revenue:100,cash:10,equity:10};m.growth=[.1,.1];m.tax=[0,0];m.capexPct=[0,0];m.daPct=[0,0];m.dso=[0,0];m.dio=[0,0];m.dpo=[0,0];m.ocaPct=[0,0];m.oclPct=[0,0];m.cogsPct=[.65,.65];m.sgaPct=[.12,.12];m.rndPct=[.03,.03];
      const r=FinancialModelEngine.build(m,{});out.financialModel=Math.abs(r.income[0].revenue-110)<1e-9&&Math.abs(r.income[1].revenue-121)<1e-9&&r.check.ok===true;
    }catch(e){out.financialModel=false;}
    try{ const d0=Date.UTC(2024,0,1),d1=Date.UTC(2024,11,31);const r=XIRR.xirr([-1000,1100],[d0,d1]);out.xirr=r!=null&&Math.abs(r-.1)<1e-8; }catch(e){out.xirr=false;}
    try{ const e=ECLV2.compute(.08,.35,1000);const z=ECLV2.compute(null,.35,1000);out.ecl=e.el===52&&z.el===null&&ECLV2.eadDefault(0,'loan')===0; }catch(e){out.ecl=false;}
    try{
      const old=App.state.results.stock;App.state.results.stock={defaultPD:0};
      const r=StressTestEngine.run({revenue:100,growth:0,ebitdaMargin:.2,tax:0,capexPct:.05,wcPct:.02,dandaPct:.04,wacc:.1,terminalGrowth:.02,netDebt:0,shares:10,horizon:5},[{name:'Control',rev:0,margin:0,wacc:0,pdMult:3,desc:'control'}]);
      out.stress=!!r&&r.base.revenue0===100&&r.base.growth===0&&r.base.tax===0&&r.out[0].pd===0;
      App.state.results.stock=old;
    }catch(e){out.stress=false;}
    try{
      const bad=PortfolioEngine.build([{name:'A',weight:0,expectedReturn:.1,volatility:.2}]);
      const p=PortfolioEngine.build([{name:'Bond',assetClass:'bond',weight:1,expectedReturn:.03,volatility:0}]);
      const s=PortfolioEngine.stress(p,{rate:.02,bondSpread:.03,eq:0,earnings:0});
      out.portfolio=bad===null&&p&&p.vol===0&&p.sharpe===null&&s&&s.totalImpact===0;
    }catch(e){out.portfolio=false;}
    try{
      const old=App.state.results.stock;
      App.state.results.stock={comps:{impliedMean:2,peers:[10,11,12,13]},costEquity:.12};
      const sd={price:100,equity:1000,netIncome:120,shares:100};
      const mx=ValuationMatrixV2.build(sd);
      const comp=mx.methods.find(m=>m.method==='Comparable');
      const ri=mx.methods.find(m=>m.method==='Residual Income');
      const rawRI=FinanceCore.residualIncome({bookValue0:1000,roe:.12,costEquity:.12,horizon:5,terminalRoe:.10,payoutRatio:0,terminalGrowth:0});
      out.valuationMatrix=comp&&comp.value===50&&comp.upside===-.5&&ri&&Math.abs(ri.value-rawRI.value/100)<1e-10;
      App.state.results.stock=old;
    }catch(e){out.valuationMatrix=false;}
    return out;
  });
  for(const [k,v] of Object.entries(runtimeChecks)) if(!v) failures.push(`runtime regression failed: ${k}`);

  const layoutChecks=await page.evaluate((mobile)=>{
    const root=document.documentElement;
    const menu=document.getElementById('menuBtn');
    const sidebar=document.getElementById('sidebar');
    const result={horizontalOverflow:root.scrollWidth>root.clientWidth+2,menuVisible:null,menuOpens:null};
    if(mobile&&menu&&sidebar){
      result.menuVisible=getComputedStyle(menu).display!=='none';
      menu.click();result.menuOpens=sidebar.classList.contains('open');menu.click();
    }
    return result;
  },mobile);
  if(mobile&&layoutChecks.horizontalOverflow)failures.push('mobile body has unexpected horizontal overflow');
  if(mobile&&layoutChecks.menuVisible!==true)failures.push('mobile menu button is not visible');
  if(mobile&&layoutChecks.menuOpens!==true)failures.push('mobile menu does not open sidebar');

  await browser.close();

  const report={
    target:path.basename(target),
    browser:browserArg,
    viewport:viewportArg,
    certificationVersion:cert.version,
    financialModelVersion:cert.modelVersion||null,
    legacyCalculationVersion:cert.legacyVersion||null,
    totalViews:viewIds.length,
    viewsVisited,
    tabsActivated,
    pageErrors,
    consoleErrors,
    externalNetworkRequests:[...new Set(networkRequests)],
    runtimeChecks,
    layoutChecks,
    failures,
    status:(!pageErrors.length&&!consoleErrors.length&&!networkRequests.length&&!failures.length&&viewsVisited===viewIds.length)?'PASS':'FAIL'
  };
  const json=JSON.stringify(report,null,2)+'\n';
  console.log(json);
  if(outPath){fs.mkdirSync(path.dirname(outPath),{recursive:true});fs.writeFileSync(outPath,json);}

  if(pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.length}`);
  if(consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.length}`);
  if(networkRequests.length) throw new Error(`Unexpected external network requests: ${[...new Set(networkRequests)].join(', ')}`);
  if(failures.length) throw new Error(`Browser smoke failures: ${failures.length}`);
  if(viewsVisited!==viewIds.length) throw new Error(`Visited ${viewsVisited}/${viewIds.length} views.`);
})();