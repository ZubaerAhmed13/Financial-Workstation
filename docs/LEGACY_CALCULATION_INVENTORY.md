# Legacy Calculation Inventory

Generated mechanically from the production source to support the final modularization pass. This is an engineering inventory, not a certification claim.

- Source: `index.html`
- Target names: **36**
- Located occurrences: **69**

## simScore — line 1556 — owner `stats`

```js
 1548 |   function buildDB(count=10000,seed=42,includeReal=true){ const db=[]; for(let i=0;i<count;i++) db.push(genCase(seed+i*7919, i+1)); return includeReal? db.concat(REAL_CASES):db; }
 1549 |   return {buildDB,genCase,mulberry32,REAL_CASES};
 1550 | })();
 1551 | 
 1552 | const SimilarityEngine=(()=>{
 1553 |   const FEATURES=["profitMargin","revenueGrowth","de","currentRatio","interestCov","pe","pb","evEbitda","volatility","beta","roe","roa","fcfMargin","divYield","size","grossMargin","assetTurnover","debtEbitda"];
 1554 |   const defaultWeights={profitMargin:.12,revenueGrowth:.16,de:.16,currentRatio:.08,interestCov:.08,pe:.04,pb:.02,evEbitda:.02,volatility:.08,beta:.04,roe:.04,roa:.02,fcfMargin:.06,divYield:.01,size:.03,grossMargin:.06,assetTurnover:.03,debtEbitda:.05};
 1555 |   function standardize(cases){ const stats={}; FEATURES.forEach(f=>{ const vals=cases.map(c=>c.features[f]).filter(v=>v!=null&&isFinite(v)); const m=CalcEngine.mean(vals), s=CalcEngine.stdev(vals,0)||1; stats[f]={m,s}; }); return stats; }
 1556 |   function simScore(query, c, stats, weights){
 1557 |     let sim=0,wsum=0;
 1558 |     for(const f of FEATURES){ const w=weights[f]; if(!w) continue; const q=query.features[f]; const v=c.features[f]; if(q==null||v==null) continue;
 1559 |       const s=stats[f]; if(!s) continue; const dz=Math.abs((q-s.m)/s.s-(v-s.m)/s.s); sim+=w*Math.exp(-dz); wsum+=w; }
 1560 |     return wsum>0? sim/wsum : 0;
 1561 |   }
 1562 |   function match(query, cases, weights, mode, k){
 1563 |     weights=weights||defaultWeights; k=k||10;
 1564 |     let pool=cases;
 1565 |     if(mode==="strict"){ pool=cases.filter(c=>c.type===query.type); }
 1566 |     // broad = all same-type or include all
 1567 |     const stats=standardize(pool);
 1568 |     const scored=pool.map(c=>({case:c, sim:simScore(query,c,stats,weights)}));
 1569 |     scored.sort((a,b)=>b.sim-a.sim);
 1570 |     return {matches:scored.slice(0,k), total:pool.length, stats, weights};
 1571 |   }
 1572 |   function normalizeWeights(weights){ const total=Object.values(weights).reduce((s,v)=>s+v,0); const out={}; for(const k in weights) out[k]= weights[k]/total; return out; }
 1573 |   // Match against a specific set of reference cases (e.g. the famous real cases)
 1574 |   function matchReference(query, refCases, weights, k){
 1575 |     weights=weights||defaultWeights; k=k||3;
 1576 |     const stats=standardize(refCases);
 1577 |     const scored=refCases.map(c=>({case:c, sim:simScore(query,c,stats,weights)}));
 1578 |     scored.sort((a,b)=>b.sim-a.sim);
 1579 |     return scored.slice(0,k);
 1580 |   }
 1581 |   return {match,simScore,standardize,FEATURES,defaultWeights,normalizeWeights,matchReference};
 1582 | })();
 1583 | 
```

## score — line 1919 — owner `DataQualityEngine`

```js
 1911 |     if(ctx.valuation && ctx.valuation.mos!=null && ctx.valuation.mos>.2) flags.push({level:"good",text:`Positive margin of safety (${fmt.pct(ctx.valuation.mos)}).`});
 1912 |     if(ctx.npv!=null && ctx.npv>0) flags.push({level:"good",text:`Positive NPV (${fmt.money(ctx.npv)}).`});
 1913 |     if(ctx.irr!=null && ctx.hurdle!=null && ctx.irr>ctx.hurdle) flags.push({level:"good",text:`IRR (${fmt.pct(ctx.irr)}) above hurdle rate (${fmt.pct(ctx.hurdle)}).`});
 1914 |     return flags; }
 1915 |   return {scan};
 1916 | })();
 1917 | 
 1918 | const DataQualityEngine=(()=>{
 1919 |   function score(ctx){
 1920 |     let score=0, total=0, reasons=[];
 1921 |     const add=(weight,good,msg)=>{ total+=weight; if(good) score+=weight; else reasons.push(msg); };
 1922 |     add(20, !!ctx.history && ctx.history.prices && ctx.history.prices.length>=120, "Limited historical price series (fewer than ~120 observations).");
 1923 |     add(15, !!ctx.financials && ctx.financials.assets!=null && ctx.financials.netIncome!=null, "Financial statements incomplete.");
 1924 |     add(20, !!ctx.dcf && ctx.dcf.wacc!=null && isFinite(ctx.dcf.perShare), "Valuation model(s) unavailable or incomplete.");
 1925 |     add(15, !!ctx.peers && ctx.peers.length>=3, "Few or no comparable companies entered.");
 1926 |     add(10, ctx.caseMatches && ctx.caseMatches.length>0, "No similar historical (synthetic) cases matched.");
 1927 |     add(10, ctx.caseMatches? Math.min(1, ctx.caseMatches.length/10):0, "Small case-match sample.");
 1928 |     add(10, ctx.dataOk!==false, "Some inputs failed validation.");
 1929 |     const s= total>0? Math.round(score/total*100):0;
 1930 |     const label= s>=80?"High": s>=60?"Moderate": s>=40?"Low":"Very Low";
 1931 |     return {score:s,label,reasons};
 1932 |   }
 1933 |   return {score};
 1934 | })();
 1935 | 
 1936 | /* Hierarchical assessment framework */
 1937 | const AssessmentEngine=(()=>{
 1938 |   function overall(ctx){
 1939 |     const parts={};
 1940 |     // Tier1 data quality
 1941 |     const dq=DataQualityEngine.score(ctx); parts.dataQuality={label:dq.label, score:dq.score, reasons:dq.reasons};
 1942 |     // Tier2 financial health
 1943 |     let health;
 1944 |     if(!ctx.financials || ctx.financials.netMargin==null){ health="Unknown"; }
 1945 |     else { let hp=0; const nm=ctx.financials.netMargin, de=ctx.financials.debtEquity, cr=ctx.financials.currentRatio;
 1946 |       if(nm>0.10)hp+=3; else if(nm>0)hp+=2; else hp+=0;
```

## score — line 2008 — owner `DEFAULT_W`

```js
 2000 |     return {conflict:false, note:`Model agreement is ${valid.length===attractive?"high":over>0?"moderate":"mixed"}.`};
 2001 |   }
 2002 |   return {detect};
 2003 | })();
 2004 | 
 2005 | /* Preference scoring */
 2006 | const ScoringEngine=(()=>{
 2007 |   const DEFAULT_W={return:30,safety:30,valuation:20,liquidity:10,historical:10};
 2008 |   function score(metrics, weights){
 2009 |     weights=weights||DEFAULT_W; const total=Object.values(weights).reduce((s,v)=>s+v,0);
 2010 |     let s=0; const detail=[];
 2011 |     const push=(key,label,val,maxVal,minVal)=>{ if(val==null){return;} const w=weights[key]||0; const norm= maxVal-minVal>0? (Math.max(minVal,Math.min(maxVal,val))-minVal)/(maxVal-minVal):.5; s+= w/total*norm*100; detail.push({label,value:val,weight:w,normalized:norm}); };
 2012 |     push("return", "Expected return", metrics.expectedReturn, .5, -.3);
 2013 |     push("safety", "Safety (1 - default PD)", metrics.safety, 1, 0);
 2014 |     push("valuation", "Margin of safety", metrics.marginOfSafety, .5, -.5);
 2015 |     push("liquidity", "Liquidity score", metrics.liquidity, 1, 0);
 2016 |     push("historical", "Case outcome score", metrics.historical, 1, 0);
 2017 |     return {score:Math.round(s), detail, weights};
 2018 |   }
 2019 |   return {score,DEFAULT_W};
 2020 | })();
 2021 | 
 2022 | /* ============================================================
 2023 |    CHART MANAGER — self-contained SVG rendering, no external libs.
 2024 |    Supports line/area/bar/scatter/heatmap/tornado with tooltips.
 2025 |    ============================================================ */
 2026 | const ChartManager=(()=>{
 2027 |   const NS="http://www.w3.org/2000/svg";
 2028 |   const el=(tag,attrs={})=>{ const node=document.createElementNS(NS,tag); for(const [k,v] of Object.entries(attrs)){ if(v!=null) node.setAttribute(k,String(v)); } return node; };
 2029 |   function elAxisText(){}
 2030 |   function colors(){ const dark=document.documentElement.getAttribute("data-theme")==="dark";
 2031 |     return { grid:dark?"#26344a":"#e8edf4", text:dark?"#a7b4ca":"#55627a", axis:dark?"#3a4a66":"#cfd8e6",
 2032 |       series:["#2456c4","#1c7c47","#b06a12","#b3261e","#7a3ff0","#0e9aa7","#c46a2a","#5c6f8a","#3b6fe0","#9aa7c0"] }; }
 2033 |   function svgEl(w,h){ const s=el("svg",{viewBox:`0 0 ${w} ${h}`}); s.setAttribute("preserveAspectRatio","none"); return s; }
 2034 |   function niceTicks(min,max,count=5){ const span=max-min; if(span===0) return [min]; const step=Math.pow(10,Math.floor(Math.log10(span/count))); const err=span/count/step;
 2035 |     const mag= err>=7.5?10: err>=3.5?5: err>=1.5?2:1; const s=step*mag; const start=Math.floor(min/s)*s; const out=[]; for(let v=start;v<=max+s*0.5;v+=s) out.push(v); return out; }
```

## score — line 8938 — owner `PeerSimilarity`

```js
 8930 |   function sectorFromResearch(){ return (App.state.research&&App.state.research.profile&&App.state.research.profile.sector)||(App.state.stockData&&App.state.stockData.sector)||""; }
 8931 |   return {metricsFor,render,TEMPLATES};
 8932 | })();
 8933 | 
 8934 | /* ============================================================
 8935 |    PEER SIMILARITY SCORE
 8936 |    ============================================================ */
 8937 | const PeerSimilarity=(()=>{
 8938 |   function score(peers){
 8939 |     if(!peers||!peers.length)return null;
 8940 |     // peers: [{name,marketCap,growth,margin,roe,multiple}]
 8941 |     const n=peers.length;
 8942 |     let size=0,growth=0,margin=0,roe=0,mult=0;
 8943 |     peers.forEach(p=>{ size+=p.marketCap?1:0; growth+=p.growth!=null?1:0; margin+=p.margin!=null?1:0; roe+=p.roe!=null?1:0; mult+=p.multiple!=null?1:0; });
 8944 |     const coverage= (size+growth+margin+roe+mult)/(5*Math.max(1,n));
 8945 |     const score=Math.round(coverage*100);
 8946 |     return {score,coverage,n};
 8947 |   }
 8948 |   function html(p){
 8949 |     if(!p)return "";
 8950 |     const label= p.score>=70?"High": p.score>=40?"Moderate":"Low";
 8951 |     return `<div class="card"><div class="card-title">Peer Similarity</div>
 8952 |     <div class="scorebar"><div class="bar"><div style="width:${p.score}%;background:var(--accent)"></div></div><div class="val">${p.score}/100</div></div>
 8953 |     <div class="small dim">Based on the completeness of peer data (market cap, growth, margin, ROE, multiples) across ${p.n} peers. ${pill(label,label==="High"?"good":label==="Moderate"?"warn":"info")}</div></div>`;
 8954 |   }
 8955 |   return {score,html};
 8956 | })();
 8957 | 
 8958 | /* ============================================================
 8959 |    EXPORT ANALYSIS PACKAGE (full state bundle)
 8960 |    ============================================================ */
 8961 | const ExportPackage=(()=>{
 8962 |   function build(){
 8963 |     const s=App.state;
 8964 |     return JSON.stringify({
 8965 |       meta:{app:App.meta.appVersion,model:App.meta.modelVersion,schema:App.meta.schemaVersion,exportedAt:new Date().toISOString()},
```

## whatWouldChange — line 4792 — owner `ThesisConsistency`

```js
 4784 |   if(r.valInputs&&r.valInputs.terminalGrowth!=null)risks.push("Terminal assumptions: terminal value is "+(r.dcf&&r.dcf.terminalShare!=null?fmt.pct(r.dcf.terminalShare):"—")+" of EV — a slower long-run world destroys value.");
 4785 |   if(r.risk&&r.risk.volatility!=null&&r.risk.volatility>.35)risks.push("Market risk: high volatility ("+fmt.pct(r.risk.volatility)+") means wide drawdowns.");
 4786 |   if(r.defaultPD!=null&&r.defaultPD>.05)risks.push("Default risk: Merton 1-yr PD of "+fmt.pct(r.defaultPD,2)+".");
 4787 |   if(f.netMargin!=null&&f.netMargin<0)risks.push("Profitability: negative net margin ("+fmt.pct(f.netMargin)+").");
 4788 |   risks.push("Interest rates: a rising WACC (from higher rates) reduces DCF value materially.");
 4789 |   risks.push("Competition / demand: forecast growth of "+fmt.pct((r.valInputs&&r.valInputs.growth)||.1)+" may not materialize.");
 4790 |   risks.push("Historical uncertainty: analogues and past volatility do not bound future outcomes.");
 4791 |   return `<div class="gridlist">${risks.map(x=>`<div class="banner warn" style="margin:4px 0">• ${esc(x)}</div>`).join("")}</div>`; }
 4792 | function whatWouldChange(){ const r=App.state.results.stock; if(!r)return `<div class="small dim">Run Stock Analysis first.</div>`; const sd=App.state.stockData; if(!sd)return "";
 4793 |   const base={revenue0:sd.revenue0||sd.revenue, tax:sd.tax||.21, capexPct:sd.capexPct||.06, wcPct:sd.wcPct||.02, dandaPct:sd.dandaPct||.05, wacc:sd.wacc||.09, terminalGrowth:sd.terminalGrowth||.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt||0)-(sd.cash||0)), shares:sd.shares||1, horizon:sd.horizon||5, growth:sd.growth||.1, ebitdaMargin:sd.ebitdaMargin||.2};
 4794 |   const price=sd.price;
 4795 |   // find WACC at which value=price
 4796 |   let waccFlips=null; for(let w=.03;w<=.25;w+=.001){ const v=ValuationEngine.dcf({...base,wacc:w}).perShare; if(v!=null&&price!=null&&v<price){ waccFlips=w; break; } }
 4797 |   let tgFlips=null; for(let g=0;g<=.06;g+=.0005){ const v=ValuationEngine.dcf({...base,terminalGrowth:g}).perShare; if(v!=null&&price!=null&&v<price){ tgFlips=g; break; } }
 4798 |   const outs=[];
 4799 |   if(waccFlips)outs.push(`The conclusion moves to fairly valued if WACC rises to approximately <b>${fmt.pct(waccFlips,1)}</b> (from ${fmt.pct(base.wacc)}).`);
 4800 |   if(tgFlips)outs.push(`The conclusion moves to overvalued if long-term growth falls below approximately <b>${fmt.pct(tgFlips,1)}</b>.`);
 4801 |   if(!outs.length)outs.push("The base valuation is above price across a wide range of assumptions — but verify inputs; results remain assumption-sensitive.");
 4802 |   return `<div class="gridlist">${outs.map(x=>`<div class="banner info" style="margin:4px 0">→ ${x}</div>`).join("")}</div>`; }
 4803 | /* ---- Risk & Stress view ---- */
 4804 | function stressRender(){ const tab=$("#view-stress .tab.active")?.dataset.tab||"rs1";
 4805 |   if(tab==="rs1"){ $("#stressForm").innerHTML=`<div class="card"><div class="card-title">Value at Risk & Expected Shortfall</div>
 4806 |     <p class="small dim">VaR quantifies the worst loss not exceeded at a given confidence over a single period. Expected Shortfall is the average loss in the worst tail. Both are estimates from historical returns, not guarantees.</p>
 4807 |     <div class="row"><button class="btn btn-primary" id="rs_var">Compute VaR & ES</button></div><div id="rsOut" class="mt"></div></div>`;
 4808 |     wire("rs_var","click",()=>{ const v=RiskMetricsV2.computeVaRES(App.state.stockData); const price=App.state.stockData.price; $("#rsOut").innerHTML=RiskMetricsV2.varHTML(v,price); AuditTrailEngine.record("Risk","VaR","var",null,"computed","VaR & ES computed"); });
 4809 |   } else if(tab==="rs2"){ $("#stressForm").innerHTML=`<div class="card"><div class="card-title">Stress Testing</div>
 4810 |     <p class="small dim">Predefined stress scenarios apply shocks to revenue growth, margins, WACC and default probability. These are illustrative downside cases, not forecasts.</p>
 4811 |     <div class="row"><button class="btn btn-primary" id="rs_stress">Run Stress Tests</button></div><div id="rsOut2" class="mt"></div></div>`;
 4812 |     wire("rs_stress","click",()=>{ const res=StressTestEngine.run(App.state.stockData, StressTestEngine.PREDEFINED); $("#rsOut2").innerHTML=StressTestEngine.stressHTML(res); AuditTrailEngine.record("Risk","Stress","stress",null,"run","Stress test scenarios executed"); });
 4813 |   } else if(tab==="rs3"){ $("#stressForm").innerHTML=`<div class="card"><div class="card-title">Risk Dashboard</div>
 4814 |     <div class="row"><button class="btn btn-primary" id="rs_dash">Build Risk Dashboard</button></div><div id="rsOut3" class="mt"></div></div>`;
 4815 |     wire("rs_dash","click",()=>{ $("#rsOut3").innerHTML=riskDashboardHTML(); });
 4816 |   }
 4817 | }
 4818 | function riskDashboardHTML(){ const r=App.state.results.stock; const v=App.state.var; const risk=App.state.results.risk; const f=r?r.financials:null; const sd=App.state.stockData;
 4819 |   let h=`<div class="grid g2"><div class="card"><div class="card-title">Market Risk</div>
