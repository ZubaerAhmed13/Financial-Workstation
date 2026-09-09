'use strict';

const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');

(async()=>{
  const target=path.resolve(process.argv[2]||'dist/index.html');
  if(!fs.existsSync(target)) throw new Error(`Missing browser-smoke target: ${target}`);

  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
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
  await page.waitForFunction(()=>typeof globalThis.App!=='undefined' && !!globalThis.__FINANCIAL_CERTIFICATION__,null,{timeout:15000});

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

    const tabs=await page.$$eval(`#view-${CSS.escape(view)} .tab`,els=>els.map((e,i)=>({i,tab:e.dataset.tab||'',text:(e.textContent||'').trim().slice(0,80)})));
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
    bond:typeof BondEngine==='object',
    valuation:typeof ValuationEngine==='object',
    csv:typeof CsvParser==='object',
    ratios:typeof FinancialRatios==='object',
    financeCore:typeof FinanceCore==='object',
    cert:!!globalThis.__FINANCIAL_CERTIFICATION__
  }));
  for(const [k,v] of Object.entries(criticalGlobals)) if(!v) failures.push(`critical global missing: ${k}`);

  const runtimeChecks=await page.evaluate(()=>{
    const out={};
    try{ out.median=FinanceCore.median([1,2,3,4])===2.5; }catch(e){out.median=false;}
    try{ const d=BondEngine.modifiedDuration(8,0.06,2); out.duration=Math.abs(d-(8/1.03))<1e-12; }catch(e){out.duration=false;}
    try{ const d=CalcEngine.maxDrawdown([100,90,70,80,95,100]); out.recovery=d.recoveryPeriod===3; }catch(e){out.recovery=false;}
    try{ const m=CalcEngine.macd(Array.from({length:80},(_,i)=>100+i),12,26,9); out.macd=Array.isArray(m.hist)&&m.hist.some(Number.isFinite); }catch(e){out.macd=false;}
    try{ const r=CalcEngine.rsi(Array.from({length:30},(_,i)=>i+1),14); out.rsi=r[r.length-1]===100; }catch(e){out.rsi=false;}
    try{ const d=ValuationEngine.dcf({revenue0:100,growth:.05,ebitdaMargin:.2,tax:.2,capexPct:.04,wcPct:.01,dandaPct:.03,wacc:.08,terminalGrowth:.08,netDebt:0,shares:1,horizon:5}); out.dcf=!!d.error; }catch(e){out.dcf=false;}
    return out;
  });
  for(const [k,v] of Object.entries(runtimeChecks)) if(!v) failures.push(`runtime regression failed: ${k}`);

  await browser.close();

  const report={
    target:path.basename(target),
    certificationVersion:cert.version,
    totalViews:viewIds.length,
    viewsVisited,
    tabsActivated,
    pageErrors,
    consoleErrors,
    externalNetworkRequests:[...new Set(networkRequests)],
    runtimeChecks,
    failures
  };
  console.log(JSON.stringify(report,null,2));

  if(pageErrors.length) throw new Error(`Browser page errors: ${pageErrors.length}`);
  if(consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.length}`);
  if(networkRequests.length) throw new Error(`Unexpected external network requests: ${[...new Set(networkRequests)].join(', ')}`);
  if(failures.length) throw new Error(`Browser smoke failures: ${failures.length}`);
  if(viewsVisited!==viewIds.length) throw new Error(`Visited ${viewsVisited}/${viewIds.length} views.`);
})();
