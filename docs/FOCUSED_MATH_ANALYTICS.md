# Focused Math Inventory — analytics

Generated from index.html. Engineering evidence only; not a certification claim.

## const SimilarityEngine — 1 hit(s)

### line 1552

```js
 1540 |       "Returns were fabricated (Ponzi), not real trading."),
 1541 |     realCase("R09","Wirecard (2020)","Fintech / Payments","Germany",2020,
 1542 |       {de:8,currentRatio:.8,interestCov:1.5,volatility:.40,beta:1.4,fcfMargin:-.10,size:8},{ret1:null,ret3:null,ret5:null,defaulted:true,maxDD:-.95,note:"€1.9bn cash that did not exist; insolvency June 2020."},
 1543 |       "Reported cash balances were fictitious; a quarter of the balance sheet."),
 1544 |     realCase("R10","FTX (2022)","Crypto Exchange","Bahamas/US",2022,
 1545 |       {de:20,currentRatio:.5,volatility:.60,beta:2.0,fcfMargin:-.20,size:8},{ret1:null,ret3:null,ret5:null,defaulted:true,maxDD:-.97,note:"~$8-10bn customer-funds hole; bankruptcy Nov 2022."},
 1546 |       "Customer deposits misappropriated to a sister trading firm.")
 1547 |   ];
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
 1584 | /* ============================================================
 1585 |    SCENARIO ENGINE
 1586 |    ============================================================ */
 1587 | const ScenarioEngine=(()=>{
 1588 |   function run(baseDcf, scenarios, currentPrice, netDebt, shares){
 1589 |     // scenarios: array of {name, growth, margin, wacc, terminalGrowth, prob}
 1590 |     const out=[]; for(const s of scenarios){
 1591 |       const dcf=ValuationEngine.dcf({revenue0:baseDcf.revenue0, growth:s.growth, ebitdaMargin:s.margin, tax:baseDcf.tax, capexPct:s.capexPct!=null?s.capexPct:baseDcf.capexPct, wcPct:s.wcPct!=null?s.wcPct:baseDcf.wcPct, dandaPct:baseDcf.dandaPct, wacc:s.wacc, terminalGrowth:s.terminalGrowth, terminalMethod:baseDcf.terminalMethod, exitMultiple:s.exitMultiple!=null?s.exitMultiple:baseDcf.exitMultiple, netDebt, shares, horizon:baseDcf.horizon});
 1592 |       const val=dcf.perShare; const mos=currentPrice>0? (val/currentPrice)-1:null;
 1593 |       out.push({name:s.name, growth:s.growth, margin:s.margin, wacc:s.wacc, tg:s.terminalGrowth, prob:s.prob??null, value:val, perShare:val, dcf, mos});
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
 1616 |     const subsample=[];
```

## const ScenarioEngine — 1 hit(s)

### line 1587

```js
 1575 |     weights=weights||defaultWeights; k=k||3;
 1576 |     const stats=standardize(refCases);
 1577 |     const scored=refCases.map(c=>({case:c, sim:simScore(query,c,stats,weights)}));
 1578 |     scored.sort((a,b)=>b.sim-a.sim);
 1579 |     return scored.slice(0,k);
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
 1593 |       out.push({name:s.name, growth:s.growth, margin:s.margin, wacc:s.wacc, tg:s.terminalGrowth, prob:s.prob??null, value:val, perShare:val, dcf, mos});
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
 1636 | const Correlation=(()=>{
 1637 |   function matrix(series){
 1638 |     // series: {name, returns[]}
 1639 |     const n=Math.min(...series.map(s=>s.returns.length));
 1640 |     const names=series.map(s=>s.name); const m=names.length;
 1641 |     const out=Array.from({length:m},()=>Array(m).fill(null));
 1642 |     for(let i=0;i<m;i++) for(let j=0;j<m;j++){ if(i===j){out[i][j]=1;continue;} const a=series[i].returns.slice(-n),b=series[j].returns.slice(-n); out[i][j]=CalcEngine.corr(a,b); }
 1643 |     return {names,matrix:out};
 1644 |   }
 1645 |   return {matrix};
 1646 | })();
 1647 | 
 1648 | /* ============================================================
 1649 |    SENTIMENT — rule-based, clearly limited.
 1650 |    ============================================================ */
 1651 | const Sentiment=(()=>{
```

## const MonteCarlo — 2 hit(s)

### line 1606

```js
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
 1636 | const Correlation=(()=>{
 1637 |   function matrix(series){
 1638 |     // series: {name, returns[]}
 1639 |     const n=Math.min(...series.map(s=>s.returns.length));
 1640 |     const names=series.map(s=>s.name); const m=names.length;
 1641 |     const out=Array.from({length:m},()=>Array(m).fill(null));
 1642 |     for(let i=0;i<m;i++) for(let j=0;j<m;j++){ if(i===j){out[i][j]=1;continue;} const a=series[i].returns.slice(-n),b=series[j].returns.slice(-n); out[i][j]=CalcEngine.corr(a,b); }
 1643 |     return {names,matrix:out};
 1644 |   }
 1645 |   return {matrix};
 1646 | })();
 1647 | 
 1648 | /* ============================================================
 1649 |    SENTIMENT — rule-based, clearly limited.
 1650 |    ============================================================ */
 1651 | const Sentiment=(()=>{
 1652 |   const pos=["beat","growth","profit","strong","record","up","gain","positive","outperform","upgrade","growth","confidence","recover","expansion","margin","surge","bullish","good","excellent","improve","boost","opportunity","dividend","buyback","guidance","raised"];
 1653 |   const neg=["loss","decline","fall","miss","weak","down","negative","underperform","downgrade","risk","debt","bankruptcy","default","lawsuit","fraud","restructure","warn","cut","weakness","bearish","bad","poor","drop","slump","layoff","charge","impairment"];
 1654 |   const neu=["guidance","reported","announced","expected","flat","mixed","stable","unchanged","review","commentary","legal","regulatory"];
 1655 |   function analyze(text){ const words=String(text).toLowerCase().replace(/[^a-z\s'-]/g," ").split(/\s+/).filter(Boolean);
 1656 |     let p=0,n=0,nu=0; const foundP=[],foundN=[],foundNeu=[];
 1657 |     for(const w of words){ if(pos.includes(w)){p++;foundP.push(w);} else if(neg.includes(w)){n++;foundN.push(w);} else if(neu.includes(w)){nu++;foundNeu.push(w);} }
 1658 |     const total=p+n+nu; const score= total>0? (p-n)/total : 0;
 1659 |     const label= p>n? "Positive bias": n>p? "Negative bias":"Neutral / mixed";
 1660 |     return {p,n,nu,score,label,foundP:foundP.slice(0,12),foundN:foundN.slice(0,12),words:words.length,note:"Rule-based word-count sentiment; may misread context, sarcasm, negation, or industry jargon."}; }
 1661 |   return {analyze};
 1662 | })();
 1663 | 
 1664 | /* ============================================================
 1665 |    EXPLANATION, RED FLAGS, DATA QUALITY, ASSESSMENT
 1666 |    ============================================================ */
 1667 | const ExplanationEngine=(()=>{
 1668 |   function valuation(mos){ if(mos==null) return "Valuation unknown — insufficient data.";
 1669 |     if(mos>=.30) return "Estimated intrinsic value is substantially above the current price under the selected assumptions — potentially attractive, though highly assumption-dependent.";
 1670 |     if(mos>=.10) return "Estimated intrinsic value is modestly above the current price — potentially attractive under current assumptions.";
```

### line 7510