```

## run — line 1588 — owner `ScenarioEngine`

```js
 1580 |   }
 1581 |   return {match,simScore,standardize,FEATURES,defaultWeights,normalizeWeights,matchReference};
 1582 | })();
 1583 | 
 1584 | /* ============================================================
 1585 |    SCENARIO ENGINE
 1586 |    ============================================================ */
 1587 | const ScenarioEngine=(()=>{
 1588 |   function run(baseDcf, scenarios, currentPrice, netDebt, shares){
 1589 |     // scenarios: array of {name, growth, margin, wacc, terminalGrowth, prob}
 1590 |     const out=[]; for(const s of scenarios){
 1591 |       const dcf=ValuationEngine.dcf({revenue0:baseDcf.revenue0, growth:s.growth, ebitdaMargin:s.margin, tax:baseDcf.tax, capexPct:s.capexPct!=null?s.capexPct:baseDcf.capexPct, wcPct:s.wcPct!=null?s.wcPct:baseDcf.wcPct, dandaPct:baseDcf.dandaPct, wacc:s.wacc, terminalGrowth:s.terminalGrowth, terminalMethod:baseDcf.terminalMethod, exitMultiple:s.exitMultiple!=null?s.exitMultiple:baseDcf.exitMultiple, netDebt, shares, horizon:baseDcf.horizon});
 1592 |       const val=dcf.perShare; const mos=currentPrice>0? (val/currentPrice)-1:null;
 1593 |       out.push({name:s.name, growth:s.growth, margin:s.margin, wacc:s.wacc, tg:s.terminalGrowth, prob:s.prob||null, value:val, perShare:val, dcf, mos});
 1594 |     }
 1595 |     // probability weighted (if probs provided)
 1596 |     const probSum=out.reduce((s,o)=>s+(o.prob??0),0);
 1597 |     let weighted=null; if(probSum>0 && out.every(o=>o.prob!=null)) weighted=out.reduce((s,o)=>s+o.prob*o.value,0)/probSum;
 1598 |     return {out,weighted};
 1599 |   }
 1600 |   return {run};
 1601 | })();
 1602 | 
 1603 | /* ============================================================
 1604 |    MONTE CARLO — GBM paths
 1605 |    ============================================================ */
 1606 | const MonteCarlo=(()=>{
 1607 |   function mulberry(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
 1608 |   function run({initial=100, expectedReturn=.10, volatility=.25, horizonYears=1, simulations=10000, seed=1234, target=110, stepsPerYear=12}){
 1609 |     const rnd=mulberry(seed);
 1610 |     const norm=()=>{ // Box-Muller
 1611 |       const u1=Math.max(rnd(),1e-12), u2=rnd(); return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2); };
 1612 |     const mu=expectedReturn, sigma=volatility;
 1613 |     const dt=1/stepsPerYear; const n=Math.round(horizonYears*stepsPerYear);
 1614 |     const finals=[];
 1615 |     const results={ };
```

## run — line 1608 — owner `MonteCarlo`

```js
 1600 |   return {run};
 1601 | })();
 1602 | 
 1603 | /* ============================================================
 1604 |    MONTE CARLO — GBM paths
 1605 |    ============================================================ */
 1606 | const MonteCarlo=(()=>{
 1607 |   function mulberry(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
 1608 |   function run({initial=100, expectedReturn=.10, volatility=.25, horizonYears=1, simulations=10000, seed=1234, target=110, stepsPerYear=12}){
 1609 |     const rnd=mulberry(seed);
 1610 |     const norm=()=>{ // Box-Muller
 1611 |       const u1=Math.max(rnd(),1e-12), u2=rnd(); return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2); };
 1612 |     const mu=expectedReturn, sigma=volatility;
 1613 |     const dt=1/stepsPerYear; const n=Math.round(horizonYears*stepsPerYear);
 1614 |     const finals=[];
 1615 |     const results={ };
 1616 |     const subsample=[];
 1617 |     for(let sim=0;sim<simulations;sim++){
 1618 |       let s=initial;
 1619 |       for(let t=0;t<n;t++){ s*= Math.exp((mu-0.5*sigma*sigma)*dt + sigma*Math.sqrt(dt)*norm()); }
 1620 |       finals.push(s); if(sim% Math.max(1,Math.floor(simulations/200))===0) subsample.push(s);
 1621 |     }
 1622 |     finals.sort((a,b)=>a-b);
 1623 |     const pct=(p)=> finals[Math.min(finals.length-1, Math.floor(p*(finals.length-1)))];
 1624 |     const returns=finals.map(f=> f/initial-1);
 1625 |     const pLoss=returns.filter(r=>r<0).length/returns.length;
 1626 |     const pTarget=finals.filter(f=>f>=target).length/simulations; // P(final ≥ target)
 1627 |     const pExceed=finals.filter(f=>f>=target).length/simulations;
 1628 |     return {initial,simulations, median:pct(.5), p5:pct(.05),p25:pct(.25),p75:pct(.75),p95:pct(.95), min:finals[0], max:finals[finals.length-1], mean:CalcEngine.mean(finals), pLoss, pTarget, pExceed, target, subsample, seed};
 1629 |   }
 1630 |   return {run};
 1631 | })();
 1632 | 
 1633 | /* ============================================================
 1634 |    CORRELATION
 1635 |    ============================================================ */
```

## run — line 4527 — owner `StressTestEngine`

```js
 4519 | const StressTestEngine=(()=>{
 4520 |   const PREDEFINED=[
 4521 |     {name:"Mild Recession", rev:-0.10, margin:-0.015, wacc:+0.010, pdMult:1.5, desc:"Revenue -10%, margin -150bp, WACC +100bp"},
 4522 |     {name:"Severe Recession", rev:-0.25, margin:-0.04, wacc:+0.025, pdMult:2.0, desc:"Revenue -25%, margin -400bp, WACC +250bp"},
 4523 |     {name:"Interest Rate Shock", rev:0, margin:0, wacc:+0.02, pdMult:1.3, desc:"Cost of debt +200bp (via WACC)"},
 4524 |     {name:"Credit Shock", rev:-0.05, margin:-0.01, wacc:+0.01, pdMult:2.0, desc:"PD × 2"},
 4525 |     {name:"Market Crash", rev:-0.15, margin:-0.02, wacc:+0.015, pdMult:2.5, desc:"Equity value -40% (approx)"}
 4526 |   ];
 4527 |   function run(sd, scenarios){
 4528 |     if(!sd||sd.revenue0==null)return null;
 4529 |     const base={revenue0:sd.revenue0||sd.revenue, tax:sd.tax||.21, capexPct:sd.capexPct||.06, wcPct:sd.wcPct||.02, dandaPct:sd.dandaPct||.05, wacc:sd.wacc||.09, terminalGrowth:sd.terminalGrowth||.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt||0)-(sd.cash||0)), shares:sd.shares||1, horizon:sd.horizon||5, growth:sd.growth||.1, ebitdaMargin:sd.ebitdaMargin||.2};
 4530 |     const baseVal=ValuationEngine.dcf(base);
 4531 |     const basePD=App.state.results.stock&&App.state.results.stock.defaultPD!=null?App.state.results.stock.defaultPD:0.05;
 4532 |     const out=(scenarios||PREDEFINED).map(sc=>{
 4533 |       const g=Math.max(-0.5, (sd.growth||.1)+sc.rev);
 4534 |       const m=Math.max(0.01,(sd.ebitdaMargin||.2)+sc.margin);
 4535 |       const w=Math.max(0.02,(sd.wacc||.09)+sc.wacc);
 4536 |       const dcf=ValuationEngine.dcf({...base, growth:g, ebitdaMargin:m, wacc:w});
 4537 |       const val=dcf.error?null:dcf.perShare;
 4538 |       const pd=Math.min(.95,(basePD||.05)*sc.pdMult);
 4539 |       const downside= val!=null&&baseVal.perShare? (val/baseVal.perShare-1):null;
 4540 |       return {name:sc.name,desc:sc.desc,value:val,downside,pd,baseVal:baseVal.perShare};
 4541 |     });
 4542 |     return {baseVal:baseVal.perShare, out};
 4543 |   }
 4544 |   function stressHTML(res){
 4545 |     if(!res)return `<div class="banner warn">Run the Stock Analysis first to populate DCF inputs for stress testing.</div>`;
 4546 |     let h=`<div class="tablewrap"><table class="data"><thead><tr><th>Scenario</th><th class="num">Value/share</th><th class="num">Downside vs base</th><th class="num">Implied PD</th><th>Description</th></tr></thead><tbody>`;
 4547 |     res.out.forEach(s=>{ const cls=s.downside!=null&&s.downside<-.3?"bad":s.downside!=null&&s.downside<-.1?"warn":"info"; h+=`<tr><td>${esc(s.name)}</td><td class="num">${s.value!=null?fmt.money(s.value):"—"}</td><td class="num ${cls}">${s.downside!=null?fmt.pct(s.downside):"—"}</td><td class="num">${fmt.pct(s.pd,1)}</td><td class="small">${esc(s.desc)}</td></tr>`; });
 4548 |     h+=`</tbody></table></div>`;
 4549 |     const chart=document.createElementNS&&true;
 4550 |     h+=`<div class="mt"><div id="stressChart"></div></div>`;
 4551 |     setTimeout(()=>{ const c=$("#stressChart"); if(c){ c.appendChild(ChartManager.barChart({series:[{data:res.out.map(s=>s.downside!=null?s.downside*100:0)}],labels:res.out.map(s=>s.name),title:"Stress Scenario Downside vs Base (%)",yFmt:fmt.num})); } },0);
 4552 |     return h;
 4553 |   }
 4554 |   return {PREDEFINED,run,stressHTML};
```

## run — line 5114 — owner `FullAnalysis`

```js
 5106 |     "Running scenarios",
 5107 |     "Running stress tests",
 5108 |     "Calculating breakpoints",
 5109 |     "Assessing model risk",
 5110 |     "Calculating robustness",
 5111 |     "Updating thesis",
 5112 |     "Generating assessment"
 5113 |   ];
 5114 |   function run(){
 5115 |     // reset warnings from this run, keep registry for reporting
 5116 |     const st=App.state;
 5117 |     const panel=$("#pipelinePanel");
 5118 |     let html=`<div class="pipeline-panel"><div class="card-title">Full Analysis — Pipeline</div><div id="pipelineSteps">${STEPS.map((s,i)=>`<div class="pipeline-step" data-step="${i}"><span class="st">${i+1}</span><span>${esc(s)}</span></div>`).join("")}</div></div>`;
 5119 |     if(panel){ panel.innerHTML=html; panel.classList.remove("hidden"); }
 5120 |     const mark=(i,cls)=>{ const el=$(`.pipeline-step[data-step="${i}"]`); if(el)el.classList.add(cls); };
 5121 |     const errors=[];
 5122 |     try{ // 0 validate
 5123 |       mark(0,"done");
 5124 |       // 1 historical statements (ratios)
 5125 |       const f=financialsFromState(); mark(1,"done");
 5126 |       // 2 forecast financials — build 3-statement
 5127 |       if(!st.fm||!st.fm.years) Object.assign(st.fm||(st.fm={}),FinancialModelEngine.defaults());
 5128 |       FinancialModelEngine.fillDefaults(st.fm, st.stockData);
 5129 |       const fm=FinancialModelEngine.build(st.fm, st.stockData);
 5130 |       st.fm.result=fm; mark(2,"done");
 5131 |       // 3 cash flow mark
 5132 |       mark(3,"done");
 5133 |       // 4 debt schedule mark
 5134 |       mark(4,"done");
 5135 |       // 5-7 valuation: DCF, DDM, comps
 5136 |       const sd=st.stockData;
 5137 |       // apply overrides into sd snapshot for run
 5138 |       const a=Model.assumptions();
 5139 |       const runSd=Object.assign({},sd,{growth:a.revenueGrowth,ebitdaMargin:a.ebitdaMargin,tax:a.tax,capexPct:a.capexPct,wcPct:a.wcPct,dandaPct:a.dandaPct,wacc:a.wacc,terminalGrowth:a.terminalGrowth,exitMultiple:a.exitMultiple,netDebt:a.netDebt,shares:a.shares,horizon:a.horizon,beta:a.beta,rf:a.rf,erp:a.erp,debt:a.debt,cash:a.cash,equity:a.equity,marketCap:a.marketCap,price:a.price,dividend:a.dividend,divGrowth:a.divGrowth});
 5140 |       // run stock analysis via stockRun (recalculates everything)
 5141 |       mark(5,"run");
```

## run — line 5195 — owner `BreakpointEngine`

```js
 5187 |   }
 5188 |   return {run,STEPS};
 5189 | })();
 5190 | 
 5191 | /* ============================================================
 5192 |    BREAKPOINT ANALYSIS
 5193 |    ============================================================ */
 5194 | const BreakpointEngine=(()=>{
 5195 |   function run(sd){
 5196 |     if(!sd||sd.price==null||sd.price<=0)return null;
 5197 |     const a=Model.assumptions();
 5198 |     const base={revenue0:a.revenue||sd.revenue, tax:a.tax, capexPct:a.capexPct, wcPct:a.wcPct, dandaPct:a.dandaPct, wacc:a.wacc, terminalGrowth:a.terminalGrowth, terminalMethod:"growth", exitMultiple:a.exitMultiple, netDebt:a.netDebt, shares:a.shares, horizon:a.horizon, growth:a.revenueGrowth, ebitdaMargin:a.ebitdaMargin};
 5199 |     const price=a.price;
 5200 |     const out={};
 5201 |     // WACC breakpoint: where DCF = price
 5202 |     let waccBP=null; for(let w=.02;w<=.30;w+=.001){ const v=ValuationEngine.dcf({...base,wacc:w}).perShare; if(v!=null&&v<price){ waccBP=w; break; } }
 5203 |     out.wacc=waccBP;
 5204 |     // terminal growth breakpoint
 5205 |     let tgBP=null; for(let g=0;g<=.06;g+=.0005){ const v=ValuationEngine.dcf({...base,terminalGrowth:g}).perShare; if(v!=null&&v<price){ tgBP=g; break; } }
 5206 |     out.terminalGrowth=tgBP;
 5207 |     // revenue growth breakpoint (base constant growth)
 5208 |     let growthBP=null; for(let g=-.2;g<=.6;g+=.001){ const v=ValuationEngine.dcf({...base,growth:g}).perShare; if(v!=null&&v<price){ growthBP=g; break; } }
 5209 |     out.revenueGrowth=growthBP;
 5210 |     // margin breakpoint
 5211 |     let marginBP=null; for(let m=.005;m<=.5;m+=.001){ const v=ValuationEngine.dcf({...base,ebitdaMargin:m}).perShare; if(v!=null&&v<price){ marginBP=m; break; } }
 5212 |     out.ebitdaMargin=marginBP;
 5213 |     // NPV=0 discount rate breakpoint (for project cash flows)
 5214 |     let npvIRR=null; if(sd.price==null){ /* skip */ }
 5215 |     return out;
 5216 |   }
 5217 |   function renderHTML(bp){
 5218 |     if(!bp)return `<div class="banner info">Breakpoint analysis requires a current price. Run after entering price.</div>`;
 5219 |     const row=(label,val,unit,desc)=>`<div class="metricline"><span class="l">${label}</span><span class="v">${val!=null?(unit==="%"?fmt.pct(val,1):fmt.num(val,2)):"—"}</span></div>`;
 5220 |     return `<div class="card"><div class="card-title">Break-Even / Breakpoint Analysis</div>
 5221 |     <p class="small dim">At each breakpoint, the DCF value equals the current price (upside → 0) or the stated limit. These are computed directly from the model.</p>
 5222 |     <div class="grid g2">
```

## run — line 7149 — owner `BootstrapMC`

```js
 7141 |     <div class="banner info">XIRR handles cash flows that arrive at irregular dates by discounting each to its actual year-fraction. It annualizes the return correctly for non-annual periods.</div></div>`;
 7142 |   }
 7143 |   return {xnpv,xirr,xirrHTML};
 7144 | })();
 7145 | 
 7146 | /* ---- Historical Bootstrap Monte Carlo ----
 7147 |    Resample actual historical returns with replacement. */
 7148 | const BootstrapMC=(()=>{
 7149 |   function run({initial, returns, horizonYears, simulations, seed, stepsPerYear, target}){
 7150 |     // returns: array of historical periodic returns
 7151 |     if(!returns||returns.length<5)return null;
 7152 |     const n=Math.round((horizonYears||1)*stepsPerYear);
 7153 |     // Build daily-resampled paths; each step picks a random historical return.
 7154 |     const finals=[];
 7155 |     const rnd=mulberry(seed!=null?seed:1234);
 7156 |     for(let s=0;s<simulations;s++){
 7157 |       let val=initial;
 7158 |       for(let t=0;t<n;t++){
 7159 |         const r=returns[Math.floor(rnd()*returns.length)];
 7160 |         val*=(1+r);
 7161 |       }
 7162 |       finals.push(val);
 7163 |     }
 7164 |     finals.sort((a,b)=>a-b);
 7165 |     const pct=p=>finals[Math.min(finals.length-1,Math.floor(p*(finals.length-1)))];
 7166 |     const pLoss=finals.filter(v=>v<initial).length/simulations;
 7167 |     const pExceed= target!=null? finals.filter(v=>v>=target).length/simulations : null;
 7168 |     return {initial,simulations,seed,n,median:pct(.5),p5:pct(.05),p25:pct(.25),p75:pct(.75),p95:pct(.95),mean:CalcEngine.mean(finals),pLoss,pExceed,target,method:"Historical Bootstrap"};
 7169 |   }
 7170 |   function mulberry(seed){ let s=seed|0; return function(){ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
 7171 |   function html(r){
 7172 |     if(!r)return `<div class="banner warn">Historical Bootstrap requires at least 5 historical return observations. Import a price series first.</div>`;
 7173 |     return `<div class="card"><div class="card-title">Historical Bootstrap Monte Carlo <span class="tag info">seed ${r.seed}</span></div>
 7174 |     <div class="banner info">Resamples actual historical returns (with replacement) rather than assuming a normal distribution. <b>Results are conditional distributions under the observed history — not forecasts.</b></div>
 7175 |     <div class="grid g4">
 7176 |       ${kpi("Median outcome",fmt.money(r.median),"P50")}${kpi("P5",fmt.money(r.p5))}${kpi("P25",fmt.money(r.p25))}${kpi("P75",fmt.money(r.p75))}${kpi("P95",fmt.money(r.p95))}${kpi("Mean",fmt.money(r.mean))}${kpi("Prob. of loss",fmt.pct(r.pLoss))}${kpi("Simulations",String(r.simulations))}
```

## run — line 7534 — owner `MonteCarloWorker`

```js
 7526 |         if(curCallback){ const cb=curCallback; curCallback=null; curProgress=null; running=false; cb(null); }
 7527 |       };
 7528 |       worker=w; return w;
 7529 |     }catch(e){ return null; }
 7530 |   }
 7531 |   function cleanup(){ try{ if(worker){ worker.terminate(); } }catch(e){} worker=null; }
 7532 | 
 7533 |   // Run in worker if possible, else run synchronously via MonteCarlo.run
 7534 |   function run(cfg, onDone, onProgress){
 7535 |     const w=worker||buildWorker();
 7536 |     if(!w){
 7537 |       // main-thread fallback
 7538 |       const r=MonteCarlo.run(cfg);
 7539 |       if(onProgress){ for(let i=0;i<=20;i++) onProgress(i*Math.ceil((cfg.simulations||10000)/20), cfg.simulations||10000); }
 7540 |       if(onDone) setTimeout(()=>onDone(r),0);
 7541 |       return true; // handled synchronously (indicate no worker used)
 7542 |     }
 7543 |     running=true; curCallback=onDone; curProgress=onProgress;
 7544 |     w.postMessage(cfg);
 7545 |     return false;
 7546 |   }
 7547 |   function cancel(){ cleanup(); running=false; curCallback=null; curProgress=null; }
 7548 |   function isRunning(){ return running; }
 7549 |   return {run,cancel,isRunning,buildWorker,MCWorkerSource};
 7550 | })();
 7551 | 
 7552 | /* ---- Enhanced runMC using the worker with progress bar ---- */
 7553 | function runMC(newSeed){
 7554 |   const g=n=>Number($("#"+n).value)||0;
 7555 |   const seed= newSeed? Math.floor(Math.random()*1e9): (App.state.mcSeed||1234); App.state.mcSeed=seed;
 7556 |   const sims=Math.min(50000,Math.max(100,Math.round(g("mc_n"))));
 7557 |   const cfg={initial:g("mc_s0"), expectedReturn:g("mc_mu")/100, volatility:g("mc_sig")/100, horizonYears:g("mc_T"), simulations:sims, seed, target:g("mc_target"), stepsPerYear:252};
 7558 |   // progress UI
 7559 |   $("#mcOut").innerHTML=`<div class="card"><div class="card-title">Running Monte Carlo</div>
 7560 |   <div class="progressbar"><div id="mcProgressBar" style="width:0%"></div></div>
 7561 |   <div class="small dim mt" id="mcProgressLabel">Preparing ${fmt.num(sims,0)} simulations…</div>
```

## run — line 8551 — owner `BacktestEngine`

```js
 8543 |   }
 8544 |   return {compute,html};
 8545 | })();
 8546 | 
 8547 | /* ============================================================
 8548 |    BACKTESTING ENGINE
 8549 |    ============================================================ */
 8550 | const BacktestEngine=(()=>{
 8551 |   function run({prices, signal, startDate, endDate, initialCapital, longThreshold, shortThreshold, rebalanceEvery, transactionCost, slippage, benchmarkPrices}){
 8552 |     if(!prices||prices.length<30) return {available:false,reason:"Backtest unavailable — insufficient validated historical data."};
 8553 |     let series=prices;
 8554 |     if(startDate) series=series.filter(p=>p.date>=startDate);
 8555 |     if(endDate) series=series.filter(p=>p.date<=endDate);
 8556 |     if(series.length<30) return {available:false,reason:"Backtest unavailable — insufficient data in selected period."};
 8557 |     const cap=initialCapital||100000;
 8558 |     const tc=transactionCost!=null?transactionCost:.0010;
 8559 |     const slip=slippage!=null?slippage:.0005;
 8560 |     const reb=rebalanceEvery||1;
 8561 |     const longT=longThreshold!=null?longThreshold:.0001;
 8562 |     const shortT=shortThreshold!=null?shortThreshold:-.0001;
 8563 |     let stratVal=cap, costs=0, tradeCount=0, prevClose=series[0].close, curPos=0;
 8564 |     const eqCurve=[cap];
 8565 |     for(let i=0;i<series.length;i++){
 8566 |       const c=series[i].close;
 8567 |       if(i===0){ curPos=(signal&&signal[0]!=null)?signal[0]:backtestSignal(prices,0); prevClose=c; continue; }
 8568 |       const r=c/prevClose-1;
 8569 |       if(i%reb===0){
 8570 |         const sig=(signal&&signal[i]!=null)?signal[i]:backtestSignal(prices,i);
 8571 |         const newPos= sig>=longT?1: sig<=shortT?-1:0;
 8572 |         if(newPos!==curPos){ costs+=cap*(tc+slip); tradeCount++; curPos=newPos; }
 8573 |       }
 8574 |       stratVal=stratVal*(1+curPos*r);
 8575 |       prevClose=c; eqCurve.push(stratVal);
 8576 |     }
 8577 |     stratVal-=costs;
 8578 |     const totalReturn=stratVal/cap-1;
```

## run — line 8712 — owner `BoundaryTests`

```js
 8704 |   }
 8705 |   return {compute,html};
 8706 | })();
 8707 | 
 8708 | /* ============================================================
 8709 |    BOUNDARY TEST SUITE + INDEPENDENT CALC CHECKS
 8710 |    ============================================================ */
 8711 | const BoundaryTests=(()=>{
 8712 |   function run(){
 8713 |     const tests=[];
 8714 |     const t=(n,ok,detail)=>{ tests.push({name:n,ok,detail}); };
 8715 |     // zero / negative / NaN / Infinity handling
 8716 |     t("NPV empty", (()=>{ const v=LoanEngine.npv([],.1); return isFinite(v); })(), "returns finite");
 8717 |     t("NPV all zero", (()=>{ const v=LoanEngine.npv([0,0,0],.1); return isFinite(v)&&Math.abs(v)<1e-9; })(), "0");
 8718 |     t("IRR no root", (()=>{ const v=LoanEngine.irr([100,100,100]); return v===null||isFinite(v); })(), "handles no-root");
 8719 |     t("DCF WACC<=g blocked", (()=>{ const d=ValuationEngine.dcf({revenue0:100,growth:.1,ebitdaMargin:.2,tax:.21,capexPct:.06,wcPct:.02,dandaPct:.05,wacc:.05,terminalGrowth:.05,netDebt:0,shares:1,horizon:5}); return !!d.error; })(), "error returned");
 8720 |     t("DCF zero shares", (()=>{ const d=ValuationEngine.dcf({revenue0:100,growth:.1,ebitdaMargin:.2,tax:.21,capexPct:.06,wcPct:.02,dandaPct:.05,wacc:.1,terminalGrowth:.02,netDebt:0,shares:0,horizon:5}); return d.perShare===0; })(), "0 per share");
 8721 |     t("DCF zero volatility", (()=>{ const m=MonteCarlo.run({initial:100,expectedReturn:.1,volatility:0,horizonYears:1,simulations:100,seed:1,target:110}); return isFinite(m.median); })(), "finite");
 8722 |     t("Negative discount rate", (()=>{ const v=LoanEngine.npv([-1000,1100],-0.5); return isFinite(v); })(), "finite NPV");
 8723 |     t("Missing data graceful", (()=>{ return typeof DataSufficiency.compute()==="object"; })(), "sufficiency handles missing");
 8724 |     t("Very large value", (()=>{ const v=LoanEngine.npv([-1e12,1.1e12],.1); return isFinite(v); })(), "finite");
 8725 |     return tests;
 8726 |   }
 8727 |   return {run};
 8728 | })();
 8729 | 
 8730 | const IndependentChecks=(()=>{
 8731 |   // Two independent paths for key calcs
 8732 |   function npvCheck(flows,rate){
 8733 |     // path1: LoanEngine.npv; path2: manual loop
 8734 |     const v1=LoanEngine.npv(flows,rate);
 8735 |     let v2=0; for(let t=0;t<flows.length;t++)v2+=flows[t]/Math.pow(1+rate,t);
 8736 |     return {v1,v2,match:Math.abs(v1-v2)<1e-9};
 8737 |   }
 8738 |   function waccCheck(e,v,re,d,rd,tax){
 8739 |     const v1=CapmWacc.wacc(e,v,re,d,rd,tax);
```

## run — line 8743 — owner `IndependentChecks`

```js
 8735 |     let v2=0; for(let t=0;t<flows.length;t++)v2+=flows[t]/Math.pow(1+rate,t);
 8736 |     return {v1,v2,match:Math.abs(v1-v2)<1e-9};
 8737 |   }
 8738 |   function waccCheck(e,v,re,d,rd,tax){
 8739 |     const v1=CapmWacc.wacc(e,v,re,d,rd,tax);
 8740 |     const v2=(e/v)*re+(d/v)*rd*(1-tax);
 8741 |     return {v1,v2,match:Math.abs(v1-v2)<1e-12};
 8742 |   }
 8743 |   function run(){
 8744 |     const results=[];
 8745 |     results.push(npvCheck([-1000,1100],.1));
 8746 |     results.push(waccCheck(80,100,.10,20,.05,.3));
 8747 |     return results;
 8748 |   }
 8749 |   return {npvCheck,waccCheck,run};
 8750 | })();
 8751 | 
 8752 | /* ============================================================
 8753 |    NARRATIVE/MODEL CONTRADICTION ENGINE
 8754 |    ============================================================ */
 8755 | const ContradictionEngineV5=(()=>{
 8756 |   function detect(){
 8757 |     const t=App.state.thesis||{}; const a=Model.assumptions(); const r=App.state.results.stock;
 8758 |     const f=r?r.financials:null;
 8759 |     const issues=[];
 8760 |     // thesis "strong growth" vs model growth
 8761 |     const growthPhrase=(t.thesis+" "+(t.bull||"")).toLowerCase();
 8762 |     if(/(strong|high|aggressive|rapid).*(growth)|growth.*(strong|high|rapid)/.test(growthPhrase)&&a.revenueGrowth!=null&&a.revenueGrowth<.05){
 8763 |       issues.push({sev:"warning",type:"POSSIBLE INCONSISTENCY",text:"Thesis implies strong growth but model CAGR is "+fmt.pct(a.revenueGrowth)+".","module":"Thesis",why:"Narrative and model are not aligned.",action:"Review growth assumption or thesis."});
 8764 |     }
 8765 |     // "conservative valuation" but high terminal value
 8766 |     if(/(conservative|cheap|undervalued)/.test(growthPhrase)&&r&&r.dcf&&r.dcf.terminalShare!=null&&r.dcf.terminalShare>.7){
 8767 |       issues.push({sev:"warning",type:"REVIEW VALUATION ASSUMPTION",text:"Thesis suggests conservative valuation but terminal value is "+fmt.pct(r.dcf.terminalShare)+" of EV.","module":"Valuation",why:"Terminal dependence is high for a 'conservative' claim.",action:"Review terminal assumptions."});
 8768 |     }
 8769 |     // "low leverage" but high debt
 8770 |     if(/(low|conservative|safe).*(leverage|debt)|leverage.*(low|conservative)/.test(growthPhrase)&&f&&f.debtEbitda!=null&&f.debtEbitda>3){
```

## run — line 9022 — owner `WalkForward`

```js
 9014 |    5. Multi-user review data model (offline, single-user but future-ready)
 9015 |    ============================================================ */
 9016 | 
 9017 | /* ============================================================
 9018 |    1. WALK-FORWARD TESTING ENGINE
 9019 |    ============================================================ */
 9020 | const WalkForward=(()=>{
 9021 |   // Runs backtest over rolling train/test windows
 9022 |   function run({prices, signal, trainSize, testSize, initialCapital, transactionCost, slippage, longThreshold, shortThreshold}){
 9023 |     if(!prices||prices.length < trainSize+testSize) return {available:false,reason:"Walk-forward unavailable — insufficient historical data for training + test windows."};
 9024 |     const train=trainSize||120, test=testSize||30;
 9025 |     const windows=[];
 9026 |     let i=0;
 9027 |     while(i+train+test <= prices.length){
 9028 |       const trainIdx=prices.slice(i,i+train);
 9029 |       const testIdx=prices.slice(i+train,i+train+test);
 9030 |       const winStart=i, winEnd=i+train+test;
 9031 |       // in-sample (train) backtest
 9032 |       const inSample=BacktestEngine.run({prices:trainIdx, signal, initialCapital, transactionCost, slippage, longThreshold, shortThreshold});
 9033 |       const outSample=BacktestEngine.run({prices:testIdx, signal, initialCapital, transactionCost, slippage, longThreshold, shortThreshold});
 9034 |       windows.push({window:windows.length+1,start:testIdx[0].date,end:testIdx[testIdx.length-1].date,
 9035 |         inSample:inSample.available?inSample.totalReturn:null,
 9036 |         outSample:outSample.available?outSample.totalReturn:null,
 9037 |         inSharpe:inSample.available?inSample.sharpe:null, outSharpe:outSample.available?outSample.sharpe:null});
 9038 |       i+=(testSize||30);
 9039 |     }
 9040 |     // stability: consistency of out-of-sample signs & degradation
 9041 |     const oos=windows.map(w=>w.outSample).filter(v=>v!=null);
 9042 |     if(!oos.length)return {available:true,windows,degradation:null,stability:null};
 9043 |     const posShare=oos.filter(v=>v>0).length/oos.length;
 9044 |     const meanOos=CalcEngine.mean(oos);
 9045 |     const meanIn=CalcEngine.mean(windows.map(w=>w.inSample).filter(v=>v!=null));
 9046 |     const degradation= meanIn!=null? meanOos-meanIn : null;
 9047 |     const stability= Math.round(posShare*100);
 9048 |     const warning= degradation!=null&&degradation<-.02? "OUT-OF-SAMPLE DETERIORATION DETECTED" : null;
 9049 |     return {available:true,windows,degradation,stability,warning,meanOos,meanIn};
```

## run — line 12927 — owner `out`

```js
12919 |       if(amount==null)return {pd,recovery,ead,lgd:null,el:null,error:'ECL requires finite PD/recovery in [0,1] and non-negative EAD.'};
12920 |       const lgd=1-recovery;return {pd,recovery,ead,lgd,el:Math.round(amount*100)/100};
12921 |     };
12922 |     ECLV2.eadDefault=(face,_exposureType)=>Core.isFiniteNumber(face)&&face>=0?face:null;
12923 |     mark('ECLV2');
12924 |   }
12925 | 
12926 |   if(LegacyCore && typeof StressTestEngine!=='undefined' && StressTestEngine){
12927 |     StressTestEngine.run=(sd,scenarios)=>{
12928 |       const currentPD=(typeof App!=='undefined'&&App&&App.state&&App.state.results&&App.state.results.stock&&App.state.results.stock.defaultPD!=null)?App.state.results.stock.defaultPD:.05;
12929 |       const useScenarios=scenarios==null?StressTestEngine.PREDEFINED:scenarios;
12930 |       return LegacyCore.stressRun(sd,useScenarios,{defaultPD:currentPD});
12931 |     };
12932 |     mark('StressTestEngine.run');
12933 |   }
12934 | 
12935 |   if(LegacyCore && typeof PortfolioEngine!=='undefined' && PortfolioEngine){
12936 |     PortfolioEngine.build=(items)=>{
12937 |       const rf=(typeof App!=='undefined'&&App&&App.state&&App.state.stockData&&App.state.stockData.rf!=null)?App.state.stockData.rf:.03;
12938 |       return LegacyCore.portfolioBuild(items,{riskFreeRate:rf,correlation:.4});
12939 |     };
12940 |     PortfolioEngine.stress=(port,scenario)=>LegacyCore.portfolioStress(port,scenario||{});
12941 |     mark('PortfolioEngine.build/stress');
12942 |   }
12943 | 
12944 |   if(LegacyCore && typeof ValuationMatrixV2!=='undefined' && ValuationMatrixV2){
12945 |     ValuationMatrixV2.build=(sd)=>{
12946 |       const result=(typeof App!=='undefined'&&App&&App.state&&App.state.results&&App.state.results.stock)?App.state.results.stock:{};
12947 |       return LegacyCore.valuationMatrix(sd,result);
12948 |     };
12949 |     ValuationMatrixV2.driversHTML=(_mx,sd)=>{
12950 |       const rows=LegacyCore.valuationDrivers(sd);
12951 |       if(!rows||!rows.length)return '';
12952 |       return `<h4 class="mt">TOP VALUE DRIVERS</h4><div class="gridlist">${rows.map((r,i)=>`<div class="metricline"><span class="l">${i+1}. ${r.label}</span><span class="v">${fmt.pct(r.impact,1)} of base value</span></div>`).join('')}</div>`;
12953 |     };
12954 |     mark('ValuationMatrixV2.build/driversHTML');
```

## monitor — line 5315 — owner `ThesisConsistencyV3`

```js
 5307 |   }
 5308 |   return {compute};
 5309 | })();
 5310 | 
 5311 | /* ============================================================
 5312 |    THESIS MONITOR + INTEGRITY (consume model values)
 5313 |    ============================================================ */
 5314 | const ThesisConsistencyV3=(()=>{
 5315 |   function monitor(){
 5316 |     const t=App.state.thesis; const a=Model.assumptions(); const r=App.state.results.stock; const f=r?r.financials:null;
 5317 |     const rows=[];
 5318 |     const add=(driver,target,val,fmtv,status)=>{ rows.push({driver,target,val,fmtv,status}); };
 5319 |     // revenue growth
 5320 |     add("Revenue growth","15%",a.revenueGrowth,fmt.pct, Math.abs((a.revenueGrowth||0)-.15)<=.04?"good": Math.abs((a.revenueGrowth||0)-.15)<=.08?"warn":"bad");
 5321 |     // margin
 5322 |     add("EBITDA margin","22%",a.ebitdaMargin,fmt.pct, Math.abs((a.ebitdaMargin||0)-.22)<=.03?"good": Math.abs((a.ebitdaMargin||0)-.22)<=.06?"warn":"bad");
 5323 |     // Debt/EBITDA
 5324 |     if(f&&f.debtEbitda!=null) add("Debt/EBITDA","< 3×",f.debtEbitda,fmt.x, f.debtEbitda<3?"good":f.debtEbitda<4?"warn":"bad");
 5325 |     // PD
 5326 |     if(r&&r.defaultPD!=null) add("Default PD","< 5%",r.defaultPD,fmt.pct, r.defaultPD<.05?"good":r.defaultPD<.12?"warn":"bad");
 5327 |     return {rows};
 5328 |   }
 5329 |   function integrity(){
 5330 |     const m=monitor().rows; if(!m.length)return {score:50,status:"Insufficient Data"};
 5331 |     let good=0; m.forEach(r=>{ if(r.status==="good")good++; });
 5332 |     const score=Math.round(good/m.length*100);
 5333 |     const status= score>=75?"Supported": score>=50?"Under Pressure": score>=25?"Broken":"Insufficient Data";
 5334 |     return {score,status};
 5335 |   }
 5336 |   function render(){
 5337 |     const m=monitor().rows; const int=integrity();
 5338 |     const cls=int.status==="Supported"?"good":int.status==="Under Pressure"?"warn":"bad";
 5339 |     let h=`<div class="card"><div class="card-title">Thesis Monitor & Integrity ${pill(int.status,cls)}</div>
 5340 |     <div class="scorebar"><div class="bar"><div style="width:${int.score}%;background:${int.score>=75?'var(--good)':int.score>=50?'var(--warn)':'var(--bad)'}"></div></div><div class="val">${int.score}/100</div></div>
 5341 |     <div class="small dim">Thesis Integrity measures whether the current model is consistent with the assumptions underlying your thesis — it does NOT mean the investment is good.</div>
 5342 |     <div class="tablewrap mt"><table class="data"><thead><tr><th>Thesis Driver</th><th class="num">Target</th><th class="num">Model Value</th><th>Status</th></tr></thead><tbody>
```

## betaAlphaAligned — line 5444 — owner `DateAlign`

```js
 5436 |     for(let i=1;i<common.length;i++){
 5437 |       if(common[i-1].a.close>0&&common[i].a.close>0&&common[i-1].b.close>0&&common[i].b.close>0){
 5438 |         retsA.push(common[i].a.close/common[i-1].a.close-1);
 5439 |         retsB.push(common[i].b.close/common[i-1].b.close-1);
 5440 |       }
 5441 |     }
 5442 |     return {n:common.length, matchedReturnsA:retsA, matchedReturnsB:retsB, dates:common.map(c=>c.d)};
 5443 |   }
 5444 |   function betaAlphaAligned(serA,serB,rfPerPeriod){
 5445 |     const al=align(serA,serB);
 5446 |     if(al.matchedReturnsA.length<5) return null;
 5447 |     const bet=CalcEngine.beta(al.matchedReturnsA, al.matchedReturnsB);
 5448 |     const alpha=CalcEngine.alpha(al.matchedReturnsA, al.matchedReturnsB, rfPerPeriod||0);
 5449 |     const corr=CalcEngine.corr(al.matchedReturnsA, al.matchedReturnsB);
 5450 |     return {beta:bet, alpha, corr, n:al.matchedReturnsA.length, method:"Date-aligned daily returns"};
 5451 |   }
 5452 |   return {align,betaAlphaAligned};
 5453 | })();
 5454 | 
 5455 | /* ---- 42: Rolling risk analytics ---- */
 5456 | const RollingRisk=(()=>{
 5457 |   function rollingVol(returns,windowDays,annualFactor){ const out=[]; for(let i=windowDays-1;i<returns.length;i++){ out.push(CalcEngine.stdev(returns.slice(i-windowDays+1,i+1),0)*Math.sqrt(annualFactor||252)); } return out; }
 5458 |   function rollingBeta(asset,bench,window){
 5459 |     const out=[]; for(let i=window-1;i<asset.length;i++){ const a=asset.slice(i-window+1,i+1),b=bench.slice(i-window+1,i+1); const beta=CalcEngine.beta(a,b); out.push(isFinite(beta)?beta:null); } return out;
 5460 |   }
 5461 |   function rollingSharpe(returns,window,rfPerPeriod){ const out=[]; for(let i=window-1;i<returns.length;i++){ const w=returns.slice(i-window+1,i+1); out.push(CalcEngine.sharpe(w,rfPerPeriod||0)); } return out; }
 5462 |   function rollingDrawdown(closes){ const out=[]; let peak=-Infinity; for(let i=0;i<closes.length;i++){ if(closes[i]>peak)peak=closes[i]; out.push(closes[i]/peak-1); } return out; }
 5463 |   return {rollingVol,rollingBeta,rollingSharpe,rollingDrawdown};
 5464 | })();
 5465 | 
 5466 | /* ---- 48: Merton numerical diagnostics ---- */
 5467 | const MertonDiag=(()=>{
 5468 |   // Solve and return iteration/convergence details by re-running a traced solve
 5469 |   function erf(x){ const sign=x<0?-1:1; x=Math.abs(x); const t=1/(1+0.3275911*x); const y=1-((((1.061405429*t-1.453152027)*t+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x); return sign*y; }
 5470 |   function trace(E,sigmaE,D,r,T){
 5471 |     if(!E||!D||!sigmaE||E<=0||D<=0||sigmaE<=0) return {error:"Inputs invalid"};
```

## rollingSharpe — line 5461 — owner `RollingRisk`

```js
 5453 | })();
 5454 | 
 5455 | /* ---- 42: Rolling risk analytics ---- */
 5456 | const RollingRisk=(()=>{
 5457 |   function rollingVol(returns,windowDays,annualFactor){ const out=[]; for(let i=windowDays-1;i<returns.length;i++){ out.push(CalcEngine.stdev(returns.slice(i-windowDays+1,i+1),0)*Math.sqrt(annualFactor||252)); } return out; }
 5458 |   function rollingBeta(asset,bench,window){
 5459 |     const out=[]; for(let i=window-1;i<asset.length;i++){ const a=asset.slice(i-window+1,i+1),b=bench.slice(i-window+1,i+1); const beta=CalcEngine.beta(a,b); out.push(isFinite(beta)?beta:null); } return out;
 5460 |   }
 5461 |   function rollingSharpe(returns,window,rfPerPeriod){ const out=[]; for(let i=window-1;i<returns.length;i++){ const w=returns.slice(i-window+1,i+1); out.push(CalcEngine.sharpe(w,rfPerPeriod||0)); } return out; }
 5462 |   function rollingDrawdown(closes){ const out=[]; let peak=-Infinity; for(let i=0;i<closes.length;i++){ if(closes[i]>peak)peak=closes[i]; out.push(closes[i]/peak-1); } return out; }
 5463 |   return {rollingVol,rollingBeta,rollingSharpe,rollingDrawdown};
 5464 | })();
 5465 | 
 5466 | /* ---- 48: Merton numerical diagnostics ---- */
 5467 | const MertonDiag=(()=>{
 5468 |   // Solve and return iteration/convergence details by re-running a traced solve
 5469 |   function erf(x){ const sign=x<0?-1:1; x=Math.abs(x); const t=1/(1+0.3275911*x); const y=1-((((1.061405429*t-1.453152027)*t+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x); return sign*y; }
 5470 |   function trace(E,sigmaE,D,r,T){
 5471 |     if(!E||!D||!sigmaE||E<=0||D<=0||sigmaE<=0) return {error:"Inputs invalid"};
 5472 |     let V=E+D, sigmaV=sigmaE*E/V;
 5473 |     const normCDF=(x)=>0.5*(1+erf(x/Math.SQRT2));
 5474 |     let iters=0, conv=false, resid=Infinity;
 5475 |     for(let i=0;i<100;i++){ iters=i+1;
 5476 |       const d1=(Math.log(V/D)+(r+0.5*sigmaV*sigmaV)*T)/(sigmaV*Math.sqrt(T));
 5477 |       const d2=d1-sigmaV*Math.sqrt(T);
 5478 |       const Nd1=normCDF(d1), Nd2=normCDF(d2);
 5479 |       const Ecalc=V*Nd1-D*Math.exp(-r*T)*Nd2;
 5480 |       const sEcalc=sigmaV*(V/E)*Nd1;
 5481 |       resid=Math.abs(E-Ecalc)/E;
 5482 |       if(resid<1e-6 && Math.abs(sigmaE-sEcalc)/sigmaE<1e-6){ conv=true; break; }
 5483 |       V=Math.max(V+(E-Ecalc)*0.5, E*0.5);
 5484 |       sigmaV=Math.max(sigmaV+(sigmaE-sEcalc)*0.5,0.01);
 5485 |     }
 5486 |     return {iterations:iters,converged:conv,residual:resid};
 5487 |   }
 5488 |   function diagHTML(merton,diag){
```

## mcBootstrapRender — line 6159 — owner `WorkflowGuide`

```js
 6151 |     <div class="metricline"><span class="l">Last actual revenue</span><span class="v">${fmt.money(lastActual)}</span></div>
 6152 |     <div class="metricline"><span class="l">First forecast year revenue</span><span class="v">${fmt.money(firstForecast)}</span></div>
 6153 |     <div class="metricline"><span class="l">Forecast uplift (Year 1)</span><span class="v">${fmt.pct(varPct)}</span></div>
 6154 |     <div class="banner info">Review whether the jump from the last actual to the first forecast is reasonable and supported by the growth assumption.</div></div>`;
 6155 |   }
 6156 |   $("#forecastForm").innerHTML=h;
 6157 | }
 6158 | /* ---- Bootstrap MC render (tab mc2) ---- */
 6159 | function mcBootstrapRender(){
 6160 |   const sd=App.state.stockData; const hist=App.state.history;
 6161 |   const hasHist= hist&&hist.prices&&hist.prices.length>5;
 6162 |   $("#mcForm").innerHTML=`<div class="card"><div class="card-title">Historical Bootstrap Monte Carlo</div>
 6163 |   <p class="small dim">Resamples actual historical returns with replacement. Compare this against GBM — neither is guaranteed correct; they make different assumptions about the distribution of returns.</p>
 6164 |   ${hasHist?`<div class="fields g3">
 6165 |     ${AppUI.frow("Current price",App.state.settings.currency,"bc_s0",sd.price||100)}
 6166 |     ${AppUI.frow("Horizon (years)","","bc_T",1)}
 6167 |     ${AppUI.frow("Simulations","","bc_n",App.state.settings.defaultSimCount||10000)}
 6168 |     ${AppUI.frow("Target price","","bc_target",sd.price?sd.price*1.2:"120")}
 6169 |   </div>
 6170 |   <div class="row mt"><button class="btn btn-primary" id="bc_run">Run Bootstrap</button></div><div id="bcOutBoot" class="mt"></div>`:`<div class="banner warn">Import a historical price series (Stock → Price History) first — bootstrap needs ≥6 observations.</div>`}
 6171 |   </div>`;
 6172 |   if(!hasHist)return;
 6173 |   wire("bc_run","click",()=>{ const rets=CalcEngine.dailyReturns(hist.prices.map(p=>p.close)); if(rets.length<5){ toast("Not enough returns.","warn"); return; }
 6174 |     const g=n=>Number($("#"+n).value)||0;
 6175 |     const r=BootstrapMC.run({initial:g("bc_s0"),returns:rets,horizonYears:g("bc_T"),simulations:Math.min(50000,Math.max(100,Math.round(g("bc_n")))),seed:App.state.mcSeed||1234,target:g("bc_target"),stepsPerYear:252});
 6176 |     App.state.bootstrapMC=r;
 6177 |     $("#bcOut").innerHTML=BootstrapMC.html(r);
 6178 |     // chart
 6179 |     const c=$("#bcChart"); if(c)c.remove(); const cb=h("div",{id:"bcChart",class:"chartbox mt"});
 6180 |     const lo=r.p5,hi=r.p95,histo={}; for(let i=0;i<20;i++)histo[i]=0; const step=(hi-lo)/20;
 6181 |     // regenerate a subsample for histogram (reuse run output? we only stored summary). Recompute small sample.
 6182 |     const rets2=rets; const rnd=(s=>function(){s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;})(1234);
 6183 |     const n=Math.round(g("bc_T")*252);
 6184 |     for(let i=0;i<500;i++){let v=g("bc_s0");for(let t=0;t<n;t++)v*=(1+rets2[Math.floor(rnd()*rets2.length)]);if(v>=lo&&v<=hi){const b=Math.floor((v-lo)/step);if(histo[b]!=null)histo[b]++;}}
 6185 |     cb.appendChild(ChartManager.barChart({series:[{data:Object.values(histo)}],labels:Object.keys(histo).map(i=>fmt.money(lo+Number(i)*step,0)),title:"Bootstrap Terminal-Value Distribution (P5–P95)",yFmt:fmt.num}));
 6186 |     $("#bcOut").appendChild(cb);
```

## walkForwardRender — line 6208 — owner `top-level/unknown`

```js
 6200 |   <div id="xrOut" class="mt"></div></div>`;
 6201 |   wire("xr_demo","click",()=>{ $("#xr_flows").value="-1000,300,400,500"; $("#xr_dates").value="2024-01-01,2024-07-01,2025-01-01,2026-01-01"; });
 6202 |   wire("xr_run","click",()=>{ const flows=$("#xr_flows").value.split(",").map(x=>Number(x.trim())).filter(x=>isFinite(x));
 6203 |     const dates=$("#xr_dates").value.split(",").map(x=>new Date(x.trim()).getTime()).filter(x=>!isNaN(x));
 6204 |     if(flows.length<2||flows.length!==dates.length){ $("#xrOut").innerHTML=`<div class="banner warn">Need matching cash flows and dates.</div>`; return; }
 6205 |     $("#xrOut").innerHTML=XIRR.xirrHTML(flows,dates);
 6206 |   });
 6207 | }
 6208 | function walkForwardRender(){
 6209 |   const hist=App.state.history; const hasHist= hist&&hist.prices&&hist.prices.length>150;
 6210 |   $("#backtestForm").innerHTML=`<div class="card"><div class="card-title">Walk-Forward Validation</div>
 6211 |   <p class="small dim">Runs the backtest over rolling training + test windows. In-sample and out-of-sample returns are compared to gauge robustness. This is not proof of future performance.</p>
 6212 |   ${hasHist? `<div class="fields g3">
 6213 |     ${AppUI.frow("Training window (days)","","wf_train",120)}
 6214 |     ${AppUI.frow("Test window (days)","","wf_test",30)}
 6215 |     ${AppUI.frow("Transaction cost","%","wf_tc",0.10)}
 6216 |     ${AppUI.frow("Slippage","%","wf_slip",0.05)}
 6217 |   </div>
 6218 |   <div class="row mt"><button class="btn btn-primary" id="wf_run">Run Walk-Forward</button></div><div id="wfOut" class="mt"></div>` : `<div class="banner warn">Walk-forward needs at least ~150 historical observations.</div>`}
 6219 |   </div>`;
 6220 |   if(hasHist) wire("wf_run","click",()=>{ const g=n=>Number($("#"+n)?.value)||0;
 6221 |     const r=WalkForward.run({prices:hist.prices, trainSize:Math.round(g("wf_train")), testSize:Math.round(g("wf_test")), initialCapital:100000, transactionCost:g("wf_tc")/100, slippage:g("wf_slip")/100});
 6222 |     App.state.walkForward=r; $("#wfOut").innerHTML=WalkForward.html(r); });
 6223 | }
 6224 | function optimizerRender(){
 6225 |   const saved=App.state.savedInvestments||[];
 6226 |   const items=saved.map(i=>({name:i.name,expectedReturn:i.metrics&&i.metrics.expectedReturn||.1,volatility:i.metrics&&i.metrics.volatility||.2})).filter(i=>i.expectedReturn!=null&&i.volatility!=null);
 6227 |   const el=$("#optimizerForm"); if(!el)return;
 6228 |   let h=`<p class="small dim">Analytical optimization methods applied to the current comparison set. These are <b>not</b> personal recommendations.</p>
 6229 |   <div class="row">${["Equal Weight","Minimum Variance","Maximum Sharpe","Risk Parity"].map((m,i)=>`<button class="btn btn-sm" data-opt="${i}">${m}</button>`).join("")}</div>
 6230 |   <div id="optOut" class="mt"></div>`;
 6231 |   el.innerHTML=h;
 6232 |   if(items.length<2){ const oo=$("#optOut"); if(oo)oo.innerHTML=`<div class="banner warn">Need at least 2 saved investments with return & volatility to optimize.</div>`; return; }
 6233 |   $$("#optimizerForm [data-opt]").forEach(b=>b.addEventListener("click",()=>{ const i=Number(b.dataset.opt); const out=$("#optOut");
 6234 |     let w=null, name="";
 6235 |     if(i===0){w=PortfolioOptimizers.equalWeight(items);name="Equal Weight";}
```

## backtestRender — line 6241 — owner `top-level/unknown`

```js
 6233 |   $$("#optimizerForm [data-opt]").forEach(b=>b.addEventListener("click",()=>{ const i=Number(b.dataset.opt); const out=$("#optOut");
 6234 |     let w=null, name="";
 6235 |     if(i===0){w=PortfolioOptimizers.equalWeight(items);name="Equal Weight";}
 6236 |     else if(i===1){w=PortfolioOptimizers.minimumVariance(items);name="Minimum Variance";}
 6237 |     else if(i===2){w=PortfolioOptimizers.maximumSharpe(items);name="Maximum Sharpe";}
 6238 |     else {w=PortfolioOptimizers.riskParity(items);name="Risk Parity";}
 6239 |     if(out)out.innerHTML=PortfolioOptimizers.htmlOptimizer(name,w,items); }));
 6240 | }
 6241 | function backtestRender(){
 6242 |   const tab=$("#view-backtest .tab.active")?.dataset.tab||"bt1";
 6243 |   if(tab==="bt2"){ walkForwardRender(); return; }
 6244 | 
 6245 |   const sd=App.state.stockData; const hist=App.state.history;
 6246 |   const hasHist= hist&&hist.prices&&hist.prices.length>30;
 6247 |   $("#backtestForm").innerHTML=`<div class="card"><div class="card-title">Strategy Backtest</div>
 6248 |   <p class="small dim">Runs a signal-based long/flat/short strategy on the imported historical price series, applying transaction costs and slippage. Requires a validated historical series.</p>
 6249 |   ${hasHist? `<div class="fields g3">
 6250 |     ${AppUI.frow("Long threshold (signal)","","bt_lt",0.0001)}
 6251 |     ${AppUI.frow("Short threshold (signal)","","bt_st",-0.0001)}
 6252 |     ${AppUI.frow("Rebalance every (days)","","bt_reb",1)}
 6253 |     ${AppUI.frow("Transaction cost","%","bt_tc",0.10)}
 6254 |     ${AppUI.frow("Slippage","%","bt_slip",0.05)}
 6255 |     ${AppUI.frow("Initial capital","","bt_cap",100000)}
 6256 |   </div>
 6257 |   <div class="row mt"><button class="btn btn-primary" id="bt_run">Run Backtest</button></div>
 6258 |   <div id="btOut" class="mt"></div>` : `<div class="banner warn">Backtest requires a validated historical price series (import in Stock → Price History, or load a demo).</div>`}
 6259 |   </div>`;
 6260 |   if(hasHist) wire("bt_run","click",()=>{
 6261 |     const g=n=>Number($("#"+n)?.value)||0;
 6262 |     const r=BacktestEngine.run({prices:hist.prices, startDate:null, endDate:null,
 6263 |       initialCapital:g("bt_cap"), longThreshold:g("bt_lt"), shortThreshold:g("bt_st"),
 6264 |       rebalanceEvery:Math.max(1,Math.round(g("bt_reb"))), transactionCost:g("bt_tc")/100, slippage:g("bt_slip")/100,
 6265 |       benchmarkPrices: hist.benchmark&&hist.benchmark.length?hist.benchmark:null});
 6266 |     App.state.backtestResult=r;
 6267 |     $("#btOut").innerHTML=BacktestEngine.html(r);
 6268 |     // bias controls disclosure
```

## computeMoatScore — line 6349 — owner `top-level/unknown`

```js
 6341 |     <div class="card-title mt">Competitive Position / Moat</div>
 6342 |     <div class="grid g3">
 6343 |       ${["Cost advantage","Scale","Network effects","Switching costs","Brand","Intangibles","Distribution","Regulatory barriers","Data advantage"].map((f,i)=>`<div class="frow"><label>${f}</label><input type="range" id="rs_moat_${i}" min="0" max="100" value="${r.moat&&r.moat[i]!=null?r.moat[i]:50}"><output id="rs_moatout_${i}">${r.moat&&r.moat[i]!=null?r.moat[i]:50}</output></div>`).join("")}
 6344 |     </div>
 6345 |     ${AppUI.frow("Rationale for competitive strength","","rs_moatRationale",r.moatRationale||"",{type:"textarea"})}
 6346 |     <div class="row mt"><button class="btn btn-primary" id="rs_saveInd">Save</button><span id="rs_moatScore" class="small dim"></span></div></div>`;
 6347 |     for(let i=0;i<9;i++){ const e=$("#rs_moat_"+i); if(e)e.addEventListener("input",()=>{ const o=$("#rs_moatout_"+i); if(o)o.textContent=e.value; computeMoatScore(); }); }
 6348 |     wire("rs_saveInd","click",()=>{ const g=n=>$("#"+n)?.value||""; const ind=r.industry;ind.struct=g("rs_istruct");ind.growth=g("rs_igrowth");ind.comp=g("rs_icomp");ind.cyc=g("rs_icycle");ind.reg=g("rs_ireg");ind.trends=g("rs_itrends"); r.moat=[];for(let i=0;i<9;i++)r.moat.push(Number($("#rs_moat_"+i)?.value)||50); r.moatRationale=g("rs_moatRationale"); StorageManager.save(); toast("Saved.","good"); });
 6349 |     function computeMoatScore(){ let sum=0;for(let i=0;i<9;i++)sum+=Number($("#rs_moat_"+i)?.value)||0; const sc=Math.round(sum/9); const s=$("#rs_moatScore"); if(s)s.textContent="Competitive Strength (moat) ≈ "+sc+"/100 — requires qualitative rationale."; }
 6350 |     computeMoatScore();
 6351 |   } else if(tab==="r4"){ // Research notes + evidence
 6352 |     const ev=(r.evidence||[]).map((e,i)=>`<tr><td>${esc(e.evidence)}</td><td>${esc(e.category)}</td><td>${esc(e.source)}</td><td>${esc(e.date)}</td><td>${esc(e.confidence)}</td><td><button class="btn btn-sm btn-danger" data-ev="${i}">×</button></td></tr>`).join("");
 6353 |     $("#researchForm").innerHTML=`<div class="card"><div class="card-title">Research Notes</div>
 6354 |     <div class="fields g2">
 6355 |       ${AppUI.frow("Business quality","","rs_nbq",r.notes.bq||"",{type:"textarea"})}
 6356 |       ${AppUI.frow("Growth","","rs_ng",r.notes.g||"",{type:"textarea"})}
 6357 |       ${AppUI.frow("Profitability","","rs_np",r.notes.p||"",{type:"textarea"})}
 6358 |       ${AppUI.frow("Capital allocation","","rs_nca",r.notes.ca||"",{type:"textarea"})}
 6359 |       ${AppUI.frow("Risks","","rs_nr",r.notes.r||"",{type:"textarea"})}
 6360 |       ${AppUI.frow("Catalysts","","rs_nc",r.notes.c||"",{type:"textarea"})}
 6361 |       ${AppUI.frow("Competitive advantage","","rs_na",r.notes.a||"",{type:"textarea"})}
 6362 |     </div>
 6363 |     <button class="btn btn-primary mt" id="rs_saveNotes">Save Notes</button>
 6364 |     <div class="card-title mt">Evidence Register</div>
 6365 |     <div class="fields g3">
 6366 |       ${AppUI.frow("Evidence / statement","","rs_evid","")}
 6367 |       ${AppUI.frow("Category","","rs_evcat","Financial",{type:"select",options:["Financial","Operational","Competitive","Macro","Regulatory","Management","Market","Risk","Valuation"].map(v=>({value:v,label:v}))})}
 6368 |       ${AppUI.frow("Source (USER PROVIDED)","","rs_evsrc","")}
 6369 |       ${AppUI.frow("Source date","","rs_evdate","")}
 6370 |       ${AppUI.frow("Confidence","","rs_evconf","Medium",{type:"select",options:["Low","Medium","High","Verified"].map(v=>({value:v,label:v}))})}
 6371 |       ${AppUI.frow("Analyst note","","rs_evnote","")}
 6372 |     </div>
 6373 |     <button class="btn btn-sm mt" id="rs_addEv">+ Add Evidence</button>
 6374 |     <div class="tablewrap mt"><table class="data"><thead><tr><th>Evidence</th><th>Category</th><th>Source</th><th>Date</th><th>Confidence</th><th></th></tr></thead><tbody>${ev||`<tr><td colspan="6" class="small dim">No evidence logged yet.</td></tr>`}</tbody></table></div>
 6375 |     <div class="banner info">Sources are recorded as <b>USER PROVIDED</b>. This application never fabricates sources — anything you enter here is marked as manually provided.</div>
 6376 |     </div>`;
```

## factorExposure — line 6973 — owner `byMetric`

```js
 6965 | }
 6966 | 
 6967 | 
 6968 | /* ============================================================
 6969 |    #3 — PORTFOLIO: FACTOR EXPOSURE + ATTRIBUTION + TRACKING ERROR
 6970 |    ============================================================ */
 6971 | 
 6972 | /* ---- Factor exposure: equity (market/size/value/growth/momentum/quality/low-vol) ---- */
 6973 | function factorExposure(items){
 6974 |   if(!items||!items.length)return null;
 6975 |   const exposures={Market:1,Size:0,Value:0,Growth:0,Momentum:0,Quality:0,LowVol:0};
 6976 |   const totalW=items.reduce((a,b)=>a+(b.weight||0),0);
 6977 |   items.forEach(b=>{ const w=(b.weight||0)/totalW; const t=(b.type||"").toLowerCase();
 6978 |     if(t.includes("stock")||t.includes("equity")||t==="stock"){
 6979 |       // heuristic factor tilts from volatility, valuation, growth
 6980 |       const vol=b.volatility!=null?b.volatility:.25;
 6981 |       const ret=b.expectedReturn!=null?b.expectedReturn:.1;
 6982 |       const mos=b.marginOfSafety!=null?b.marginOfSafety:0;
 6983 |       exposures.Market+=0;
 6984 |       exposures.Size+=w*0.5; // assume mid/small tilt
 6985 |       exposures.Value+=w*(mos>0.1?1:mos>-0.1?0:-1);   // cheap=value
 6986 |       exposures.Growth+=w*(ret>0.15?1:ret>0.08?0:-1); // high ret=growth
 6987 |       exposures.Momentum+=w*(ret>0.12?1:-0.3);
 6988 |       exposures.Quality+=w*(mos>-0.05?0.5:-0.5); // profitable
 6989 |       exposures.LowVol+=w*(vol<0.2?1:vol>0.4?-1:0);
 6990 |     } else {
 6991 |       exposures.Market+=0; // bonds: duration/credit handled separately
 6992 |     }
 6993 |   });
 6994 |   // normalize risk levels
 6995 |   const out=Object.entries(exposures).map(([factor,exposure])=>({factor,exposure:Math.round(exposure*100)/100,risk:Math.abs(exposure)>0.6?"High":Math.abs(exposure)>0.3?"Medium":"Low"}));
 6996 |   return out;
 6997 | }
 6998 | function factorHTML(expos){
 6999 |   if(!expos)return "";
 7000 |   let h=`<div class="card"><div class="card-title">Equity Factor Exposure <span class="small dim">(model-derived estimates)</span></div>
```

## performanceAttribution — line 7020 — owner `exposures`

```js
 7012 |   let h=`<div class="card mt"><div class="card-title">Fixed-Income Factor Exposure</div>
 7013 |   <div class="tablewrap"><table class="data"><thead><tr><th>Bond</th><th class="num">Duration</th><th>Credit Risk</th><th class="num">Spread</th></tr></thead><tbody>
 7014 |   ${rows.map(r=>`<tr><td>${esc(r.name)}</td><td class="num">${fmt.num(r.duration,1)}</td><td>${pill(r.credit,r.credit==="High"?"bad":r.credit==="Medium"?"warn":"good")}</td><td class="num">${fmt.pct(r.spread)}</td></tr>`).join("")}</tbody></table></div>
 7015 |   <div class="small dim">Duration = interest-rate sensitivity; credit = spread risk. Model-derived estimates.</div></div>`;
 7016 |   return h;
 7017 | }
 7018 | 
 7019 | /* ---- Performance attribution (allocation/selection) ---- */
 7020 | function performanceAttribution(items, benchmarkRet){
 7021 |   if(!items||!items.length)return null;
 7022 |   const totalW=items.reduce((a,b)=>a+(b.weight||0),0);
 7023 |   const rows=[];
 7024 |   let allocEffect=0, selectionEffect=0, totalPortRet=0;
 7025 |   const bench=benchmarkRet||0.08;
 7026 |   items.forEach(b=>{ const w=(b.weight||0)/totalW; const r=b.expectedReturn||0;
 7027 |     const alloc=(w)*(r-bench);       // allocation: weight × (asset return - benchmark)
 7028 |     const sel=(w)*(r-bench);          // simplified selection proxy
 7029 |     allocEffect+=alloc; selectionEffect+=sel; totalPortRet+=w*r;
 7030 |     rows.push({name:b.name,weight:w,return:r,allocation:alloc,selection:sel});
 7031 |   });
 7032 |   return {rows,allocEffect,selectionEffect,totalPortRet,benchmark:bench,excess:totalPortRet-bench};
 7033 | }
 7034 | function attributionHTML(attr){
 7035 |   if(!attr)return "";
 7036 |   let h=`<div class="card mt"><div class="card-title">Performance Attribution</div>
 7037 |   <div class="small dim">Allocation and selection effects are simplified estimates. Attribution is only meaningful when actual asset returns and weights are accurate; do not fabricate attribution when data is insufficient.</div>
 7038 |   <div class="tablewrap"><table class="data"><thead><tr><th>Asset</th><th class="num">Weight</th><th class="num">Return</th><th class="num">Allocation Effect</th><th class="num">Selection Effect</th></tr></thead><tbody>
 7039 |   ${attr.rows.map(r=>`<tr><td>${esc(r.name)}</td><td class="num">${fmt.pct(r.weight)}</td><td class="num">${fmt.pct(r.return)}</td><td class="num ${r.allocation>=0?'pos':'neg'}">${fmt.pct(r.allocation)}</td><td class="num ${r.selection>=0?'pos':'neg'}">${fmt.pct(r.selection)}</td></tr>`).join("")}</tbody></table></div>
 7040 |   <div class="grid g3 mt">${kpi("Portfolio return",fmt.pct(attr.totalPortRet))}${kpi("Benchmark",fmt.pct(attr.benchmark))}${kpi("Excess return",fmt.pct(attr.excess))}</div>
 7041 |   <div class="banner info">Allocation effect = Σ weight×(asset return − benchmark). This is a simplified single-period attribution.</div></div>`;
 7042 |   return h;
 7043 | }
 7044 | 
 7045 | /* ---- Tracking error ---- */
 7046 | function trackingError(assetReturns, benchReturns){
 7047 |   // assetReturns and benchReturns aligned arrays of periodic returns
```

## creditRatios — line 7193 — owner `BootstrapMC`

```js
 7185 | /* ============================================================
 7186 |    #5/#6/#7/#8 — CREDIT RATIOS (FFO/DSCR) + FIELD MAPPING
 7187 |    REVIEW + DATA FRESHNESS + WHY-DID-MODEL-CHANGE
 7188 |    ============================================================ */
 7189 | 
 7190 | /* ============================================================
 7191 |    #5 — Credit ratios: Net debt, FFO/Debt, Debt-service coverage
 7192 |    ============================================================ */
 7193 | function creditRatios(sd){
 7194 |   if(!sd)return null;
 7195 |   const safe=(a,b)=> b&&Math.abs(b)>1e-12? a/b:null;
 7196 |   const netDebt=(sd.debt!=null&&sd.cash!=null)? sd.debt-sd.cash : null;
 7197 |   const ffo = sd.ffo!=null? sd.ffo : (sd.netIncome!=null&&sd.danda!=null? sd.netIncome+sd.danda : null);
 7198 |   const dscr = (sd.debtService!=null&&sd.ebitda!=null&&sd.ebitda>0)? sd.ebitda/sd.debtService : null;
 7199 |   return {
 7200 |     netDebt,
 7201 |     grossDebt:sd.debt,
 7202 |     ffo,
 7203 |     ffoToDebt: safe(ffo, sd.debt),
 7204 |     netDebtEbitda: safe(netDebt, sd.ebitda),
 7205 |     dscr,
 7206 |     interestCoverage: safe(sd.ebit, sd.interestExpense),
 7207 |     recovery:.35
 7208 |   };
 7209 | }
 7210 | function creditRatiosHTML(cr){
 7211 |   if(!cr)return "";
 7212 |   const status=(v,low,high)=> v==null?"—": (v<low?"Concern":v>high?"Good":"Moderate");
 7213 |   return `<div class="card"><div class="card-title">Credit Ratios</div>
 7214 |   <div class="grid g3">
 7215 |     ${kpi("Net debt",cr.netDebt!=null?fmt.money(cr.netDebt):"—",cr.grossDebt!=null?"Gross "+fmt.money(cr.grossDebt):"")}
 7216 |     ${kpi("FFO / Debt",cr.ffoToDebt!=null?fmt.x(cr.ffoToDebt,2):"—",pill(status(cr.ffoToDebt,.1,.2),status(cr.ffoToDebt,.1,.2)==="Good"?"good":status(cr.ffoToDebt,.1,.2)==="Concern"?"bad":"warn"))}
 7217 |     ${kpi("Net Debt / EBITDA",cr.netDebtEbitda!=null?fmt.x(cr.netDebtEbitda,2):"—",pill(status(cr.netDebtEbitda,2,3.5),status(cr.netDebtEbitda,2,3.5)==="Good"?"good":status(cr.netDebtEbitda,2,3.5)==="Concern"?"bad":"warn"))}
 7218 |     ${kpi("Debt-service coverage (DSCR)",cr.dscr!=null?fmt.x(cr.dscr,2):"—","EBITDA / debt service")}
 7219 |     ${kpi("Interest coverage",cr.interestCoverage!=null?fmt.x(cr.interestCoverage,2):"—")}
 7220 |   </div>
```

## segmentForecastRender — line 7308 — owner `BootstrapMC`

```js
 7300 | 
 7301 | 
 7302 | /* ============================================================
 7303 |    #9 — SUM-OF-THE-PARTS VALUATION + SEGMENT FORECAST
 7304 |    #10 — EARNINGS QUALITY TREND CHARTS
 7305 |    ============================================================ */
 7306 | 
 7307 | /* ---- Segment-level forecast: revenue by segment ---- */
 7308 | function segmentForecastRender(){
 7309 |   const seg=App.state.segments||(App.state.segments={segments:[],years:3,startYear:new Date().getFullYear()+1});
 7310 |   const sd=App.state.stockData;
 7311 |   // default segments
 7312 |   if(!seg.segments.length) seg.segments=[
 7313 |     {name:"Segment A",share:0.6,growth:[.1,.1,.1],margin:[.2,.2,.2]},
 7314 |     {name:"Segment B",share:0.4,growth:[.15,.15,.15],margin:[.25,.25,.25]}
 7315 |   ];
 7316 |   const n=seg.years;
 7317 |   const yrHeaders=Array.from({length:n},(_,i)=>`<th class="num">${seg.startYear+i}E</th>`).join("");
 7318 |   const growRow=(s,i)=>s.growth.map((v,y)=>`<input type="text" value="${(v*100).toFixed(1)}" id="seg_${i}_g_${y}" style="width:56px">`).join("");
 7319 |   const marginRow=(s,i)=>s.margin.map((v,y)=>`<input type="text" value="${(v*100).toFixed(1)}" id="seg_${i}_m_${y}" style="width:56px">`).join("");
 7320 |   const rows=seg.segments.map((s,i)=>`<tr>
 7321 |     <td><input type="text" value="${esc(s.name)}" id="seg_${i}_name" style="width:110px"> <button class="btn btn-sm btn-danger" data-seg="${i}">×</button></td>
 7322 |     <td><input type="text" value="${s.share}" id="seg_${i}_share" style="width:56px"></td>
 7323 |     <td>${growRow(s,i)}</td><td>${marginRow(s,i)}</td></tr>`).join("");
 7324 |   $("#segForm").innerHTML=`<div class="card"><div class="card-title">Segment Revenue Forecast</div>
 7325 |   <p class="small dim">Split total revenue into segments with per-segment growth and margin assumptions. This feeds a sum-of-the-parts style view and a weighted total forecast.</p>
 7326 |   <div class="row mb"><span class="small">Total revenue (base): <input type="text" id="seg_total" value="${sd.revenue||""}" style="width:110px"></span>
 7327 |   <span class="small">Years: <input type="text" id="seg_years" value="${n}" style="width:50px"></span>
 7328 |   <button class="btn btn-sm" id="seg_add">+ Segment</button></div>
 7329 |   <div class="tablewrap"><table class="data"><thead><tr><th>Segment</th><th class="num">Share</th><th>Growth % (per yr)</th><th>Margin % (per yr)</th></tr></thead><tbody>${rows}</tbody></table></div>
 7330 |   <div class="row mt"><button class="btn btn-primary" id="seg_run">Build Segment Forecast</button></div>
 7331 |   <div id="segOut" class="mt"></div></div>`;
 7332 |   wire("seg_add","click",()=>{ seg.segments.push({name:"Segment "+String.fromCharCode(65+seg.segments.length),share:0,growth:Array(n).fill(.1),margin:Array(n).fill(.2)}); segmentForecastRender(); });
 7333 |   $$("#segForm [data-seg]").forEach(b=>b.addEventListener("click",()=>{ seg.segments.splice(Number(b.dataset.seg),1); segmentForecastRender(); }));
 7334 |   wire("seg_run","click",()=>{
 7335 |     const total=Number($("#seg_total").value)||sd.revenue||1000;
```

## sotpRender — line 7365 — owner `BootstrapMC`

```js
 7357 |     <div id="segChart" class="mt"></div></div>`;
 7358 |     $("#segOut").innerHTML=h;
 7359 |     const cb=h("div",{id:"segChartBox",class:"chartbox"}); cb.appendChild(ChartManager.lineChart({series:out.map(s=>({data:s.revs,label:s.name})),labels:out[0].revs.map((_,i)=>(seg.startYear+i)+"E"),title:"Segment Revenue Forecast",yFmt:fmt.money})); $("#segOut").appendChild(cb);
 7360 |     StorageManager.save();
 7361 |   });
 7362 | }
 7363 | 
 7364 | /* ---- Sum-of-the-Parts valuation ---- */
 7365 | function sotpRender(){
 7366 |   const sotp=App.state.sotp||(App.state.sotp={parts:[],shares:null});
 7367 |   const sd=App.state.stockData;
 7368 |   if(!sotp.parts.length) sotp.parts=[{name:"Core Business",value:sd.marketCap||0,multiple:10,metric:sd.netIncome||0},{name:"Cash / Investments",value:sd.cash||0,multiple:1,metric:sd.cash||0}];
 7369 |   const rows=sotp.parts.map((p,i)=>`<tr>
 7370 |     <td><input type="text" value="${esc(p.name)}" id="sotp_${i}_name" style="width:140px"></td>
 7371 |     <td><input type="text" value="${p.value}" id="sotp_${i}_value" style="width:90px"></td>
 7372 |     <td><input type="text" value="${p.multiple}" id="sotp_${i}_mult" style="width:60px"></td>
 7373 |     <td><input type="text" value="${p.metric}" id="sotp_${i}_metric" style="width:90px"></td>
 7374 |     <td><button class="btn btn-sm btn-danger" data-sotp="${i}">×</button></td></tr>`).join("");
 7375 |   $("#sotpForm").innerHTML=`<div class="card"><div class="card-title">Sum-of-the-Parts Valuation</div>
 7376 |   <p class="small dim">Value each business part separately (e.g. via its own multiple × metric, or an absolute value), then sum and divide by shares. Useful for conglomerates.</p>
 7377 |   <div class="tablewrap"><table class="data"><thead><tr><th>Part</th><th class="num">Value / Metric</th><th class="num">Multiple</th><th class="num">Metric</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
 7378 |   <div class="row mt"><span class="small">Shares outstanding: <input type="text" id="sotp_shares" value="${sotp.shares||sd.shares||1}" style="width:90px"></span>
 7379 |   <button class="btn btn-sm" id="sotp_add">+ Part</button>
 7380 |   <button class="btn btn-primary" id="sotp_run">Compute SOTP</button></div>
 7381 |   <div id="sotpOut" class="mt"></div></div>`;
 7382 |   wire("sotp_add","click",()=>{ sotp.parts.push({name:"New Part",value:0,multiple:1,metric:0}); sotpRender(); });
 7383 |   $$("#sotpForm [data-sotp]").forEach(b=>b.addEventListener("click",()=>{ sotp.parts.splice(Number(b.dataset.sotp),1); sotpRender(); }));
 7384 |   wire("sotp_run","click",()=>{
 7385 |     const shares=Number($("#sotp_shares").value)||1;
 7386 |     const parts=sotp.parts.map((p,i)=>{ const value=Number($("#sotp_"+i+"_value")?.value)||0; const mult=Number($("#sotp_"+i+"_mult")?.value)||1; const metric=Number($("#sotp_"+i+"_metric")?.value)||0; return {name:$("#sotp_"+i+"_name")?.value||p.name, value: value!==0? value: mult*metric, mult, metric}; });
 7387 |     sotp.parts=parts; sotp.shares=shares;
 7388 |     const totalEV=parts.reduce((a,b)=>a+b.value,0);
 7389 |     const equityValue=totalEV-(sd.netDebt||0);
 7390 |     const perShare= shares>0? equityValue/shares:0;
 7391 |     App.state.sotpResult={parts,totalEV,equityValue,perShare,shares};
 7392 |     let h=`<div class="card"><div class="card-title">Sum-of-the-Parts Result</div>
```

## mulberry — line 1607 — owner `MonteCarlo`

```js
 1599 |   }
 1600 |   return {run};
 1601 | })();
 1602 | 
 1603 | /* ============================================================
 1604 |    MONTE CARLO — GBM paths
 1605 |    ============================================================ */
 1606 | const MonteCarlo=(()=>{
 1607 |   function mulberry(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
 1608 |   function run({initial=100, expectedReturn=.10, volatility=.25, horizonYears=1, simulations=10000, seed=1234, target=110, stepsPerYear=12}){
 1609 |     const rnd=mulberry(seed);
 1610 |     const norm=()=>{ // Box-Muller
 1611 |       const u1=Math.max(rnd(),1e-12), u2=rnd(); return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2); };
 1612 |     const mu=expectedReturn, sigma=volatility;
 1613 |     const dt=1/stepsPerYear; const n=Math.round(horizonYears*stepsPerYear);
 1614 |     const finals=[];
 1615 |     const results={ };
 1616 |     const subsample=[];
 1617 |     for(let sim=0;sim<simulations;sim++){
 1618 |       let s=initial;
 1619 |       for(let t=0;t<n;t++){ s*= Math.exp((mu-0.5*sigma*sigma)*dt + sigma*Math.sqrt(dt)*norm()); }
 1620 |       finals.push(s); if(sim% Math.max(1,Math.floor(simulations/200))===0) subsample.push(s);
 1621 |     }
 1622 |     finals.sort((a,b)=>a-b);
 1623 |     const pct=(p)=> finals[Math.min(finals.length-1, Math.floor(p*(finals.length-1)))];
 1624 |     const returns=finals.map(f=> f/initial-1);
 1625 |     const pLoss=returns.filter(r=>r<0).length/returns.length;
 1626 |     const pTarget=finals.filter(f=>f>=target).length/simulations; // P(final ≥ target)
 1627 |     const pExceed=finals.filter(f=>f>=target).length/simulations;
 1628 |     return {initial,simulations, median:pct(.5), p5:pct(.05),p25:pct(.25),p75:pct(.75),p95:pct(.95), min:finals[0], max:finals[finals.length-1], mean:CalcEngine.mean(finals), pLoss, pTarget, pExceed, target, subsample, seed};
 1629 |   }
 1630 |   return {run};
 1631 | })();
 1632 | 
 1633 | /* ============================================================
 1634 |    CORRELATION
```

## mulberry — line 7170 — owner `BootstrapMC`

```js
 7162 |       finals.push(val);
 7163 |     }
 7164 |     finals.sort((a,b)=>a-b);
 7165 |     const pct=p=>finals[Math.min(finals.length-1,Math.floor(p*(finals.length-1)))];
 7166 |     const pLoss=finals.filter(v=>v<initial).length/simulations;
 7167 |     const pExceed= target!=null? finals.filter(v=>v>=target).length/simulations : null;
 7168 |     return {initial,simulations,seed,n,median:pct(.5),p5:pct(.05),p25:pct(.25),p75:pct(.75),p95:pct(.95),mean:CalcEngine.mean(finals),pLoss,pExceed,target,method:"Historical Bootstrap"};
 7169 |   }
 7170 |   function mulberry(seed){ let s=seed|0; return function(){ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
 7171 |   function html(r){
 7172 |     if(!r)return `<div class="banner warn">Historical Bootstrap requires at least 5 historical return observations. Import a price series first.</div>`;
 7173 |     return `<div class="card"><div class="card-title">Historical Bootstrap Monte Carlo <span class="tag info">seed ${r.seed}</span></div>
 7174 |     <div class="banner info">Resamples actual historical returns (with replacement) rather than assuming a normal distribution. <b>Results are conditional distributions under the observed history — not forecasts.</b></div>
 7175 |     <div class="grid g4">
 7176 |       ${kpi("Median outcome",fmt.money(r.median),"P50")}${kpi("P5",fmt.money(r.p5))}${kpi("P25",fmt.money(r.p25))}${kpi("P75",fmt.money(r.p75))}${kpi("P95",fmt.money(r.p95))}${kpi("Mean",fmt.money(r.mean))}${kpi("Prob. of loss",fmt.pct(r.pLoss))}${kpi("Simulations",String(r.simulations))}
 7177 |     </div>
 7178 |     ${r.target!=null?`<div class="metricline"><span class="l">P(exceed target ${fmt.money(r.target)})</span><span class="v">${fmt.pct(r.pExceed)}</span></div>`:""}
 7179 |     <div class="small dim">Bootstrap uses the actual distribution of the imported history — it avoids the normality assumption of GBM but still assumes the past sample is representative.</div></div>`;
 7180 |   }
 7181 |   return {run,html};
 7182 | })();
 7183 | 
 7184 | 
 7185 | /* ============================================================
 7186 |    #5/#6/#7/#8 — CREDIT RATIOS (FFO/DSCR) + FIELD MAPPING
 7187 |    REVIEW + DATA FRESHNESS + WHY-DID-MODEL-CHANGE
 7188 |    ============================================================ */
 7189 | 
 7190 | /* ============================================================
 7191 |    #5 — Credit ratios: Net debt, FFO/Debt, Debt-service coverage
 7192 |    ============================================================ */
 7193 | function creditRatios(sd){
 7194 |   if(!sd)return null;
 7195 |   const safe=(a,b)=> b&&Math.abs(b)>1e-12? a/b:null;
 7196 |   const netDebt=(sd.debt!=null&&sd.cash!=null)? sd.debt-sd.cash : null;
 7197 |   const ffo = sd.ffo!=null? sd.ffo : (sd.netIncome!=null&&sd.danda!=null? sd.netIncome+sd.danda : null);
```

## mulberry — line 7479 — owner `top-level/unknown`

```js
 7471 |    responsive on large simulation counts. Falls back to the
 7472 |    main thread if the environment blocks workers (e.g. strict
 7473 |    file:// sandboxes) — preserving offline operation either way.
 7474 |    ============================================================ */
 7475 | 
 7476 | /* ---- Worker core: identical GBM math, but standalone (no external deps) ---- */
 7477 | const MCWorkerSource = `
 7478 | "use strict";
 7479 | function mulberry(seed){ var s=seed|0; return function(){ s=s+0x6D2B79F5|0; var t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
 7480 | self.onmessage=function(e){
 7481 |   var cfg=e.data||{};
 7482 |   var initial=cfg.initial||100, expectedReturn=cfg.expectedReturn||0, volatility=cfg.volatility||0;
 7483 |   var horizonYears=cfg.horizonYears||1, simulations=cfg.simulations||10000, seed=cfg.seed||1234, target=cfg.target;
 7484 |   var stepsPerYear=cfg.stepsPerYear||252;
 7485 |   var rnd=mulberry(seed);
 7486 |   function norm(){ var u1=Math.max(rnd(),1e-12),u2=rnd(); return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2); }
 7487 |   var mu=expectedReturn, sigma=volatility, dt=1/stepsPerYear, n=Math.round(horizonYears*stepsPerYear);
 7488 |   var finals=new Array(simulations);
 7489 |   var subsample=[];
 7490 |   for(var sim=0;sim<simulations;sim++){
 7491 |     var s=initial;
 7492 |     for(var t=0;t<n;t++){ s*=Math.exp((mu-0.5*sigma*sigma)*dt + sigma*Math.sqrt(dt)*norm()); }
 7493 |     finals[sim]=s;
 7494 |     if(sim % Math.max(1,Math.floor(simulations/200))===0) subsample.push(s);
 7495 |     // progress reporting every ~5%
 7496 |     if(sim % Math.max(1,Math.floor(simulations/20))===0) self.postMessage({type:"progress",done:sim+1,total:simulations});
 7497 |   }
 7498 |   finals.sort(function(a,b){return a-b;});
 7499 |   function pct(p){ return finals[Math.min(finals.length-1,Math.floor(p*(finals.length-1)))]; }
 7500 |   var sum=0; for(var i=0;i<finals.length;i++)sum+=finals[i];
 7501 |   var mean=sum/finals.length;
 7502 |   var pLoss=0; for(i=0;i<finals.length;i++) if(finals[i]<initial)pLoss++;
 7503 |   pLoss=pLoss/finals.length;
 7504 |   var pExceed=0; if(target!=null){ for(i=0;i<finals.length;i++) if(finals[i]>=target)pExceed++; pExceed=pExceed/finals.length; }
 7505 |   self.postMessage({type:"done", initial:initial, simulations:simulations, median:pct(.5), p5:pct(.05), p25:pct(.25), p75:pct(.75), p95:pct(.95), min:finals[0], max:finals[finals.length-1], mean:mean, pLoss:pLoss, pExceed:pExceed, target:target, subsample:subsample, seed:seed, method:"GBM (Web Worker)"});
 7506 | };
```

## check — line 4645 — owner `ThesisConsistency`

```js
 4637 |   }
 4638 |   return {build,stress};
 4639 | })();
 4640 | 
 4641 | /* ============================================================
 4642 |    THESIS vs MODEL CONSISTENCY
 4643 |    ============================================================ */
 4644 | const ThesisConsistency=(()=>{
 4645 |   function check(){
 4646 |     const s=App.state; const t=s.thesis; const sd=s.stockData;
 4647 |     if(!t||!t.thesis) return null;
 4648 |     const issues=[];
 4649 |     // detect margin assumption in thesis vs model
 4650 |     const marginMatch=/(\d{1,3})\s*%\s*(margin|operating margin)/i.exec(t.thesis+" "+t.bull);
 4651 |     const modelMargin= sd&&sd.ebitdaMargin!=null? sd.ebitdaMargin*100:null;
 4652 |     if(marginMatch&&modelMargin!=null){ const thesisMargin=Number(marginMatch[1]); if(Math.abs(thesisMargin-modelMargin)>3) issues.push(`Your thesis assumes margin expansion to ~${thesisMargin}%, but the base-case model assumes ${fmt.pct(sd.ebitdaMargin)}. The thesis and model are not fully aligned.`); }
 4653 |     // growth
 4654 |     const growthMatch=/(\d{1,3})\s*%\s*(growth|revenue growth)/i.exec(t.thesis+" "+t.bull);
 4655 |     const modelGrowth= sd&&sd.growth!=null? sd.growth*100:null;
 4656 |     if(growthMatch&&modelGrowth!=null){ const thesisGrowth=Number(growthMatch[1]); if(Math.abs(thesisGrowth-modelGrowth)>5) issues.push(`Your thesis implies ~${thesisGrowth}% growth, while the base-case model assumes ${fmt.pct(sd.growth)}.`); }
 4657 |     // target vs valuation
 4658 |     const target=t.target; const val=s.results.stock&&s.results.stock.valuation?s.results.stock.valuation.perShare:null;
 4659 |     if(target!=null&&val!=null){ if(Math.abs(target-val)/val>.2) issues.push(`Your target valuation (${fmt.money(target)}) is ${fmt.pct((target-val)/val)} away from the base DCF value (${fmt.money(val)}).`); }
 4660 |     const ok=!issues.length;
 4661 |     return {ok,issues, target:t.target, val: s.results.stock&&s.results.stock.valuation?s.results.stock.valuation.perShare:null};
 4662 |   }
 4663 |   function checkHTML(res){
 4664 |     if(!res)return "";
 4665 |     return `<div class="card"><div class="card-title">Thesis vs Model Consistency ${res.ok?pill("ALIGNED","good"):pill("MISALIGNED","warn")}</div>
 4666 |     ${res.issues.length?`<div class="gridlist">${res.issues.map(i=>`<div class="banner warn" style="margin:4px 0">⚠ ${esc(i)}</div>`).join("")}</div>`:`<div class="banner good" style="margin:4px 0">The financial model appears consistent with your stated thesis assumptions.</div>`}</div>`;
 4667 |   }
 4668 |   return {check,checkHTML};
 4669 | })();
 4670 | 
 4671 | /* ============================================================
 4672 |    UI — render new views
```

## check — line 8455 — owner `PortfolioConstraints`

```js
 8447 |    V5 — BATCH 2: PORTFOLIO CONSTRAINTS + RISK CONTRIBUTION,
 8448 |    VALUATION UNCERTAINTY, BACKTESTING ENGINE
 8449 |    ============================================================ */
 8450 | 
 8451 | /* ============================================================
 8452 |    PORTFOLIO CONSTRAINTS ENGINE
 8453 |    ============================================================ */
 8454 | const PortfolioConstraints=(()=>{
 8455 |   function check(port,constraints){
 8456 |     if(!port)return [];
 8457 |     const issues=[];
 8458 |     const items=port.items||[]; const totalW=items.reduce((a,b)=>a+(b.weight||0),0)||1;
 8459 |     const c=constraints||{maxPosition:.08,minPosition:0,sectorLimit:.25,cashMin:.03,countryLimit:.30};
 8460 |     items.forEach(b=>{ const w=(b.weight||0)/totalW;
 8461 |       if(c.maxPosition!=null&&w>c.maxPosition) issues.push({sev:"warning",text:"Position "+b.name+" at "+fmt.pct(w)+" exceeds max "+fmt.pct(c.maxPosition),module:"Portfolio",why:"Concentration increases idiosyncratic risk.",action:"Review position weight."});
 8462 |       if(c.minPosition!=null&&w>0&&w<c.minPosition) issues.push({sev:"review",text:"Position "+b.name+" ("+fmt.pct(w)+") below min "+fmt.pct(c.minPosition),module:"Portfolio",why:"Fragmented holdings add cost without benefit.",action:"Consider consolidating."});
 8463 |     });
 8464 |     const bySector={}; items.forEach(b=>{ const k=b.sector||"Other"; bySector[k]=(bySector[k]||0)+(b.weight||0)/totalW; });
 8465 |     Object.entries(bySector).forEach(([s,w])=>{ if(c.sectorLimit!=null&&w>c.sectorLimit) issues.push({sev:"warning",text:"Sector "+s+" at "+fmt.pct(w)+" exceeds limit "+fmt.pct(c.sectorLimit),module:"Portfolio",why:"Sector concentration reduces diversification.",action:"Rebalance away from "+s+"."}); });
 8466 |     const cash=items.filter(b=>(b.assetClass||"").toLowerCase().includes("cash")).reduce((a,b)=>a+(b.weight||0)/totalW,0);
 8467 |     if(c.cashMin!=null&&cash<c.cashMin) issues.push({sev:"review",text:"Cash at "+fmt.pct(cash)+" below minimum "+fmt.pct(c.cashMin),module:"Portfolio",why:"Low cash reduces liquidity buffer.",action:"Increase cash allocation."});
 8468 |     return issues;
 8469 |   }
 8470 |   return {check};
 8471 | })();
 8472 | 
 8473 | /* ============================================================
 8474 |    PORTFOLIO RISK CONTRIBUTION
 8475 |    ============================================================ */
 8476 | const RiskContribution=(()=>{
 8477 |   function compute(port,corrMatrix){
 8478 |     if(!port)return null;
 8479 |     const items=port.items||[]; if(items.length<2)return null;
 8480 |     const n=items.length; const totalW=items.reduce((a,c)=>a+(c.weight||0),0)||1;
 8481 |     const weights=items.map(b=> (b.weight||0)/totalW );
 8482 |     const vols=items.map(b=> b.volatility!=null?b.volatility:0.2);
```

## check — line 8875 — owner `InvestmentHorizon`

```js
 8867 |   return {render,CHECKLIST};
 8868 | })();
 8869 | 
 8870 | /* ============================================================
 8871 |    INVESTMENT HORIZON
 8872 |    ============================================================ */
 8873 | const InvestmentHorizon=(()=>{
 8874 |   const OPTIONS=["<1 year","1–3 years","3–5 years","5–10 years","10+ years"];
 8875 |   function check(){
 8876 |     const hz=App.state.thesis&&App.state.thesis.horizon; const modelH=Model.assumptions().horizon;
 8877 |     if(hz==null||modelH==null)return null;
 8878 |     // map horizon to years
 8879 |     let hzYears = hz<1?0.5: hz<3?2: hz<5?4: hz<10?7:15;
 8880 |     const mismatch= Math.abs(hzYears-modelH)>1.5;
 8881 |     return {hz,modelH,mismatch};
 8882 |   }
 8883 |   function render(){
 8884 |     const c=check();
 8885 |     let h=`<div class="card"><div class="card-title">Investment Horizon</div>
 8886 |     <div class="fields g3">${AppUI.frow("Selected horizon (years)","","hz_years",App.state.thesis&&App.state.thesis.horizon||"","tip")}</div>
 8887 |     <button class="btn btn-sm mt" id="hz_set">Set Horizon</button>
 8888 |     <div id="hzOut" class="mt"></div></div>`;
 8889 |     const el=$("#horizonForm"); if(el)el.innerHTML=h;
 8890 |     wire("hz_set","click",()=>{ App.state.thesis.horizon=Number($("#hz_years").value)||null; StorageManager.save(); const o=$("#hzOut");
 8891 |       if(c&&c.mismatch)o.innerHTML=`<div class="banner warn">REVIEW — analytical horizon (${c.hz}yr) differs from model horizon (${c.modelH}yr). Explain the mismatch.</div>`;
 8892 |       else o.innerHTML=`<div class="banner good">Horizon set.</div>`; toast("Horizon saved.","good"); });
 8893 |   }
 8894 |   return {check,render,OPTIONS};
 8895 | })();
 8896 | 
 8897 | /* ============================================================
 8898 |    SECTOR TEMPLATES
 8899 |    ============================================================ */
 8900 | const SectorTemplates=(()=>{
 8901 |   const TEMPLATES={
 8902 |     Banks:{metrics:["CET1 ratio","Tier 1 capital","Net interest margin","Cost/income ratio","NPL ratio","Provisioning","Loan growth","Deposit growth","ROE"]},
```

## compute — line 1368 — owner `FinancialRatios`

```js
 1360 |   function equivalentAnnualValue(npv_,rate,nYears){ return rate===0? npv_/nYears : npv_*rate/(1-Math.pow(1+rate,-nYears)); }
 1361 |   return {npv,irr,mirr,payback,discountedPayback,profitabilityIndex,npvTable,payment,amortization,equivalentAnnualValue};
 1362 | })();
 1363 | 
 1364 | /* ============================================================
 1365 |    COMPANY RATIOS & CREDIT MODELS
 1366 |    ============================================================ */
 1367 | const FinancialRatios=(()=>{
 1368 |   function compute(f){
 1369 |     const safe=(a,b)=> (b&&Math.abs(b)>1e-12)? a/b:null;
 1370 |     const r={};
 1371 |     r.revenue=f.revenue||null; r.cogs=f.cogs||null; r.opex=f.opex||null; r.gross=f.grossProfit!==undefined? f.grossProfit: (f.revenue!=null&&f.cogs!=null? f.revenue-f.cogs:null);
 1372 |     r.ebitda=f.ebitda||null; r.ebit=f.ebit||null; r.netIncome=f.netIncome||null;
 1373 |     r.cash=f.cash||null; r.debt=f.debt||null; r.assets=f.assets||null; r.liabilities=f.liabilities||null;
 1374 |     r.equity=f.equity||null; r.workingCapital=f.workingCapital||null; r.retained=f.retained||null; r.mve=f.mve||null;
 1375 |     r.currentAssets=f.currentAssets||null; r.currentLiabilities=f.currentLiabilities||null;
 1376 |     r.inventory=f.inventory||null;
 1377 |     r.grossMargin=safe(r.gross,r.revenue);
 1378 |     r.operatingMargin=safe(r.ebit,r.revenue);
 1379 |     r.ebitdaMargin=safe(r.ebitda,r.revenue);
 1380 |     r.netMargin=safe(r.netIncome,r.revenue);
 1381 |     r.roa=safe(r.netIncome,r.assets);
 1382 |     r.roe=safe(r.netIncome,r.equity);
 1383 |     r.roic=safe(r.ebit*(1-(f.tax||0)), r.equity+r.debt-f.cash);
 1384 |     r.currentRatio=safe(r.currentAssets,r.currentLiabilities);
 1385 |     r.quickRatio=safe((r.currentAssets-(r.inventory||0)), r.currentLiabilities);
 1386 |     r.debtEquity=safe(r.debt,r.equity);
 1387 |     r.debtAssets=safe(r.debt,r.assets);
 1388 |     r.debtEbitda=safe(r.debt,r.ebitda);
 1389 |     r.interestCoverage=safe(r.ebit, f.interestExpense);
 1390 |     r.assetTurnover=safe(r.revenue,r.assets);
 1391 |     r.equityMultiplier=safe(r.assets,r.equity);
 1392 |     r.netDebt=(r.debt!=null&&r.cash!=null)? r.debt-r.cash:null;
 1393 |     return r;
 1394 |   }
 1395 |   function dupont(r){ return {netMargin:r.netMargin, assetTurnover:r.assetTurnover, equityMultiplier:r.equityMultiplier, roe:r.netMargin!=null&&r.assetTurnover!=null&&r.equityMultiplier!=null? r.netMargin*r.assetTurnover*r.equityMultiplier:null}; }
```

## compute — line 4193 — owner `DataQualityV2`

```js
 4185 |   function markCalculated(){ App.state.modelStatus.lastCalc=Date.now(); update(); }
 4186 |   return {update,markCalculated};
 4187 | })();
 4188 | 
 4189 | /* ============================================================
 4190 |    MULTI-DIMENSIONAL DATA QUALITY
 4191 |    ============================================================ */
 4192 | const DataQualityV2=(()=>{
 4193 |   function compute(){
 4194 |     const s=App.state; const r=s.results;
 4195 |     const dims={};
 4196 |     // Completeness
 4197 |     let compTotal=0,compScore=0; const compBits=[["Financial statements", !!(s.stockData&&s.stockData.revenue!=null)],["Historical data", !!(s.history&&s.history.prices&&s.history.prices.length>0)],["Forecast assumptions", !!(s.stockData&&s.stockData.wacc!=null)],["Peer data", !!(r.stock&&r.stock.comps)],["Credit data", !!(r.stock&&r.stock.merton)]];
 4198 |     compBits.forEach(([n,ok])=>{compTotal++; if(ok)compScore++;});
 4199 |     dims.completeness= compTotal? Math.round(compScore/compTotal*100):0;
 4200 |     // Consistency
 4201 |     let cons=70; if(r.stock&&r.stock.altman&&r.stock.altman.z!=null)cons+=10; if(r.stock&&r.stock.dataQuality)cons=Math.min(100,cons+Math.max(0,(r.stock.dataQuality.score-50)/10)); dims.consistency=Math.min(100,cons);
 4202 |     // Timeliness
 4203 |     dims.timeliness= s.history&&s.history.prices&&s.history.prices.length>200?90: s.history&&s.history.prices&&s.history.prices.length>60?70:50;
 4204 |     // Reliability
 4205 |     dims.reliability= r.stock&&r.stock.dataQuality?r.stock.dataQuality.score:50;
 4206 |     // Historical coverage
 4207 |     dims.coverage= s.history&&s.history.prices? Math.min(100,Math.round(s.history.prices.length/5)):0;
 4208 |     // Model suitability
 4209 |     dims.modelSuitability=80; if(r.stock&&r.stock.ddm==null)dims.modelSuitability-=10;
 4210 |     const overall=Math.round((dims.completeness+dims.consistency+dims.timeliness+dims.reliability+dims.coverage+dims.modelSuitability)/6);
 4211 |     return {overall,dims};
 4212 |   }
 4213 |   function renderHTML(){
 4214 |     const q=compute();
 4215 |     let html=`<div class="scorebar"><div class="bar"><div style="width:${q.overall}%;background:${q.overall>=80?'var(--good)':q.overall>=60?'var(--warn)':'var(--bad)'}"></div></div><div class="val">${q.overall}/100</div></div>
 4216 |     <div class="grid g3 mt">`;
 4217 |     [["Completeness","completeness"],["Consistency","consistency"],["Timeliness","timeliness"],["Reliability","reliability"],["Historical Coverage","coverage"],["Model Suitability","modelSuitability"]].forEach(([label,key])=>{
 4218 |       const v=q.dims[key];
 4219 |       html+=`<div class="metricline"><span class="l">${label}</span><span class="v">${v}/100</span></div>`;
 4220 |     });
```

## compute — line 4231 — owner `ModelCompleteness`

```js
 4223 |   }
 4224 |   return {compute,renderHTML};
 4225 | })();
 4226 | 
 4227 | /* ============================================================
 4228 |    MODEL COMPLETENESS SCORE
 4229 |    ============================================================ */
 4230 | const ModelCompleteness=(()=>{
 4231 |   function compute(){
 4232 |     const s=App.state; const r=s.results;
 4233 |     const bits=[
 4234 |       ["Historical data", (s.history&&s.history.prices&&s.history.prices.length>0)?100:0],
 4235 |       ["Financial statements", (s.stockData&&s.stockData.revenue!=null&&s.stockData.netIncome!=null)?100:30],
 4236 |       ["Forecast assumptions", (s.stockData&&s.stockData.wacc!=null&&s.stockData.growth!=null)?100:40],
 4237 |       ["Peer data", (r.stock&&r.stock.comps)?100:50],
 4238 |       ["Credit data", (r.stock&&r.stock.merton)?100:60],
 4239 |       ["Scenario coverage", (r.stock&&r.stock.scenarios)?100:60],
 4240 |       ["Risk analytics", (r.stock&&r.stock.risk&&r.stock.risk.volatility!=null)?100:50],
 4241 |       ["Case evidence", (r.cases&&r.cases.matches)?100:50]
 4242 |     ];
 4243 |     const total=bits.reduce((a,b)=>a+b[1],0);
 4244 |     const overall=Math.round(total/bits.length);
 4245 |     return overall;
 4246 |   }
 4247 |   function renderHTML(){
 4248 |     const s=App.state; const r=s.results;
 4249 |     const bits=[
 4250 |       ["Historical data", (s.history&&s.history.prices&&s.history.prices.length>0)?100:0],
 4251 |       ["Financial statements", (s.stockData&&s.stockData.revenue!=null&&s.stockData.netIncome!=null)?100:30],
 4252 |       ["Forecast assumptions", (s.stockData&&s.stockData.wacc!=null&&s.stockData.growth!=null)?100:40],
 4253 |       ["Peer data", (r.stock&&r.stock.comps)?100:50],
 4254 |       ["Credit data", (r.stock&&r.stock.merton)?100:60],
 4255 |       ["Scenario coverage", (r.stock&&r.stock.scenarios)?100:60],
 4256 |       ["Risk analytics", (r.stock&&r.stock.risk&&r.stock.risk.volatility!=null)?100:50],
 4257 |       ["Case evidence", (r.cases&&r.cases.matches)?100:50]
 4258 |     ];
```

## compute — line 4513 — owner `ECLV2`

```js
 4505 |       ${curve.horiz.map((h,i)=>`<tr><td>${h}Y</td><td class="num">${curve.pd[i]!=null?fmt.pct(curve.pd[i],2):"—"}</td></tr>`).join("")}</tbody></table></div>
 4506 |       <div class="banner info small">These are <b>model-based estimates</b> from an illustrative rating mapping — not guaranteed probabilities.</div>`;
 4507 |   }
 4508 |   return {curve,curveHTML};
 4509 | })();
 4510 | 
 4511 | /* ---- Expected Credit Loss: PD × LGD × EAD ---- */
 4512 | const ECLV2=(()=>{
 4513 |   function compute(pd,recovery,ead){ const lgd=1-recovery; return {pd,recovery,ead,lgd,el:Math.round(pd*lgd*ead*100)/100}; }
 4514 |   function eadDefault(face,exposureType){ return exposureType==="bond"?face:(face||1000000); }
 4515 |   return {compute,eadDefault};
 4516 | })();
 4517 | 
 4518 | /* ---- STRESS TESTING ---- */
 4519 | const StressTestEngine=(()=>{
 4520 |   const PREDEFINED=[
 4521 |     {name:"Mild Recession", rev:-0.10, margin:-0.015, wacc:+0.010, pdMult:1.5, desc:"Revenue -10%, margin -150bp, WACC +100bp"},
 4522 |     {name:"Severe Recession", rev:-0.25, margin:-0.04, wacc:+0.025, pdMult:2.0, desc:"Revenue -25%, margin -400bp, WACC +250bp"},
 4523 |     {name:"Interest Rate Shock", rev:0, margin:0, wacc:+0.02, pdMult:1.3, desc:"Cost of debt +200bp (via WACC)"},
 4524 |     {name:"Credit Shock", rev:-0.05, margin:-0.01, wacc:+0.01, pdMult:2.0, desc:"PD × 2"},
 4525 |     {name:"Market Crash", rev:-0.15, margin:-0.02, wacc:+0.015, pdMult:2.5, desc:"Equity value -40% (approx)"}
 4526 |   ];
 4527 |   function run(sd, scenarios){
 4528 |     if(!sd||sd.revenue0==null)return null;
 4529 |     const base={revenue0:sd.revenue0||sd.revenue, tax:sd.tax||.21, capexPct:sd.capexPct||.06, wcPct:sd.wcPct||.02, dandaPct:sd.dandaPct||.05, wacc:sd.wacc||.09, terminalGrowth:sd.terminalGrowth||.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt||0)-(sd.cash||0)), shares:sd.shares||1, horizon:sd.horizon||5, growth:sd.growth||.1, ebitdaMargin:sd.ebitdaMargin||.2};
 4530 |     const baseVal=ValuationEngine.dcf(base);
 4531 |     const basePD=App.state.results.stock&&App.state.results.stock.defaultPD!=null?App.state.results.stock.defaultPD:0.05;
 4532 |     const out=(scenarios||PREDEFINED).map(sc=>{
 4533 |       const g=Math.max(-0.5, (sd.growth||.1)+sc.rev);
 4534 |       const m=Math.max(0.01,(sd.ebitdaMargin||.2)+sc.margin);
 4535 |       const w=Math.max(0.02,(sd.wacc||.09)+sc.wacc);
 4536 |       const dcf=ValuationEngine.dcf({...base, growth:g, ebitdaMargin:m, wacc:w});
 4537 |       const val=dcf.error?null:dcf.perShare;
 4538 |       const pd=Math.min(.95,(basePD||.05)*sc.pdMult);
 4539 |       const downside= val!=null&&baseVal.perShare? (val/baseVal.perShare-1):null;
 4540 |       return {name:sc.name,desc:sc.desc,value:val,downside,pd,baseVal:baseVal.perShare};
```

## compute — line 5243 — owner `ModelRiskEngine`

```js
 5235 |   }
 5236 |   return {run,renderHTML};
 5237 | })();
 5238 | 
 5239 | /* ============================================================
 5240 |    MODEL RISK ENGINE
 5241 |    ============================================================ */
 5242 | const ModelRiskEngine=(()=>{
 5243 |   function compute(sd,pr){
 5244 |     let score=0; const reasons=[];
 5245 |     // data quality
 5246 |     const dq=DataQualityV2.compute().overall; if(dq<60){score+=30;reasons.push("Low data quality ("+dq+"/100).");} else if(dq<80){score+=15;reasons.push("Moderate data quality.");}
 5247 |     // terminal dependence
 5248 |     if(pr&&pr.dcf&&pr.dcf.terminalShare!=null&&pr.dcf.terminalShare>.7){score+=25;reasons.push("Terminal value represents "+fmt.pct(pr.dcf.terminalShare)+" of EV — high terminal-value dependence.");}
 5249 |     // valuation dispersion
 5250 |     const disp=ValuationDispersion.compute(sd);
 5251 |     if(disp&&disp.label==="High"){score+=20;reasons.push("Valuation methods show high dispersion (CV "+fmt.pct(disp.cv,1)+").");} else if(disp&&disp.label==="Moderate"){score+=10;reasons.push("Moderate valuation dispersion.");}
 5252 |     // peer sample
 5253 |     if(sd.peers&&sd.peers.length<4){score+=15;reasons.push("Only "+(sd.peers.length)+" comparable peers available.");}
 5254 |     // history length
 5255 |     if(sd.historyLength==null&&App.state.history&&App.state.history.prices&&App.state.history.prices.length<120){score+=15;reasons.push("Historical price data has fewer than 120 observations.");}
 5256 |     // Merton convergence
 5257 |     if(pr&&pr.pd==null&&sd.marketCap){score+=10;reasons.push("Merton model could not be reliably solved from inputs.");}
 5258 |     // WACC vs terminal growth
 5259 |     if(sd.wacc!=null&&sd.terminalGrowth!=null&&sd.wacc-sd.terminalGrowth<.02){score+=20;reasons.push("WACC is only "+fmt.pct(sd.wacc-sd.terminalGrowth,1)+" above terminal growth.");}
 5260 |     // assumptions sensitivity
 5261 |     if(pr&&pr.robustness){ const rob=pr.robustness.score; if(rob<40){score+=20;reasons.push("Conclusion robustness is low ("+rob+"/100).");} }
 5262 |     const label= score>=60?"VERY HIGH": score>=40?"HIGH": score>=20?"MODERATE":"LOW";
 5263 |     return {score:Math.min(100,score),label,reasons};
 5264 |   }
 5265 |   return {compute};
 5266 | })();
 5267 | 
 5268 | /* ============================================================
 5269 |    VALUATION DISPERSION
 5270 |    ============================================================ */
```

## compute — line 5272 — owner `ValuationDispersion`

```js
 5264 |   }
 5265 |   return {compute};
 5266 | })();
 5267 | 
 5268 | /* ============================================================
 5269 |    VALUATION DISPERSION
 5270 |    ============================================================ */
 5271 | const ValuationDispersion=(()=>{
 5272 |   function compute(sd){
 5273 |     const mx=ValuationMatrixV2.build(sd); if(!mx||!mx.methods)return null;
 5274 |     const vals=mx.methods.filter(m=>m.value!=null).map(m=>m.value);
 5275 |     if(vals.length<2)return null;
 5276 |     const mean=CalcEngine.mean(vals), sdv=CalcEngine.stdev(vals,0);
 5277 |     const cv= mean>0? sdv/Math.abs(mean):1;
 5278 |     const label= cv>.35?"High": cv>.18?"Moderate":"Low";
 5279 |     return {cv,label,mean,count:vals.length,spread:Math.max(...vals)-Math.min(...vals)};
 5280 |   }
 5281 |   function html(d){
 5282 |     if(!d)return "";
 5283 |     const cls=d.label==="High"?"bad":d.label==="Moderate"?"warn":"good";
 5284 |     return `<div class="metricline"><span class="l">Valuation dispersion (CV)</span><span class="v">${fmt.pct(d.cv,1)}</span> ${pill(d.label,cls)}</div>
 5285 |     <div class="metricline"><span class="l">Methods</span><span class="v">${d.count}</span></div>
 5286 |     ${d.label==="High"?`<div class="banner warn">Independent valuation methods disagree materially. The valuation conclusion should be treated as uncertain.</div>`:""}`;
 5287 |   }
 5288 |   return {compute,html};
 5289 | })();
 5290 | 
 5291 | /* ============================================================
 5292 |    ROBUSTNESS v3
 5293 |    ============================================================ */
 5294 | const RobustnessV3=(()=>{
 5295 |   function compute(sd){
 5296 |     if(!sd||sd.price==null)return {score:50,reasons:["No price — robustness cannot be assessed."]};
 5297 |     const a=Model.assumptions();
 5298 |     const base={revenue0:a.revenue||sd.revenue,tax:a.tax,capexPct:a.capexPct,wcPct:a.wcPct,dandaPct:a.dandaPct,wacc:a.wacc,terminalGrowth:a.terminalGrowth,terminalMethod:"growth",exitMultiple:a.exitMultiple,netDebt:a.netDebt,shares:a.shares,horizon:a.horizon,growth:a.revenueGrowth,ebitdaMargin:a.ebitdaMargin};
 5299 |     const baseVal=ValuationEngine.dcf(base).perShare;
```

## compute — line 5295 — owner `RobustnessV3`

```js
 5287 |   }
 5288 |   return {compute,html};
 5289 | })();
 5290 | 
 5291 | /* ============================================================
 5292 |    ROBUSTNESS v3
 5293 |    ============================================================ */
 5294 | const RobustnessV3=(()=>{
 5295 |   function compute(sd){
 5296 |     if(!sd||sd.price==null)return {score:50,reasons:["No price — robustness cannot be assessed."]};
 5297 |     const a=Model.assumptions();
 5298 |     const base={revenue0:a.revenue||sd.revenue,tax:a.tax,capexPct:a.capexPct,wcPct:a.wcPct,dandaPct:a.dandaPct,wacc:a.wacc,terminalGrowth:a.terminalGrowth,terminalMethod:"growth",exitMultiple:a.exitMultiple,netDebt:a.netDebt,shares:a.shares,horizon:a.horizon,growth:a.revenueGrowth,ebitdaMargin:a.ebitdaMargin};
 5299 |     const baseVal=ValuationEngine.dcf(base).perShare;
 5300 |     const tests=[["WACC +1%",{...base,wacc:a.wacc+.01}],["WACC -1%",{...base,wacc:a.wacc-.01}],["Growth +5%",{...base,growth:a.revenueGrowth+.05}],["Growth -5%",{...base,growth:a.revenueGrowth-.05}],["Margin -3%",{...base,ebitdaMargin:a.ebitdaMargin-.03}],["Margin +3%",{...base,ebitdaMargin:a.ebitdaMargin+.03}],["Terminal g +1%",{...base,terminalGrowth:a.terminalGrowth+.01}],["Terminal g -1%",{...base,terminalGrowth:a.terminalGrowth-.01}]];
 5301 |     let maxChange=0;
 5302 |     tests.forEach(([name,cfg])=>{ const v=ValuationEngine.dcf(cfg).perShare; if(v!=null&&baseVal){ maxChange=Math.max(maxChange,Math.abs(v-baseVal)/Math.abs(baseVal)); } });
 5303 |     const score=Math.max(0,Math.min(100,Math.round(100 - maxChange*100)));
 5304 |     const label= score>=70?"Robust": score>=45?"Moderately sensitive":"Highly assumption-sensitive";
 5305 |     const reasons=[`Max change across ±stress on key drivers: ${fmt.pct(maxChange,0)} of base value.`];
 5306 |     return {score,label,reasons,maxChange};
 5307 |   }
 5308 |   return {compute};
 5309 | })();
 5310 | 
 5311 | /* ============================================================
 5312 |    THESIS MONITOR + INTEGRITY (consume model values)
 5313 |    ============================================================ */
 5314 | const ThesisConsistencyV3=(()=>{
 5315 |   function monitor(){
 5316 |     const t=App.state.thesis; const a=Model.assumptions(); const r=App.state.results.stock; const f=r?r.financials:null;
 5317 |     const rows=[];
 5318 |     const add=(driver,target,val,fmtv,status)=>{ rows.push({driver,target,val,fmtv,status}); };
 5319 |     // revenue growth
 5320 |     add("Revenue growth","15%",a.revenueGrowth,fmt.pct, Math.abs((a.revenueGrowth||0)-.15)<=.04?"good": Math.abs((a.revenueGrowth||0)-.15)<=.08?"warn":"bad");
 5321 |     // margin
 5322 |     add("EBITDA margin","22%",a.ebitdaMargin,fmt.pct, Math.abs((a.ebitdaMargin||0)-.22)<=.03?"good": Math.abs((a.ebitdaMargin||0)-.22)<=.06?"warn":"bad");
```

## compute — line 5516 — owner `CreditWaterfall`

```js
 5508 |     ${diag&&!diag.converged?`<div class="banner bad">Merton solution could not be reliably established from the supplied assumptions. Treat the PD as unreliable.</div>`:""}
 5509 |     </div>`;
 5510 |   }
 5511 |   return {trace,diagHTML};
 5512 | })();
 5513 | 
 5514 | /* ---- 51: Credit risk waterfall ---- */
 5515 | const CreditWaterfall=(()=>{
 5516 |   function compute(f,vol,beta,mertonPD,alt){
 5517 |     const steps=[];
 5518 |     const add=(label,val,note)=>{ steps.push({label,val,note}); };
 5519 |     add("Leverage (Debt/Equity)", f&&f.debtEquity!=null?fmt.x(f.debtEquity,2):"—", f&&f.debtEquity!=null&&f.debtEquity>3?"high leverage":"normal");
 5520 |     add("Liquidity (Current ratio)", f&&f.currentRatio!=null?fmt.x(f.currentRatio,2):"—", f&&f.currentRatio!=null&&f.currentRatio<1?"weak":"adequate");
 5521 |     add("Interest coverage", f&&f.interestCoverage!=null?fmt.x(f.interestCoverage,2):"—", f&&f.interestCoverage!=null&&f.interestCoverage<1.5?"stress":"adequate");
 5522 |     add("Equity volatility", vol!=null?fmt.pct(vol):"—", vol!=null&&vol>.5?"high":"moderate/low");
 5523 |     add("Distance to default", mertonPD&&mertonPD.distanceToDefault!=null?fmt.num(mertonPD.distanceToDefault,2):"—","structural model");
 5524 |     add("Recovery (LGD)", "65%","illustrative assumption");
 5525 |     add("Final estimated PD", mertonPD&&mertonPD.pd!=null?fmt.pct(mertonPD.pd,2):"—","Merton structural estimate");
 5526 |     return steps;
 5527 |   }
 5528 |   function waterfallHTML(steps){
 5529 |     if(!steps||!steps.length)return "";
 5530 |     let h=`<div class="card"><div class="card-title">Credit Risk Waterfall</div>`;
 5531 |     steps.forEach((s,i)=>{
 5532 |       h+=`<div class="metricline"><span class="l">${i+1}. ${s.label}</span><span class="v">${s.val}</span></div>`;
 5533 |       if(i<steps.length-1) h+=`<div style="text-align:center;color:var(--text3)">↓</div>`;
 5534 |     });
 5535 |     h+=`</div>`;
 5536 |     return h;
 5537 |   }
 5538 |   return {compute,waterfallHTML};
 5539 | })();
 5540 | 
 5541 | /* ---- 22/23/24/25: Model reconciliation diagnostics ---- */
 5542 | const ReconciliationDiag=(()=>{
 5543 |   function compute(fm){
```

## compute — line 5543 — owner `ReconciliationDiag`

```js
 5535 |     h+=`</div>`;
 5536 |     return h;
 5537 |   }
 5538 |   return {compute,waterfallHTML};
 5539 | })();
 5540 | 
 5541 | /* ---- 22/23/24/25: Model reconciliation diagnostics ---- */
 5542 | const ReconciliationDiag=(()=>{
 5543 |   function compute(fm){
 5544 |     if(!fm||!fm.result)return null;
 5545 |     const out=fm.result;
 5546 |     const checks=[];
 5547 |     // Balance sheet
 5548 |     checks.push({name:"Balance Sheet", pass:out.check.ok, detail: out.check.ok?"BALANCED":"DIFFERENCE "+fmt.money(out.check.diff)});
 5549 |     // Cash flow reconciliation
 5550 |     const cfTie=out.check.cashFlowTies===true; checks.push({name:"Cash Flow Reconciliation", pass:cfTie, detail:cfTie?"PASS":"FAIL"});
 5551 |     // Debt roll-forward
 5552 |     let debtOk=true, debtDetail="N/A (no schedule)";
 5553 |     if(out.debtSchedule){ debtOk=out.debtSchedule.every(r=>Math.abs(r.ending-(r.opening-r.repayment))<0.01||r.repayment===0); debtDetail=debtOk?"PASS":"FAIL"; }
 5554 |     checks.push({name:"Debt Roll-Forward", pass:debtOk, detail:debtDetail});
 5555 |     // Equity roll-forward (ending equity = start + NI in simplified model)
 5556 |     const bal=out.balance; const eqOk = bal.length? bal[bal.length-1].equity>0:true; checks.push({name:"Equity Roll-Forward", pass:eqOk, detail:eqOk?"PASS":"negative equity"});
 5557 |     // Retained earnings / consistency
 5558 |     const modelOk=out.check&&out.check.ok&&out.check.cashFlowTies; checks.push({name:"Model Consistency", pass:modelOk, detail:modelOk?"PASS":"FAIL"});
 5559 |     return checks;
 5560 |   }
 5561 |   function checksHTML(checks){
 5562 |     if(!checks)return "";
 5563 |     const status=(p)=> p?pill("PASS","good"):pill("FAIL","bad");
 5564 |     return `<div class="card"><div class="card-title">Model Reconciliation Diagnostics</div>
 5565 |     <div class="tablewrap"><table class="data"><thead><tr><th>Check</th><th>Status</th><th>Detail</th></tr></thead><tbody>
 5566 |     ${checks.map(c=>`<tr><td>${c.name}</td><td>${status(c.pass)}</td><td class="small">${esc(c.detail)}</td></tr>`).join("")}</tbody></table></div></div>`;
 5567 |   }
 5568 |   return {compute,checksHTML};
 5569 | })();
 5570 | 
```

## compute — line 5589 — owner `TerminalCrossCheck`

```js
 5581 |     return `<div class="row" style="gap:6px;flex-wrap:wrap">${labelsArr.map(l=>`<span class="pill ${l.endsWith('A')?'info':'warn'}">${esc(l)}</span>`).join("")}</div>
 5582 |     <div class="legend mt"><span><span class="dot" style="background:var(--info)"></span>A = Actual</span><span><span class="dot" style="background:var(--warn)"></span>E = Estimate</span></div>`;
 5583 |   }
 5584 |   return {labels,html};
 5585 | })();
 5586 | 
 5587 | /* ---- 35: DCF terminal-value cross-check (Gordon vs Exit) ---- */
 5588 | const TerminalCrossCheck=(()=>{
 5589 |   function compute(sd){
 5590 |     const a=Model.assumptions();
 5591 |     const base={revenue0:a.revenue||sd.revenue,tax:a.tax,capexPct:a.capexPct,wcPct:a.wcPct,dandaPct:a.dandaPct,wacc:a.wacc,terminalGrowth:a.terminalGrowth,netDebt:a.netDebt,shares:a.shares,horizon:a.horizon,growth:a.revenueGrowth,ebitdaMargin:a.ebitdaMargin,exitMultiple:a.exitMultiple};
 5592 |     const gordon=ValuationEngine.dcf({...base,terminalMethod:"growth"});
 5593 |     const exit=ValuationEngine.dcf({...base,terminalMethod:"exit",exitMultiple:a.exitMultiple});
 5594 |     if(gordon.error||exit.error)return null;
 5595 |     const rows=[
 5596 |       {method:"Gordon Growth",tv:gordon.tv,ev:gordon.ev,perShare:gordon.perShare,tvShare:gordon.terminalShare},
 5597 |       {method:"Exit Multiple ("+fmt.x(a.exitMultiple)+")",tv:exit.tv,ev:exit.ev,perShare:exit.perShare,tvShare:exit.terminalShare}
 5598 |     ];
 5599 |     return rows;
 5600 |   }
 5601 |   function html(rows){
 5602 |     if(!rows)return "";
 5603 |     let h=`<div class="card"><div class="card-title">DCF Terminal-Value Cross-Check</div>
 5604 |     <div class="tablewrap"><table class="data"><thead><tr><th>Method</th><th class="num">Terminal Value</th><th class="num">EV</th><th class="num">Per Share</th><th class="num">% of EV</th></tr></thead><tbody>`;
 5605 |     rows.forEach(r=>{ h+=`<tr><td>${r.method}</td><td class="num">${fmt.money(r.tv)}</td><td class="num">${fmt.money(r.ev)}</td><td class="num">${fmt.money(r.perShare)}</td><td class="num">${fmt.pct(r.tvShare)}</td></tr>`; });
 5606 |     h+=`</tbody></table></div>
 5607 |     ${rows.some(r=>r.tvShare>.7)?`<div class="banner warn">HIGH TERMINAL-VALUE DEPENDENCE — terminal value exceeds 70% of enterprise value in one or more methods. Review WACC and terminal growth.</div>`:""}
 5608 |     </div>`;
 5609 |     return h;
 5610 |   }
 5611 |   return {compute,html};
 5612 | })();
 5613 | 
 5614 | /* ---- 38: Valuation range with percentiles ---- */
 5615 | const ValuationRange=(()=>{
 5616 |   function build(sd){
```

## compute — line 5790 — owner `ModelAgreementPanel`

```js
 5782 |     h+=`</tbody></table></div></div>`;
 5783 |     return h;
 5784 |   }
 5785 |   return {counts,render};
 5786 | })();
 5787 | 
 5788 | /* ---- 101: Model agreement panel ---- */
 5789 | const ModelAgreementPanel=(()=>{
 5790 |   function compute(sd){
 5791 |     const r=App.state.results.stock; if(!r)return null;
 5792 |     const rows=[];
 5793 |     const add=(model,label,note)=>{ rows.push({model,label,note}); };
 5794 |     if(r.valuation&&r.valuation.mos!=null) add("DCF", r.valuation.mos>=.1?"ATTRACTIVE":r.valuation.mos>=-.1?"FAIR":"OVER-VALUED", "MoS "+fmt.pct(r.valuation.mos));
 5795 |     if(r.ddm!=null&&sd.price) add("DDM", r.ddm/sd.price>=1.1?"ATTRACTIVE":r.ddm/sd.price>=.9?"FAIR":"OVER-VALUED", "value "+fmt.money(r.ddm));
 5796 |     else add("DDM","UNAVAILABLE","no dividend data");
 5797 |     if(r.comps&&r.comps.impliedMean!=null) add("Comparable", r.comps.impliedMean>1.1?"ATTRACTIVE":r.comps.impliedMean>=.9?"FAIR":"OVER-VALUED","trades at "+fmt.x(r.comps.impliedMean,2)+" peer multiple");
 5798 |     if(r.technical&&r.technical.rsi!=null) add("Technical", r.technical.rsi>70?"OVERBOUGHT":r.technical.rsi<30?"OVERSOLD":"NEUTRAL","RSI "+fmt.num(r.technical.rsi,0));
 5799 |     add("Financial Quality", r.assessment&&r.assessment.parts.financialHealth?r.assessment.parts.financialHealth.label.toUpperCase():"UNKNOWN","");
 5800 |     add("Credit Risk", r.assessment&&r.assessment.parts.default?r.assessment.parts.default.label.toUpperCase():"UNKNOWN","");
 5801 |     // Agreement
 5802 |     const pos=rows.filter(x=>x.label==="ATTRACTIVE"||x.label==="STRONG").length;
 5803 |     const neg=rows.filter(x=>x.label==="OVER-VALUED"||x.label==="ELEVATED"||x.label==="HIGH"||x.label==="OVERBOUGHT").length;
 5804 |     const agreement= pos>0&&neg>0?"MIXED": pos>0?"ALIGNED": neg>0?"CONFLICT":"LOW";
 5805 |     return {rows,agreement,pos,neg};
 5806 |   }
 5807 |   function html(res){
 5808 |     if(!res)return "";
 5809 |     const cls=res.agreement==="ALIGNED"?"good":res.agreement==="MIXED"?"warn":"bad";
 5810 |     return `<div class="card"><div class="card-title">Model Agreement ${pill(res.agreement,cls)}</div>
 5811 |     <div class="tablewrap"><table class="data"><thead><tr><th>Model</th><th>Signal</th><th>Note</th></tr></thead><tbody>
 5812 |     ${res.rows.map(x=>`<tr><td>${x.model}</td><td><b>${esc(x.label)}</b></td><td class="small">${esc(x.note)}</td></tr>`).join("")}</tbody></table></div>
 5813 |     ${res.agreement==="MIXED"||res.agreement==="CONFLICT"?`<div class="banner warn">The models do not fully agree. The investment thesis depends heavily on which methods and assumptions are considered most reliable. Contradictions are not hidden.</div>`:""}
 5814 |     </div>`;
 5815 |   }
 5816 |   return {compute,html};
 5817 | })();
```

## compute — line 8303 — owner `DataSufficiency`

```js
 8295 |     "\nCredit engine: "+m.creditEngineVersion+"\nPortfolio engine: "+(m.portfolioEngineVersion||m.appVersion)+
 8296 |     "\nData model: "+m.dataModelVersion+"\nSchema: "+m.schemaVersion+"\nCase DB: "+m.caseDbVersion;
 8297 | }
 8298 | 
 8299 | /* ============================================================
 8300 |    DATA SUFFICIENCY (kept SEPARATE from Data Quality)
 8301 |    ============================================================ */
 8302 | const DataSufficiency=(()=>{
 8303 |   function compute(){
 8304 |     const s=App.state; const r=s.results;
 8305 |     const dims={};
 8306 |     // Historical statements depth
 8307 |     let stmtDepth=0; const sd=s.stockData||{};
 8308 |     const hasStmts=["revenue","ebitda","ebit","netIncome","fcf","assets","liabilities","equity","cash","debt"].filter(k=>sd[k]!=null).length;
 8309 |     stmtDepth=Math.round(hasStmts/10*100);
 8310 |     dims.statements=stmtDepth;
 8311 |     // Years of history (rough: presence of multi-year data not tracked well -> estimate)
 8312 |     dims.historicalYears= s.history&&s.history.prices&&s.history.prices.length>250?100: s.history&&s.history.prices&&s.history.prices.length>60?60:20;
 8313 |     // Peer history
 8314 |     dims.peers= (sd.peers&&sd.peers.length>=4)?80: (sd.peers&&sd.peers.length>0)?50:15;
 8315 |     // Price history
 8316 |     dims.priceHistory= s.history&&s.history.prices? Math.min(100,Math.round(s.history.prices.length/5)):0;
 8317 |     // Benchmark
 8318 |     dims.benchmark= (s.history&&s.history.benchmark&&s.history.benchmark.length>0)?80:10;
 8319 |     // Quarterly data
 8320 |     dims.quarterly= (s.stockData&&s.stockData.hasQuarterly)?100:10;
 8321 |     // Credit data
 8322 |     dims.credit= (r&&r.stock&&r.stock.merton)?70: (sd.debt!=null&&sd.ebitda!=null)?50:20;
 8323 |     // Case coverage
 8324 |     dims.cases= (r&&r.cases&&r.cases.matches)?70:30;
 8325 |     const keys=["statements","historicalYears","peers","priceHistory","benchmark","quarterly","credit","cases"];
 8326 |     const overall=Math.round(keys.reduce((a,k)=>a+dims[k],0)/keys.length);
 8327 |     return {overall,dims};
 8328 |   }
 8329 |   function html(){
 8330 |     const q=compute(); const d=q.dims;
```

## compute — line 8477 — owner `RiskContribution`

```js
 8469 |   }
 8470 |   return {check};
 8471 | })();
 8472 | 
 8473 | /* ============================================================
 8474 |    PORTFOLIO RISK CONTRIBUTION
 8475 |    ============================================================ */
 8476 | const RiskContribution=(()=>{
 8477 |   function compute(port,corrMatrix){
 8478 |     if(!port)return null;
 8479 |     const items=port.items||[]; if(items.length<2)return null;
 8480 |     const n=items.length; const totalW=items.reduce((a,c)=>a+(c.weight||0),0)||1;
 8481 |     const weights=items.map(b=> (b.weight||0)/totalW );
 8482 |     const vols=items.map(b=> b.volatility!=null?b.volatility:0.2);
 8483 |     const corr=corrMatrix||Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=> i===j?1:0.4));
 8484 |     let varP=0;
 8485 |     for(let i=0;i<n;i++)for(let j=0;j<n;j++) varP+=weights[i]*weights[j]*vols[i]*vols[j]*corr[i][j];
 8486 |     const volP=Math.sqrt(Math.max(varP,1e-12));
 8487 |     const rows=items.map((b,i)=>{
 8488 |       let mcr=0;
 8489 |       for(let j=0;j<n;j++) mcr+=weights[j]*vols[i]*vols[j]*corr[i][j];
 8490 |       mcr= mcr/volP;
 8491 |       const component=weights[i]*mcr;
 8492 |       return {name:b.name,weight:weights[i],volatility:vols[i],mcr,component,riskShare: varP>0? weights[i]*mcr*volP/varP : 0};
 8493 |     });
 8494 |     return {rows,volP,varP};
 8495 |   }
 8496 |   function html(r){
 8497 |     if(!r)return "";
 8498 |     let h=`<div class="card mt"><div class="card-title">Portfolio Risk Contribution</div>
 8499 |     <div class="tablewrap"><table class="data"><thead><tr><th>Holding</th><th class="num">Weight</th><th class="num">Volatility</th><th class="num">Risk Contribution</th><th class="num">% of Risk</th></tr></thead><tbody>`;
 8500 |     r.rows.forEach(x=>{ h+=`<tr><td>${esc(x.name)}</td><td class="num">${fmt.pct(x.weight)}</td><td class="num">${fmt.pct(x.volatility)}</td><td class="num">${fmt.pct(x.component)}</td><td class="num">${fmt.pct(x.riskShare)}</td></tr>`; });
 8501 |     h+=`</tbody></table></div>
 8502 |     <div class="banner info">Risk contribution reveals how much each holding actually drives portfolio volatility — a small weight can still dominate risk.</div></div>`;
 8503 |     return h;
 8504 |   }
```

## compute — line 8512 — owner `ValuationUncertainty`

```js
 8504 |   }
 8505 |   return {compute,html};
 8506 | })();
 8507 | 
 8508 | /* ============================================================
 8509 |    VALUATION UNCERTAINTY (bear/base/bull RANGES)
 8510 |    ============================================================ */
 8511 | const ValuationUncertainty=(()=>{
 8512 |   function compute(sd){
 8513 |     const a=Model.assumptions();
 8514 |     if(!sd||sd.price==null)return null;
 8515 |     const base={revenue0:a.revenue||sd.revenue,tax:a.tax,capexPct:a.capexPct,wcPct:a.wcPct,dandaPct:a.dandaPct,wacc:a.wacc,terminalGrowth:a.terminalGrowth,terminalMethod:"growth",exitMultiple:a.exitMultiple,netDebt:a.netDebt,shares:a.shares,horizon:a.horizon,growth:a.revenueGrowth,ebitdaMargin:a.ebitdaMargin};
 8516 |     function dcfRange(g,m,w,tg){
 8517 |       const lo=ValuationEngine.dcf({...base,growth:g*.9,margin:m*.9,wacc:w*1.06,terminalGrowth:tg*.85}).perShare;
 8518 |       const hi=ValuationEngine.dcf({...base,growth:g*1.1,margin:m*1.1,wacc:w*.94,terminalGrowth:tg*1.15}).perShare;
 8519 |       const mid=ValuationEngine.dcf({...base,growth:g,margin:m,wacc:w,terminalGrowth:tg}).perShare;
 8520 |       return {lo,mid,hi};
 8521 |     }
 8522 |     const bear=dcfRange(a.revenueGrowth*.55,a.ebitdaMargin*.8,a.wacc*1.15,a.terminalGrowth*.6);
 8523 |     const baseR=dcfRange(a.revenueGrowth,a.ebitdaMargin,a.wacc,a.terminalGrowth);
 8524 |     const bull=dcfRange(a.revenueGrowth*1.5,a.ebitdaMargin*1.2,a.wacc*.85,a.terminalGrowth*1.4);
 8525 |     const central=baseR.mid;
 8526 |     const disp=(bull.hi-bear.lo)/(Math.abs(central)||1);
 8527 |     const suff=DataSufficiency.compute().overall;
 8528 |     const conf= Math.max(0,Math.min(100,Math.round(80 - disp*20 + (suff-50)*0.3)));
 8529 |     return {bear,baseR,bull,central,conf,dispersion:disp};
 8530 |   }
 8531 |   function html(u){
 8532 |     if(!u)return "";
 8533 |     const fmtR=(r)=>`${fmt.money(r.lo)} – ${fmt.money(r.hi)}`;
 8534 |     return `<div class="card"><div class="card-title">Valuation Uncertainty Range</div>
 8535 |     <div class="grid g3">
 8536 |       ${kpi("Bear range",fmtR(u.bear),"")}
 8537 |       ${kpi("Base range",fmtR(u.baseR),"central "+fmt.money(u.baseR.mid))}
 8538 |       ${kpi("Bull range",fmtR(u.bull),"")}
 8539 |       ${kpi("Central estimate",fmt.money(u.central))}
```

## compute — line 8659 — owner `ModelValidationScore`

```js
 8651 |     es:{input:{returns:[-.01,-.02,-.03,-.04,-.05],conf:.8},expected:-.05,tol:1e-9}
 8652 |   };
 8653 | })();
 8654 | 
 8655 | /* ============================================================
 8656 |    MODEL VALIDATION SCORE (component breakdown)
 8657 |    ============================================================ */
 8658 | const ModelValidationScore=(()=>{
 8659 |   function compute(){
 8660 |     const parts=[];
 8661 |     const add=(name,score,note)=>{ parts.push({name,score:Math.max(0,Math.min(100,score)),note}); };
 8662 |     // calculation tests (self-test pass rate)
 8663 |     try{
 8664 |       const results=[]; coreTestBattery(results);
 8665 |       const pass=results.filter(r=>r.ok).length;
 8666 |       add("Calculation tests", results.length? pass/results.length*100:0, pass+"/"+results.length+" passed");
 8667 |     }catch(e){ add("Calculation tests",0,"test battery error"); }
 8668 |     // reconciliation
 8669 |     const fm=App.state.fm&&App.state.fm.result;
 8670 |     if(fm) add("Reconciliation", fm.check&&fm.check.ok?100: (fm.check&&fm.check.cashFlowTies?70:30), fm.check&&fm.check.ok?"balanced":"check failed");
 8671 |     else add("Reconciliation",0,"no financial model built");
 8672 |     // data validation
 8673 |     add("Data validation", DataQualityV2.compute().overall, "data quality");
 8674 |     // assumption validation (WACC>terminal)
 8675 |     const sd=App.state.stockData;
 8676 |     if(sd.wacc!=null&&sd.terminalGrowth!=null) add("Assumption validation", sd.wacc>sd.terminalGrowth?100:0, sd.wacc>sd.terminalGrowth?"WACC>g":"WACC<=g critical");
 8677 |     else add("Assumption validation",50,"assumptions incomplete");
 8678 |     // sensitivity coverage
 8679 |     add("Sensitivity coverage", (typeof renderOneWay==="function"&&typeof renderTwoWay==="function")?80:30,"one/two-way available");
 8680 |     // scenario coverage
 8681 |     const scen=App.state.pipeline&&App.state.pipeline.scen;
 8682 |     add("Scenario coverage", scen&&scen.out&&scen.out.length>=3?85:40, (scen&&scen.out&&scen.out.length)||0+" scenarios");
 8683 |     // model agreement
 8684 |     const ma=ModelAgreementPanel.compute(sd);
 8685 |     add("Model agreement", ma? (ma.agreement==="ALIGNED"?90:ma.agreement==="MIXED"?60:35):40, ma?ma.agreement:"n/a");
 8686 |     // documentation
```

## compute — line 12838 — owner `installReport`

```js
12830 |       if(r.error)return {error:r.error,value:null,rows:[]};
12831 |       return {value:r.value,bookValue0,pvRI:r.pvRI,tvRI:r.continuingValue,pvTV:r.pvContinuing,rows:r.rows.map(x=>({t:x.t,income:x.netIncome,charge:x.equityCharge,ri:x.residualIncome,pvRI:x.pvRI,bv:x.endingBV}))};
12832 |     };
12833 |     ValuationEngine.comparables=(companyMultiple,peers)=>Core.comparables(companyMultiple,peers);
12834 |     mark('ValuationEngine');
12835 |   }
12836 | 
12837 |   if(typeof FinancialRatios!=='undefined' && FinancialRatios){
12838 |     FinancialRatios.compute=(f)=>Core.financialRatios(f||{});
12839 |     FinancialRatios.dupont=(r)=>({netMargin:r.netMargin,assetTurnover:r.assetTurnover,equityMultiplier:r.equityMultiplier,roe:r.netMargin!=null&&r.assetTurnover!=null&&r.equityMultiplier!=null?r.netMargin*r.assetTurnover*r.equityMultiplier:null});
12840 |     mark('FinancialRatios');
12841 |   }
12842 | 
12843 |   if(ModelCore && typeof FinancialModelEngine!=='undefined' && FinancialModelEngine){
12844 |     FinancialModelEngine.defaults=()=>{
12845 |       const currency=(typeof App!=='undefined'&&App&&App.state&&App.state.settings&&App.state.settings.currency)||'EUR';
12846 |       return ModelCore.defaults(currency);
12847 |     };
12848 |     FinancialModelEngine.fillDefaults=(m,sd)=>ModelCore.fillDefaults(m,sd||{});
12849 |     FinancialModelEngine.build=(m,sd)=>{
12850 |       const out=ModelCore.build(m,sd||{});
12851 |       if(Array.isArray(out.covenants) && typeof fmt!=='undefined')out.covenants=out.covenants.map(c=>({...c,fmt:c.format==='ratio'?fmt.x:fmt.money}));
12852 |       return out;
12853 |     };
12854 |     mark('FinancialModelEngine.build/fillDefaults/defaults');
12855 |   }
12856 | 
12857 |   if(typeof XIRR!=='undefined' && XIRR){
12858 |     XIRR.xnpv=(rate,cashflows,dates)=>Core.xnpv(rate,cashflows,dates);
12859 |     XIRR.xirr=(cashflows,dates,_guess=.1)=>Core.xirr(cashflows,dates);
12860 |     XIRR.xirrHTML=(cashflows,dates)=>{
12861 |       const r=Core.xirr(cashflows,dates);
12862 |       if(r==null)return '<div class="banner warn">XIRR could not be determined — the irregular cash-flow pattern may have no unique root.</div>';
12863 |       return `<div class="card"><div class="card-title">XIRR (irregular-period IRR)</div><div class="grid g2">${kpi('XIRR',fmt.pct(r,2),'annualized, irregular dates')}</div><div class="formula">Solve Σ CF_i/(1+XIRR)^((date_i−date_0)/365) = 0</div><div class="banner info">XIRR handles cash flows that arrive at irregular dates by discounting each to its actual year-fraction. It annualizes the return correctly for non-annual periods.</div></div>`;
12864 |     };
12865 |     mark('XIRR');
```

## compute — line 12917 — owner `out`

```js
12909 |   }
12910 | 
12911 |   if(RiskCore && typeof MertonDiag!=='undefined' && MertonDiag){
12912 |     MertonDiag.trace=(E,sigmaE,D,r,T)=>RiskCore.mertonTrace(E,sigmaE,D,r,T);
12913 |     mark('MertonDiag.trace');
12914 |   }
12915 | 
12916 |   if(typeof ECLV2!=='undefined' && ECLV2){
12917 |     ECLV2.compute=(pd,recovery,ead)=>{
12918 |       const amount=RiskCore?RiskCore.expectedLossAmount(pd,recovery,ead):(Core.isFiniteNumber(pd)&&Core.isFiniteNumber(recovery)&&Core.isFiniteNumber(ead)&&pd>=0&&pd<=1&&recovery>=0&&recovery<=1&&ead>=0?pd*(1-recovery)*ead:null);
12919 |       if(amount==null)return {pd,recovery,ead,lgd:null,el:null,error:'ECL requires finite PD/recovery in [0,1] and non-negative EAD.'};
12920 |       const lgd=1-recovery;return {pd,recovery,ead,lgd,el:Math.round(amount*100)/100};
12921 |     };
12922 |     ECLV2.eadDefault=(face,_exposureType)=>Core.isFiniteNumber(face)&&face>=0?face:null;
12923 |     mark('ECLV2');
12924 |   }
12925 | 
12926 |   if(LegacyCore && typeof StressTestEngine!=='undefined' && StressTestEngine){
12927 |     StressTestEngine.run=(sd,scenarios)=>{
12928 |       const currentPD=(typeof App!=='undefined'&&App&&App.state&&App.state.results&&App.state.results.stock&&App.state.results.stock.defaultPD!=null)?App.state.results.stock.defaultPD:.05;
12929 |       const useScenarios=scenarios==null?StressTestEngine.PREDEFINED:scenarios;
12930 |       return LegacyCore.stressRun(sd,useScenarios,{defaultPD:currentPD});
12931 |     };
12932 |     mark('StressTestEngine.run');
12933 |   }
12934 | 
12935 |   if(LegacyCore && typeof PortfolioEngine!=='undefined' && PortfolioEngine){
12936 |     PortfolioEngine.build=(items)=>{
12937 |       const rf=(typeof App!=='undefined'&&App&&App.state&&App.state.stockData&&App.state.stockData.rf!=null)?App.state.stockData.rf:.03;
12938 |       return LegacyCore.portfolioBuild(items,{riskFreeRate:rf,correlation:.4});
12939 |     };
12940 |     PortfolioEngine.stress=(port,scenario)=>LegacyCore.portfolioStress(port,scenario||{});
12941 |     mark('PortfolioEngine.build/stress');
12942 |   }
12943 | 
12944 |   if(LegacyCore && typeof ValuationMatrixV2!=='undefined' && ValuationMatrixV2){
```

## minimumVariance — line 9122 — owner `PortfolioOptimizers`

```js
 9114 | })();
 9115 | 
 9116 | /* ============================================================
 9117 |    3. PORTFOLIO CONSTRUCTION OPTIMIZERS
 9118 |    ============================================================ */
 9119 | const PortfolioOptimizers=(()=>{
 9120 |   // Inputs: items [{name, expectedReturn, volatility}], correlations, constraints
 9121 |   function equalWeight(items){ const w=1/(items.length||1); return items.map(b=>({name:b.name,weight:w})); }
 9122 |   function minimumVariance(items,corr){
 9123 |     const n=items.length; if(n<2)return null;
 9124 |     const vols=items.map(b=>b.volatility!=null?b.volatility:.2);
 9125 |     const c=corr||Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:.4));
 9126 |     // use a simple optimization: minimize variance via closed-form for 2 assets; for n>2 use iterative gradient on simplex
 9127 |     // Build covariance matrix
 9128 |     const cov=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>c[i][j]*vols[i]*vols[j]));
 9129 |     // solve min w'Cov w s.t. sum w=1 using projected gradient
 9130 |     let w=Array(n).fill(1/n);
 9131 |     const lr=0.01;
 9132 |     for(let it=0;it<2000;it++){
 9133 |       const grad=Array(n).fill(0);
 9134 |       for(let i=0;i<n;i++){ for(let j=0;j<n;j++)grad[i]+=2*cov[i][j]*w[j]; }
 9135 |       for(let i=0;i<n;i++)w[i]-=lr*grad[i];
 9136 |       // project onto simplex (clamp >=0, normalize)
 9137 |       let min=Math.min(...w); if(min<0){ w=w.map(x=>Math.max(0,x)); }
 9138 |       const sum=w.reduce((a,b)=>a+b,0)||1; w=w.map(x=>x/sum);
 9139 |     }
 9140 |     return w.map((weight,i)=>({name:items[i].name,weight}));
 9141 |   }
 9142 |   function maximumSharpe(items,corr,rf){
 9143 |     const mv=minimumVariance(items,corr); if(!mv)return null;
 9144 |     const rf2=rf!=null?rf:.03;
 9145 |     // tangency portfolio: maximize (w'r - rf)/sqrt(w'Cov w) — use one-pass from efficient frontier via maximizing over a grid or gradient
 9146 |     // Approximate: iterate to maximize Sharpe
 9147 |     const n=items.length; const vols=items.map(b=>b.volatility!=null?b.volatility:.2);
 9148 |     const rets=items.map(b=>b.expectedReturn!=null?b.expectedReturn:.1);
 9149 |     const c=corr||Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:.4));
```

## maximumSharpe — line 9142 — owner `PortfolioOptimizers`

```js
 9134 |       for(let i=0;i<n;i++){ for(let j=0;j<n;j++)grad[i]+=2*cov[i][j]*w[j]; }
 9135 |       for(let i=0;i<n;i++)w[i]-=lr*grad[i];
 9136 |       // project onto simplex (clamp >=0, normalize)
 9137 |       let min=Math.min(...w); if(min<0){ w=w.map(x=>Math.max(0,x)); }
 9138 |       const sum=w.reduce((a,b)=>a+b,0)||1; w=w.map(x=>x/sum);
 9139 |     }
 9140 |     return w.map((weight,i)=>({name:items[i].name,weight}));
 9141 |   }
 9142 |   function maximumSharpe(items,corr,rf){
 9143 |     const mv=minimumVariance(items,corr); if(!mv)return null;
 9144 |     const rf2=rf!=null?rf:.03;
 9145 |     // tangency portfolio: maximize (w'r - rf)/sqrt(w'Cov w) — use one-pass from efficient frontier via maximizing over a grid or gradient
 9146 |     // Approximate: iterate to maximize Sharpe
 9147 |     const n=items.length; const vols=items.map(b=>b.volatility!=null?b.volatility:.2);
 9148 |     const rets=items.map(b=>b.expectedReturn!=null?b.expectedReturn:.1);
 9149 |     const c=corr||Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:.4));
 9150 |     const cov=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>c[i][j]*vols[i]*vols[j]));
 9151 |     let w=Array(n).fill(1/n), best=-1;
 9152 |     for(let it=0;it<3000;it++){
 9153 |       let er=0; for(let i=0;i<n;i++)er+=w[i]*rets[i];
 9154 |       let varP=0; for(let i=0;i<n;i++)for(let j=0;j<n;j++)varP+=w[i]*w[j]*cov[i][j];
 9155 |       const vol=Math.sqrt(Math.max(varP,1e-12));
 9156 |       const sharpe= vol>0? (er-rf2)/vol:0;
 9157 |       if(sharpe>best)best=sharpe;
 9158 |       // gradient ascent on sharpe (approx)
 9159 |       const grad=Array(n).fill(0);
 9160 |       for(let i=0;i<n;i++){ let mcr=0; for(let j=0;j<n;j++)mcr+=cov[i][j]*w[j]; grad[i]=(rets[i]*vol-(er-rf2)*(mcr/vol))/(vol*vol); }
 9161 |       const lr=0.005;
 9162 |       for(let i=0;i<n;i++)w[i]+=lr*grad[i];
 9163 |       let min=Math.min(...w); if(min<0)w=w.map(x=>Math.max(0,x));
 9164 |       const sum=w.reduce((a,b)=>a+b,0)||1; w=w.map(x=>x/sum);
 9165 |     }
 9166 |     return w.map((weight,i)=>({name:items[i].name,weight}));
 9167 |   }
 9168 |   function riskParity(items,corr){
 9169 |     const n=items.length; if(n<2)return null;
```

## wsDividendAmounts — line 9607 — owner `FinancialValidators`

```js
 9599 | function wsSortTransactions(txs){
 9600 |   return (txs||[]).slice().sort((a,b)=>{
 9601 |     const ka=wsTxSortKey(a), kb=wsTxSortKey(b);
 9602 |     return ka<kb?-1:ka>kb?1:0;
 9603 |   });
 9604 | }
 9605 | 
 9606 | /* ---- Dividend: explicit gross/withholding/net (P1 #35-37) ---- */
 9607 | function wsDividendAmounts(tx){
 9608 |   // Method A: sharesHeld * dividendPerShare. Method B: grossDividend (direct).
 9609 |   let gross=null;
 9610 |   if(tx.grossDividend!=null) gross=tx.grossDividend;
 9611 |   else if(tx.sharesHeld!=null&&tx.dividendPerShare!=null) gross=tx.sharesHeld*tx.dividendPerShare;
 9612 |   else if(tx.quantity!=null&&tx.price!=null&&tx.price>1) gross=tx.quantity*tx.price; // legacy fallback, labelled
 9613 |   else if(tx.quantity!=null&&tx.price!=null) gross=tx.quantity*tx.price;
 9614 |   const withholding= tx.withholdingTax!=null? tx.withholdingTax : (tx.tax||0);
 9615 |   const net= gross!=null? gross-withholding : (tx.amount!=null? tx.amount : 0);
 9616 |   return {gross:gross!=null?gross:net, withholding:withholding||0, net};
 9617 | }
 9618 | 
 9619 | /* ---- Independent position calculation engine (P0 #16) ----
 9620 |    Returns a fresh {positions, cash} WITHOUT writing to ws. It is the
 9621 |    single source of truth from the transaction ledger. Callers may
 9622 |    persist its output, but reconciliation compares it against what is
 9623 |    stored rather than overwriting the target first. */
 9624 | function wsCalculateFromLedger(ws, opts){
 9625 |   opts=opts||{};
 9626 |   const base=wsBaseCurrency();
 9627 |   const positions={};
 9628 |   const cash={};
 9629 |   // seed cash from existing account balances only if preserving (for reconciliation seed)
 9630 |   (ws.cashAccounts||{}).forEach&&0;
 9631 |   const txs=wsSortTransactions(ws.transactions||[]);
 9632 |   txs.forEach(tx=>{
 9633 |     const key=tx.security||tx.ticker||null;
 9634 |     const cur=tx.currency||base;
```

## wsCalculateFromLedger — line 9624 — owner `FinancialValidators`

```js
 9616 |   return {gross:gross!=null?gross:net, withholding:withholding||0, net};
 9617 | }
 9618 | 
 9619 | /* ---- Independent position calculation engine (P0 #16) ----
 9620 |    Returns a fresh {positions, cash} WITHOUT writing to ws. It is the
 9621 |    single source of truth from the transaction ledger. Callers may
 9622 |    persist its output, but reconciliation compares it against what is
 9623 |    stored rather than overwriting the target first. */
 9624 | function wsCalculateFromLedger(ws, opts){
 9625 |   opts=opts||{};
 9626 |   const base=wsBaseCurrency();
 9627 |   const positions={};
 9628 |   const cash={};
 9629 |   // seed cash from existing account balances only if preserving (for reconciliation seed)
 9630 |   (ws.cashAccounts||{}).forEach&&0;
 9631 |   const txs=wsSortTransactions(ws.transactions||[]);
 9632 |   txs.forEach(tx=>{
 9633 |     const key=tx.security||tx.ticker||null;
 9634 |     const cur=tx.currency||base;
 9635 |     const t=(tx.type||"BUY").toUpperCase();
 9636 |     if(cash[cur]==null) cash[cur]=0;
 9637 |     if(t==="BUY"){
 9638 |       const q=tx.quantity, p=tx.price;
 9639 |       if(!q||q<=0||p==null||p<=0) return;
 9640 |       if(!positions[key]) positions[key]={security:key,ticker:tx.ticker||key,quantity:0,avgCost:0,costBasis:0,realizedPnl:0,divIncome:0,divNet:0,fees:0,currency:cur,costBasisCurrency:cur,fxBasis:(tx.rateAtTrade!=null?tx.rateAtTrade:1)};
 9641 |       const pos=positions[key];
 9642 |       const cost=q*p;
 9643 |       const newQty=pos.quantity+q;
 9644 |       pos.avgCost= newQty>0? (pos.costBasis+cost)/newQty : 0;
 9645 |       pos.costBasis+=cost;
 9646 |       pos.quantity=newQty;
 9647 |       pos.fees+=(tx.fees||0);
 9648 |       // fxBasis = weighted average acquisition FX for cost basis
 9649 |       const fxB=tx.rateAtTrade!=null?tx.rateAtTrade:1;
 9650 |       const prevCost=pos.costBasis-cost;
 9651 |       pos.fxBasis= prevCost+cost>0? ((prevCost*pos.fxBasis)+(cost*fxB))/(prevCost+cost) : fxB;
```

## wsFxRateMeta — line 9704 — owner `accounts`

```js
 9696 |   if(!accounts[wsBaseCurrency()]) accounts[wsBaseCurrency()]={currency:wsBaseCurrency(),balance:0};
 9697 |   ws.cashAccounts=accounts;
 9698 |   ws.transactionsCount=(ws.transactions||[]).length;
 9699 |   return calc;
 9700 | }
 9701 | 
 9702 | 
 9703 | /* ---- FX with provenance (P0 #8) ---- */
 9704 | function wsFxRateMeta(currency){
 9705 |   const ws=wsPortfolio();
 9706 |   if(!currency||currency===wsBaseCurrency()) return {rate:1,currencyPair:(wsBaseCurrency()+"→"+wsBaseCurrency()),asOf:null,source:"BASE",rateType:"identity",provenance:"Base currency identity rate"};
 9707 |   const fxs=ws.fxRates||{};
 9708 |   const entry=fxs[currency];
 9709 |   if(entry==null) return null;
 9710 |   // Backward-compatible: a bare number is treated as a manual rate (no provenance).
 9711 |   let rate, meta;
 9712 |   if(typeof entry==="number"||typeof entry==="string"){ rate=Number(entry); meta={}; }
 9713 |   else if(typeof entry==="object"){ rate=entry.rate; meta=entry; }
 9714 |   else return null;
 9715 |   if(rate==null||!isFinite(rate)||rate<=0) return null;
 9716 |   return {rate,currencyPair:(currency+"→"+wsBaseCurrency()),asOf:meta.asOf||null,source:meta.source||"USER PROVIDED (manual)",rateType:meta.rateType||"manual",provenance:"FX rate source: "+(meta.source||"USER PROVIDED (manual)")};
 9717 | }
 9718 | 
 9719 | function wsFxRate(currency){ const m=wsFxRateMeta(currency); return m? m.rate : null; }
 9720 | function wsFxConvert(amount,currency){ const m=wsFxRateMeta(currency); if(!m)return null; return amount*m.rate; }
 9721 | 
 9722 | /* ---- Multi-currency market value + P&L decomposition (P0 #5-7, #12) ---- */
 9723 | function wsMarketValue(){
 9724 |   const ws=wsPortfolio(); const pos=ws.holdings||{};
 9725 |   let baseMV=0, baseCost=0, baseUnrealized=0, localUnrealized=0, fxUnrealized=0, missingFx=0;
 9726 |   Object.keys(pos).forEach(k=>{
 9727 |     const p=pos[k]; const cur=p.currency||wsBaseCurrency();
 9728 |     const pg=wsGetPrice(k, ws);
 9729 |     if(!pg) return; // price MISSING
 9730 |     const price=pg.price;
 9731 |     const fxM=wsFxRateMeta(cur);
```

## wsFxConvert — line 9720 — owner `accounts`

```js
 9712 |   if(typeof entry==="number"||typeof entry==="string"){ rate=Number(entry); meta={}; }
 9713 |   else if(typeof entry==="object"){ rate=entry.rate; meta=entry; }
 9714 |   else return null;
 9715 |   if(rate==null||!isFinite(rate)||rate<=0) return null;
 9716 |   return {rate,currencyPair:(currency+"→"+wsBaseCurrency()),asOf:meta.asOf||null,source:meta.source||"USER PROVIDED (manual)",rateType:meta.rateType||"manual",provenance:"FX rate source: "+(meta.source||"USER PROVIDED (manual)")};
 9717 | }
 9718 | 
 9719 | function wsFxRate(currency){ const m=wsFxRateMeta(currency); return m? m.rate : null; }
 9720 | function wsFxConvert(amount,currency){ const m=wsFxRateMeta(currency); if(!m)return null; return amount*m.rate; }
 9721 | 
 9722 | /* ---- Multi-currency market value + P&L decomposition (P0 #5-7, #12) ---- */
 9723 | function wsMarketValue(){
 9724 |   const ws=wsPortfolio(); const pos=ws.holdings||{};
 9725 |   let baseMV=0, baseCost=0, baseUnrealized=0, localUnrealized=0, fxUnrealized=0, missingFx=0;
 9726 |   Object.keys(pos).forEach(k=>{
 9727 |     const p=pos[k]; const cur=p.currency||wsBaseCurrency();
 9728 |     const pg=wsGetPrice(k, ws);
 9729 |     if(!pg) return; // price MISSING
 9730 |     const price=pg.price;
 9731 |     const fxM=wsFxRateMeta(cur);
 9732 |     if(!fxM){ missingFx++; return; }
 9733 |     const fx=fxM.rate;
 9734 |     const localMV=p.quantity*price;
 9735 |     const baseMVi=localMV*fx;
 9736 |     const baseCosti=p.costBasis*(p.fxBasis!=null?p.fxBasis:1);
 9737 |     const localUni=localMV-p.costBasis;
 9738 |     const fxUni=p.costBasis*((fx-(p.fxBasis!=null?p.fxBasis:1)));
 9739 |     baseMV+=baseMVi; baseCost+=baseCosti; baseUnrealized+=(baseMVi-baseCosti);
 9740 |     localUnrealized+=localUni; fxUnrealized+=fxUni;
 9741 |   });
 9742 |   return {mv:baseMV,cost:baseCost,unreal:baseUnrealized,localUnrealized,fxUnrealized,missingFx,priceCount:Object.keys(pos).length};
 9743 | }
 9744 | 
 9745 | 
 9746 | /* ---- Base-currency position value / weight (P2 #38-39, #12) ---- */
 9747 | function wsPositionBaseValue(k){
```

## wsMarketValue — line 9723 — owner `accounts`

```js
 9715 |   if(rate==null||!isFinite(rate)||rate<=0) return null;
 9716 |   return {rate,currencyPair:(currency+"→"+wsBaseCurrency()),asOf:meta.asOf||null,source:meta.source||"USER PROVIDED (manual)",rateType:meta.rateType||"manual",provenance:"FX rate source: "+(meta.source||"USER PROVIDED (manual)")};
 9717 | }
 9718 | 
 9719 | function wsFxRate(currency){ const m=wsFxRateMeta(currency); return m? m.rate : null; }
 9720 | function wsFxConvert(amount,currency){ const m=wsFxRateMeta(currency); if(!m)return null; return amount*m.rate; }
 9721 | 
 9722 | /* ---- Multi-currency market value + P&L decomposition (P0 #5-7, #12) ---- */
 9723 | function wsMarketValue(){
 9724 |   const ws=wsPortfolio(); const pos=ws.holdings||{};
 9725 |   let baseMV=0, baseCost=0, baseUnrealized=0, localUnrealized=0, fxUnrealized=0, missingFx=0;
 9726 |   Object.keys(pos).forEach(k=>{
 9727 |     const p=pos[k]; const cur=p.currency||wsBaseCurrency();
 9728 |     const pg=wsGetPrice(k, ws);
 9729 |     if(!pg) return; // price MISSING
 9730 |     const price=pg.price;
 9731 |     const fxM=wsFxRateMeta(cur);
 9732 |     if(!fxM){ missingFx++; return; }
 9733 |     const fx=fxM.rate;
 9734 |     const localMV=p.quantity*price;
 9735 |     const baseMVi=localMV*fx;
 9736 |     const baseCosti=p.costBasis*(p.fxBasis!=null?p.fxBasis:1);
 9737 |     const localUni=localMV-p.costBasis;
 9738 |     const fxUni=p.costBasis*((fx-(p.fxBasis!=null?p.fxBasis:1)));
 9739 |     baseMV+=baseMVi; baseCost+=baseCosti; baseUnrealized+=(baseMVi-baseCosti);
 9740 |     localUnrealized+=localUni; fxUnrealized+=fxUni;
 9741 |   });
 9742 |   return {mv:baseMV,cost:baseCost,unreal:baseUnrealized,localUnrealized,fxUnrealized,missingFx,priceCount:Object.keys(pos).length};
 9743 | }
 9744 | 
 9745 | 
 9746 | /* ---- Base-currency position value / weight (P2 #38-39, #12) ---- */
 9747 | function wsPositionBaseValue(k){
 9748 |   const ws=wsPortfolio(); const p=ws.holdings&&ws.holdings[k]; if(!p)return null;
 9749 |   const cur=p.currency||wsBaseCurrency();
 9750 |   const pg=wsGetPrice(k, ws); if(!pg)return null;
```

## wsPositionBaseValue — line 9747 — owner `accounts`

```js
 9739 |     baseMV+=baseMVi; baseCost+=baseCosti; baseUnrealized+=(baseMVi-baseCosti);
 9740 |     localUnrealized+=localUni; fxUnrealized+=fxUni;
 9741 |   });
 9742 |   return {mv:baseMV,cost:baseCost,unreal:baseUnrealized,localUnrealized,fxUnrealized,missingFx,priceCount:Object.keys(pos).length};
 9743 | }
 9744 | 
 9745 | 
 9746 | /* ---- Base-currency position value / weight (P2 #38-39, #12) ---- */
 9747 | function wsPositionBaseValue(k){
 9748 |   const ws=wsPortfolio(); const p=ws.holdings&&ws.holdings[k]; if(!p)return null;
 9749 |   const cur=p.currency||wsBaseCurrency();
 9750 |   const pg=wsGetPrice(k, ws); if(!pg)return null;
 9751 |   const fx=wsFxRate(cur); if(fx==null)return null;
 9752 |   return p.quantity*pg.price*fx;
 9753 | }
 9754 | 
 9755 | function wsWeight(k,portfolioMV){
 9756 |   const base=wsPositionBaseValue(k); if(base==null)return null;
 9757 |   const mv=(portfolioMV!=null?portfolioMV:wsMarketValue().mv);
 9758 |   return mv>0? base/mv : 0;
 9759 | }
 9760 | 
 9761 | /* ---- Multi-currency cash consolidation (P0 #9-11) ---- */
 9762 | function wsCashSummary(){
 9763 |   const ws=wsPortfolio(); const base=wsBaseCurrency();
 9764 |   const localCash={}; let baseCash=0, missingFxCurrencies=[];
 9765 |   Object.keys(ws.cashAccounts||{}).forEach(c=>{
 9766 |     const bal=ws.cashAccounts[c].balance||0; localCash[c]=bal;
 9767 |     if(c===base){ baseCash+=bal; }
 9768 |     else { const fx=wsFxRate(c); if(fx==null){ missingFxCurrencies.push(c); } else { baseCash+=bal*fx; } }
 9769 |   });
 9770 |   const mv=wsMarketValue();
 9771 |   return {cash:baseCash, localCash, missingFxCurrencies, invested:mv.mv, total:baseCash+mv.mv};
 9772 | }
 9773 | 
 9774 | /* ---- Rebalancing in base currency (P0 #12) ---- */
```

## wsCashSummary — line 9762 — owner `accounts`

```js
 9754 | 
 9755 | function wsWeight(k,portfolioMV){
 9756 |   const base=wsPositionBaseValue(k); if(base==null)return null;
 9757 |   const mv=(portfolioMV!=null?portfolioMV:wsMarketValue().mv);
 9758 |   return mv>0? base/mv : 0;
 9759 | }
 9760 | 
 9761 | /* ---- Multi-currency cash consolidation (P0 #9-11) ---- */
 9762 | function wsCashSummary(){
 9763 |   const ws=wsPortfolio(); const base=wsBaseCurrency();
 9764 |   const localCash={}; let baseCash=0, missingFxCurrencies=[];
 9765 |   Object.keys(ws.cashAccounts||{}).forEach(c=>{
 9766 |     const bal=ws.cashAccounts[c].balance||0; localCash[c]=bal;
 9767 |     if(c===base){ baseCash+=bal; }
 9768 |     else { const fx=wsFxRate(c); if(fx==null){ missingFxCurrencies.push(c); } else { baseCash+=bal*fx; } }
 9769 |   });
 9770 |   const mv=wsMarketValue();
 9771 |   return {cash:baseCash, localCash, missingFxCurrencies, invested:mv.mv, total:baseCash+mv.mv};
 9772 | }
 9773 | 
 9774 | /* ---- Rebalancing in base currency (P0 #12) ---- */
 9775 | function wsRebalance(){
 9776 |   const ws=wsPortfolio(); const mv=wsMarketValue();
 9777 |   const items=Object.keys(ws.holdings||{}).map(k=>{
 9778 |     const baseVal=wsPositionBaseValue(k); if(baseVal==null)return null;
 9779 |     const cur= mv.mv>0? baseVal/mv.mv:0;
 9780 |     const tw=ws.targetWeights&&ws.targetWeights[k]? ws.targetWeights[k]:null;
 9781 |     return {security:k,ticker:(ws.holdings[k]||{}).ticker,cur,val:baseVal,target:tw?tw.target:null,min:tw?tw.min:null,max:tw?tw.max:null,
 9782 |       drift: tw&&tw.target!=null? cur-tw.target:null,
 9783 |       status: tw&&tw.target!=null? (cur>(tw.max??1)?"OVERWEIGHT":cur<(tw.min??0)?"UNDERWEIGHT":"IN RANGE"):"—",
 9784 |       suggestedChange: tw&&tw.target!=null? (tw.target-cur)*mv.mv:null};
 9785 |   }).filter(Boolean);
 9786 |   const proposals=items.filter(i=>i.target!=null&&i.drift!=null&&Math.abs(i.drift)>0.01);
 9787 |   ws.rebalanceProposals=proposals;
 9788 |   return {items,proposals,mv};
 9789 | }
```

## wsReconcile — line 9795 — owner `localCash`

```js
 9787 |   ws.rebalanceProposals=proposals;
 9788 |   return {items,proposals,mv};
 9789 | }
 9790 | 
 9791 | 
 9792 | /* ---- Rebalancing in base currency (P0 #12) ---- */
 9793 | 
 9794 | /* ---- Independent reconciliation (P0 #16-18) ---- */
 9795 | function wsReconcile(){
 9796 |   const ws=wsPortfolio();
 9797 |   const calc=wsCalculateFromLedger(ws);
 9798 |   const derived=calc.positions;
 9799 |   const held=ws.holdings||{};
 9800 |   const issues=[];
 9801 |   Object.keys(derived).forEach(k=>{
 9802 |     const d=derived[k], h=held[k];
 9803 |     if(!h){ issues.push({sev:"warning",text:"Position "+k+" exists in ledger but not in stored holdings."}); return; }
 9804 |     if(Math.abs(h.quantity-d.quantity)>ReconciliationConfig.quantityTolerance) issues.push({sev:"warning",text:"Qty mismatch "+k+": holdings "+h.quantity+" vs ledger "+d.quantity});
 9805 |     if(Math.abs((h.costBasis||0)-(d.costBasis||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Cost basis mismatch "+k});
 9806 |     if(Math.abs((h.realizedPnl||0)-(d.realizedPnl||0))>ReconciliationConfig.pnlTolerance) issues.push({sev:"warning",text:"Realized P&L mismatch "+k});
 9807 |     if(Math.abs((h.divIncome||0)-(d.divIncome||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Dividend mismatch "+k});
 9808 |     if(Math.abs((h.fees||0)-(d.fees||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Fees mismatch "+k});
 9809 |   });
 9810 |   Object.keys(held).forEach(k=>{ if(!derived[k]&&held[k].quantity>0) issues.push({sev:"warning",text:"Holding "+k+" has no ledger transactions"}); });
 9811 |   Object.keys(calc.cash).forEach(c=>{
 9812 |     const stored=(ws.cashAccounts&&ws.cashAccounts[c]&&ws.cashAccounts[c].balance)||0;
 9813 |     if(Math.abs(stored-calc.cash[c])>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Cash mismatch ("+c+"): stored "+stored+" vs ledger "+calc.cash[c]});
 9814 |   });
 9815 |   ws.portfolioRecon={ok:issues.length===0,issues,derivedCount:Object.keys(derived).length,txCount:(ws.transactions||[]).length,tolerances:ReconciliationConfig};
 9816 |   return ws.portfolioRecon;
 9817 | }
 9818 | 
 9819 | const ReconciliationConfig={ quantityTolerance:1e-6, currencyTolerance:0.01, pnlTolerance:0.01, fxTolerance:1e-6,
 9820 |   _reason:function(){ return "quantityTolerance: share-count floating error; currencyTolerance: ±0.01 rounding on cash/P&L; pnlTolerance: ±0.01 on realized/unrealized; fxTolerance: rate rounding."; } };
 9821 | 
 9822 | /* ---- Transaction validation (P0 #14, #13) ---- */
```

## wsValidateTransaction — line 9823 — owner `ReconciliationConfig`

```js
 9815 |   ws.portfolioRecon={ok:issues.length===0,issues,derivedCount:Object.keys(derived).length,txCount:(ws.transactions||[]).length,tolerances:ReconciliationConfig};
 9816 |   return ws.portfolioRecon;
 9817 | }
 9818 | 
 9819 | const ReconciliationConfig={ quantityTolerance:1e-6, currencyTolerance:0.01, pnlTolerance:0.01, fxTolerance:1e-6,
 9820 |   _reason:function(){ return "quantityTolerance: share-count floating error; currencyTolerance: ±0.01 rounding on cash/P&L; pnlTolerance: ±0.01 on realized/unrealized; fxTolerance: rate rounding."; } };
 9821 | 
 9822 | /* ---- Transaction validation (P0 #14, #13) ---- */
 9823 | function wsValidateTransaction(tx){
 9824 |   const errors=[];
 9825 |   if(!tx) return {ok:false,errors:["Transaction is empty."]};
 9826 |   if(!tx.date||isNaN(new Date(tx.date).getTime())) errors.push("Trade date must be a valid date.");
 9827 |   const t=(tx.type||"").toUpperCase();
 9828 |   if(!WS_TYPES.includes(t)) errors.push("Unknown transaction type: "+(tx.type||""));
 9829 |   const cur=tx.currency||wsBaseCurrency();
 9830 |   if(!VALID_CURRENCIES.includes(cur)) errors.push("Unsupported currency: "+cur);
 9831 |   if(t==="BUY"){
 9832 |     if(!(tx.quantity>0)) errors.push("BUY quantity must be greater than zero.");
 9833 |     if(!(tx.price>0)) errors.push("BUY price must be greater than zero.");
 9834 |   } else if(t==="SELL"){
 9835 |     if(!(tx.quantity>0)) errors.push("SELL quantity must be greater than zero.");
 9836 |     if(!(tx.price>0)) errors.push("SELL price must be greater than zero.");
 9837 |     const ws=wsPortfolio(); const calc=wsCalculateFromLedger(ws);
 9838 |     const avail= calc.positions[tx.security||tx.ticker]? calc.positions[tx.security||tx.ticker].quantity : 0;
 9839 |     if(tx.quantity>avail+ReconciliationConfig.quantityTolerance) errors.push("SELL quantity "+tx.quantity+" exceeds available quantity "+avail+".");
 9840 |   } else if(t==="DIVIDEND"){
 9841 |     // Method A or B required
 9842 |     const hasA=tx.sharesHeld!=null&&tx.dividendPerShare!=null;
 9843 |     const hasB=tx.grossDividend!=null;
 9844 |     if(!hasA&&!hasB && !(tx.quantity!=null&&tx.price!=null)) errors.push("Dividend requires shares + dividend per share, or a gross dividend amount.");
 9845 |   } else if(t==="DEPOSIT"||t==="WITHDRAWAL"||t==="FEE"||t==="TAX"){
 9846 |     if(!(tx.amount!=null)) errors.push(t+" requires an amount.");
 9847 |     if(t==="DEPOSIT"&&tx.amount<0) errors.push("Deposit amount must be positive.");
 9848 |     if(t==="WITHDRAWAL"&&tx.amount>0) errors.push("Withdrawal amount must be negative.");
 9849 |   }
 9850 |   return {ok:errors.length===0, errors};
```

## wsUnrealized — line 9884 — owner `ReconciliationConfig`

```js
 9876 | function wsBaseCurrency(){ return App.state.settings.currency||"EUR"; }
 9877 | 
 9878 | /* ---- Transaction types ---- */
 9879 | const WS_TYPES=["BUY","SELL","DIVIDEND","FEE","TAX","DEPOSIT","WITHDRAWAL","SPLIT","CORPORATE ACTION"];
 9880 | 
 9881 | /* ---- Position reconciliation: holdings derived from transactions ---- */
 9882 | 
 9883 | /* ---- Market value & unrealized P&L (needs current prices) ---- */
 9884 | function wsUnrealized(security,price){
 9885 |   const p=(wsPortfolio().holdings||{})[security]; if(!p)return null;
 9886 |   return p.quantity*price-p.costBasis;
 9887 | }
 9888 | 
 9889 | /* ---- Cash + invested capital ---- */
 9890 | 
 9891 | /* ---- Portfolio reconciliation: holdings vs transactions ---- */
 9892 | 
 9893 | /* ---- Target weights & rebalancing proposal ---- */
 9894 | 
 9895 | 
 9896 | /* ============================================================
 9897 |    V7 — PORTFOLIO WORKSPACE UI (holdings, transactions, rebalance)
 9898 |    ============================================================ */
 9899 | 
 9900 | function wsPortfolioRender(){
 9901 |   const ws=wsPortfolio(); const mv=wsMarketValue(); const cash=wsCashSummary();
 9902 |   // derive positions (holdings from transactions)
 9903 |   const computed=wsComputePositions();
 9904 |   const pos=computed.positions;
 9905 |   // stale-price warning (P2 #40): list positions whose Price Book price is stale/missing
 9906 |   const staleKeys=[]; const missingKeys=[];
 9907 |   Object.keys(pos).forEach(k=>{ const g=wsGetPrice(k,ws); if(!g){ missingKeys.push(k); } else if(g.freshness==="STALE"||g.freshness==="AGING"){ staleKeys.push(k); } });
 9908 |   let h=`<div class="card"><div class="card-title">Portfolio <span class="hint">positions derived from transactions</span></div>
 9909 |   ${staleKeys.length||missingKeys.length?`<div class="banner warn">${missingKeys.length?`<b>PORTFOLIO VALUE INCOMPLETE</b> — no price recorded for: ${missingKeys.join(", ")}. `:""}${staleKeys.length?`<b>PORTFOLIO VALUE PARTIALLY STALE</b> — stale prices: ${staleKeys.join(", ")}. `:""}The totals below are not fully current.</div>`:""}
 9910 |   <div class="grid g4">
 9911 |     ${kpi("Market value",mv.mv>0?fmt.money(mv.mv):"—")}
```

## wsTWR — line 10229 — owner `order`

```js
10221 | function wsPerfDefault(){
10222 |   return { snapshots:[], // {date, mv, cashFlow} cashFlow=external flow into portfolio this period
10223 |            benchmark:[], // {date, level} benchmark index level for relative return
10224 |          };
10225 | }
10226 | function wsPerf(){ return App.state.wsPerf||(App.state.wsPerf=wsPerfDefault()); }
10227 | 
10228 | /* ---- Time-Weighted Return ---- */
10229 | function wsTWR(snapshots){
10230 |   if(!snapshots||snapshots.length<2)return null;
10231 |   // For each sub-period: (EndMV - flow) / StartMV
10232 |   // TWR = product(1 + subperiod return) - 1
10233 |   let twr=1;
10234 |   for(let i=1;i<snapshots.length;i++){
10235 |     const start=snapshots[i-1].mv||0;
10236 |     const end=snapshots[i].mv||0;
10237 |     const flow=snapshots[i].cashFlow||0;
10238 |     if(start<=0)continue;
10239 |     const sub=(end-flow)/start; // return factor
10240 |     if(isFinite(sub)&&sub>0)twr*=sub;
10241 |   }
10242 |   return twr-1;
10243 | }
10244 | 
10245 | /* ---- Money-Weighted Return (XIRR of cash flows + final value) ---- */
10246 | function wsMWR(snapshots){
10247 |   if(!snapshots||snapshots.length<2)return null;
10248 |   // Build cash flow series: start MV is negative (outflow), each flow is negative (outflow), final MV is positive (inflow)
10249 |   const flows=[]; const dates=[];
10250 |   const t0=snapshots[0].date;
10251 |   flows.push(-(snapshots[0].mv||0)); dates.push(snapshots[0].date);
10252 |   for(let i=1;i<snapshots.length-1;i++){
10253 |     flows.push(-(snapshots[i].cashFlow||0)); dates.push(snapshots[i].date);
10254 |   }
10255 |   const last=snapshots[snapshots.length-1];
10256 |   flows.push((last.mv||0)); dates.push(last.date);
```

## wsMWR — line 10246 — owner `order`

```js
10238 |     if(start<=0)continue;
10239 |     const sub=(end-flow)/start; // return factor
10240 |     if(isFinite(sub)&&sub>0)twr*=sub;
10241 |   }
10242 |   return twr-1;
10243 | }
10244 | 
10245 | /* ---- Money-Weighted Return (XIRR of cash flows + final value) ---- */
10246 | function wsMWR(snapshots){
10247 |   if(!snapshots||snapshots.length<2)return null;
10248 |   // Build cash flow series: start MV is negative (outflow), each flow is negative (outflow), final MV is positive (inflow)
10249 |   const flows=[]; const dates=[];
10250 |   const t0=snapshots[0].date;
10251 |   flows.push(-(snapshots[0].mv||0)); dates.push(snapshots[0].date);
10252 |   for(let i=1;i<snapshots.length-1;i++){
10253 |     flows.push(-(snapshots[i].cashFlow||0)); dates.push(snapshots[i].date);
10254 |   }
10255 |   const last=snapshots[snapshots.length-1];
10256 |   flows.push((last.mv||0)); dates.push(last.date);
10257 |   const mwr=XIRR.xirr(flows,dates,0.1);
10258 |   return mwr;
10259 | }
10260 | 
10261 | /* ---- Annualized TWR ---- */
10262 | function wsAnnualized(twr,days){
10263 |   if(twr==null||!days||days<=0)return null;
10264 |   const years=days/365.25;
10265 |   return Math.pow(1+twr,1/years)-1;
10266 | }
10267 | 
10268 | /* ---- Return decomposition (price vs income) ----
10269 |    Total return over the snapshot window is split into an income component
10270 |    (dividends ÷ start market value) and a price component (the residual,
10271 |    i.e. total − income). This is a clean accounting identity:
10272 |    total return = price return + income return.
10273 |    It is a labeled approximation: dividends are assumed to accrue across the
```

## computeBenchmark — line 10386 — owner `order`

```js
10378 |     if(sf!=null&&bf!=null&&Math.abs(sf-bf)>1) issues.push("Portfolio and benchmark have different frequencies ("+sf.toFixed(1)+"d vs "+bf.toFixed(1)+"d).");
10379 |     if(snaps.length<4||bench.length<4) issues.push("Insufficient observations for reliable capture ratios (recommend ≥4).");
10380 |     // currency basis: benchmark should be in the same base currency
10381 |     if(bench._currency&&baseCurrency&&bench._currency!==baseCurrency) issues.push("Benchmark currency ("+bench._currency+") differs from base currency ("+baseCurrency+").");
10382 |   }
10383 |   return {ok:issues.length===0, issues};
10384 | }
10385 | 
10386 | function computeBenchmark(){
10387 |   const perf=wsPerf(); const snaps=perf.snapshots||[]; const bench=perf.benchmark||[];
10388 |   const out=$("#bmOut"); if(!out)return;
10389 |   if(snaps.length<2){ out.innerHTML=`<div class="banner info">Record performance snapshots (Performance tab) to compute capture ratios against the benchmark.</div>`; return; }
10390 |   if(bench.length<2){ out.innerHTML=`<div class="banner warn">Benchmark not configured. Enter a benchmark index level series.</div>`; return; }
10391 |   const bv=wsBenchmarkValidate(snaps, bench, wsBaseCurrency());
10392 |   if(!bv.ok){ out.innerHTML=`<div class="banner bad"><b>BENCHMARK COMPARISON INVALID</b><div class="small">${bv.issues.map(i=>"• "+esc(i)).join("<br>")}</div></div>`; return; }
10393 |   // align by date: use snapshots' dates to derive portfolio periodic returns; benchmark returns from its levels
10394 |   // Build portfolio periodic returns from snapshot MV (TWR-style)
10395 |   const portRets=[]; for(let i=1;i<snaps.length;i++){ const start=snaps[i-1].mv||0, end=snaps[i].mv||0, flow=snaps[i].cashFlow||0; if(start>0)portRets.push((end-flow)/start-1); }
10396 |   // benchmark returns: use the benchmark levels nearest each snapshot date
10397 |   const benchRets=[];
10398 |   for(let i=1;i<snaps.length;i++){ const d=snaps[i].date; const prev=nearestBench(bench,snaps[i-1].date); const cur=nearestBench(bench,d); if(prev&&cur&&prev>0)benchRets.push(cur/prev-1); }
10399 |   const n=Math.min(portRets.length,benchRets.length);
10400 |   const c=wsCaptureRatios(portRets.slice(-n),benchRets.slice(-n), wsAnnualizationFactor(snaps));
10401 |   if(!c){ out.innerHTML=`<div class="banner info">Insufficient aligned data to compute capture ratios.</div>`; return; }
10402 |   let h=`<div class="grid g4 mt">
10403 |     ${kpi("Upside capture",c.upside!=null?fmt.pct(c.upside):"—",">100% = gains more in up markets")}
10404 |     ${kpi("Downside capture",c.downside!=null?fmt.pct(c.downside):"—","<100% = loses less in down markets")}
10405 |     ${kpi("Beta",fmt.num(c.beta,2))}
10406 |     ${kpi("Tracking error",c.te!=null?fmt.pct(c.te):"—")}
10407 |     ${kpi("Information ratio",c.ir!=null?fmt.num(c.ir,2):"—")}
10408 |     ${kpi("Alpha (ann.)",c.alpha!=null?fmt.pct(c.alpha):"—")}
10409 |   </div>
10410 |   <div class="banner info">Benchmark: <b>${esc(perf.benchName||"Configured")}</b>. Aligned on ${n} common periods. Capture and beta are model estimates from your recorded snapshots and benchmark levels — not live data.</div>`;
10411 |   out.innerHTML=h;
10412 | }
10413 | function nearestBench(bench,date){
```

## wsPerfRisk — line 11880 — owner `rets`

```js
11872 |   if(days<20)return 26;      // bi-weekly
11873 |   if(days<45)return 12;      // monthly
11874 |   if(days<80)return 4;       // quarterly
11875 |   if(days<200)return 2;      // semi-annual
11876 |   return 1;                  // annual
11877 | }
11878 | 
11879 | /* ---- Risk statistics from periodic returns ---- */
11880 | function wsPerfRisk(periodRets, annualFactor){
11881 |   // periodRets: array of returns over the sub-periods
11882 |   if(!periodRets||periodRets.length<2)return null;
11883 |   const vol=CalcEngine.annualizeVol(CalcEngine.stdev(periodRets), annualFactor||252);
11884 |   const sharpe= CalcEngine.sharpe(periodRets,0.02/annualFactor||0.02/252);
11885 |   const sortino= CalcEngine.sortino(periodRets,0.02/annualFactor||0.02/252);
11886 |   const mdd= CalcEngine.maxDrawdown(periodRets.map((_,i)=>100*(1+periodRets.slice(0,i+1).reduce((a,b)=>a*(1+b),1)))).mdd;
11887 |   // Calmar = CAGR / |max drawdown| (annualized growth approximated from cumulative product)
11888 |   const cumRet= periodRets.reduce((a,b)=>a*(1+b),1)-1;
11889 |   const years= periodRets.length/ (annualFactor||252);
11890 |   const cagr= years>0? Math.pow(1+cumRet,1/years)-1:null;
11891 |   const calmar2= mdd<0&&cagr!=null? cagr/Math.abs(mdd):null;
11892 |   // VaR / ES from period returns
11893 |   const histVaR95=RiskMetricsV2.historicalVaR(periodRets,.95);
11894 |   const histVaR99=RiskMetricsV2.historicalVaR(periodRets,.99);
11895 |   const es95=RiskMetricsV2.expectedShortfall(periodRets,.95);
11896 |   const es99=RiskMetricsV2.expectedShortfall(periodRets,.99);
11897 |   return {vol,sharpe,sortino,mdd,cagr,calmar:calmar2,histVaR95,histVaR99,es95,es99,cumRet};
11898 | }
11899 | 
11900 | /* ---- Upgrade wsPerformanceRender to the full performance center ---- */
11901 | function wsPerformanceRenderFull(){
11902 |   const ws=wsPortfolio(); const perf=wsPerf(); const snaps=perf.snapshots||[];
11903 |   const mv=wsMarketValue();
11904 |   const periodRets=wsPeriodReturns(snaps);
11905 |   const risk= wsPerfRisk(periodReturnsArray(snaps), wsAnnualizationFactor(snaps));
11906 |   // build an array of period returns from snapshot MV for risk stats
11907 |   function periodReturnsArray(snaps2){ const a=[]; for(let i=1;i<snaps2.length;i++){ const s=snaps2[i-1].mv||0; const e=snaps2[i].mv||0; const f=snaps2[i].cashFlow||0; if(s>0)a.push((e-f)/s-1); } return a; }
```

## periodReturnsArray — line 11907 — owner `rets`

```js
11899 | 
11900 | /* ---- Upgrade wsPerformanceRender to the full performance center ---- */
11901 | function wsPerformanceRenderFull(){
11902 |   const ws=wsPortfolio(); const perf=wsPerf(); const snaps=perf.snapshots||[];
11903 |   const mv=wsMarketValue();
11904 |   const periodRets=wsPeriodReturns(snaps);
11905 |   const risk= wsPerfRisk(periodReturnsArray(snaps), wsAnnualizationFactor(snaps));
11906 |   // build an array of period returns from snapshot MV for risk stats
11907 |   function periodReturnsArray(snaps2){ const a=[]; for(let i=1;i<snaps2.length;i++){ const s=snaps2[i-1].mv||0; const e=snaps2[i].mv||0; const f=snaps2[i].cashFlow||0; if(s>0)a.push((e-f)/s-1); } return a; }
11908 |   let h=`<div class="card"><div class="card-title">Performance Center</div>
11909 |   <p class="small dim"><b>Official performance</b> = TWR (time-weighted, removes cash-flow timing) and MWR/XIRR (money-weighted, actual dollar experience) computed from validated period-end snapshots with external cash flows. <b>Snapshot performance</b> (multi-period 1D/1W/1M/YTD/1Y/3Y/5Y and risk stats) is an approximation from the available snapshots and is labelled as such — never presented as authoritative if cash flows make it unreliable. Not live data.</p>
11910 |   <div class="fields g3">
11911 |     ${AppUI.frow("Market value today","","pf_mv", mv.mv||"")}
11912 |     ${AppUI.frow("Cash flow this period","","pf_flow","0")}
11913 |   </div>
11914 |   <button class="btn btn-sm mt" id="pf_snap">Record Period Snapshot</button>
11915 |   <div class="tablewrap mt"><table class="data"><thead><tr><th>Date</th><th class="num">Market Value</th><th class="num">Cash Flow</th></tr></thead><tbody>
11916 |   ${snaps.map((s,i)=>`<tr><td>${new Date(s.date).toLocaleDateString()}</td><td class="num">${fmt.money(s.mv)}</td><td class="num">${s.cashFlow?fmt.money(s.cashFlow):"—"}</td><td><button class="btn btn-sm btn-danger" data-ps="${i}">×</button></td></tr>`).join("")||`<tr><td colspan="4" class="small dim">No snapshots yet. Record period-end market values to compute performance.</td></tr>`}
11917 |   </tbody></table></div>
11918 |   <div class="grid g4 mt">
11919 |     ${kpi("TWR", snaps.length>=2?fmt.pct(wsTWR(snaps)):"—","time-weighted")}
11920 |     ${kpi("MWR / XIRR", snaps.length>=2?fmt.pct(wsMWR(snaps)):"—","money-weighted")}
11921 |     ${kpi("CAGR", risk&&risk.cagr!=null?fmt.pct(risk.cagr):"—","annualized")}
11922 |     ${kpi("Volatility (ann.)", risk&&risk.vol!=null?fmt.pct(risk.vol):"—")}
11923 |   </div>
11924 |   <div class="grid g4 mt">
11925 |     ${kpi("Sharpe", risk&&risk.sharpe!=null?fmt.num(risk.sharpe,2):"—")}
11926 |     ${kpi("Sortino", risk&&risk.sortino!=null?fmt.num(risk.sortino,2):"—")}
11927 |     ${kpi("Max drawdown", risk&&risk.mdd!=null?fmt.pct(risk.mdd):"—")}
11928 |     ${kpi("Calmar", risk&&risk.calmar!=null?fmt.num(risk.calmar,2):"—")}
11929 |   </div>
11930 |   <div class="mt"><div class="small dim">Multi-period returns (from snapshots)</div>
11931 |   <div class="grid g4 mt">
11932 |     ${kpi("1D", periodRets&&periodRets.d1!=null?fmt.pct(periodRets.d1):"—")}
11933 |     ${kpi("1W", periodRets&&periodRets.d7!=null?fmt.pct(periodRets.d7):"—")}
11934 |     ${kpi("1M", periodRets&&periodRets.d30!=null?fmt.pct(periodRets.d30):"—")}
```