```js
 7498 |   finals.sort(function(a,b){return a-b;});
 7499 |   function pct(p){ return finals[Math.min(finals.length-1,Math.floor(p*(finals.length-1)))]; }
 7500 |   var sum=0; for(var i=0;i<finals.length;i++)sum+=finals[i];
 7501 |   var mean=sum/finals.length;
 7502 |   var pLoss=0; for(i=0;i<finals.length;i++) if(finals[i]<initial)pLoss++;
 7503 |   pLoss=pLoss/finals.length;
 7504 |   var pExceed=0; if(target!=null){ for(i=0;i<finals.length;i++) if(finals[i]>=target)pExceed++; pExceed=pExceed/finals.length; }
 7505 |   self.postMessage({type:"done", initial:initial, simulations:simulations, median:pct(.5), p5:pct(.05), p25:pct(.25), p75:pct(.75), p95:pct(.95), min:finals[0], max:finals[finals.length-1], mean:mean, pLoss:pLoss, pExceed:pExceed, target:target, subsample:subsample, seed:seed, method:"GBM (Web Worker)"});
 7506 | };
 7507 | `;
 7508 | 
 7509 | /* ---- Main-thread fallback (mirrors the worker math via the existing engine) ---- */
 7510 | const MonteCarloWorker=(()=>{
 7511 |   let worker=null, curCallback=null, curProgress=null, running=false;
 7512 | 
 7513 |   function buildWorker(){
 7514 |     try{
 7515 |       if(typeof Worker==="undefined") return null;
 7516 |       const blob=new Blob([MCWorkerSource],{type:"application/javascript"});
 7517 |       const url=URL.createObjectURL(blob);
 7518 |       const w=new Worker(url);
 7519 |       w.onmessage=function(e){
 7520 |         const d=e.data;
 7521 |         if(d.type==="progress"){ if(curProgress)curProgress(d.done,d.total); }
 7522 |         else if(d.type==="done"){ const cb=curCallback; curCallback=null; curProgress=null; running=false; if(cb)cb(d); }
 7523 |       };
 7524 |       w.onerror=function(){ // fallback to main thread
 7525 |         cleanup();
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
 7562 |   <div class="small dim">Running off the main thread (Web Worker) so the interface stays responsive. Results are a modeled distribution, not a prediction.</div></div>`;
 7563 |   const onProgress=(done,total)=>{ const p=Math.round(done/total*100); const bar=$("#mcProgressBar"); if(bar)bar.style.width=p+"%"; const lab=$("#mcProgressLabel"); if(lab)lab.textContent=Math.min(p,100)+"% complete ("+fmt.num(done,0)+"/"+fmt.num(total,0)+")"; };
 7564 |   MonteCarloWorker.run(cfg, function(r){
 7565 |     if(!r){ // worker failed -> fallback already done; r from fallback is set via MonteCarlo.run
 7566 |       // onError path returned null; try direct
 7567 |       r=MonteCarlo.run(cfg);
 7568 |     }
 7569 |     App.state.results.mc=r; App.state.results.mc.seed=seed;
 7570 |     renderMCResult(r,cfg,g);
 7571 |   }, onProgress);
 7572 | }
 7573 | function renderMCResult(r,cfg,g){
 7574 |   $("#mcOut").innerHTML=`<div class="banner info"><b>Assumptions:</b> S₀=${fmt.money(r.initial)}, μ=${fmt.pct(cfg.expectedReturn)}, σ=${fmt.pct(cfg.volatility)}, T=${fmt.num(cfg.horizonYears)}y, ${fmt.num(r.simulations,0)} simulations, seed ${r.seed}. ${r.method||"GBM"} — this is a modeled distribution, not a prediction.</div>
```

## const DataQualityEngine — 1 hit(s)

### line 1918

```js
 1906 |     if(ctx.technical){ if(ctx.technical.strongMomentum) flags.push({level:"good",text:"Momentum indicators suggest strength."}); if(ctx.technical.weakMomentum) flags.push({level:"warn",text:"Momentum indicators suggest weakness."}); }
 1907 |     // positive signals
 1908 |     if(f.fcfMargin!=null && f.fcfMargin>.15) flags.push({level:"good",text:`Strong free-cash-flow margin (${fmt.pct(f.fcfMargin)}).`});
 1909 |     if(f.interestCoverage!=null && f.interestCoverage>5) flags.push({level:"good",text:`Strong interest coverage (${fmt.x(f.interestCoverage,1)}).`});
 1910 |     if(f.currentRatio!=null && f.currentRatio>2) flags.push({level:"good",text:`Conservative liquidity (current ratio ${fmt.x(f.currentRatio,2)}).`});
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
 1947 |       if(de!=null&&de<1)hp+=2; else if(de!=null&&de>3)hp+=0; else if(de!=null)hp+=1;
 1948 |       if(cr!=null&&cr>1.5)hp+=2; else if(cr!=null&&cr>=1)hp+=1; else if(cr!=null)hp+=0;
 1949 |       health= hp>=6?"Strong": hp>=4?"Moderate": hp>=2?"Weak":"Elevated risk"; }
 1950 |     parts.financialHealth={label:health};
 1951 |     // Tier3 valuation
 1952 |     let val;
 1953 |     if(ctx.valuation && ctx.valuation.mos!=null){ const m=ctx.valuation.mos; val= m>.1?"Potentially Undervalued": m>-.1?"Fairly Valued":"Potentially Overvalued"; }
 1954 |     else val="Unknown"; parts.valuation={label:val, mos:ctx.valuation&&ctx.valuation.mos};
 1955 |     // Tier4 risk
 1956 |     let risk;
 1957 |     if(ctx.risk && ctx.risk.volatility!=null){ const v=ctx.risk.volatility; risk= v>.5?"High": v>.3?"Elevated": v>.15?"Moderate":"Low"; }
 1958 |     else if(ctx.bondRisk!=null){ risk= ctx.bondRisk; } else risk="Unknown"; parts.risk={label:risk};
 1959 |     // Tier5 default
 1960 |     let defr;
 1961 |     if(ctx.defaultPD!=null){ defr= ctx.defaultPD>.2?"Elevated": ctx.defaultPD>.05?"Moderate":"Low"; } else if(ctx.altman && ctx.altman.zone){ defr= ctx.altman.zone.includes("Distress")?"Elevated":"Moderate"; } else defr="Unknown";
 1962 |     parts.default={label:defr};
 1963 |     // Tier6 historical analogues
 1964 |     let hist;
 1965 |     if(ctx.caseMatches && ctx.caseMatches.length){ const avg=ctx.caseStats?ctx.caseStats.mean1:null; const def=ctx.caseStats?ctx.caseStats.defaultPct:null;
 1966 |       hist= avg!=null?(avg>.15?"Positive": avg>0?"Mixed Positive":"Weak"):"Mixed"; if(def!=null&&def>.3) hist+=" / High-default"; }
 1967 |     else hist="None"; parts.historical={label:hist};
 1968 |     // Tier7 scenario robustness
 1969 |     let robustness=0; if(ctx.scenarios && ctx.scenarios.out){ const vals=ctx.scenarios.out.map(o=>o.value); const spread=Math.max(...vals)-Math.min(...vals); const base=ctx.scenarios.weighted||ctx.dcf.perShare; robustness= base>0? Math.max(0,Math.min(100,100- (spread/Math.abs(base))*50)):50; }
 1970 |     parts.robustness={score:Math.round(robustness)};
 1971 |     // combined recommendation language
 1972 |     let rec;
 1973 |     const downs=Object.entries(parts).filter(([k,v])=> v.label==="Elevated risk"||v.label==="Weak"||v.label==="High").length;
 1974 |     const ups=Object.entries(parts).filter(([k,v])=> v.label==="Potentially Undervalued"||v.label==="Strong"||v.label==="Low"||v.label==="Positive").length;
 1975 |     if(parts.valuation.label==="Unknown" && parts.financialHealth.label==="Unknown") rec="Requires More Data";
 1976 |     else if(parts.valuation.label==="Potentially Undervalued" && downs>=2) rec="Potentially Attractive but High Risk";
 1977 |     else if(parts.valuation.label==="Potentially Undervalued") rec="Potentially Attractive";
 1978 |     else if(parts.valuation.label==="Fairly Valued") rec="Fairly Valued";
 1979 |     else if(parts.valuation.label==="Potentially Overvalued" && downs>=1) rec="Potentially Overvalued / Speculative";
 1980 |     else if(parts.valuation.label==="Potentially Overvalued") rec="Potentially Overvalued";
 1981 |     else if(downs>=3) rec="Speculative";
 1982 |     else rec="Model Conflict — Investigate Further";
```

## const ScoringEngine — 1 hit(s)

### line 2006

```js
 1994 |     const valid=methods.filter(m=>m.label!=="unknown"&&m.label!=="unavailable");
 1995 |     const set=new Set(valid.map(m=>m.label));
 1996 |     if(valid.length<2) return {conflict:false, note:"Too few models to compare."};
 1997 |     const attractive=valid.filter(m=>m.label==="attractive").length;
 1998 |     const over=valid.filter(m=>m.label==="overvalued").length;
 1999 |     if(attractive>0 && over>0) return {conflict:true, note:"The models do not agree — some indicate attractive value while others indicate overvaluation. The investment thesis depends heavily on which methods and assumptions are considered most reliable."};
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
 2036 |   function lineChart({series, labels=null, xAxis=null, title, sub, height=260, area=false, yFmt=fmt.num, xFmt=x=>x, fillArea=true}){
 2037 |     const c=colors(); const W=640,H=height,P={l:46,r:12,t:16,b:34}; const iw=W-P.l-P.r, ih=H-P.t-P.b;
 2038 |     let allMin=Infinity,allMax=-Infinity; for(const s of series){ for(const v of s.data){ if(v!=null&&isFinite(v)){ if(v<allMin)allMin=v; if(v>allMax)allMax=v; } } }
 2039 |     if(allMin===Infinity){allMin=0;allMax=1;}
 2040 |     if(allMin===allMax){allMin-=1;allMax+=1;}
 2041 |     const pad=(allMax-allMin)*.08; allMin-=pad;allMax+=pad;
 2042 |     const svg=svgEl(W,H); const g=el("g",{}); svg.appendChild(g);
 2043 |     const xAt=i=>P.l+ (labels&&labels.length>1? i/(labels.length-1)*iw : 0);
 2044 |     const yAt=v=>P.t+ ih-((v-allMin)/(allMax-allMin))*ih;
 2045 |     // grid + y labels
 2046 |     const ticks=niceTicks(allMin,allMax,5);
 2047 |     for(const t of ticks){ const y=yAt(t); g.appendChild(el("line",{x1:P.l,y1:y,x2:P.l+iw,y2:y,stroke:c.grid,"stroke-width":1}));
 2048 |       const tx=el("text",{x:P.l-6,y:y+3,"text-anchor":"end",style:"font-size:10px;fill:"+c.text}); tx.textContent=yFmt(t); g.appendChild(tx); }
 2049 |     // x labels
 2050 |     if(labels){ const n=Math.min(labels.length,10); const step=Math.max(1,Math.floor(labels.length/n)); let li=0; for(let i=0;i<labels.length;i+=step){ const x=xAt(i); const tx=el("text",{x,y:H-P.b+14,"text-anchor":"middle",style:"font-size:9px;fill:"+c.text}); tx.textContent=xFmt(labels[i]); g.appendChild(tx); li++; } }
 2051 |     // series
 2052 |     series.forEach((s,i)=>{ const col=c.series[i%c.series.length]; let path="",dPath="";
 2053 |       let started=false; for(let j=0;j<s.data.length;j++){ const v=s.data[j]; if(v==null) continue; const x=xAt(j),y=yAt(v); path+= started?` L${x} ${y}`:` M${x} ${y}`; dPath+= started?` L${x} ${y}`:` M${x} ${y}`; started=true; }
 2054 |       if(area&&fillArea){ const dPathClose=dPath+(labels?` L${xAt(labels.length-1)} ${yAt(allMin)} L${xAt(0)} ${yAt(allMin)} Z`:""); g.appendChild(el("path",{d:dPathClose,fill:col,opacity:.12})); }
 2055 |       if(path) g.appendChild(el("path",{d:path,fill:"none",stroke:col,"stroke-width":1.8,"stroke-linejoin":"round","stroke-linecap":"round"})); });
 2056 |     // title
 2057 |     if(title){ const t=el("text",{x:P.l,y:12,style:"font-size:11px;font-weight:700;fill:"+(document.documentElement.getAttribute("data-theme")==="dark"?"#e6ecf5":"#1a2332")}); t.textContent=title; svg.appendChild(t); }
 2058 |     if(sub){ const t=el("text",{x:P.l,y:24,style:"font-size:9px;fill:"+c.text}); t.textContent=sub; svg.appendChild(t); }
 2059 |     // tooltip via hover on overlay points
 2060 |     return svg;
 2061 |   }
 2062 |   function barChart({series, labels, title, height=260, yFmt=fmt.num, horizontal=false}){
 2063 |     const c=colors(); const W=640,H=height,P={l:46,r:12,t:18,b:34}; const iw=W-P.l-P.r, ih=H-P.t-P.b;
 2064 |     let allMin=Infinity,allMax=-Infinity; for(const s of series) for(const v of s.data){ if(v!=null&&isFinite(v)){allMin=Math.min(allMin,v);allMax=Math.max(allMax,v);} } if(allMin===Infinity){allMin=0;allMax=1;} if(allMin>0)allMin=0; const pad=(allMax-allMin)*.08; allMax+=pad;
 2065 |     const svg=svgEl(W,H); const g=el("g",{}); svg.appendChild(g);
 2066 |     const yAt=v=>P.t+ ih-((v-allMin)/(allMax-allMin))*ih;
 2067 |     for(const t of niceTicks(allMin,allMax,5)){ const y=yAt(t); g.appendChild(el("line",{x1:P.l,y1:y,x2:P.l+iw,y2:y,stroke:c.grid,"stroke-width":1})); const tx=el("text",{x:P.l-6,y:y+3,"text-anchor":"end",style:"font-size:10px;fill:"+c.text}); tx.textContent=yFmt(t); g.appendChild(tx); }
 2068 |     const n=labels.length; const bw=iw/n*0.7; series.forEach((s,si)=>{ const col=c.series[si%c.series.length]; for(let i=0;i<s.data.length;i++){ const v=s.data[i]; if(v==null)continue; const x=P.l+(iw/n)*i+ (iw/n-bw)/2; const y=v>=0? yAt(v): yAt(0); const hgt=Math.abs(yAt(0)-yAt(v)); g.appendChild(el("rect",{x,y,width:bw,height:Math.max(hgt,0.5),fill:col,rx:1})); } });
 2069 |     labels.forEach((lb,i)=>{ const x=P.l+(iw/n)*i+ (iw/n)/2; const tx=el("text",{x,y:H-P.b+14,"text-anchor":"middle",style:"font-size:9px;fill:"+c.text}); tx.textContent=lb; g.appendChild(tx); });
 2070 |     if(title){ const t=el("text",{x:P.l,y:12,style:"font-size:11px;font-weight:700"}); t.textContent=title; svg.appendChild(t); }
```

## const AssessmentEngine — 1 hit(s)

### line 1937

```js
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
 1947 |       if(de!=null&&de<1)hp+=2; else if(de!=null&&de>3)hp+=0; else if(de!=null)hp+=1;
 1948 |       if(cr!=null&&cr>1.5)hp+=2; else if(cr!=null&&cr>=1)hp+=1; else if(cr!=null)hp+=0;
 1949 |       health= hp>=6?"Strong": hp>=4?"Moderate": hp>=2?"Weak":"Elevated risk"; }
 1950 |     parts.financialHealth={label:health};
 1951 |     // Tier3 valuation
 1952 |     let val;
 1953 |     if(ctx.valuation && ctx.valuation.mos!=null){ const m=ctx.valuation.mos; val= m>.1?"Potentially Undervalued": m>-.1?"Fairly Valued":"Potentially Overvalued"; }
 1954 |     else val="Unknown"; parts.valuation={label:val, mos:ctx.valuation&&ctx.valuation.mos};
 1955 |     // Tier4 risk
 1956 |     let risk;
 1957 |     if(ctx.risk && ctx.risk.volatility!=null){ const v=ctx.risk.volatility; risk= v>.5?"High": v>.3?"Elevated": v>.15?"Moderate":"Low"; }
 1958 |     else if(ctx.bondRisk!=null){ risk= ctx.bondRisk; } else risk="Unknown"; parts.risk={label:risk};
 1959 |     // Tier5 default
 1960 |     let defr;
 1961 |     if(ctx.defaultPD!=null){ defr= ctx.defaultPD>.2?"Elevated": ctx.defaultPD>.05?"Moderate":"Low"; } else if(ctx.altman && ctx.altman.zone){ defr= ctx.altman.zone.includes("Distress")?"Elevated":"Moderate"; } else defr="Unknown";
 1962 |     parts.default={label:defr};
 1963 |     // Tier6 historical analogues
 1964 |     let hist;
 1965 |     if(ctx.caseMatches && ctx.caseMatches.length){ const avg=ctx.caseStats?ctx.caseStats.mean1:null; const def=ctx.caseStats?ctx.caseStats.defaultPct:null;
 1966 |       hist= avg!=null?(avg>.15?"Positive": avg>0?"Mixed Positive":"Weak"):"Mixed"; if(def!=null&&def>.3) hist+=" / High-default"; }
 1967 |     else hist="None"; parts.historical={label:hist};
 1968 |     // Tier7 scenario robustness
 1969 |     let robustness=0; if(ctx.scenarios && ctx.scenarios.out){ const vals=ctx.scenarios.out.map(o=>o.value); const spread=Math.max(...vals)-Math.min(...vals); const base=ctx.scenarios.weighted||ctx.dcf.perShare; robustness= base>0? Math.max(0,Math.min(100,100- (spread/Math.abs(base))*50)):50; }
 1970 |     parts.robustness={score:Math.round(robustness)};
 1971 |     // combined recommendation language
 1972 |     let rec;
 1973 |     const downs=Object.entries(parts).filter(([k,v])=> v.label==="Elevated risk"||v.label==="Weak"||v.label==="High").length;
 1974 |     const ups=Object.entries(parts).filter(([k,v])=> v.label==="Potentially Undervalued"||v.label==="Strong"||v.label==="Low"||v.label==="Positive").length;
 1975 |     if(parts.valuation.label==="Unknown" && parts.financialHealth.label==="Unknown") rec="Requires More Data";
 1976 |     else if(parts.valuation.label==="Potentially Undervalued" && downs>=2) rec="Potentially Attractive but High Risk";
 1977 |     else if(parts.valuation.label==="Potentially Undervalued") rec="Potentially Attractive";
 1978 |     else if(parts.valuation.label==="Fairly Valued") rec="Fairly Valued";
 1979 |     else if(parts.valuation.label==="Potentially Overvalued" && downs>=1) rec="Potentially Overvalued / Speculative";
 1980 |     else if(parts.valuation.label==="Potentially Overvalued") rec="Potentially Overvalued";
 1981 |     else if(downs>=3) rec="Speculative";
 1982 |     else rec="Model Conflict — Investigate Further";
 1983 |     if(parts.robustness.score<40) rec+=" (Scenario-Sensitive)";
 1984 |     parts.recommendation={label:rec};
 1985 |     return {parts,recommendation:rec,robustness:parts.robustness.score};
 1986 |   }
 1987 |   return {overall};
 1988 | })();
 1989 | 
 1990 | /* Contradiction detection between models */
 1991 | const ContradictionEngine=(()=>{
 1992 |   function detect(methods){
 1993 |     // methods: {name, label:'attractive'|'fair'|'overvalued'|'unknown'|'weak'...}
 1994 |     const valid=methods.filter(m=>m.label!=="unknown"&&m.label!=="unavailable");
 1995 |     const set=new Set(valid.map(m=>m.label));
 1996 |     if(valid.length<2) return {conflict:false, note:"Too few models to compare."};
 1997 |     const attractive=valid.filter(m=>m.label==="attractive").length;
 1998 |     const over=valid.filter(m=>m.label==="overvalued").length;
 1999 |     if(attractive>0 && over>0) return {conflict:true, note:"The models do not agree — some indicate attractive value while others indicate overvaluation. The investment thesis depends heavily on which methods and assumptions are considered most reliable."};
 2000 |     return {conflict:false, note:`Model agreement is ${valid.length===attractive?"high":over>0?"moderate":"mixed"}.`};
 2001 |   }
```

## const PeerSimilarity — 1 hit(s)

### line 8937

```js
 8925 |     };
 8926 |     wire("sec_sel","change",renderMetrics);
 8927 |     wire("sec_auto","click",()=>{ const d=sectorFromResearch(); if(d){ $("#sec_sel").value=d; renderMetrics(); toast("Detected sector: "+d,"info"); } else toast("No sector in research profile.","warn"); });
 8928 |     if(current) renderMetrics();
 8929 |   }
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
 8966 |       currentInvestment:s.currentInvestment, stockData:s.stockData, bondData:s.bondData, projectData:s.projectData,
 8967 |       fm:s.fm, thesis:s.thesis, research:s.research, history:s.history,
 8968 |       results:s.results, assumptions:Model.assumptions(), auditTrail:s.auditTrail, snapshots:s.snapshots,
 8969 |       analyses:s.analyses, reviewQueue:s.reviewQueue, accountingQuality:s.accountingQuality,
 8970 |       signoff:s.signoff, analysisStatus:s.analysisStatus
 8971 |     }, function(k,v){ if(typeof v==="function")return undefined; if(k==="meta"&&v===App.meta)return undefined; return v; }, 2);
 8972 |   }
 8973 |   function importPackage(json){
 8974 |     try{
 8975 |       const d=JSON.parse(json);
 8976 |       if(!d||typeof d!=="object")return {ok:false,msg:"Invalid package."};
 8977 |       const s=App.state;
 8978 |       ["currentInvestment","stockData","bondData","projectData","fm","thesis","research","history","results","auditTrail","snapshots","analyses","reviewQueue","accountingQuality","signoff","analysisStatus"].forEach(k=>{ if(k in d)s[k]=d[k]; });
 8979 |       return {ok:true};
 8980 |     }catch(e){ return {ok:false,msg:e.message}; }
 8981 |   }
 8982 |   return {build,importPackage};
 8983 | })();
 8984 | 
 8985 | /* ============================================================
 8986 |    V5 WIRING — inject panels into views + nav
 8987 |    ============================================================ */
 8988 | function wireV5(){
 8989 |   // Populate thesis-view auxiliary panels when navigating to thesis
 8990 |   const origGo=AppInit.go;
 8991 |   AppInit.go=function(view){
 8992 |     origGo.call(this,view);
 8993 |     if(view==="thesis"){ try{ AnalysisLifecycle.render(); InvestmentHorizon.render(); SectorTemplates.render(); AnalystSignoff.render(); }catch(e){} }
 8994 |     if(view==="watchlist"){ try{ ResearchCalendar.render(); }catch(e){} }
 8995 |     if(view==="committee"){ try{ ReviewWorkflow.render(); }catch(e){} }
 8996 |     if(view==="compare"){ try{ optimizerRender(); }catch(e){} }
 8997 |     if(view==="accounting"){ try{ AccountingQuality.render(); }catch(e){} }
 8998 |   };
 8999 |   // Command palette additions
 9000 |   CommandPalette.commands.push(
 9001 |     {label:"Export Analysis Package",run:()=>{ download("analysis-package.json",ExportPackage.build()); toast("Analysis package exported.","good"); }},
```

## function betaAlphaAligned — 1 hit(s)

### line 5444

```js
 5432 |     for(const [d,a] of mapA){ const b=mapB.get(d); if(b) common.push({d,a,b}); }
 5433 |     common.sort((x,y)=>x.d-y.d);
 5434 |     // build returns from matched pairs
 5435 |     const retsA=[],retsB=[];
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
 5489 |     if(!merton) return `<div class="banner info">Run the Default Risk module to obtain Merton outputs.</div>`;
 5490 |     const status= diag&&diag.converged? `<span class="status-pill valid">CONVERGED</span>`: `<span class="status-pill invalid">NOT FULLY CONVERGED</span>`;
 5491 |     return `<div class="card"><div class="card-title">Merton Numerical Diagnostics ${status}</div>
 5492 |     <div class="grid g3">
 5493 |       <div class="metricline"><span class="l">Equity value (E)</span><span class="v">${fmt.money(merton.E)}</span></div>
 5494 |       <div class="metricline"><span class="l">Debt (D)</span><span class="v">${fmt.money(merton.D)}</span></div>
 5495 |       <div class="metricline"><span class="l">Risk-free rate</span><span class="v">${fmt.pct(merton.r)}</span></div>
 5496 |       <div class="metricline"><span class="l">Equity volatility</span><span class="v">${fmt.pct(merton.sigmaE,1)}</span></div>
 5497 |       <div class="metricline"><span class="l">Estimated asset value</span><span class="v">${fmt.money(merton.V)}</span></div>
 5498 |       <div class="metricline"><span class="l">Asset volatility</span><span class="v">${fmt.pct(merton.sigmaV,1)}</span></div>
 5499 |       <div class="metricline"><span class="l">d1</span><span class="v">${fmt.num(merton.d1,3)}</span></div>
 5500 |       <div class="metricline"><span class="l">d2 / distance to default</span><span class="v">${fmt.num(merton.d2,3)}</span></div>
 5501 |       <div class="metricline"><span class="l">PD (1-yr)</span><span class="v">${fmt.pct(merton.pd,2)}</span></div>
 5502 |     </div>
 5503 |     ${diag?`<div class="grid g3 mt">
 5504 |       <div class="metricline"><span class="l">Iterations</span><span class="v">${diag.iterations}</span></div>
 5505 |       <div class="metricline"><span class="l">Residual error</span><span class="v">${fmt.num(diag.residual,6)}</span></div>
 5506 |       <div class="metricline"><span class="l">Convergence</span><span class="v">${diag.converged?"YES":"NO"}</span></div>
 5507 |     </div>`:""}
 5508 |     ${diag&&!diag.converged?`<div class="banner bad">Merton solution could not be reliably established from the supplied assumptions. Treat the PD as unreliable.</div>`:""}
```

## function rollingSharpe — 1 hit(s)

### line 5461

```js
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
 5489 |     if(!merton) return `<div class="banner info">Run the Default Risk module to obtain Merton outputs.</div>`;
 5490 |     const status= diag&&diag.converged? `<span class="status-pill valid">CONVERGED</span>`: `<span class="status-pill invalid">NOT FULLY CONVERGED</span>`;
 5491 |     return `<div class="card"><div class="card-title">Merton Numerical Diagnostics ${status}</div>
 5492 |     <div class="grid g3">
 5493 |       <div class="metricline"><span class="l">Equity value (E)</span><span class="v">${fmt.money(merton.E)}</span></div>
 5494 |       <div class="metricline"><span class="l">Debt (D)</span><span class="v">${fmt.money(merton.D)}</span></div>
 5495 |       <div class="metricline"><span class="l">Risk-free rate</span><span class="v">${fmt.pct(merton.r)}</span></div>
 5496 |       <div class="metricline"><span class="l">Equity volatility</span><span class="v">${fmt.pct(merton.sigmaE,1)}</span></div>
 5497 |       <div class="metricline"><span class="l">Estimated asset value</span><span class="v">${fmt.money(merton.V)}</span></div>
 5498 |       <div class="metricline"><span class="l">Asset volatility</span><span class="v">${fmt.pct(merton.sigmaV,1)}</span></div>
 5499 |       <div class="metricline"><span class="l">d1</span><span class="v">${fmt.num(merton.d1,3)}</span></div>
 5500 |       <div class="metricline"><span class="l">d2 / distance to default</span><span class="v">${fmt.num(merton.d2,3)}</span></div>
 5501 |       <div class="metricline"><span class="l">PD (1-yr)</span><span class="v">${fmt.pct(merton.pd,2)}</span></div>
 5502 |     </div>
 5503 |     ${diag?`<div class="grid g3 mt">
 5504 |       <div class="metricline"><span class="l">Iterations</span><span class="v">${diag.iterations}</span></div>
 5505 |       <div class="metricline"><span class="l">Residual error</span><span class="v">${fmt.num(diag.residual,6)}</span></div>
 5506 |       <div class="metricline"><span class="l">Convergence</span><span class="v">${diag.converged?"YES":"NO"}</span></div>
 5507 |     </div>`:""}
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
```

## const BacktestEngine — 1 hit(s)

### line 8550

```js
 8538 |       ${kpi("Bull range",fmtR(u.bull),"")}
 8539 |       ${kpi("Central estimate",fmt.money(u.central))}
 8540 |       ${kpi("Valuation confidence",u.conf+"/100","dispersion "+fmt.pct(u.dispersion,1))}
 8541 |     </div>
 8542 |     <div class="banner info">The true value is uncertain and likely lies within the base range. Ranges reflect assumption sensitivity; do not treat any single point as precise.</div></div>`;
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
 8579 |     const days=(series[series.length-1].date-series[0].date)/86400000;
 8580 |     const years=Math.max(days/365.25,1/252);
 8581 |     const cagr= Math.pow(stratVal/cap,1/years)-1;
 8582 |     const returns=eqCurve.slice(1).map((v,i)=>(v/eqCurve[i])-1).filter(x=>isFinite(x));
 8583 |     const vol=CalcEngine.annualizeVol(CalcEngine.stdev(returns),252);
 8584 |     const mdd=CalcEngine.maxDrawdown(eqCurve).mdd;
 8585 |     const sharpe=CalcEngine.sharpe(returns,0.02/252);
 8586 |     const sortino=CalcEngine.sortino(returns,0.02/252);
 8587 |     const calmar= mdd<0&&cagr!=null? cagr/Math.abs(mdd):null;
 8588 |     let activeRet=null,beta=null,alpha=null,te=null,ir=null;
 8589 |     if(benchmarkPrices&&benchmarkPrices.length>=series.length){
 8590 |       const benchRets=CalcEngine.dailyReturns(benchmarkPrices.slice(0,series.length).map(p=>p.close));
 8591 |       const stratRets=returns.slice(0,benchRets.length);
 8592 |       const benchRet=Math.pow(benchmarkPrices[Math.min(benchmarkPrices.length-1,series.length-1)].close/benchmarkPrices[0].close,1/years)-1;
 8593 |       activeRet=totalReturn-benchRet;
 8594 |       beta=CalcEngine.beta(stratRets,benchRets);
 8595 |       alpha=CalcEngine.alpha(stratRets,benchRets,0.02/252);
 8596 |       const diffs=stratRets.map((r,k)=>r-benchRets[k]);
 8597 |       te=CalcEngine.stdev(diffs,0)*Math.sqrt(252);
 8598 |       ir= te>0? (CalcEngine.mean(stratRets)-CalcEngine.mean(benchRets))*Math.sqrt(252)/te : null;
 8599 |     }
 8600 |     const hitRate= returns.length? returns.filter(r=>r>0).length/returns.length:null;
 8601 |     const grossWin=returns.filter(r=>r>0).reduce((a,b)=>a+b,0);
 8602 |     const grossLoss=Math.abs(returns.filter(r=>r<0).reduce((a,b)=>a+b,0));
 8603 |     const profitFactor= grossLoss>0? grossWin/grossLoss:null;
 8604 |     return {available:true,totalReturn,cagr,vol,mdd,sharpe,sortino,calmar,activeRet,beta,alpha,te,ir,hitRate,profitFactor,trades:tradeCount,costs,period:[series[0].date,series[series.length-1].date],n:series.length};
 8605 |   }
 8606 |   function backtestSignal(prices,i){
 8607 |     if(i<50)return 0;
 8608 |     const closes=prices.map(p=>p.close);
 8609 |     const s50=CalcEngine.sma(closes,50)[i];
 8610 |     const s200= i>=200? CalcEngine.sma(closes,200)[i]:s50;
 8611 |     return s50>s200?1: (s50<s200)?-1:0;
 8612 |   }
 8613 |   function html(r){
 8614 |     if(!r.available)return `<div class="banner warn">${esc(r.reason)}</div>`;
```

## const PortfolioOptimizers — 1 hit(s)

### line 9119

```js
 9107 |     const tr=$("#rcTriggers"); if(tr)tr.innerHTML = triggers.length? `<div class="card"><div class="card-title">Generated Review Items</div><div class="gridlist">${triggers.map(t=>`<div class="warnchip warn">${pill(t.sev.toUpperCase(),"warn")}<span>${esc(t.issue)}</span></div>`).join("")}</div></div>` : "";
 9108 |     // also push to review queue (dedupe)
 9109 |     triggers.forEach(t=>reviewQueueAdd(t.sev,t.issue,t.module,t.why,t.action,t.view));
 9110 |     App.state.researchCalendar=cal;
 9111 |   }
 9112 |   function researchCalendarRefresh(){ refresh(); }
 9113 |   return {render,refresh,TYPES};
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
 9170 |     const vols=items.map(b=>b.volatility!=null?b.volatility:.2);
 9171 |     // risk parity: weight proportional to 1/vol (inverse volatility) — common approximation
 9172 |     const inv=vols.map(v=>1/v); const sum=inv.reduce((a,b)=>a+b,0)||1;
 9173 |     return inv.map((v,i)=>({name:items[i].name,weight:v/sum}));
 9174 |   }
 9175 |   function htmlOptimizer(method,weights,items){
 9176 |     if(!weights)return `<div class="banner warn">Optimization requires at least 2 assets with return & volatility data.</div>`;
 9177 |     const totalW=weights.reduce((a,b)=>a+b.weight,0);
 9178 |     return `<div class="card"><div class="card-title">Optimized Portfolio — ${method}</div>
 9179 |     <div class="tablewrap"><table class="data"><thead><tr><th>Asset</th><th class="num">Weight</th></tr></thead><tbody>
 9180 |     ${weights.map(w=>`<tr><td>${esc(w.name)}</td><td class="num">${fmt.pct(w.weight)}</td></tr>`).join("")}
 9181 |     </tbody></table></div>
 9182 |     <div class="banner info">This is an <b>analytical optimization method</b>, not a personal financial recommendation. It depends on the return, volatility and correlation inputs you provide. Limitation: covariance estimates are sensitive to the sample period and may be unstable.</div></div>`;
 9183 |   }
```

## function factorExposure — 2 hit(s)

### line 6973

```js
 6961 |   const entries=(App.state.forecastTrack&&App.state.forecastTrack.entries)||[];
 6962 |   if(!entries.length)return null;
 6963 |   const errors=entries.filter(r=>r.actual!==0).map(r=>(r.forecast-r.actual)/Math.abs(r.actual));
 6964 |   return {n:entries.length, mae:CalcEngine.mean(errors.map(e=>Math.abs(e))), mpe:CalcEngine.mean(errors), bias:CalcEngine.mean(errors)};
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
 7001 |   <p class="small dim">Factor exposures are estimated from portfolio characteristics (volatility, return, valuation). They are <b>model-derived estimates</b>, not based on actual factor data.</p>
 7002 |   <div class="tablewrap"><table class="data"><thead><tr><th>Factor</th><th class="num">Exposure</th><th>Risk Level</th></tr></thead><tbody>
 7003 |   ${expos.map(e=>`<tr><td>${e.factor}</td><td class="num">${e.exposure>=0?"+":""}${fmt.num(e.exposure,2)}</td><td>${pill(e.risk,e.risk==="High"?"bad":e.risk==="Medium"?"warn":"good")}</td></tr>`).join("")}</tbody></table></div>
 7004 |   <div class="banner info">These tilts are approximate and illustrative. They indicate the portfolio's sensitivity to common risk factors but are not guaranteed.</div></div>`;
 7005 |   return h;
 7006 | }
 7007 | function bondFactorHTML(items){
 7008 |   const bonds=items.filter(b=>(b.type||"").toLowerCase().includes("bond")||(b.type||"").toLowerCase().includes("fixed"));
 7009 |   if(!bonds.length)return "";
 7010 |   const rows=bonds.map(b=>{ const dur=b.duration!=null?b.duration:5; const spread=b.spread!=null?b.spread:.02;
 7011 |     return {name:b.name,duration:dur,credit:spread>0.04?"High":spread>0.02?"Medium":"Low",spread}; });
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
```

### line 12852

```js
12840 |       if(p&&finite(p.growth))covered++;
12841 |       if(p&&finite(p.margin))covered++;
12842 |       if(p&&finite(p.roe))covered++;
12843 |       if(p&&finite(p.multiple))covered++;
12844 |     }
12845 |     const coverage=covered/(5*peers.length);return {score:Math.round(coverage*100),coverage,n:peers.length};
12846 |   }
12847 |   function moatScore(values){
12848 |     if(!Array.isArray(values)||!values.length||values.some(v=>!finite(v)||v<0||v>100))return null;
12849 |     return Math.round(values.reduce((s,v)=>s+v,0)/values.length);
12850 |   }
12851 | 
12852 |   function factorExposure(items){
12853 |     const norm=normalizeItems(items);if(!norm)return null;
12854 |     const exposures={Market:1,Size:0,Value:0,Growth:0,Momentum:0,Quality:0,LowVol:0};
12855 |     for(const b of norm.items){
12856 |       const w=b.normalizedWeight,t=String(b.type||b.assetClass||'').toLowerCase();
12857 |       if(t.includes('stock')||t.includes('equity')){
12858 |         const vol=finite(b.volatility)?b.volatility:.25;
12859 |         const ret=finite(b.expectedReturn)?b.expectedReturn:.1;
12860 |         const mos=finite(b.marginOfSafety)?b.marginOfSafety:0;
12861 |         exposures.Size+=w*.5;
12862 |         exposures.Value+=w*(mos>.1?1:mos>-.1?0:-1);
12863 |         exposures.Growth+=w*(ret>.15?1:ret>.08?0:-1);
12864 |         exposures.Momentum+=w*(ret>.12?1:-.3);
12865 |         exposures.Quality+=w*(mos>-.05?.5:-.5);
12866 |         exposures.LowVol+=w*(vol<.2?1:vol>.4?-1:0);
12867 |       }
12868 |     }
12869 |     return Object.entries(exposures).map(([factor,exposure])=>({factor,exposure:Math.round(exposure*100)/100,risk:Math.abs(exposure)>.6?'High':Math.abs(exposure)>.3?'Medium':'Low'}));
12870 |   }
12871 |   function performanceAttribution(items,benchmarkRet){
12872 |     const norm=normalizeItems(items);if(!norm||!finite(benchmarkRet))return null;
12873 |     if(norm.items.some(x=>!finite(x.expectedReturn)))return null;
12874 |     let totalPortRet=0,allocationProxy=0;const rows=[];
12875 |     for(const b of norm.items){
12876 |       const w=b.normalizedWeight,r=b.expectedReturn,active=r-benchmarkRet;
12877 |       const contribution=w*r,alloc=w*active;
12878 |       totalPortRet+=contribution;allocationProxy+=alloc;
12879 |       rows.push({name:b.name,weight:w,return:r,contribution,allocation:alloc,selection:null});
12880 |     }
12881 |     return {rows,allocEffect:allocationProxy,selectionEffect:null,totalPortRet,benchmark:benchmarkRet,activeReturn:totalPortRet-benchmarkRet,methodology:'single-benchmark allocation proxy; selection unavailable without benchmark constituent weights/returns'};
12882 |   }
12883 | 
12884 |   function validateCorrelationMatrix(corr,n){
12885 |     if(!Array.isArray(corr)||corr.length!==n)return false;
12886 |     for(let i=0;i<n;i++){
12887 |       if(!Array.isArray(corr[i])||corr[i].length!==n)return false;
12888 |       for(let j=0;j<n;j++)if(!finite(corr[i][j])||corr[i][j]<-1||corr[i][j]>1||Math.abs(corr[i][j]-corr[j]?.[i])>1e-8)return false;
12889 |       if(Math.abs(corr[i][i]-1)>1e-8)return false;
12890 |     }
12891 |     return true;
12892 |   }
12893 |   function riskContribution(port,corrMatrix){
12894 |     if(!port||!Array.isArray(port.items)||port.items.length<2)return null;
12895 |     const norm=normalizeItems(port.items);if(!norm)return null;
12896 |     const items=norm.items,n=items.length;
12897 |     if(items.some(x=>!finite(x.volatility)||x.volatility<0))return null;
12898 |     const corr=corrMatrix||Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:.4));
12899 |     if(!validateCorrelationMatrix(corr,n))return null;
12900 |     const weights=items.map(x=>x.normalizedWeight),vols=items.map(x=>x.volatility);
12901 |     let varP=0;for(let i=0;i<n;i++)for(let j=0;j<n;j++)varP+=weights[i]*weights[j]*vols[i]*vols[j]*corr[i][j];
12902 |     if(varP<0&&varP>-EPS)varP=0;if(!finite(varP)||varP<0)return null;
12903 |     const volP=Math.sqrt(varP);
12904 |     const rows=items.map((b,i)=>{
12905 |       let covarianceWithPortfolio=0;for(let j=0;j<n;j++)covarianceWithPortfolio+=weights[j]*vols[i]*vols[j]*corr[i][j];
12906 |       const mcr=volP>EPS?covarianceWithPortfolio/volP:null;
12907 |       const component=mcr==null?null:weights[i]*mcr;
12908 |       const riskShare=varP>EPS?weights[i]*covarianceWithPortfolio/varP:null;
12909 |       return {name:b.name,weight:weights[i],volatility:vols[i],mcr,component,riskShare};
12910 |     });
12911 |     return {rows,volP,varP};
12912 |   }
12913 | 
12914 |   function covarianceFromItems(items,corrMatrix){
12915 |     if(!Array.isArray(items)||!items.length||items.some(x=>!x||!finite(x.volatility)||x.volatility<0))return null;
12916 |     const n=items.length;
```

## function performanceAttribution — 2 hit(s)

### line 7020

```js
 7008 |   const bonds=items.filter(b=>(b.type||"").toLowerCase().includes("bond")||(b.type||"").toLowerCase().includes("fixed"));
 7009 |   if(!bonds.length)return "";
 7010 |   const rows=bonds.map(b=>{ const dur=b.duration!=null?b.duration:5; const spread=b.spread!=null?b.spread:.02;
 7011 |     return {name:b.name,duration:dur,credit:spread>0.04?"High":spread>0.02?"Medium":"Low",spread}; });
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
 7048 |   if(!assetReturns||!benchReturns||assetReturns.length<3||assetReturns.length!==benchReturns.length)return null;
 7049 |   const diffs=assetReturns.map((r,i)=>r-benchReturns[i]);
 7050 |   const te=CalcEngine.stdev(diffs,0);
 7051 |   const annualized= te*Math.sqrt(252);
 7052 |   return {periodic:te,annualized};
 7053 | }
 7054 | function trackingErrorHTML(te){
 7055 |   if(!te)return "";
 7056 |   return `<div class="card mt"><div class="card-title">Tracking Error</div>
 7057 |   <div class="grid g2">${kpi("Tracking error (periodic)",fmt.pct(te.periodic))}${kpi("Tracking error (annualized)",fmt.pct(te.annualized))}</div>
 7058 |   <div class="banner info">Tracking error measures how much the portfolio return deviates from the benchmark. Lower = tracks closer. Annualized = periodic × √252.</div></div>`;
 7059 | }
 7060 | 
 7061 | /* ---- Portfolio upgrade render: add factor, attribution, tracking to portfolio output ---- */
 7062 | function portfolioAdvancedRender(){
 7063 |   const port=App.state.portfolio&&App.state.portfolio.result; if(!port)return;
 7064 |   const items=port.items;
 7065 |   const expos=factorExposure(items);
 7066 |   const attr=performanceAttribution(items, 0.08);
 7067 |   const target=$("#pfAdvanced"); if(!target)return;
 7068 |   target.innerHTML=factorHTML(expos)+bondFactorHTML(items)+attributionHTML(attr);
 7069 |   // tracking error if history available
 7070 |   const hist=App.state.history; const bench=App.state.history&&App.state.history.benchmark;
 7071 |   if(hist&&hist.prices&&hist.prices.length>3&&bench&&bench.length>3){
 7072 |     const a=CalcEngine.dailyReturns(hist.prices.map(p=>p.close));
 7073 |     const b=CalcEngine.dailyReturns(bench.map(p=>p.close));
 7074 |     const n=Math.min(a.length,b.length);
 7075 |     const te=trackingError(a.slice(-n),b.slice(-n));
 7076 |     target.insertAdjacentHTML("beforeend", trackingErrorHTML(te));
 7077 |   }
 7078 | }
 7079 | 
 7080 | /* ---- Wiring: add advanced analytics to portfolio build ---- */
 7081 | function wirePortfolioAdvanced(){
 7082 |   const orig=renderPortfolio;
 7083 |   renderPortfolio=function(port){
 7084 |     orig.call(this,port);
```

### line 12871

```js
12859 |         const ret=finite(b.expectedReturn)?b.expectedReturn:.1;
12860 |         const mos=finite(b.marginOfSafety)?b.marginOfSafety:0;
12861 |         exposures.Size+=w*.5;
12862 |         exposures.Value+=w*(mos>.1?1:mos>-.1?0:-1);
12863 |         exposures.Growth+=w*(ret>.15?1:ret>.08?0:-1);
12864 |         exposures.Momentum+=w*(ret>.12?1:-.3);
12865 |         exposures.Quality+=w*(mos>-.05?.5:-.5);
12866 |         exposures.LowVol+=w*(vol<.2?1:vol>.4?-1:0);
12867 |       }
12868 |     }
12869 |     return Object.entries(exposures).map(([factor,exposure])=>({factor,exposure:Math.round(exposure*100)/100,risk:Math.abs(exposure)>.6?'High':Math.abs(exposure)>.3?'Medium':'Low'}));
12870 |   }
12871 |   function performanceAttribution(items,benchmarkRet){
12872 |     const norm=normalizeItems(items);if(!norm||!finite(benchmarkRet))return null;
12873 |     if(norm.items.some(x=>!finite(x.expectedReturn)))return null;
12874 |     let totalPortRet=0,allocationProxy=0;const rows=[];
12875 |     for(const b of norm.items){
12876 |       const w=b.normalizedWeight,r=b.expectedReturn,active=r-benchmarkRet;
12877 |       const contribution=w*r,alloc=w*active;
12878 |       totalPortRet+=contribution;allocationProxy+=alloc;
12879 |       rows.push({name:b.name,weight:w,return:r,contribution,allocation:alloc,selection:null});
12880 |     }
12881 |     return {rows,allocEffect:allocationProxy,selectionEffect:null,totalPortRet,benchmark:benchmarkRet,activeReturn:totalPortRet-benchmarkRet,methodology:'single-benchmark allocation proxy; selection unavailable without benchmark constituent weights/returns'};
12882 |   }
12883 | 
12884 |   function validateCorrelationMatrix(corr,n){
12885 |     if(!Array.isArray(corr)||corr.length!==n)return false;
12886 |     for(let i=0;i<n;i++){
12887 |       if(!Array.isArray(corr[i])||corr[i].length!==n)return false;
12888 |       for(let j=0;j<n;j++)if(!finite(corr[i][j])||corr[i][j]<-1||corr[i][j]>1||Math.abs(corr[i][j]-corr[j]?.[i])>1e-8)return false;
12889 |       if(Math.abs(corr[i][i]-1)>1e-8)return false;
12890 |     }
12891 |     return true;
12892 |   }
12893 |   function riskContribution(port,corrMatrix){
12894 |     if(!port||!Array.isArray(port.items)||port.items.length<2)return null;
12895 |     const norm=normalizeItems(port.items);if(!norm)return null;
12896 |     const items=norm.items,n=items.length;
12897 |     if(items.some(x=>!finite(x.volatility)||x.volatility<0))return null;
12898 |     const corr=corrMatrix||Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:.4));
12899 |     if(!validateCorrelationMatrix(corr,n))return null;
12900 |     const weights=items.map(x=>x.normalizedWeight),vols=items.map(x=>x.volatility);
12901 |     let varP=0;for(let i=0;i<n;i++)for(let j=0;j<n;j++)varP+=weights[i]*weights[j]*vols[i]*vols[j]*corr[i][j];
12902 |     if(varP<0&&varP>-EPS)varP=0;if(!finite(varP)||varP<0)return null;
12903 |     const volP=Math.sqrt(varP);
12904 |     const rows=items.map((b,i)=>{
12905 |       let covarianceWithPortfolio=0;for(let j=0;j<n;j++)covarianceWithPortfolio+=weights[j]*vols[i]*vols[j]*corr[i][j];
12906 |       const mcr=volP>EPS?covarianceWithPortfolio/volP:null;
12907 |       const component=mcr==null?null:weights[i]*mcr;
12908 |       const riskShare=varP>EPS?weights[i]*covarianceWithPortfolio/varP:null;
12909 |       return {name:b.name,weight:weights[i],volatility:vols[i],mcr,component,riskShare};
12910 |     });
12911 |     return {rows,volP,varP};
12912 |   }
12913 | 
12914 |   function covarianceFromItems(items,corrMatrix){
12915 |     if(!Array.isArray(items)||!items.length||items.some(x=>!x||!finite(x.volatility)||x.volatility<0))return null;
12916 |     const n=items.length;
12917 |     const corr=corrMatrix||Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:.4));
12918 |     if(!validateCorrelationMatrix(corr,n))return null;
12919 |     return corr.map((row,i)=>row.map((rho,j)=>rho*items[i].volatility*items[j].volatility));
12920 |   }
12921 |   function equalWeight(items){
12922 |     if(!Array.isArray(items)||!items.length)return null;return Array(items.length).fill(1/items.length);
12923 |   }
12924 |   function minimumVariance(items,corrMatrix){
12925 |     if(!Array.isArray(items)||items.length<2)return null;
12926 |     const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;
12927 |     const invVol=items.map(x=>x.volatility>EPS?1/x.volatility:1/EPS);const s=invVol.reduce((a,b)=>a+b,0);
12928 |     let w=invVol.map(v=>v/s);
12929 |     const step=.08;
12930 |     for(let it=0;it<2500;it++){
12931 |       const grad=w.map((_,i)=>2*cov[i].reduce((acc,c,j)=>acc+c*w[j],0));
12932 |       let next=w.map((x,i)=>Math.max(0,x-step*grad[i]));const z=next.reduce((a,b)=>a+b,0);
12933 |       if(z<=EPS)return null;next=next.map(x=>x/z);
12934 |       const diff=next.reduce((m,x,i)=>Math.max(m,Math.abs(x-w[i])),0);w=next;if(diff<1e-12)break;
12935 |     }
```

## const RiskContribution — 1 hit(s)

### line 8476

```js
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
 8517 |       const lo=ValuationEngine.dcf({...base,growth:g*.9,ebitdaMargin:m*.9,wacc:w*1.06,terminalGrowth:tg*.85}).perShare;
 8518 |       const hi=ValuationEngine.dcf({...base,growth:g*1.1,ebitdaMargin:m*1.1,wacc:w*.94,terminalGrowth:tg*1.15}).perShare;
 8519 |       const mid=ValuationEngine.dcf({...base,growth:g,ebitdaMargin:m,wacc:w,terminalGrowth:tg}).perShare;
 8520 |       return {lo,mid,hi};
 8521 |     }
 8522 |     const bear=dcfRange(a.revenueGrowth*.55,a.ebitdaMargin*.8,a.wacc*1.15,a.terminalGrowth*.6);
 8523 |     const baseR=dcfRange(a.revenueGrowth,a.ebitdaMargin,a.wacc,a.terminalGrowth);
 8524 |     const bull=dcfRange(a.revenueGrowth*1.5,a.ebitdaMargin*1.2,a.wacc*.85,a.terminalGrowth*1.4);
 8525 |     const central=baseR.mid;
 8526 |     const disp=Number.isFinite(central)&&Math.abs(central)>1e-12?(bull.hi-bear.lo)/Math.abs(central):null;
 8527 |     const suff=DataSufficiency.compute().overall;
 8528 |     const conf= disp==null?0:Math.max(0,Math.min(100,Math.round(80 - disp*20 + (suff-50)*0.3)));
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
 8540 |       ${kpi("Valuation confidence",u.conf+"/100","dispersion "+fmt.pct(u.dispersion,1))}
```

## function segmentForecastRender — 1 hit(s)

### line 7308

```js
 7296 |   if(dcfA!=null&&dcfB!=null){ const impact=dcfB/dcfA-1; h+=`<div class="grid g3 mt">${kpi("DCF value (snapshot A)",fmt.money(dcfA))}${kpi("DCF value (snapshot B)",fmt.money(dcfB))}${kpi("Impact",fmt.pct(impact),(impact>=0?'pos':'neg'))}</div>`; }
 7297 |   h+=`<div class="banner info">The model changed because the assumptions above were revised between snapshots. Each change is traceable in the audit trail. ${changes.map(c=>`<br>• ${esc(c.label)}: ${fmt.num(c.old,3)} → ${fmt.num(c.new,3)}`).join("")}</div></div>`;
 7298 |   const el=$("#changeOut"); if(el)el.innerHTML=h;
 7299 | }
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
 7336 |     seg.years=Number($("#seg_years").value)||n; const ny=seg.years;
 7337 |     const segs=seg.segments.map((s,i)=>{
 7338 |       const name=$("#seg_"+i+"_name")?.value||s.name;
 7339 |       const share=Number($("#seg_"+i+"_share")?.value)||0;
 7340 |       const growth=[],margin=[];
 7341 |       for(let y=0;y<ny;y++){ growth.push((Number($("#seg_"+i+"_g_"+y)?.value)||0)/100); margin.push((Number($("#seg_"+i+"_m_"+y)?.value)||0)/100); }
 7342 |       return {name,share,growth,margin};
 7343 |     });
 7344 |     seg.segments=segs;
 7345 |     // compute per-segment revenue path
 7346 |     const segCalc=WorkstationCalculationCore.segmentForecast(total,segs,ny);
 7347 |     if(!segCalc){ $("#segOut").innerHTML=`<div class="banner warn">Segment forecast requires finite non-negative revenue/shares and finite growth/margin assumptions for every year.</div>`; return; }
 7348 |     const out=segCalc.segments,totalRevs=segCalc.totalRevs,totalEbitda=segCalc.totalEbitda;
 7349 |     App.state.segmentForecast={segments:out,totalRevs,totalEbitda,startYear:seg.startYear,shareTotal:segCalc.shareTotal,shareReconciles:segCalc.shareReconciles};
 7350 |     // render
 7351 |     let h=`<div class="card"><div class="card-title">Segment Forecast</div>
 7352 |     <div class="tablewrap"><table class="data"><thead><tr><th>Segment</th>${yrHeaders}<th class="num">Total</th></tr></thead><tbody>`;
 7353 |     out.forEach(s=>{ const tot=s.revs.reduce((a,b)=>a+b,0); h+=`<tr><td>${esc(s.name)}</td>${s.revs.map(v=>`<td class="num">${fmt.money(v)}</td>`).join("")}<td class="num">${fmt.money(tot)}</td></tr>`; });
 7354 |     h+=`</tbody></table></div>
 7355 |     <div class="grid g3 mt">${kpi("Total revenue (Y1)",fmt.money(totalRevs[0]))}${kpi("Total EBITDA (Y1)",fmt.money(totalEbitda[0]))}${kpi("Blended margin (Y1)",totalRevs[0]?fmt.pct(totalEbitda[0]/totalRevs[0]):"—")}</div>
 7356 |     <div id="segChart" class="mt"></div></div>`;
 7357 |     $("#segOut").innerHTML=h;
 7358 |     const cb=h("div",{id:"segChartBox",class:"chartbox"}); cb.appendChild(ChartManager.lineChart({series:out.map(s=>({data:s.revs,label:s.name})),labels:out[0].revs.map((_,i)=>(seg.startYear+i)+"E"),title:"Segment Revenue Forecast",yFmt:fmt.money})); $("#segOut").appendChild(cb);
 7359 |     StorageManager.save();
 7360 |   });
 7361 | }
 7362 | 
 7363 | /* ---- Sum-of-the-Parts valuation ---- */
 7364 | function sotpRender(){
 7365 |   const sotp=App.state.sotp||(App.state.sotp={parts:[],shares:null});
 7366 |   const sd=App.state.stockData;
 7367 |   if(!sotp.parts.length) sotp.parts=[{name:"Core Business",value:sd.marketCap||0,multiple:10,metric:sd.netIncome||0},{name:"Cash / Investments",value:sd.cash||0,multiple:1,metric:sd.cash||0}];
 7368 |   const rows=sotp.parts.map((p,i)=>`<tr>
 7369 |     <td><input type="text" value="${esc(p.name)}" id="sotp_${i}_name" style="width:140px"></td>
 7370 |     <td><input type="text" value="${p.value}" id="sotp_${i}_value" style="width:90px"></td>
 7371 |     <td><input type="text" value="${p.multiple}" id="sotp_${i}_mult" style="width:60px"></td>
 7372 |     <td><input type="text" value="${p.metric}" id="sotp_${i}_metric" style="width:90px"></td>
```

## function sotpRender — 1 hit(s)

### line 7364

```js
 7352 |     <div class="tablewrap"><table class="data"><thead><tr><th>Segment</th>${yrHeaders}<th class="num">Total</th></tr></thead><tbody>`;
 7353 |     out.forEach(s=>{ const tot=s.revs.reduce((a,b)=>a+b,0); h+=`<tr><td>${esc(s.name)}</td>${s.revs.map(v=>`<td class="num">${fmt.money(v)}</td>`).join("")}<td class="num">${fmt.money(tot)}</td></tr>`; });
 7354 |     h+=`</tbody></table></div>
 7355 |     <div class="grid g3 mt">${kpi("Total revenue (Y1)",fmt.money(totalRevs[0]))}${kpi("Total EBITDA (Y1)",fmt.money(totalEbitda[0]))}${kpi("Blended margin (Y1)",totalRevs[0]?fmt.pct(totalEbitda[0]/totalRevs[0]):"—")}</div>
 7356 |     <div id="segChart" class="mt"></div></div>`;
 7357 |     $("#segOut").innerHTML=h;
 7358 |     const cb=h("div",{id:"segChartBox",class:"chartbox"}); cb.appendChild(ChartManager.lineChart({series:out.map(s=>({data:s.revs,label:s.name})),labels:out[0].revs.map((_,i)=>(seg.startYear+i)+"E"),title:"Segment Revenue Forecast",yFmt:fmt.money})); $("#segOut").appendChild(cb);
 7359 |     StorageManager.save();
 7360 |   });
 7361 | }
 7362 | 
 7363 | /* ---- Sum-of-the-Parts valuation ---- */
 7364 | function sotpRender(){
 7365 |   const sotp=App.state.sotp||(App.state.sotp={parts:[],shares:null});
 7366 |   const sd=App.state.stockData;
 7367 |   if(!sotp.parts.length) sotp.parts=[{name:"Core Business",value:sd.marketCap||0,multiple:10,metric:sd.netIncome||0},{name:"Cash / Investments",value:sd.cash||0,multiple:1,metric:sd.cash||0}];
 7368 |   const rows=sotp.parts.map((p,i)=>`<tr>
 7369 |     <td><input type="text" value="${esc(p.name)}" id="sotp_${i}_name" style="width:140px"></td>
 7370 |     <td><input type="text" value="${p.value}" id="sotp_${i}_value" style="width:90px"></td>
 7371 |     <td><input type="text" value="${p.multiple}" id="sotp_${i}_mult" style="width:60px"></td>
 7372 |     <td><input type="text" value="${p.metric}" id="sotp_${i}_metric" style="width:90px"></td>
 7373 |     <td><button class="btn btn-sm btn-danger" data-sotp="${i}">×</button></td></tr>`).join("");
 7374 |   $("#sotpForm").innerHTML=`<div class="card"><div class="card-title">Sum-of-the-Parts Valuation</div>
 7375 |   <p class="small dim">Value each business part separately (e.g. via its own multiple × metric, or an absolute value), then sum and divide by shares. Useful for conglomerates.</p>
 7376 |   <div class="tablewrap"><table class="data"><thead><tr><th>Part</th><th class="num">Value / Metric</th><th class="num">Multiple</th><th class="num">Metric</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
 7377 |   <div class="row mt"><span class="small">Shares outstanding: <input type="text" id="sotp_shares" value="${sotp.shares||sd.shares||1}" style="width:90px"></span>
 7378 |   <button class="btn btn-sm" id="sotp_add">+ Part</button>
 7379 |   <button class="btn btn-primary" id="sotp_run">Compute SOTP</button></div>
 7380 |   <div id="sotpOut" class="mt"></div></div>`;
 7381 |   wire("sotp_add","click",()=>{ sotp.parts.push({name:"New Part",value:0,multiple:1,metric:0}); sotpRender(); });
 7382 |   $$("#sotpForm [data-sotp]").forEach(b=>b.addEventListener("click",()=>{ sotp.parts.splice(Number(b.dataset.sotp),1); sotpRender(); }));
 7383 |   wire("sotp_run","click",()=>{
 7384 |     const sharesRaw=$("#sotp_shares").value; const shares=String(sharesRaw).trim()===""?NaN:Number(sharesRaw);
 7385 |     const rawParts=sotp.parts.map((p,i)=>{ const raw=$("#sotp_"+i+"_value")?.value; const value=raw==null||String(raw).trim()===""?null:Number(raw); const mult=Number($("#sotp_"+i+"_mult")?.value); const metric=Number($("#sotp_"+i+"_metric")?.value); return {name:$("#sotp_"+i+"_name")?.value||p.name,value:Number.isFinite(value)?value:null,multiple:mult,metric}; });
 7386 |     const netDebt=Number.isFinite(sd.netDebt)?sd.netDebt:((Number.isFinite(sd.debt)?sd.debt:0)-(Number.isFinite(sd.cash)?sd.cash:0));
 7387 |     const sotpCalc=WorkstationCalculationCore.sumOfParts(rawParts,netDebt,shares);
 7388 |     if(!sotpCalc){ $("#sotpOut").innerHTML=`<div class="banner warn">SOTP requires positive diluted shares and a finite explicit value or finite multiple × metric for every part.</div>`; return; }
 7389 |     const parts=sotpCalc.parts,totalEV=sotpCalc.totalEV,equityValue=sotpCalc.equityValue,perShare=sotpCalc.perShare;
 7390 |     sotp.parts=parts; sotp.shares=shares;
 7391 |     App.state.sotpResult={parts,totalEV,equityValue,perShare,shares,netDebt};
 7392 |     let h=`<div class="card"><div class="card-title">Sum-of-the-Parts Result</div>
 7393 |     <div class="tablewrap"><table class="data"><thead><tr><th>Part</th><th class="num">Value</th></tr></thead><tbody>${parts.map(p=>`<tr><td>${esc(p.name)}</td><td class="num">${fmt.money(p.value)}</td></tr>`).join("")}<tr><td><b>Total EV</b></td><td class="num"><b>${fmt.money(totalEV)}</b></td></tr><tr><td>Net debt</td><td class="num">${fmt.money(netDebt)}</td></tr><tr><td><b>Equity value</b></td><td class="num"><b>${fmt.money(equityValue)}</b></td></tr><tr><td><b>Per share</b></td><td class="num"><b>${fmt.money(perShare)}</b></td></tr></tbody></table></div>
 7394 |     ${sd.price?`<div class="metricline"><span class="l">vs current price</span><span class="v">${fmt.money(sd.price)} → ${perShare?fmt.pct(perShare/sd.price-1):"—"}</span></div>`:""}
 7395 |     <div id="sotpChart" class="mt"></div></div>`;
 7396 |     $("#sotpOut").innerHTML=h;
 7397 |     const cb=h("div",{id:"sotpChartBox",class:"chartbox"}); cb.appendChild(ChartManager.barChart({series:[{data:parts.map(p=>p.value)}],labels:parts.map(p=>p.name),title:"Sum-of-the-Parts Value by Segment",yFmt:fmt.money})); $("#sotpOut").appendChild(cb);
 7398 |     StorageManager.save();
 7399 |   });
 7400 | }
 7401 | 
 7402 | /* ============================================================
 7403 |    #10 — EARNINGS QUALITY TREND CHARTS
 7404 |    ============================================================ */
 7405 | function earningsQualityTrend(){
 7406 |   // Requires multi-period data. Store App.state.eqTrend = {periods:[{period,ni,cfo,fcf,rev,wc}]}
 7407 |   const t=App.state.eqTrend||(App.state.eqTrend={periods:[]});
 7408 |   const rows=t.periods.map((p,i)=>`<tr>
 7409 |     <td><input type="text" value="${esc(p.period)}" id="eqt_${i}_p" style="width:70px"></td>
 7410 |     <td><input type="text" value="${p.ni}" id="eqt_${i}_ni" style="width:80px"></td>
 7411 |     <td><input type="text" value="${p.cfo}" id="eqt_${i}_cfo" style="width:80px"></td>
 7412 |     <td><input type="text" value="${p.fcf}" id="eqt_${i}_fcf" style="width:80px"></td>
 7413 |     <td><input type="text" value="${p.rev}" id="eqt_${i}_rev" style="width:80px"></td>
 7414 |     <td><input type="text" value="${p.wc}" id="eqt_${i}_wc" style="width:80px"></td>
 7415 |     <td><button class="btn btn-sm btn-danger" data-eqt="${i}">×</button></td></tr>`).join("");
 7416 |   $("#eqtForm").innerHTML=`<div class="card"><div class="card-title">Earnings Quality Trend</div>
 7417 |   <p class="small dim">Enter multi-period net income, operating cash flow, FCF, revenue and working capital to chart the trend and highlight divergence.</p>
 7418 |   <div class="tablewrap"><table class="data"><thead><tr><th>Period</th><th class="num">Net Income</th><th class="num">CFO</th><th class="num">FCF</th><th class="num">Revenue</th><th class="num">Working Capital</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="7" class="small dim">No periods yet.</td></tr>`}</tbody></table></div>
 7419 |   <div class="row mt"><button class="btn btn-sm" id="eqt_add">+ Period</button><button class="btn btn-primary" id="eqt_run">Analyze Trend</button></div>
 7420 |   <div id="eqtOut" class="mt"></div></div>`;
 7421 |   wire("eqt_add","click",()=>{ t.periods.push({period:"",ni:0,cfo:0,fcf:0,rev:0,wc:0}); earningsQualityTrend(); });
 7422 |   $$("#eqtForm [data-eqt]").forEach(b=>b.addEventListener("click",()=>{ t.periods.splice(Number(b.dataset.eqt),1); earningsQualityTrend(); }));
 7423 |   wire("eqt_run","click",()=>{
 7424 |     const ps=t.periods.map((p,i)=>({period:$("#eqt_"+i+"_p")?.value||("P"+(i+1)),ni:Number($("#eqt_"+i+"_ni")?.value)||0,cfo:Number($("#eqt_"+i+"_cfo")?.value)||0,fcf:Number($("#eqt_"+i+"_fcf")?.value)||0,rev:Number($("#eqt_"+i+"_rev")?.value)||0,wc:Number($("#eqt_"+i+"_wc")?.value)||0}));
 7425 |     t.periods=ps;
 7426 |     App.state.eqTrend=t;
 7427 |     // charts: NI vs CFO vs FCF, and working-capital warning
 7428 |     let h=`<div class="card"><div class="card-title">Earnings Quality Trend</div>
```

## mulberry — 4 hit(s)

### line 1457

```js
 1445 |     A:{1:.0012,3:.006,5:.012,10:.04}, BBB:{1:.005,3:.02,5:.04,10:.10}, BB:{1:.02,3:.08,5:.15,10:.28},
 1446 |     B:{1:.06,3:.18,5:.30,10:.48}, CCC:{1:.25,3:.45,5:.55,10:.70}, CC:{1:.40,3:.60,5:.70,10:.80} };
 1447 |   function ratingPD(rating,horizon,table){ table=table||defaultPDTable; const r=table[rating]; if(!r) return null; return r[horizon]??null; }
 1448 |   function expectedLoss(pd,recovery){ const lgd=1-recovery; return pd*lgd; }
 1449 |   return {altmanZ,altmanZPrime,merton,defaultPDTable,ratingPD,expectedLoss};
 1450 | })();
 1451 | 
 1452 | /* ============================================================
 1453 |    CASE DATABASE & kNN SIMILARITY
 1454 |    SYNTHETIC / DEMONSTRATION DATA — never real historical evidence.
 1455 |    ============================================================ */
 1456 | const CaseDB=(()=>{
 1457 |   // Deterministic PRNG (mulberry32) so the DB is reproducible per seed.
 1458 |   function mulberry32(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
 1459 |   const rand=(r,a,b)=> a+r()*(b-a);
 1460 |   const pick=(r,a)=> a[Math.floor(r()*a.length)];
 1461 |   const IND=["Tech","Consumer","Financials","Health Care","Industrials","Energy","Real Estate","Utilities","Materials","Communication"];
 1462 |   const COUNTRIES=["US","DE","UK","FR","CH","JP","CA","AU","NL","SE"];
 1463 |   function genCase(seed,id){
 1464 |     const r=mulberry32(seed);
 1465 |     const type="stock";
 1466 |     const industry=pick(r,IND);
 1467 |     const country=pick(r,COUNTRIES);
 1468 |     const year=1985+Math.floor(r()*35);
 1469 |     const profitMargin=rand(r,-.15,.28);
 1470 |     const revenueGrowth=rand(r,-.15,.45);
 1471 |     const de=rand(r,0,4);
 1472 |     const currentRatio=rand(r,.4,4);
 1473 |     const interestCov=rand(r,0,25);
 1474 |     const pe= rand(r,.8,80);
 1475 |     const pb= rand(r,.3,20);
 1476 |     const evEbitda= rand(r,2,40);
 1477 |     const volatility=rand(r,.15,.8);
 1478 |     const beta= rand(r,.4,2.5);
 1479 |     const roe= rand(r,-.3,.5);
 1480 |     const roa= rand(r,-.15,.25);
 1481 |     const fcfMargin= rand(r,-.3,.4);
 1482 |     const divYield= rand(r,0,.08);
 1483 |     const size= rand(r,1,10); // log-ish
 1484 |     const grossMargin= rand(r,.05,.75);
 1485 |     const assetTurnover= rand(r,.2,2.5);
 1486 |     const debtEbitda= de>0? (de*3)*rand(r,.5,1.5):0;
 1487 |     // outcome correlated with fundamentals
 1488 |     const quality = profitMargin*1.5 + roe*2 + currentRatio*.3 - (de>3?1:0) - (interestCov<1.5?1.5:0) - (fcfMargin<0?.8:0) + revenueGrowth*.3 + grossMargin*.6 + assetTurnover*.2 + rand(r,-1.5,1.5);
 1489 |     const ret1= Math.max(-.9, Math.min(2.5, quality*1.1 + rand(r,-.6,.6)));
 1490 |     const ret3= Math.max(-.95, Math.min(4, quality*1.6 + rand(r,-1,1)));
 1491 |     const ret5= Math.max(-.98, Math.min(6, quality*2.2 + rand(r,-1.4,1.4)));
 1492 |     // distress-based default probability (synthetic realism; clearly not real data)
 1493 |     const distressScore = (interestCov<1.5?1:0) + (de>2.5?1:0) + (fcfMargin<0?1:0) + (currentRatio<1?1:0) + (profitMargin<0?1:0);
 1494 |     const pDef = Math.min(.5, distressScore*0.06 + (ret1<-0.4?0.04:0));
 1495 |     const defaulted = rand(r,0,1) < pDef;
 1496 |     const maxDD= Math.min(-.1, -(ret1/2+ .15 + rand(r,0,.4)));
 1497 |     return { id, type, industry, country, period:`${year}`, sourceType:"synthetic", sourceDescription:"Synthetic demonstration case — NOT real historical data.",
 1498 |       features:{profitMargin,revenueGrowth,de,currentRatio,interestCov,pe,pb,evEbitda,volatility,beta,roe,roa,fcfMargin,divYield,size,grossMargin,assetTurnover,debtEbitda,industry},
 1499 |       outcome:{ret1,ret3,ret5,defaulted,survived:!defaulted, maxDD, profitable: netIncome_(profitMargin,revenueGrowth) } };
 1500 |   }
 1501 |   function netIncome_(pm,rg){ return pm>0; }
 1502 |   /* ---- REAL HISTORICAL REFERENCE CASES ----
 1503 |      Sourced from the user-provided document "The Ten Most Famous Financial Cases"
 1504 |      (reference study citing courts, regulators, trustees and official reports).
 1505 |      These are REAL, named historical failures with provenance.
 1506 |      Numeric features are qualitative directional estimates inferred from the
 1507 |      documented narrative — NOT audited financial statements — so they are flagged
 1508 |      as estimates in each sourceDescription. Outcome defaults are factual (the
 1509 |      entity/fund collapsed). This is educational reference, not investment advice. */
 1510 |   function realCase(id,name,industry,country,period,feat,outcome,note){
 1511 |     return { id, name, type:"stock", industry, country, period:String(period),
 1512 |       sourceType:"real-reference", sourceDescription:"Real historical case: "+name+". Numeric features are qualitative estimates inferred from the reference narrative (courts/regulators/reports), not audited financials. "+note,
 1513 |       features:Object.assign({profitMargin:null,revenueGrowth:null,de:null,currentRatio:null,interestCov:null,pe:null,pb:null,evEbitda:null,volatility:null,beta:null,roe:null,roa:null,fcfMargin:null,divYield:null,size:null,grossMargin:null,assetTurnover:null,debtEbitda:null},feat),
 1514 |       outcome };
 1515 |   }
 1516 |   const REAL_CASES=[
 1517 |     realCase("R01","Wall Street Crash (1929)","Market Crash","US",1929,
 1518 |       {volatility:.35,de:8,beta:1.4,size:10},{ret1:null,ret3:null,ret5:null,defaulted:true,maxDD:-.89,note:"Systemic market crash; DJIA -89% peak to 1932 trough."},
 1519 |       "Whole-market leverage/margin collapse, not a single-firm default."),
 1520 |     realCase("R02","Barings Bank (1995)","Banking","UK",1995,
 1521 |       {de:6,currentRatio:.8,interestCov:.5,volatility:.30,beta:1.3,size:9},{ret1:null,ret3:null,ret5:null,defaulted:true,maxDD:-1,note:"Rogue trading wiped out the bank."},
```

### line 1458

```js
 1446 |     B:{1:.06,3:.18,5:.30,10:.48}, CCC:{1:.25,3:.45,5:.55,10:.70}, CC:{1:.40,3:.60,5:.70,10:.80} };
 1447 |   function ratingPD(rating,horizon,table){ table=table||defaultPDTable; const r=table[rating]; if(!r) return null; return r[horizon]??null; }
 1448 |   function expectedLoss(pd,recovery){ const lgd=1-recovery; return pd*lgd; }
 1449 |   return {altmanZ,altmanZPrime,merton,defaultPDTable,ratingPD,expectedLoss};
 1450 | })();
 1451 | 
 1452 | /* ============================================================
 1453 |    CASE DATABASE & kNN SIMILARITY
 1454 |    SYNTHETIC / DEMONSTRATION DATA — never real historical evidence.
 1455 |    ============================================================ */
 1456 | const CaseDB=(()=>{
 1457 |   // Deterministic PRNG (mulberry32) so the DB is reproducible per seed.
 1458 |   function mulberry32(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
 1459 |   const rand=(r,a,b)=> a+r()*(b-a);
 1460 |   const pick=(r,a)=> a[Math.floor(r()*a.length)];
 1461 |   const IND=["Tech","Consumer","Financials","Health Care","Industrials","Energy","Real Estate","Utilities","Materials","Communication"];
 1462 |   const COUNTRIES=["US","DE","UK","FR","CH","JP","CA","AU","NL","SE"];
 1463 |   function genCase(seed,id){
 1464 |     const r=mulberry32(seed);
 1465 |     const type="stock";
 1466 |     const industry=pick(r,IND);
 1467 |     const country=pick(r,COUNTRIES);
 1468 |     const year=1985+Math.floor(r()*35);
 1469 |     const profitMargin=rand(r,-.15,.28);
 1470 |     const revenueGrowth=rand(r,-.15,.45);
 1471 |     const de=rand(r,0,4);
 1472 |     const currentRatio=rand(r,.4,4);
 1473 |     const interestCov=rand(r,0,25);
 1474 |     const pe= rand(r,.8,80);
 1475 |     const pb= rand(r,.3,20);
 1476 |     const evEbitda= rand(r,2,40);
 1477 |     const volatility=rand(r,.15,.8);
 1478 |     const beta= rand(r,.4,2.5);
 1479 |     const roe= rand(r,-.3,.5);
 1480 |     const roa= rand(r,-.15,.25);
 1481 |     const fcfMargin= rand(r,-.3,.4);
 1482 |     const divYield= rand(r,0,.08);
 1483 |     const size= rand(r,1,10); // log-ish
 1484 |     const grossMargin= rand(r,.05,.75);
 1485 |     const assetTurnover= rand(r,.2,2.5);
 1486 |     const debtEbitda= de>0? (de*3)*rand(r,.5,1.5):0;
 1487 |     // outcome correlated with fundamentals
 1488 |     const quality = profitMargin*1.5 + roe*2 + currentRatio*.3 - (de>3?1:0) - (interestCov<1.5?1.5:0) - (fcfMargin<0?.8:0) + revenueGrowth*.3 + grossMargin*.6 + assetTurnover*.2 + rand(r,-1.5,1.5);
 1489 |     const ret1= Math.max(-.9, Math.min(2.5, quality*1.1 + rand(r,-.6,.6)));
 1490 |     const ret3= Math.max(-.95, Math.min(4, quality*1.6 + rand(r,-1,1)));
 1491 |     const ret5= Math.max(-.98, Math.min(6, quality*2.2 + rand(r,-1.4,1.4)));
 1492 |     // distress-based default probability (synthetic realism; clearly not real data)
 1493 |     const distressScore = (interestCov<1.5?1:0) + (de>2.5?1:0) + (fcfMargin<0?1:0) + (currentRatio<1?1:0) + (profitMargin<0?1:0);
 1494 |     const pDef = Math.min(.5, distressScore*0.06 + (ret1<-0.4?0.04:0));
 1495 |     const defaulted = rand(r,0,1) < pDef;
 1496 |     const maxDD= Math.min(-.1, -(ret1/2+ .15 + rand(r,0,.4)));
 1497 |     return { id, type, industry, country, period:`${year}`, sourceType:"synthetic", sourceDescription:"Synthetic demonstration case — NOT real historical data.",
 1498 |       features:{profitMargin,revenueGrowth,de,currentRatio,interestCov,pe,pb,evEbitda,volatility,beta,roe,roa,fcfMargin,divYield,size,grossMargin,assetTurnover,debtEbitda,industry},
 1499 |       outcome:{ret1,ret3,ret5,defaulted,survived:!defaulted, maxDD, profitable: netIncome_(profitMargin,revenueGrowth) } };
 1500 |   }
 1501 |   function netIncome_(pm,rg){ return pm>0; }
 1502 |   /* ---- REAL HISTORICAL REFERENCE CASES ----
 1503 |      Sourced from the user-provided document "The Ten Most Famous Financial Cases"
 1504 |      (reference study citing courts, regulators, trustees and official reports).
 1505 |      These are REAL, named historical failures with provenance.
 1506 |      Numeric features are qualitative directional estimates inferred from the
 1507 |      documented narrative — NOT audited financial statements — so they are flagged
 1508 |      as estimates in each sourceDescription. Outcome defaults are factual (the
 1509 |      entity/fund collapsed). This is educational reference, not investment advice. */
 1510 |   function realCase(id,name,industry,country,period,feat,outcome,note){
 1511 |     return { id, name, type:"stock", industry, country, period:String(period),
 1512 |       sourceType:"real-reference", sourceDescription:"Real historical case: "+name+". Numeric features are qualitative estimates inferred from the reference narrative (courts/regulators/reports), not audited financials. "+note,
 1513 |       features:Object.assign({profitMargin:null,revenueGrowth:null,de:null,currentRatio:null,interestCov:null,pe:null,pb:null,evEbitda:null,volatility:null,beta:null,roe:null,roa:null,fcfMargin:null,divYield:null,size:null,grossMargin:null,assetTurnover:null,debtEbitda:null},feat),
 1514 |       outcome };
 1515 |   }
 1516 |   const REAL_CASES=[
 1517 |     realCase("R01","Wall Street Crash (1929)","Market Crash","US",1929,
 1518 |       {volatility:.35,de:8,beta:1.4,size:10},{ret1:null,ret3:null,ret5:null,defaulted:true,maxDD:-.89,note:"Systemic market crash; DJIA -89% peak to 1932 trough."},
 1519 |       "Whole-market leverage/margin collapse, not a single-firm default."),
 1520 |     realCase("R02","Barings Bank (1995)","Banking","UK",1995,
 1521 |       {de:6,currentRatio:.8,interestCov:.5,volatility:.30,beta:1.3,size:9},{ret1:null,ret3:null,ret5:null,defaulted:true,maxDD:-1,note:"Rogue trading wiped out the bank."},
 1522 |       "Operational failure: one trader controlled trading and back office."),
```

### line 1464

```js
 1452 | /* ============================================================
 1453 |    CASE DATABASE & kNN SIMILARITY
 1454 |    SYNTHETIC / DEMONSTRATION DATA — never real historical evidence.
 1455 |    ============================================================ */
 1456 | const CaseDB=(()=>{
 1457 |   // Deterministic PRNG (mulberry32) so the DB is reproducible per seed.
 1458 |   function mulberry32(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
 1459 |   const rand=(r,a,b)=> a+r()*(b-a);
 1460 |   const pick=(r,a)=> a[Math.floor(r()*a.length)];
 1461 |   const IND=["Tech","Consumer","Financials","Health Care","Industrials","Energy","Real Estate","Utilities","Materials","Communication"];
 1462 |   const COUNTRIES=["US","DE","UK","FR","CH","JP","CA","AU","NL","SE"];
 1463 |   function genCase(seed,id){
 1464 |     const r=mulberry32(seed);
 1465 |     const type="stock";
 1466 |     const industry=pick(r,IND);
 1467 |     const country=pick(r,COUNTRIES);
 1468 |     const year=1985+Math.floor(r()*35);
 1469 |     const profitMargin=rand(r,-.15,.28);
 1470 |     const revenueGrowth=rand(r,-.15,.45);
 1471 |     const de=rand(r,0,4);
 1472 |     const currentRatio=rand(r,.4,4);
 1473 |     const interestCov=rand(r,0,25);
 1474 |     const pe= rand(r,.8,80);
 1475 |     const pb= rand(r,.3,20);
 1476 |     const evEbitda= rand(r,2,40);
 1477 |     const volatility=rand(r,.15,.8);
 1478 |     const beta= rand(r,.4,2.5);
 1479 |     const roe= rand(r,-.3,.5);
 1480 |     const roa= rand(r,-.15,.25);
 1481 |     const fcfMargin= rand(r,-.3,.4);
 1482 |     const divYield= rand(r,0,.08);
 1483 |     const size= rand(r,1,10); // log-ish
 1484 |     const grossMargin= rand(r,.05,.75);
 1485 |     const assetTurnover= rand(r,.2,2.5);
 1486 |     const debtEbitda= de>0? (de*3)*rand(r,.5,1.5):0;
 1487 |     // outcome correlated with fundamentals
 1488 |     const quality = profitMargin*1.5 + roe*2 + currentRatio*.3 - (de>3?1:0) - (interestCov<1.5?1.5:0) - (fcfMargin<0?.8:0) + revenueGrowth*.3 + grossMargin*.6 + assetTurnover*.2 + rand(r,-1.5,1.5);
 1489 |     const ret1= Math.max(-.9, Math.min(2.5, quality*1.1 + rand(r,-.6,.6)));
 1490 |     const ret3= Math.max(-.95, Math.min(4, quality*1.6 + rand(r,-1,1)));
 1491 |     const ret5= Math.max(-.98, Math.min(6, quality*2.2 + rand(r,-1.4,1.4)));
 1492 |     // distress-based default probability (synthetic realism; clearly not real data)
 1493 |     const distressScore = (interestCov<1.5?1:0) + (de>2.5?1:0) + (fcfMargin<0?1:0) + (currentRatio<1?1:0) + (profitMargin<0?1:0);
 1494 |     const pDef = Math.min(.5, distressScore*0.06 + (ret1<-0.4?0.04:0));
 1495 |     const defaulted = rand(r,0,1) < pDef;
 1496 |     const maxDD= Math.min(-.1, -(ret1/2+ .15 + rand(r,0,.4)));
 1497 |     return { id, type, industry, country, period:`${year}`, sourceType:"synthetic", sourceDescription:"Synthetic demonstration case — NOT real historical data.",
 1498 |       features:{profitMargin,revenueGrowth,de,currentRatio,interestCov,pe,pb,evEbitda,volatility,beta,roe,roa,fcfMargin,divYield,size,grossMargin,assetTurnover,debtEbitda,industry},
 1499 |       outcome:{ret1,ret3,ret5,defaulted,survived:!defaulted, maxDD, profitable: netIncome_(profitMargin,revenueGrowth) } };
 1500 |   }
 1501 |   function netIncome_(pm,rg){ return pm>0; }
 1502 |   /* ---- REAL HISTORICAL REFERENCE CASES ----
 1503 |      Sourced from the user-provided document "The Ten Most Famous Financial Cases"
 1504 |      (reference study citing courts, regulators, trustees and official reports).
 1505 |      These are REAL, named historical failures with provenance.
 1506 |      Numeric features are qualitative directional estimates inferred from the
 1507 |      documented narrative — NOT audited financial statements — so they are flagged
 1508 |      as estimates in each sourceDescription. Outcome defaults are factual (the
 1509 |      entity/fund collapsed). This is educational reference, not investment advice. */
 1510 |   function realCase(id,name,industry,country,period,feat,outcome,note){
 1511 |     return { id, name, type:"stock", industry, country, period:String(period),
 1512 |       sourceType:"real-reference", sourceDescription:"Real historical case: "+name+". Numeric features are qualitative estimates inferred from the reference narrative (courts/regulators/reports), not audited financials. "+note,
 1513 |       features:Object.assign({profitMargin:null,revenueGrowth:null,de:null,currentRatio:null,interestCov:null,pe:null,pb:null,evEbitda:null,volatility:null,beta:null,roe:null,roa:null,fcfMargin:null,divYield:null,size:null,grossMargin:null,assetTurnover:null,debtEbitda:null},feat),
 1514 |       outcome };
 1515 |   }
 1516 |   const REAL_CASES=[
 1517 |     realCase("R01","Wall Street Crash (1929)","Market Crash","US",1929,
 1518 |       {volatility:.35,de:8,beta:1.4,size:10},{ret1:null,ret3:null,ret5:null,defaulted:true,maxDD:-.89,note:"Systemic market crash; DJIA -89% peak to 1932 trough."},
 1519 |       "Whole-market leverage/margin collapse, not a single-firm default."),
 1520 |     realCase("R02","Barings Bank (1995)","Banking","UK",1995,
 1521 |       {de:6,currentRatio:.8,interestCov:.5,volatility:.30,beta:1.3,size:9},{ret1:null,ret3:null,ret5:null,defaulted:true,maxDD:-1,note:"Rogue trading wiped out the bank."},
 1522 |       "Operational failure: one trader controlled trading and back office."),
 1523 |     realCase("R03","Long-Term Capital Management (1998)","Hedge Fund","US",1998,
 1524 |       {de:50,interestCov:.3,volatility:.28,beta:1.0,size:9},{ret1:null,ret3:null,ret5:null,defaulted:true,maxDD:-.92,note:"Extreme leverage (~100:1) led to a $4.6bn loss and forced rescue."},
 1525 |       "Model-driven leverage; correlations going to 1; counterparty contagion."),
 1526 |     realCase("R04","Enron (2001)","Energy","US",2001,
 1527 |       {de:25,currentRatio:.7,interestCov:1.2,volatility:.45,beta:1.6,fcfMargin:-.20,size:10},{ret1:null,ret3:null,ret5:null,defaulted:true,maxDD:-.99,note:"~$74bn shareholder value destroyed; bankruptcy Dec 2001."},
 1528 |       "Off-balance-sheet entities and mark-to-model earnings masked true cash flow."),
```

### line 1549

```js
 1537 |       "Wholesale funding run on a highly leveraged investment bank (Repo 105)."),
 1538 |     realCase("R08","Bernard Madoff (2008)","Asset Management","US",2008,
 1539 |       {volatility:.10,beta:.6,size:9},{ret1:null,ret3:null,ret5:null,defaulted:true,maxDD:-1,note:"Ponzi scheme; ~$17.5bn actual cash lost, ~$65bn paper; firm collapsed."},
 1540 |       "Returns were fabricated (Ponzi), not real trading."),
 1541 |     realCase("R09","Wirecard (2020)","Fintech / Payments","Germany",2020,
 1542 |       {de:8,currentRatio:.8,interestCov:1.5,volatility:.40,beta:1.4,fcfMargin:-.10,size:8},{ret1:null,ret3:null,ret5:null,defaulted:true,maxDD:-.95,note:"€1.9bn cash that did not exist; insolvency June 2020."},
 1543 |       "Reported cash balances were fictitious; a quarter of the balance sheet."),
 1544 |     realCase("R10","FTX (2022)","Crypto Exchange","Bahamas/US",2022,
 1545 |       {de:20,currentRatio:.5,volatility:.60,beta:2.0,fcfMargin:-.20,size:8},{ret1:null,ret3:null,ret5:null,defaulted:true,maxDD:-.97,note:"~$8-10bn customer-funds hole; bankruptcy Nov 2022."},
 1546 |       "Customer deposits misappropriated to a sister trading firm.")
 1547 |   ];
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
 1584 | /* ============================================================
 1585 |    SCENARIO ENGINE
 1586 |    ============================================================ */
 1587 | const ScenarioEngine=(()=>{
 1588 |   function run(baseDcf, scenarios, currentPrice, netDebt, shares){
 1589 |     // scenarios: array of {name, growth, margin, wacc, terminalGrowth, prob}
 1590 |     const out=[]; for(const s of scenarios){
 1591 |       const dcf=ValuationEngine.dcf({revenue0:baseDcf.revenue0, growth:s.growth, ebitdaMargin:s.margin, tax:baseDcf.tax, capexPct:s.capexPct!=null?s.capexPct:baseDcf.capexPct, wcPct:s.wcPct!=null?s.wcPct:baseDcf.wcPct, dandaPct:baseDcf.dandaPct, wacc:s.wacc, terminalGrowth:s.terminalGrowth, terminalMethod:baseDcf.terminalMethod, exitMultiple:s.exitMultiple!=null?s.exitMultiple:baseDcf.exitMultiple, netDebt, shares, horizon:baseDcf.horizon});
 1592 |       const val=dcf.perShare; const mos=currentPrice>0? (val/currentPrice)-1:null;
 1593 |       out.push({name:s.name, growth:s.growth, margin:s.margin, wacc:s.wacc, tg:s.terminalGrowth, prob:s.prob??null, value:val, perShare:val, dcf, mos});
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
```

## const TerminalCrossCheck — 1 hit(s)

### line 5588

```js
 5576 |     for(let i=histYears;i>=1;i--) out.push((current-i)+"A");
 5577 |     for(let i=0;i<forecastYears;i++) out.push((current+i)+"E");
 5578 |     return out;
 5579 |   }
 5580 |   function html(labelsArr){
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
 5617 |     const mx=ValuationMatrixV2.build(sd); if(!mx)return null;
 5618 |     const vals=mx.methods.filter(m=>m.value!=null).map(m=>m.value);
 5619 |     if(!vals.length)return null;
 5620 |     const sorted=vals.slice().sort((a,b)=>a-b);
 5621 |     const pct=(p)=> sorted[Math.min(sorted.length-1,Math.max(0,Math.floor(p*sorted.length)))];
 5622 |     return {
 5623 |       bear: Math.min(...vals), base: CalcEngine.mean(vals), bull: Math.max(...vals),
 5624 |       low: pct(.25), median: pct(.5), high: pct(.75), p5:pct(.05), p95:pct(.95),
 5625 |       count: vals.length, current: mx.current
 5626 |     };
 5627 |   }
 5628 |   function html(r){
 5629 |     if(!r)return "";
 5630 |     return `<div class="card"><div class="card-title">Valuation Range (no false precision)</div>
 5631 |     <div class="grid g4">
 5632 |       ${kpi("Bear (low)",fmt.money(r.bear))}${kpi("Base (mean)",fmt.money(r.base))}${kpi("Bull (high)",fmt.money(r.bull))}${kpi("Current price",fmt.money(r.current))}
 5633 |       ${kpi("P5",fmt.money(r.p5))}${kpi("P25",fmt.money(r.low))}${kpi("Median",fmt.money(r.median))}${kpi("P75",fmt.money(r.high))}${kpi("P95",fmt.money(r.p95))}${kpi("Methods",String(r.count))}
 5634 |     </div>
 5635 |     <div class="banner info">The true intrinsic value is uncertain and likely lies within this range. Single-point estimates should not be treated as precise.</div></div>`;
 5636 |   }
 5637 |   return {build,html};
 5638 | })();
 5639 | 
 5640 | /* ---- 27: Full debt schedule (borrowing, refinancing) ---- */
 5641 | const DebtScheduleV2=(()=>{
 5642 |   function build(rows,years,startYear){
 5643 |     if(!rows||!rows.length)return null;
 5644 |     const out=[]; let prevOpening=0;
 5645 |     for(let i=0;i<years;i++){
 5646 |       const r=rows[Math.min(i,rows.length-1)];
 5647 |       const opening=i===0? r.opening : prevOpening;
 5648 |       const newBorrow=r.newBorrow||0;
 5649 |       const rate=r.rate||0.05;
 5650 |       const interest=opening*rate;
 5651 |       const repay=r.repayment||0;
 5652 |       const closing=Math.max(0,opening+newBorrow-repay);
```

## const ValuationUncertainty — 1 hit(s)

### line 8511

```js
 8499 |     <div class="tablewrap"><table class="data"><thead><tr><th>Holding</th><th class="num">Weight</th><th class="num">Volatility</th><th class="num">Risk Contribution</th><th class="num">% of Risk</th></tr></thead><tbody>`;
 8500 |     r.rows.forEach(x=>{ h+=`<tr><td>${esc(x.name)}</td><td class="num">${fmt.pct(x.weight)}</td><td class="num">${fmt.pct(x.volatility)}</td><td class="num">${fmt.pct(x.component)}</td><td class="num">${fmt.pct(x.riskShare)}</td></tr>`; });
 8501 |     h+=`</tbody></table></div>
 8502 |     <div class="banner info">Risk contribution reveals how much each holding actually drives portfolio volatility — a small weight can still dominate risk.</div></div>`;
 8503 |     return h;
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
 8517 |       const lo=ValuationEngine.dcf({...base,growth:g*.9,ebitdaMargin:m*.9,wacc:w*1.06,terminalGrowth:tg*.85}).perShare;
 8518 |       const hi=ValuationEngine.dcf({...base,growth:g*1.1,ebitdaMargin:m*1.1,wacc:w*.94,terminalGrowth:tg*1.15}).perShare;
 8519 |       const mid=ValuationEngine.dcf({...base,growth:g,ebitdaMargin:m,wacc:w,terminalGrowth:tg}).perShare;
 8520 |       return {lo,mid,hi};
 8521 |     }
 8522 |     const bear=dcfRange(a.revenueGrowth*.55,a.ebitdaMargin*.8,a.wacc*1.15,a.terminalGrowth*.6);
 8523 |     const baseR=dcfRange(a.revenueGrowth,a.ebitdaMargin,a.wacc,a.terminalGrowth);
 8524 |     const bull=dcfRange(a.revenueGrowth*1.5,a.ebitdaMargin*1.2,a.wacc*.85,a.terminalGrowth*1.4);
 8525 |     const central=baseR.mid;
 8526 |     const disp=Number.isFinite(central)&&Math.abs(central)>1e-12?(bull.hi-bear.lo)/Math.abs(central):null;
 8527 |     const suff=DataSufficiency.compute().overall;
 8528 |     const conf= disp==null?0:Math.max(0,Math.min(100,Math.round(80 - disp*20 + (suff-50)*0.3)));
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
 8540 |       ${kpi("Valuation confidence",u.conf+"/100","dispersion "+fmt.pct(u.dispersion,1))}
 8541 |     </div>
 8542 |     <div class="banner info">The true value is uncertain and likely lies within the base range. Ranges reflect assumption sensitivity; do not treat any single point as precise.</div></div>`;
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
```

