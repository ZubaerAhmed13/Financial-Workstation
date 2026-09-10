# Focused Math Inventory — portfolio

Generated from index.html. Engineering evidence only; not a certification claim.

## const PortfolioPolicy — 0 hit(s)

Not located.

## const PortfolioLimits — 0 hit(s)

Not located.

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
 8540 |       ${kpi("Valuation confidence",u.conf+"/100","dispersion "+fmt.pct(u.dispersion,1))}
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

## function minimumVariance — 2 hit(s)

### line 9122

```js
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
 9184 |   return {equalWeight,minimumVariance,maximumSharpe,riskParity,htmlOptimizer};
 9185 | })();
 9186 | 
```

### line 12924

```js
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
12936 |     return w;
12937 |   }
12938 |   function maximumSharpe(items,corrMatrix,riskFreeRate=0){
12939 |     if(!Array.isArray(items)||items.length<2||!finite(riskFreeRate)||items.some(x=>!finite(x.expectedReturn)))return null;
12940 |     const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;
12941 |     let w=minimumVariance(items,corrMatrix);if(!w)return null;
12942 |     const objective=x=>{
12943 |       const ret=x.reduce((s,v,i)=>s+v*items[i].expectedReturn,0);let vr=0;for(let i=0;i<x.length;i++)for(let j=0;j<x.length;j++)vr+=x[i]*x[j]*cov[i][j];
12944 |       return vr>EPS?(ret-riskFreeRate)/Math.sqrt(vr):-Infinity;
12945 |     };
12946 |     let best=objective(w),step=.08;
12947 |     for(let it=0;it<3000;it++){
12948 |       let improved=false;
12949 |       for(let i=0;i<w.length;i++)for(let j=0;j<w.length;j++)if(i!==j&&w[j]>0){
12950 |         const d=Math.min(step,w[j]),x=w.slice();x[i]+=d;x[j]-=d;const q=objective(x);if(q>best+1e-12){w=x;best=q;improved=true;}
12951 |       }
12952 |       if(!improved){step*=.5;if(step<1e-7)break;}
12953 |     }
12954 |     return w;
12955 |   }
12956 |   function riskParity(items,corrMatrix){
12957 |     if(!Array.isArray(items)||items.length<2)return null;
12958 |     const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;
12959 |     let w=equalWeight(items);
12960 |     for(let it=0;it<3000;it++){
12961 |       const marginal=w.map((_,i)=>cov[i].reduce((s,c,j)=>s+c*w[j],0));
12962 |       const contrib=w.map((x,i)=>x*marginal[i]);
12963 |       const target=contrib.reduce((a,b)=>a+b,0)/w.length;
12964 |       if(!finite(target)||target<=EPS){
12965 |         if(items.every(x=>x.volatility<=EPS))return equalWeight(items);
12966 |         return null;
12967 |       }
12968 |       const next=w.map((x,i)=>contrib[i]>EPS?x*Math.sqrt(target/contrib[i]):x);
12969 |       const sum=next.reduce((a,b)=>a+b,0);if(sum<=EPS)return null;
12970 |       for(let i=0;i<next.length;i++)next[i]/=sum;
12971 |       const diff=next.reduce((m,x,i)=>Math.max(m,Math.abs(x-w[i])),0);w=next;if(diff<1e-10)break;
12972 |     }
12973 |     return w;
12974 |   }
12975 | 
12976 |   function segmentForecast(totalRevenue,segments,years){
12977 |     if(!finite(totalRevenue)||totalRevenue<0||!Number.isInteger(years)||years<=0||!Array.isArray(segments)||!segments.length)return null;
12978 |     const out=[];let shareTotal=0;
12979 |     for(const s of segments){
12980 |       if(!s||!finite(s.share)||s.share<0||!Array.isArray(s.growth)||!Array.isArray(s.margin)||s.growth.length<years||s.margin.length<years)return null;
12981 |       if(s.growth.slice(0,years).some(v=>!finite(v)||v<=-1)||s.margin.slice(0,years).some(v=>!finite(v)))return null;
12982 |       shareTotal+=s.share;let r=totalRevenue*s.share;const revs=[];
12983 |       for(let y=0;y<years;y++){revs.push(r);r*=1+s.growth[y];if(!finite(r))return null;}
12984 |       out.push({name:s.name,revs,margins:s.margin.slice(0,years)});
12985 |     }
12986 |     const totalRevs=Array(years).fill(0),totalEbitda=Array(years).fill(0);
12987 |     for(const s of out)for(let y=0;y<years;y++){totalRevs[y]+=s.revs[y];totalEbitda[y]+=s.revs[y]*s.margins[y];}
12988 |     return {segments:out,totalRevs,totalEbitda,shareTotal,shareReconciles:Math.abs(shareTotal-1)<=1e-8};
```

## function maximumSharpe — 2 hit(s)

### line 9142

```js
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
 9184 |   return {equalWeight,minimumVariance,maximumSharpe,riskParity,htmlOptimizer};
 9185 | })();
 9186 | 
 9187 | /* ============================================================
 9188 |    4. PER-LINE IFRS/GAAP COMPARABILITY WARNINGS
 9189 |    ============================================================ */
 9190 | const AccountingComparability=(()=>{
 9191 |   const RULES={
 9192 |     capitalizedDevelopment:{ifrs:"Development costs are capitalized under IFRS when criteria met.",gaap:"Development costs are generally expensed under US GAAP."},
 9193 |     leaseLiab:{ifrs:"Leases are capitalized (right-of-use + lease liability) under IFRS 16.",gaap:"Operating leases are capitalized under ASC 842 (similar, but transition differences)."},
 9194 |     revenueRecognition:{ifrs:"IFRS 15 / US GAAP ASC 606 are broadly converged, but details differ (e.g. contract costs)."},
 9195 |     inventory:{ifrs:"IFRS forbids LIFO; US GAAP permits LIFO."},
 9196 |     goodwill:{ifrs:"IFRS: goodwill not amortized, annual impairment (single-step).",gaap:"US GAAP: goodwill not amortized, two-step impairment."},
 9197 |     deferredTax:{ifrs:"Deferred tax under IFRS has limited recognition for some items.",gaap:"US GAAP valuation allowance approach."}
 9198 |   };
 9199 |   function warnFor(aq){
 9200 |     if(!aq||!aq.framework)return [];
 9201 |     const fw=aq.framework;
 9202 |     const out=[];
 9203 |     Object.keys(RULES).forEach(k=>{
 9204 |       if(RULES[k][fw.toLowerCase()]|| (fw==="IFRS"&&RULES[k].ifrs)||(fw==="US GAAP"&&RULES[k].gaap)){
 9205 |         const item=aq.items[k]; const active= item&&item.status!=="Unknown"&&item.status!=="N/A";
 9206 |         if(active|| k==="revenueRecognition"||k==="goodwill"||k==="inventory"){
```

### line 12938

```js
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
12936 |     return w;
12937 |   }
12938 |   function maximumSharpe(items,corrMatrix,riskFreeRate=0){
12939 |     if(!Array.isArray(items)||items.length<2||!finite(riskFreeRate)||items.some(x=>!finite(x.expectedReturn)))return null;
12940 |     const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;
12941 |     let w=minimumVariance(items,corrMatrix);if(!w)return null;
12942 |     const objective=x=>{
12943 |       const ret=x.reduce((s,v,i)=>s+v*items[i].expectedReturn,0);let vr=0;for(let i=0;i<x.length;i++)for(let j=0;j<x.length;j++)vr+=x[i]*x[j]*cov[i][j];
12944 |       return vr>EPS?(ret-riskFreeRate)/Math.sqrt(vr):-Infinity;
12945 |     };
12946 |     let best=objective(w),step=.08;
12947 |     for(let it=0;it<3000;it++){
12948 |       let improved=false;
12949 |       for(let i=0;i<w.length;i++)for(let j=0;j<w.length;j++)if(i!==j&&w[j]>0){
12950 |         const d=Math.min(step,w[j]),x=w.slice();x[i]+=d;x[j]-=d;const q=objective(x);if(q>best+1e-12){w=x;best=q;improved=true;}
12951 |       }
12952 |       if(!improved){step*=.5;if(step<1e-7)break;}
12953 |     }
12954 |     return w;
12955 |   }
12956 |   function riskParity(items,corrMatrix){
12957 |     if(!Array.isArray(items)||items.length<2)return null;
12958 |     const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;
12959 |     let w=equalWeight(items);
12960 |     for(let it=0;it<3000;it++){
12961 |       const marginal=w.map((_,i)=>cov[i].reduce((s,c,j)=>s+c*w[j],0));
12962 |       const contrib=w.map((x,i)=>x*marginal[i]);
12963 |       const target=contrib.reduce((a,b)=>a+b,0)/w.length;
12964 |       if(!finite(target)||target<=EPS){
12965 |         if(items.every(x=>x.volatility<=EPS))return equalWeight(items);
12966 |         return null;
12967 |       }
12968 |       const next=w.map((x,i)=>contrib[i]>EPS?x*Math.sqrt(target/contrib[i]):x);
12969 |       const sum=next.reduce((a,b)=>a+b,0);if(sum<=EPS)return null;
12970 |       for(let i=0;i<next.length;i++)next[i]/=sum;
12971 |       const diff=next.reduce((m,x,i)=>Math.max(m,Math.abs(x-w[i])),0);w=next;if(diff<1e-10)break;
12972 |     }
12973 |     return w;
12974 |   }
12975 | 
12976 |   function segmentForecast(totalRevenue,segments,years){
12977 |     if(!finite(totalRevenue)||totalRevenue<0||!Number.isInteger(years)||years<=0||!Array.isArray(segments)||!segments.length)return null;
12978 |     const out=[];let shareTotal=0;
12979 |     for(const s of segments){
12980 |       if(!s||!finite(s.share)||s.share<0||!Array.isArray(s.growth)||!Array.isArray(s.margin)||s.growth.length<years||s.margin.length<years)return null;
12981 |       if(s.growth.slice(0,years).some(v=>!finite(v)||v<=-1)||s.margin.slice(0,years).some(v=>!finite(v)))return null;
12982 |       shareTotal+=s.share;let r=totalRevenue*s.share;const revs=[];
12983 |       for(let y=0;y<years;y++){revs.push(r);r*=1+s.growth[y];if(!finite(r))return null;}
12984 |       out.push({name:s.name,revs,margins:s.margin.slice(0,years)});
12985 |     }
12986 |     const totalRevs=Array(years).fill(0),totalEbitda=Array(years).fill(0);
12987 |     for(const s of out)for(let y=0;y<years;y++){totalRevs[y]+=s.revs[y];totalEbitda[y]+=s.revs[y]*s.margins[y];}
12988 |     return {segments:out,totalRevs,totalEbitda,shareTotal,shareReconciles:Math.abs(shareTotal-1)<=1e-8};
12989 |   }
12990 |   function sumOfParts(parts,netDebt,shares){
12991 |     if(!Array.isArray(parts)||!parts.length||!finite(netDebt)||!finite(shares)||shares<=0)return null;
12992 |     const valued=[];
12993 |     for(const p of parts){
12994 |       if(!p)return null;let value=null,source=null;
12995 |       if(has(p,'value')&&p.value!=null){if(!finite(p.value))return null;value=p.value;source='explicit';}
12996 |       else if(finite(p.multiple)&&finite(p.metric)){value=p.multiple*p.metric;source='multiple';}
12997 |       else return null;
12998 |       if(!finite(value))return null;valued.push(Object.assign({},p,{value,source}));
12999 |     }
13000 |     const totalEV=valued.reduce((s,p)=>s+p.value,0),equityValue=totalEV-netDebt,perShare=equityValue/shares;
13001 |     return {parts:valued,totalEV,netDebt,equityValue,shares,perShare};
13002 |   }
```

## function riskParity — 2 hit(s)

### line 9168

```js
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
 9184 |   return {equalWeight,minimumVariance,maximumSharpe,riskParity,htmlOptimizer};
 9185 | })();
 9186 | 
 9187 | /* ============================================================
 9188 |    4. PER-LINE IFRS/GAAP COMPARABILITY WARNINGS
 9189 |    ============================================================ */
 9190 | const AccountingComparability=(()=>{
 9191 |   const RULES={
 9192 |     capitalizedDevelopment:{ifrs:"Development costs are capitalized under IFRS when criteria met.",gaap:"Development costs are generally expensed under US GAAP."},
 9193 |     leaseLiab:{ifrs:"Leases are capitalized (right-of-use + lease liability) under IFRS 16.",gaap:"Operating leases are capitalized under ASC 842 (similar, but transition differences)."},
 9194 |     revenueRecognition:{ifrs:"IFRS 15 / US GAAP ASC 606 are broadly converged, but details differ (e.g. contract costs)."},
 9195 |     inventory:{ifrs:"IFRS forbids LIFO; US GAAP permits LIFO."},
 9196 |     goodwill:{ifrs:"IFRS: goodwill not amortized, annual impairment (single-step).",gaap:"US GAAP: goodwill not amortized, two-step impairment."},
 9197 |     deferredTax:{ifrs:"Deferred tax under IFRS has limited recognition for some items.",gaap:"US GAAP valuation allowance approach."}
 9198 |   };
 9199 |   function warnFor(aq){
 9200 |     if(!aq||!aq.framework)return [];
 9201 |     const fw=aq.framework;
 9202 |     const out=[];
 9203 |     Object.keys(RULES).forEach(k=>{
 9204 |       if(RULES[k][fw.toLowerCase()]|| (fw==="IFRS"&&RULES[k].ifrs)||(fw==="US GAAP"&&RULES[k].gaap)){
 9205 |         const item=aq.items[k]; const active= item&&item.status!=="Unknown"&&item.status!=="N/A";
 9206 |         if(active|| k==="revenueRecognition"||k==="goodwill"||k==="inventory"){
 9207 |           const text= fw==="IFRS"? (RULES[k].ifrs||RULES[k].gaap) : (RULES[k].gaap||RULES[k].ifrs);
 9208 |           out.push({item:k,text});
 9209 |         }
 9210 |       }
 9211 |     });
 9212 |     return out;
 9213 |   }
 9214 |   function html(aq){
 9215 |     const warns=warnFor(aq);
 9216 |     if(!warns.length)return "";
 9217 |     return `<div class="card"><div class="card-title">Accounting Comparability Notes (${esc(aq.framework)})</div>
 9218 |     <div class="gridlist">${warns.map(w=>`<div class="banner warn small" style="margin:3px 0">• <b>${esc(w.item.replace(/([A-Z])/g," $1"))}</b>: ${esc(w.text)}</div>`).join("")}</div>
 9219 |     <div class="small dim">Informational only — not accounting/legal advice. Review source filings.</div></div>`;
 9220 |   }
 9221 |   return {warnFor,html};
 9222 | })();
 9223 | 
 9224 | /* ============================================================
 9225 |    5. MULTI-USER REVIEW DATA MODEL (offline, future-ready)
 9226 |    ============================================================ */
 9227 | const ReviewWorkflow=(()=>{
 9228 |   const STATES=["DRAFT","UNDER REVIEW","CHANGES REQUESTED","APPROVED","ARCHIVED"];
 9229 |   function defaults(){ return {primaryAnalyst:"",reviewer:"",status:"DRAFT",history:[]}; }
 9230 |   function render(){
 9231 |     const rw=App.state.reviewWorkflow||(App.state.reviewWorkflow=defaults());
 9232 |     let h=`<div class="card"><div class="card-title">Review Workflow</div>
```

### line 12956

```js
12944 |       return vr>EPS?(ret-riskFreeRate)/Math.sqrt(vr):-Infinity;
12945 |     };
12946 |     let best=objective(w),step=.08;
12947 |     for(let it=0;it<3000;it++){
12948 |       let improved=false;
12949 |       for(let i=0;i<w.length;i++)for(let j=0;j<w.length;j++)if(i!==j&&w[j]>0){
12950 |         const d=Math.min(step,w[j]),x=w.slice();x[i]+=d;x[j]-=d;const q=objective(x);if(q>best+1e-12){w=x;best=q;improved=true;}
12951 |       }
12952 |       if(!improved){step*=.5;if(step<1e-7)break;}
12953 |     }
12954 |     return w;
12955 |   }
12956 |   function riskParity(items,corrMatrix){
12957 |     if(!Array.isArray(items)||items.length<2)return null;
12958 |     const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;
12959 |     let w=equalWeight(items);
12960 |     for(let it=0;it<3000;it++){
12961 |       const marginal=w.map((_,i)=>cov[i].reduce((s,c,j)=>s+c*w[j],0));
12962 |       const contrib=w.map((x,i)=>x*marginal[i]);
12963 |       const target=contrib.reduce((a,b)=>a+b,0)/w.length;
12964 |       if(!finite(target)||target<=EPS){
12965 |         if(items.every(x=>x.volatility<=EPS))return equalWeight(items);
12966 |         return null;
12967 |       }
12968 |       const next=w.map((x,i)=>contrib[i]>EPS?x*Math.sqrt(target/contrib[i]):x);
12969 |       const sum=next.reduce((a,b)=>a+b,0);if(sum<=EPS)return null;
12970 |       for(let i=0;i<next.length;i++)next[i]/=sum;
12971 |       const diff=next.reduce((m,x,i)=>Math.max(m,Math.abs(x-w[i])),0);w=next;if(diff<1e-10)break;
12972 |     }
12973 |     return w;
12974 |   }
12975 | 
12976 |   function segmentForecast(totalRevenue,segments,years){
12977 |     if(!finite(totalRevenue)||totalRevenue<0||!Number.isInteger(years)||years<=0||!Array.isArray(segments)||!segments.length)return null;
12978 |     const out=[];let shareTotal=0;
12979 |     for(const s of segments){
12980 |       if(!s||!finite(s.share)||s.share<0||!Array.isArray(s.growth)||!Array.isArray(s.margin)||s.growth.length<years||s.margin.length<years)return null;
12981 |       if(s.growth.slice(0,years).some(v=>!finite(v)||v<=-1)||s.margin.slice(0,years).some(v=>!finite(v)))return null;
12982 |       shareTotal+=s.share;let r=totalRevenue*s.share;const revs=[];
12983 |       for(let y=0;y<years;y++){revs.push(r);r*=1+s.growth[y];if(!finite(r))return null;}
12984 |       out.push({name:s.name,revs,margins:s.margin.slice(0,years)});
12985 |     }
12986 |     const totalRevs=Array(years).fill(0),totalEbitda=Array(years).fill(0);
12987 |     for(const s of out)for(let y=0;y<years;y++){totalRevs[y]+=s.revs[y];totalEbitda[y]+=s.revs[y]*s.margins[y];}
12988 |     return {segments:out,totalRevs,totalEbitda,shareTotal,shareReconciles:Math.abs(shareTotal-1)<=1e-8};
12989 |   }
12990 |   function sumOfParts(parts,netDebt,shares){
12991 |     if(!Array.isArray(parts)||!parts.length||!finite(netDebt)||!finite(shares)||shares<=0)return null;
12992 |     const valued=[];
12993 |     for(const p of parts){
12994 |       if(!p)return null;let value=null,source=null;
12995 |       if(has(p,'value')&&p.value!=null){if(!finite(p.value))return null;value=p.value;source='explicit';}
12996 |       else if(finite(p.multiple)&&finite(p.metric)){value=p.multiple*p.metric;source='multiple';}
12997 |       else return null;
12998 |       if(!finite(value))return null;valued.push(Object.assign({},p,{value,source}));
12999 |     }
13000 |     const totalEV=valued.reduce((s,p)=>s+p.value,0),equityValue=totalEV-netDebt,perShare=equityValue/shares;
13001 |     return {parts:valued,totalEV,netDebt,equityValue,shares,perShare};
13002 |   }
13003 | 
13004 |   function mulberry32(seed){let a=(Number(seed)||0)>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
13005 |   function normal01(rng){let u=0,v=0;while(u<=Number.EPSILON)u=rng();while(v<=Number.EPSILON)v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
13006 |   function monteCarloGBM(cfg){
13007 |     cfg=cfg||{};const initial=has(cfg,'initial')?cfg.initial:100,mu=has(cfg,'expectedReturn')?cfg.expectedReturn:0,sigma=has(cfg,'volatility')?cfg.volatility:0;
13008 |     const years=has(cfg,'years')?cfg.years:1,steps=has(cfg,'steps')?cfg.steps:252,paths=has(cfg,'paths')?cfg.paths:1000,seed=has(cfg,'seed')?cfg.seed:42;
13009 |     if(!finite(initial)||initial<=0||!finite(mu)||!finite(sigma)||sigma<0||!finite(years)||years<=0||!Number.isInteger(steps)||steps<=0||!Number.isInteger(paths)||paths<=0||paths>100000)return null;
13010 |     const rng=mulberry32(seed),dt=years/steps,drift=(mu-.5*sigma*sigma)*dt,diff=sigma*Math.sqrt(dt),terminal=[];
13011 |     for(let p=0;p<paths;p++){let x=initial;for(let i=0;i<steps;i++)x*=Math.exp(drift+diff*normal01(rng));terminal.push(x);}
13012 |     terminal.sort((a,b)=>a-b);return {initial,expectedReturn:mu,volatility:sigma,years,steps,paths,seed,terminal};
13013 |   }
13014 | 
13015 |   function dividendAmounts(tx){
13016 |     if(!tx||typeof tx!=='object')return null;
13017 |     const gross=finite(tx.gross)?tx.gross:(finite(tx.amount)?tx.amount:null);
13018 |     const withholding=has(tx,'withholdingTax')?tx.withholdingTax:(has(tx,'tax')?tx.tax:0);
13019 |     const net=finite(tx.net)?tx.net:(gross!=null&&finite(withholding)?gross-withholding:null);
13020 |     if(gross==null||!finite(withholding)||withholding<0||net==null)return null;
```

## function equalWeight — 2 hit(s)

### line 9121

```js
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
 9184 |   return {equalWeight,minimumVariance,maximumSharpe,riskParity,htmlOptimizer};
 9185 | })();
```

### line 12921

```js
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
12936 |     return w;
12937 |   }
12938 |   function maximumSharpe(items,corrMatrix,riskFreeRate=0){
12939 |     if(!Array.isArray(items)||items.length<2||!finite(riskFreeRate)||items.some(x=>!finite(x.expectedReturn)))return null;
12940 |     const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;
12941 |     let w=minimumVariance(items,corrMatrix);if(!w)return null;
12942 |     const objective=x=>{
12943 |       const ret=x.reduce((s,v,i)=>s+v*items[i].expectedReturn,0);let vr=0;for(let i=0;i<x.length;i++)for(let j=0;j<x.length;j++)vr+=x[i]*x[j]*cov[i][j];
12944 |       return vr>EPS?(ret-riskFreeRate)/Math.sqrt(vr):-Infinity;
12945 |     };
12946 |     let best=objective(w),step=.08;
12947 |     for(let it=0;it<3000;it++){
12948 |       let improved=false;
12949 |       for(let i=0;i<w.length;i++)for(let j=0;j<w.length;j++)if(i!==j&&w[j]>0){
12950 |         const d=Math.min(step,w[j]),x=w.slice();x[i]+=d;x[j]-=d;const q=objective(x);if(q>best+1e-12){w=x;best=q;improved=true;}
12951 |       }
12952 |       if(!improved){step*=.5;if(step<1e-7)break;}
12953 |     }
12954 |     return w;
12955 |   }
12956 |   function riskParity(items,corrMatrix){
12957 |     if(!Array.isArray(items)||items.length<2)return null;
12958 |     const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;
12959 |     let w=equalWeight(items);
12960 |     for(let it=0;it<3000;it++){
12961 |       const marginal=w.map((_,i)=>cov[i].reduce((s,c,j)=>s+c*w[j],0));
12962 |       const contrib=w.map((x,i)=>x*marginal[i]);
12963 |       const target=contrib.reduce((a,b)=>a+b,0)/w.length;
12964 |       if(!finite(target)||target<=EPS){
12965 |         if(items.every(x=>x.volatility<=EPS))return equalWeight(items);
12966 |         return null;
12967 |       }
12968 |       const next=w.map((x,i)=>contrib[i]>EPS?x*Math.sqrt(target/contrib[i]):x);
12969 |       const sum=next.reduce((a,b)=>a+b,0);if(sum<=EPS)return null;
12970 |       for(let i=0;i<next.length;i++)next[i]/=sum;
12971 |       const diff=next.reduce((m,x,i)=>Math.max(m,Math.abs(x-w[i])),0);w=next;if(diff<1e-10)break;
12972 |     }
12973 |     return w;
12974 |   }
12975 | 
12976 |   function segmentForecast(totalRevenue,segments,years){
12977 |     if(!finite(totalRevenue)||totalRevenue<0||!Number.isInteger(years)||years<=0||!Array.isArray(segments)||!segments.length)return null;
12978 |     const out=[];let shareTotal=0;
12979 |     for(const s of segments){
12980 |       if(!s||!finite(s.share)||s.share<0||!Array.isArray(s.growth)||!Array.isArray(s.margin)||s.growth.length<years||s.margin.length<years)return null;
12981 |       if(s.growth.slice(0,years).some(v=>!finite(v)||v<=-1)||s.margin.slice(0,years).some(v=>!finite(v)))return null;
12982 |       shareTotal+=s.share;let r=totalRevenue*s.share;const revs=[];
12983 |       for(let y=0;y<years;y++){revs.push(r);r*=1+s.growth[y];if(!finite(r))return null;}
12984 |       out.push({name:s.name,revs,margins:s.margin.slice(0,years)});
12985 |     }
```

## trackingError — 4 hit(s)

### line 3515

```js
 3503 |   const am=LoanEngine.amortization(100000,.05,12,15); t("Amortization",Math.abs(am.rows[am.rows.length-1].balance)<1,"final balance="+fmt.num(am.rows[am.rows.length-1].balance,2));
 3504 |   /* ---- V2 regression tests ---- */
 3505 |   t("VaR historical", (()=>{ const r=RiskMetricsV2.historicalVaR([-0.01,-0.02,-0.03,-0.04,-0.05],.95); return r===-0.05; })(), "worst 5% threshold");
 3506 |   t("Expected Shortfall", (()=>{ const es=RiskMetricsV2.expectedShortfall([-0.01,-0.02,-0.03,-0.04,-0.05],.80); return Math.abs(es-(-0.05))<1e-9; })(), "avg of worst tail");
 3507 |   t("Parametric VaR 95", (()=>{ const v=RiskMetricsV2.parametricVaR(.02,0,.95); return Math.abs(v-(-0.0329))<1e-4; })(), "0 - 1.645*0.02");
 3508 |   t("3-Statement balances", (()=>{ const m=FinancialModelEngine.defaults(); m.years=3; m.bs0={revenue:1000,debt:100,cash:50,equity:200,ppne:300}; m.growth=[.1,.1,.1]; m.margin=[.2,.2,.2]; m.tax=[.21,.21,.21]; m.capexPct=[.06,.06,.06]; m.daPct=[.05,.05,.05]; m.dso=[45,45,45]; m.dio=[45,45,45]; m.dpo=[40,40,40]; const o=FinancialModelEngine.build(m,{}); return o.check&&o.check.ok; })(), "assets == liab+equity");
 3509 |   t("Debt schedule roll-forward", (()=>{ const m=FinancialModelEngine.defaults(); m.debt.rows=[{name:"D",opening:1000,rate:.05,repayment:100}]; const ds=FinancialModelEngine.build(m,{}).debtSchedule; return ds&&ds[0].ending===900; })(), "1000-100");
 3510 |   t("Covenant breach detection", (()=>{ const m=FinancialModelEngine.defaults(); m.covenants={debtEbitda:4,ic:3,currentRatio:1,minCash:0}; const cov=FinancialModelEngine.build(m,{}).covenants; return cov.some(c=>c.status==="ok"); })(), "covenants computed");
 3511 |   t("Valuation matrix", (()=>{ App.state.results.stock={valuation:{perShare:105},dataQuality:{score:80},comps:{impliedMean:1.1,peers:[1,2,3,4]},ddm:95,valInputs:{},costEquity:.1}; const mx=ValuationMatrixV2.build({price:80}); return mx&&mx.low>0&&mx.high>0&&mx.base>0; })(), "range from methods");
 3512 |   t("Portfolio concentration", (()=>{ const p=PortfolioEngine.build([{name:"A",weight:50,volatility:.2,expectedReturn:.1,assetClass:"equity"},{name:"B",weight:50,volatility:.2,expectedReturn:.08,assetClass:"equity"}]); return Math.abs(p.hhi-0.5)<1e-9 && p.concentration==="High"; })(), "HHI=0.5 -> High");
 3513 |   t("Factor exposure", (()=>{ const e=factorExposure([{name:"A",type:"stock",weight:1,volatility:.2,expectedReturn:.1,marginOfSafety:.1}]); return e&&e.length===7; })(), "7 factors");
 3514 |   t("Performance attribution", (()=>{ const a=performanceAttribution([{name:"A",weight:50,expectedReturn:.12},{name:"B",weight:50,expectedReturn:.08}],0.08); return a&&Math.abs(a.excess-0.02)<1e-9; })(), "excess 2%");
 3515 |   t("Tracking error", (()=>{ const te=trackingError([.01,.02,.03,.04,.05],[.01,.01,.01,.01,.01]); return te&&te.annualized>0; })(), "annualized>0");
 3516 |   t("XIRR 1-year", (()=>{ const d0=new Date("2024-01-01").getTime(),d1=new Date("2025-01-01").getTime(); const r=XIRR.xirr([-1000,1100],[d0,d1]); return r!=null&&Math.abs(r-.10)<0.02; })(), "~10%");
 3517 |   t("XIRR irregular", (()=>{ const a=new Date("2024-01-01").getTime(),b=new Date("2024-07-01").getTime(),c=new Date("2025-07-01").getTime(); const r=XIRR.xirr([-1000,500,600],[a,b,c]); return r!=null&&r>0; })(), "positive");
 3518 |   t("Bootstrap MC", (()=>{ const r=BootstrapMC.run({initial:100,returns:[.01,-.02,.03,0,.02],horizonYears:1,simulations:1000,seed:5,target:110,stepsPerYear:252}); return r&&r.median>0&&r.pLoss>=0; })(), "runs");
 3519 |   t("Credit ratios FFO/Debt", (()=>{ const cr=creditRatios({debt:1000,cash:200,ebitda:300,ebit:150,interestExpense:30,ffo:180,debtService:100,netIncome:100,danda:80}); return cr&&cr.netDebt===800&&Math.abs(cr.ffoToDebt-.18)<1e-9; })(), "netDebt & ffo");
 3520 |   t("Data freshness", (()=>{ return typeof dataFreshness==="function"; })(), "exists");
 3521 |   t("Model change analysis", (()=>{ App.state.snapshots=[{stockData:{growth:.1,wacc:.09},results:{stock:{valuation:{perShare:105}}}},{stockData:{growth:.1,wacc:.10},results:{stock:{valuation:{perShare:95}}}}]; return typeof modelChangeAnalysis==="function"; })(), "exists");
 3522 |   t("SOTP valuation", (()=>{ App.state.sotp={parts:[{name:"A",value:1000,multiple:1,metric:0},{name:"B",value:500,multiple:1,metric:0}],shares:100}; App.state.stockData={netDebt:100,price:10}; const parts=App.state.sotp.parts; const totalEV=parts.reduce((a,b)=>a+b.value,0); const perShare=(totalEV-100)/100; return perShare===14; })(), "per share");
 3523 |   t("Segment forecast", (()=>{ const segs=[{name:"S1",share:.6,growth:[.1],margin:[.2]},{name:"S2",share:.4,growth:[.15],margin:[.25]}]; const total=1000; const revs=segs.map(s=>total*s.share); const totRev=revs.reduce((a,b)=>a+b,0); return Math.abs(totRev-1000)<1e-9; })(), "shares sum");
 3524 |   t("Earnings trend", (()=>{ return typeof earningsQualityTrend==="function"; })(), "exists");
 3525 |   t("Review queue", (()=>{ App.state.reviewQueue=[]; reviewQueueAdd("critical","Test","Test","why","action","dashboard"); reviewQueueAdd("warning","Test2","Test","why","action","stock"); return App.state.reviewQueue.some(x=>x.sev==="critical"); })(), "adds by severity");
 3526 |   t("Global search", (()=>{ return typeof GlobalSearch.searchAll==="function"&&GlobalSearch.searchAll("wacc").length>=0; })(), "search exists");
 3527 |   t("MC skew/kurtosis", (()=>{ const r=MonteCarlo.run({initial:100,expectedReturn:.1,volatility:.3,horizonYears:1,simulations:2000,seed:5,target:110}); return r.skew!=null&&r.kurtosis!=null; })(), "has moments");
 3528 |   t("SG&A/R&D drivers", (()=>{ const m=FinancialModelEngine.defaults();m.years=1;m.bs0={revenue:1000,debt:0,equity:500,ppne:400};m.growth=[.1];m.margin=[.2];m.tax=[.21];m.capexPct=[.06];m.daPct=[.05];m.dso=[45];m.dio=[45];m.dpo=[40];const o=FinancialModelEngine.build(m,{});return o.income[0].sga>0&&o.income[0].rnd>0&&o.income[0].cogs>0; })(), "cogs/sga/rnd populated");
 3529 |   t("Education examples", (()=>{ return EducationExamples.exampleFor("npv")!=null&&EducationExamples.exampleFor("wacc")!=null; })(), "examples present");
 3530 |   t("XLSX parser", (()=>{ return typeof XlsxParser==="object"&&typeof XlsxParser.inflateRaw==="function"; })(), "parser exists");
 3531 |   /* ---- V5 tests ---- */
 3532 |   t("Data sufficiency separate from quality", (()=>{ const s=DataSufficiency.compute(); return typeof s.overall==="number"&&s.overall>=0&&s.overall<=100&&typeof s.dims==="object"; })(), "separate metric");
 3533 |   t("Accounting quality", (()=>{ return typeof AccountingQuality.defaults==="function"&&Object.keys(AccountingQuality.defaults().items).length>=10; })(), "framework+items");
 3534 |   t("Data provider registry", (()=>{ return DataProviderRegistry.get("manual")!=null&&DataProviderRegistry.list().length>=1; })(), "manual provider");
 3535 |   t("Portfolio constraints", (()=>{ const port={items:[{name:"A",weight:.5,sector:"Tech",assetClass:"equity"},{name:"B",weight:.5,sector:"Tech",assetClass:"equity"}]}; const issues=PortfolioConstraints.check(port,{maxPosition:.3,sectorLimit:.25}); return issues.some(i=>i.sev==="warning"); })(), "detects breach");
 3536 |   t("Risk contribution", (()=>{ const r=RiskContribution.compute({items:[{name:"A",weight:.5,volatility:.2},{name:"B",weight:.5,volatility:.3}]}); return r&&r.rows.length===2&&Math.abs(r.rows.reduce((a,x)=>a+x.riskShare,0)-1)<0.05; })(), "shares sum ~1");
 3537 |   t("Valuation uncertainty", (()=>{ App.state.stockData.price=80; const u=ValuationUncertainty.compute(App.state.stockData); return u&&u.central>0&&u.bear.lo<=u.baseR.mid&&u.baseR.mid<=u.bull.hi; })(), "ordered ranges");
 3538 |   t("Backtest unavailable w/o data", (()=>{ const r=BacktestEngine.run({prices:[]}); return !r.available&&r.reason; })(), "graceful no-data");
 3539 |   t("Model validation score", (()=>{ const v=ModelValidationScore.compute(); return typeof v.overall==="number"&&v.parts.length>=5; })(), "components");
 3540 |   t("Boundary tests", (()=>{ const t=BoundaryTests.run(); return t.length>=8&&t.every(x=>typeof x.ok==="boolean"); })(), "suite runs");
 3541 |   t("Independent checks", (()=>{ const r=IndependentChecks.run(); return r.every(x=>x.match); })(), "dual-path match");
 3542 |   t("Contradiction engine", (()=>{ App.state.thesis={thesis:"strong growth and low leverage",bull:"",bear:""}; App.state.stockData.growth=.03; App.state.results.stock={dcf:{terminalShare:.75},financials:{debtEbitda:4}}; const i=ContradictionEngineV5.detect(); return i.length>=1; })(), "detects mismatch");
 3543 |   t("Forecast accuracy deep", (()=>{ const r=ForecastAccuracyV5.metrics([{forecast:105,actual:100},{forecast:112,actual:110}]); return r&&r.mae>0&&r.rmse>0; })(), "MAE/RMSE");
 3544 |   t("Analysis lifecycle", (()=>{ AnalysisLifecycle.set("MODEL READY","test"); return AnalysisLifecycle.status()==="MODEL READY"; })(), "status set");
 3545 |   t("Analyst signoff", (()=>{ return AnalystSignoff.CHECKLIST.length===10; })(), "checklist");
 3546 |   t("Investment horizon", (()=>{ return InvestmentHorizon.OPTIONS.length>=5; })(), "horizons");
 3547 |   t("Sector templates", (()=>{ return SectorTemplates.metricsFor("Banks")!=null&&SectorTemplates.metricsFor("SaaS / Technology")!=null; })(), "bank+saas");
 3548 |   t("Peer similarity", (()=>{ const p=PeerSimilarity.score([{marketCap:1,growth:.1,margin:.2,roe:.1,multiple:10}]); return p&&p.score>=0; })(), "score");
 3549 |   t("Export package", (()=>{ const j=ExportPackage.build(); return j&&typeof j==="string"&&j.length>10; })(), "builds JSON");
 3550 |   /* ---- V6 remaining-item tests ---- */
 3551 |   t("Walk-forward windows", (()=>{ App.state.history.prices=[]; for(let i=0;i<300;i++)App.state.history.prices.push({date:Date.now()-i*86400000,close:100+i}); const r=WalkForward.run({prices:App.state.history.prices,trainSize:120,testSize:30,initialCapital:100000,transactionCost:.001,slippage:.0005}); return r&&r.available&&r.windows.length>=2; })(), "windows>=2");
 3552 |   t("Research calendar", (()=>{ App.state.researchCalendar={events:[{type:"Earnings",title:"E",date:new Date(Date.now()+3*86400000).toISOString().slice(0,10)}]}; const before=(App.state.reviewQueue||[]).length; ResearchCalendar.render(); return typeof ResearchCalendar.refresh==="function"; })(), "calendar exists");
 3553 |   t("Equal-weight optimizer", (()=>{ const w=PortfolioOptimizers.equalWeight([{name:"A",expectedReturn:.1,volatility:.2},{name:"B",expectedReturn:.1,volatility:.2}]); return w.length===2&&Math.abs(w[0].weight-.5)<1e-9; })(), "equal weight");
 3554 |   t("Min-variance optimizer", (()=>{ const w=PortfolioOptimizers.minimumVariance([{name:"A",expectedReturn:.1,volatility:.2},{name:"B",expectedReturn:.1,volatility:.3}]); return w&&w.length===2&&Math.abs(w.reduce((a,b)=>a+b.weight,0)-1)<.05; })(), "sums to 1");
 3555 |   t("Risk-parity optimizer", (()=>{ const w=PortfolioOptimizers.riskParity([{name:"A",expectedReturn:.1,volatility:.2},{name:"B",expectedReturn:.1,volatility:.4}]); return w&&Math.abs(w.reduce((a,b)=>a+b.weight,0)-1)<.01; })(), "sums to 1");
 3556 |   t("Max-sharpe optimizer", (()=>{ const w=PortfolioOptimizers.maximumSharpe([{name:"A",expectedReturn:.15,volatility:.2},{name:"B",expectedReturn:.05,volatility:.3}]); return w&&w.length===2; })(), "runs");
 3557 |   t("Per-line comparability", (()=>{ const aq=AccountingQuality.defaults();aq.framework="US GAAP";aq.items.capitalizedDevelopment={status:"Actual"};aq.items.leaseLiab={status:"Actual"}; const w=AccountingComparability.warnFor(aq); return w.length>=2; })(), "GAAP warns");
 3558 |   t("Review workflow model", (()=>{ App.state.reviewWorkflow={primaryAnalyst:"A",reviewer:"B",status:"DRAFT",history:[]}; const rw=App.state.reviewWorkflow; return rw.primaryAnalyst==="A"&&Array.isArray(rw.history); })(), "data model");
 3559 |   /* Interface wiring (regression): the top-level action handlers must exist & run. */
 3560 |   t("UI: action handler functions defined (regression)", (()=>{ return typeof decisionReadiness==="function" && typeof reverseDcf==="function" && typeof committeeBuild==="function" && typeof valuationCrossRender==="function"; })(), "valCross/revDcf/committee/readiness");
 3561 |   t("UI: committee_ready decisionReadiness renders a verdict", (()=>{ App.state.results.stock={valuation:{perShare:100},defaultPD:.02,dataQuality:{score:70}}; App.state.stockData={price:100}; App.state.thesis={thesis:"test"}; const r=decisionReadiness(); return /READY|PARTIAL|NOT READY/.test(r); })(), "readiness rendered");
 3562 |   /* ---- Decision Suggestion tests ---- */
 3563 |   t("Decision: stock attractive", (()=>{ const d=DecisionSuggestion.forStock({valuation:{mos:.25},defaultPD:.03,financials:{netMargin:.1,debtEquity:1,currentRatio:2,interestCoverage:8},dcf:{terminalShare:.6},dataQuality:{score:85}}); return d.suggestion==="Potentially Attractive"&&d.reasons.length>=1; })(), "attractive");
 3564 |   t("Decision: stock overvalued", (()=>{ const d=DecisionSuggestion.forStock({valuation:{mos:-.3},defaultPD:.3,financials:{netMargin:-.05,debtEquity:5,currentRatio:.5,interestCoverage:1},dcf:{terminalShare:.8},dataQuality:{score:60}}); return d.suggestion==="Significantly Overvalued"; })(), "overvalued");
 3565 |   t("Decision: bond", (()=>{ const d=DecisionSuggestion.forBond({ytm:.09,defaultEL:.03,macDur:6}); return d.suggestion.indexOf("Attractive")>-1; })(), "bond");
 3566 |   t("Decision: project", (()=>{ const d=DecisionSuggestion.forProject({npv:5000,irr:.15,hurdle:.10,r:.10}); return d.suggestion==="Attractive Project"; })(), "project");
 3567 |   t("Decision: company", (()=>{ const d=DecisionSuggestion.forCompany({roe:.18,debtEquity:.5,currentRatio:2,interestCoverage:8}); return d.suggestion==="Strong Fundamentals"; })(), "company");
 3568 |   t("Decision: risk", (()=>{ const d=DecisionSuggestion.forRisk({defaultPD:.25,altman:{z:1.2,zone:"Distress zone"},disagree:true}); return d.suggestion.indexOf("Elevated")>-1; })(), "risk");
 3569 |   t("Decision render has Why", (()=>{ const h=DecisionSuggestion.render(DecisionSuggestion.forStock({valuation:{mos:.25},defaultPD:.03,financials:{netMargin:.1,debtEquity:1,currentRatio:2,interestCoverage:8},dcf:{terminalShare:.6},dataQuality:{score:85}})); return h.indexOf("Decision Suggestion")>-1&&h.indexOf("Why?")>-1; })(), "render");
 3570 |   /* ---- V7 workspace tests ---- */
 3571 |   t("Position reconciliation", (()=>{ const ws=wsPortfolio(); ws.transactions=[{security:"A",type:"BUY",quantity:100,price:50,fees:5,currency:"EUR"},{security:"A",type:"SELL",quantity:40,price:60,fees:5,currency:"EUR"}]; const c=wsComputePositions(); return c.positions.A.quantity===60&&Math.abs(c.positions.A.realizedPnl-395)<1e-6; })(), "qty+realized");
 3572 |   t("Dividend P&L", (()=>{ const ws=wsPortfolio(); ws.transactions.push({security:"A",type:"DIVIDEND",quantity:2,price:100,currency:"EUR"}); return wsComputePositions().positions.A.divIncome===200; })(), "dividend");
 3573 |   t("Market value & unrealized", (()=>{ const ws=wsPortfolio(); ws.prices={A:55}; const mv=wsMarketValue(); return mv.mv===3300&&Math.abs(mv.unreal-300)<1e-6; })(), "MV+unreal");
 3574 |   t("Target weights & rebalance", (()=>{ const ws=wsPortfolio(); ws.targetWeights={A:{target:.5,min:.4,max:.6}}; const r=wsRebalance(); return r.items.length>=1&&r.proposals.length>=0; })(), "rebalance");
 3575 |   t("Portfolio reconcile", (()=>{ const r=wsReconcile(); return typeof r.ok==="boolean"&&r.txCount>=3; })(), "reconcile");
 3576 |   t("Workspace journal", (()=>{ wsJournalAdd({security:"A",decision:"Buy",price:50}); return wsJournal().entries.length>=1; })(), "journal add");
 3577 |   t("Workspace library", (()=>{ wsLibrary().docs.push({title:"t"}); return wsLibrary().docs.length>=1; })(), "library");
 3578 |   t("Workspace notebook", (()=>{ wsNotebook().notes.push({title:"n",body:"b"}); return wsNotebook().notes.length>=1; })(), "notebook");
 3579 |   t("Cash summary", (()=>{ const c=wsCashSummary(); return typeof c.total==="number"&&typeof c.cash==="number"; })(), "cash");
```

### line 7046

```js
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
 7085 |     // add a container and populate
 7086 |     const out=$("#pfOut"); if(out){ out.insertAdjacentHTML("beforeend",`<div id="pfAdvanced" class="mt"></div>`); portfolioAdvancedRender(); }
 7087 |   };
 7088 |   // also wire a button in portfolioRender if present
 7089 | }
 7090 | 
 7091 | 
 7092 | /* ============================================================
 7093 |    #4 — XIRR (irregular cash flows) + HISTORICAL BOOTSTRAP MC
 7094 |    ============================================================ */
 7095 | 
 7096 | /* ---- XIRR: IRR with non-annual, irregular dates ---- */
 7097 | const XIRR=(()=>{
 7098 |   function xnpv(rate, cashflows, dates){
 7099 |     if(!cashflows||!dates||cashflows.length!==dates.length||!cashflows.length)return null;
 7100 |     const t0=dates[0];
 7101 |     let npv=0;
 7102 |     for(let i=0;i<cashflows.length;i++){
 7103 |       const years=(dates[i]-t0)/(1000*60*60*24*365.25);
 7104 |       npv+=cashflows[i]/Math.pow(1+rate, years);
 7105 |     }
 7106 |     return npv;
 7107 |   }
 7108 |   function xirr(cashflows, dates, guess){
 7109 |     guess=(guess==null?0.1:guess);
 7110 |     const f=r=>xnpv(r,cashflows,dates);
```

### line 7054

```js
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
 7085 |     // add a container and populate
 7086 |     const out=$("#pfOut"); if(out){ out.insertAdjacentHTML("beforeend",`<div id="pfAdvanced" class="mt"></div>`); portfolioAdvancedRender(); }
 7087 |   };
 7088 |   // also wire a button in portfolioRender if present
 7089 | }
 7090 | 
 7091 | 
 7092 | /* ============================================================
 7093 |    #4 — XIRR (irregular cash flows) + HISTORICAL BOOTSTRAP MC
 7094 |    ============================================================ */
 7095 | 
 7096 | /* ---- XIRR: IRR with non-annual, irregular dates ---- */
 7097 | const XIRR=(()=>{
 7098 |   function xnpv(rate, cashflows, dates){
 7099 |     if(!cashflows||!dates||cashflows.length!==dates.length||!cashflows.length)return null;
 7100 |     const t0=dates[0];
 7101 |     let npv=0;
 7102 |     for(let i=0;i<cashflows.length;i++){
 7103 |       const years=(dates[i]-t0)/(1000*60*60*24*365.25);
 7104 |       npv+=cashflows[i]/Math.pow(1+rate, years);
 7105 |     }
 7106 |     return npv;
 7107 |   }
 7108 |   function xirr(cashflows, dates, guess){
 7109 |     guess=(guess==null?0.1:guess);
 7110 |     const f=r=>xnpv(r,cashflows,dates);
 7111 |     // Newton's method with bisection fallback
 7112 |     let r=guess;
 7113 |     for(let i=0;i<100;i++){
 7114 |       const fx=f(r);
 7115 |       if(Math.abs(fx)<1e-7)return r;
 7116 |       const h=1e-4;
 7117 |       const df=(f(r+h)-f(r-h))/(2*h);
 7118 |       if(Math.abs(df)<1e-12)break;
```

### line 7075

```js
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
 7085 |     // add a container and populate
 7086 |     const out=$("#pfOut"); if(out){ out.insertAdjacentHTML("beforeend",`<div id="pfAdvanced" class="mt"></div>`); portfolioAdvancedRender(); }
 7087 |   };
 7088 |   // also wire a button in portfolioRender if present
 7089 | }
 7090 | 
 7091 | 
 7092 | /* ============================================================
 7093 |    #4 — XIRR (irregular cash flows) + HISTORICAL BOOTSTRAP MC
 7094 |    ============================================================ */
 7095 | 
 7096 | /* ---- XIRR: IRR with non-annual, irregular dates ---- */
 7097 | const XIRR=(()=>{
 7098 |   function xnpv(rate, cashflows, dates){
 7099 |     if(!cashflows||!dates||cashflows.length!==dates.length||!cashflows.length)return null;
 7100 |     const t0=dates[0];
 7101 |     let npv=0;
 7102 |     for(let i=0;i<cashflows.length;i++){
 7103 |       const years=(dates[i]-t0)/(1000*60*60*24*365.25);
 7104 |       npv+=cashflows[i]/Math.pow(1+rate, years);
 7105 |     }
 7106 |     return npv;
 7107 |   }
 7108 |   function xirr(cashflows, dates, guess){
 7109 |     guess=(guess==null?0.1:guess);
 7110 |     const f=r=>xnpv(r,cashflows,dates);
 7111 |     // Newton's method with bisection fallback
 7112 |     let r=guess;
 7113 |     for(let i=0;i<100;i++){
 7114 |       const fx=f(r);
 7115 |       if(Math.abs(fx)<1e-7)return r;
 7116 |       const h=1e-4;
 7117 |       const df=(f(r+h)-f(r-h))/(2*h);
 7118 |       if(Math.abs(df)<1e-12)break;
 7119 |       const rNew=r-fx/df;
 7120 |       if(!isFinite(rNew))break;
 7121 |       r=rNew;
 7122 |       if(Math.abs(rNew-r)<1e-9)break;
 7123 |     }
 7124 |     // fallback: bracket scan
 7125 |     for(let i=-50;i<=200;i++){
 7126 |       const a=i/100, b=(i+1)/100;
 7127 |       const fa=f(a), fb=f(b);
 7128 |       if(isFinite(fa)&&isFinite(fb)&&fa*fb<0){
 7129 |         const root=Solvers.bisect(f,a,b,1e-9);
 7130 |         if(root!=null)return root;
 7131 |       }
 7132 |     }
 7133 |     return null;
 7134 |   }
 7135 |   function xirrHTML(cashflows, dates){
 7136 |     const r=xirr(cashflows,dates);
 7137 |     if(r==null)return `<div class="banner warn">XIRR could not be determined — the irregular cash-flow pattern may have no unique root.</div>`;
 7138 |     return `<div class="card"><div class="card-title">XIRR (irregular-period IRR)</div>
 7139 |     <div class="grid g2">${kpi("XIRR",fmt.pct(r,2),"annualized, irregular dates")}</div>
```

## informationRatio — 0 hit(s)

Not located.

## capture — 4 hit(s)

### line 3584

```js
 3572 |   t("Dividend P&L", (()=>{ const ws=wsPortfolio(); ws.transactions.push({security:"A",type:"DIVIDEND",quantity:2,price:100,currency:"EUR"}); return wsComputePositions().positions.A.divIncome===200; })(), "dividend");
 3573 |   t("Market value & unrealized", (()=>{ const ws=wsPortfolio(); ws.prices={A:55}; const mv=wsMarketValue(); return mv.mv===3300&&Math.abs(mv.unreal-300)<1e-6; })(), "MV+unreal");
 3574 |   t("Target weights & rebalance", (()=>{ const ws=wsPortfolio(); ws.targetWeights={A:{target:.5,min:.4,max:.6}}; const r=wsRebalance(); return r.items.length>=1&&r.proposals.length>=0; })(), "rebalance");
 3575 |   t("Portfolio reconcile", (()=>{ const r=wsReconcile(); return typeof r.ok==="boolean"&&r.txCount>=3; })(), "reconcile");
 3576 |   t("Workspace journal", (()=>{ wsJournalAdd({security:"A",decision:"Buy",price:50}); return wsJournal().entries.length>=1; })(), "journal add");
 3577 |   t("Workspace library", (()=>{ wsLibrary().docs.push({title:"t"}); return wsLibrary().docs.length>=1; })(), "library");
 3578 |   t("Workspace notebook", (()=>{ wsNotebook().notes.push({title:"n",body:"b"}); return wsNotebook().notes.length>=1; })(), "notebook");
 3579 |   t("Cash summary", (()=>{ const c=wsCashSummary(); return typeof c.total==="number"&&typeof c.cash==="number"; })(), "cash");
 3580 |   /* ---- V7 item tests (performance, benchmark, notifications, header) ---- */
 3581 |   t("TWR no flows", (()=>{ const s=[{date:Date.now()-30*86400000,mv:100,cashFlow:0},{date:Date.now(),mv:110,cashFlow:0}]; return Math.abs(wsTWR(s)-.10)<.001; })(), "TWR 10%");
 3582 |   t("TWR with flows", (()=>{ const s=[{date:Date.now()-60*86400000,mv:100,cashFlow:0},{date:Date.now()-30*86400000,mv:105,cashFlow:20},{date:Date.now(),mv:120,cashFlow:0}]; const t=wsTWR(s); return isFinite(t); })(), "finite");
 3583 |   t("MWR/XIRR", (()=>{ const s=[{date:Date.now()-60*86400000,mv:100,cashFlow:0},{date:Date.now(),mv:110,cashFlow:0}]; const m=wsMWR(s); return m!=null&&isFinite(m); })(), "mwr");
 3584 |   t("Capture ratios", (()=>{ const c=wsCaptureRatios([.1,.02,-.05,-.03],[.08,.01,-.1,-.05]); return c&&c.upside!=null&&c.beta!=null; })(), "capture");
 3585 |   t("Notifications add", (()=>{ wsNotifyAdd("warning","Test","x",null,null,"low"); return wsNotify().items.length>=1; })(), "notify");
 3586 |   t("Company header", (()=>{ App.state.stockData.price=80; const h=wsCompanyHeader(); return h.indexOf("Fair value")>-1; })(), "header");
 3587 |   t("Performance snapshot", (()=>{ wsPerf().snapshots=[{date:Date.now()-30*86400000,mv:100,cashFlow:0},{date:Date.now(),mv:110,cashFlow:0}]; return Math.abs(wsTWR(wsPerf().snapshots)-.10)<.001; })(), "perf snapshot");
 3588 |   /* ---- V7 FX + attribution tests ---- */
 3589 |   t("FX convert", (()=>{ const ws=wsPortfolio(); ws.fxRates={USD:.9}; return Math.abs(wsFxConvert(100,"USD")-90)<1e-9; })(), "USD->EUR");
 3590 |   t("FX unknown no silent", (()=>{ return wsFxConvert(100,"JPY")===null; })(), "no silent convert");
 3591 |   t("MV with FX", (()=>{ const ws=wsPortfolio(); ws.transactions=[{security:"US",type:"BUY",quantity:10,price:100,currency:"USD"}]; ws.prices={US:110}; ws.fxRates={USD:.9}; wsComputePositions(); return Math.abs(wsMarketValue().mv-(10*110*.9))<1e-6; })(), "MV converted");
 3592 |   t("Attribution eps growth", (()=>{ const r=wsAttributionDecompose({},100,110,10,11,.02,.01); return r&&Math.abs(r.epsGrowth-.1)<1e-9&&r.totalReturn>.1; })(), "eps+total");
 3593 |   t("Attribution multiple change", (()=>{ const r=wsAttributionDecompose({},100,120,10,11,0,0); return r&&r.multChange!=null&&r.multChange>0; })(), "multiple change");
 3594 |   t("FX P&L engine", (()=>{ const r=wsComputeFX(); return Array.isArray(r); })(), "fx pnl");
 3595 |   t("FX P&L computes", (()=>{ const ws=wsPortfolio(); ws.fxRates={USD:1.1}; ws.transactions=[{date:"2024-01-01",security:"X",type:"BUY",quantity:100,price:10,currency:"USD",rateAtTrade:1.0,id:1}]; const c=wsComputeFX().filter(x=>x.currency==="USD"); return c.length===1&&c[0].fxPnl!=null&&Math.abs(c[0].fxPnl-100)<0.01; })(), "qty×price×Δrate");
 3596 |   t("Breadcrumb container present", (()=> !!(document.getElementById&&document.getElementById("breadcrumbs")) )(), "breadcrumbs in DOM");
 3597 |   t("Data Center output containers", (()=>{ try{ datacenterRender(); return !!(document.getElementById("freshnessOut")&&document.getElementById("mappingOut")&&document.getElementById("changeOut")); }catch(e){ return false; } })(), "dc2/dc3/dc4 targets exist");
 3598 |   t("Inbox & timeline render into wsSections", (()=>{ const el=document.getElementById("wsSections"); if(!el)return true; wsInboxRender(); wsTimelineRender(); return (el.innerHTML||"").length>0; })(), "inbox/timeline populated");
 3599 |   t("Analysis guide present", (()=>{ return typeof AnalysisGuide!=="undefined" && Object.keys(AnalysisGuide.GUIDES).length>=20; })(), "20+ analysis views guided");
 3600 |   /* ---- V8 accounting + integrity regression tests ---- */
 3601 |   t("V8 oversell rejected", (()=>{ const ws=wsPortfolio(); ws.transactions=[{id:"TX-a",date:"2024-01-01",security:"A",type:"BUY",quantity:100,price:100,currency:"EUR",timestamp:1}]; const v=wsValidateTransaction({date:"2024-02-01",security:"A",type:"SELL",quantity:150,price:120,currency:"EUR"}); return !v.ok&&v.errors.join(" ").indexOf("exceeds available")>-1; })(), "SELL 150 > 100 rejected");
 3602 |   t("V8 valid sell passes", (()=>{ const ws=wsPortfolio(); ws.transactions=[{id:"TX-a",date:"2024-01-01",security:"A",type:"BUY",quantity:100,price:100,currency:"EUR",timestamp:1}]; return wsValidateTransaction({date:"2024-02-01",security:"A",type:"SELL",quantity:20,price:120,currency:"EUR"}).ok; })(), "SELL 20 <= 100 accepted");
 3603 |   t("V8 sell does not short", (()=>{ const ws=wsPortfolio(); ws.transactions=[{id:"TX-a",date:"2024-01-01",security:"A",type:"BUY",quantity:100,price:100,currency:"EUR",timestamp:1}]; ws.prices={A:120}; wsComputePositions(); const before=ws.holdings.A.quantity; const calc=wsCalculateFromLedger(Object.assign({},ws,{transactions:[{id:"TX-a",date:"2024-01-01",security:"A",type:"BUY",quantity:100,price:100,currency:"EUR",timestamp:1},{id:"TX-b",date:"2024-02-01",security:"A",type:"SELL",quantity:150,price:120,currency:"EUR",timestamp:2}]})); const q=calc.positions.A?calc.positions.A.quantity:0; return q>=0&&q<100; })(), "no negative quantity from oversell");
 3604 |   t("V8 multi-currency MV", (()=>{ const ws=wsPortfolio(); ws.transactions=[{id:"TX-u",date:"2024-01-01",security:"US",type:"BUY",quantity:10,price:100,currency:"USD",rateAtTrade:0.9,timestamp:1}]; ws.prices={US:110}; ws.fxRates={USD:0.9}; wsComputePositions(); return Math.abs(wsMarketValue().mv-(10*110*0.9))<1e-6; })(), "USD position valued in base EUR");
 3605 |   t("V8 cash FX consolidation", (()=>{ const ws=wsPortfolio(); ws.cashAccounts={EUR:{currency:"EUR",balance:10000},USD:{currency:"USD",balance:10000}}; ws.fxRates={USD:0.90}; return Math.abs(wsCashSummary().cash-19000)<1e-6; })(), "EUR 10k + USD 10k@0.90 = 19k");
 3606 |   t("V8 cash missing FX flagged", (()=>{ const ws=wsPortfolio(); ws.cashAccounts={EUR:{currency:"EUR",balance:10000},GBP:{currency:"GBP",balance:1000}}; ws.fxRates={}; const c=wsCashSummary(); return c.missingFxCurrencies.includes("GBP")&&Math.abs(c.cash-10000)<1e-6; })(), "GBP cash excluded without FX");
 3607 |   t("V8 weight base currency", (()=>{ const ws=wsPortfolio(); ws.transactions=[{id:"a",date:"2024",security:"EU",type:"BUY",quantity:1,price:100,currency:"EUR",timestamp:1},{id:"b",date:"2024",security:"US",type:"BUY",quantity:1,price:100,currency:"USD",rateAtTrade:0.9,timestamp:2}]; ws.prices={EU:100,US:100}; ws.fxRates={USD:0.9}; wsComputePositions(); const mv=wsMarketValue(); return Math.abs(wsWeight("EU",mv.mv)-100/190)<1e-6; })(), "EUR weight uses base MV");
 3608 |   t("V8 reconciliation detects tampering", (()=>{ const ws=wsPortfolio(); ws.transactions=[{id:"a",date:"2024",security:"A",type:"BUY",quantity:100,price:100,currency:"EUR",timestamp:1}]; wsComputePositions(); ws.holdings.A.quantity=999; const rec=wsReconcile(); return !rec.ok&&rec.issues.some(i=>i.text.indexOf("Qty mismatch")>-1); })(), "independent reconciliation");
 3609 |   t("V8 chronological ordering", (()=>{ const ws=wsPortfolio(); ws.transactions=[{id:"a",date:"2024-03-01",security:"A",type:"BUY",quantity:50,price:100,currency:"EUR",timestamp:3},{id:"b",date:"2024-01-01",security:"A",type:"BUY",quantity:50,price:100,currency:"EUR",timestamp:1},{id:"c",date:"2024-02-01",security:"A",type:"BUY",quantity:50,price:100,currency:"EUR",timestamp:2}]; const s=wsSortTransactions(ws.transactions); return s[0].date==="2024-01-01"&&s[2].date==="2024-03-01"; })(), "sorted by date");
 3610 |   t("V8 immutable tx id", (()=>{ return /^TX-[0-9]{8}-[0-9]{6}-[0-9]+$/.test(wsGenTxId()); })(), "TX-YYYYMMDD-seq");
 3611 |   t("V8 dividend gross/net", (()=>{ const ws=wsPortfolio(); ws.transactions=[{id:"a",date:"2024",security:"A",type:"DIVIDEND",sharesHeld:80,dividendPerShare:2,withholdingTax:32,currency:"EUR",timestamp:1}]; wsComputePositions(); return Math.abs(ws.holdings.A.divIncome-160)<1e-6&&Math.abs(ws.holdings.A.divNet-128)<1e-6; })(), "gross 160 net 128");
 3612 |   t("V8 schema version unified", (()=>{ return typeof CURRENT_SCHEMA_VERSION==="number"&&CURRENT_SCHEMA_VERSION===3&&StorageManager.CURRENT_SCHEMA_VERSION===3; })(), "single schema version");
 3613 |   t("V8 offline scan verified", (()=>{ try{ const s=OfflineScan.scan(); return s.offlineStatus==="OFFLINE VERIFIED"; }catch(e){ return false; } })(), "no network dependency");
 3614 |   t("V8 DOM no duplicate ids", (()=>{ const ids=[...document.querySelectorAll("[id]")].map(x=>x.id); return ids.length===new Set(ids).size; })(), "0 duplicate IDs");
 3615 |   t("V8 single active nav", (()=>{ return document.querySelectorAll(".navlink.active").length<=1; })(), "<=1 active navlink");
 3616 |   t("V8 workspace round-trip", (()=>{ const ws=wsPortfolio(); ws.transactions=[{id:"TX-20260818-000001-1",date:"2024-01-01",security:"A",type:"BUY",quantity:100,price:100,currency:"EUR",timestamp:1}]; const json=wsExportPackage(); const ok=wsImportPackage(json); return ok&&ok.ok===true; })(), "export then import");
 3617 |   t("V8 import rejects malformed", (()=>{ const r=wsImportPackage(JSON.stringify({type:"NOPE"})); return r.ok===false; })(), "bad package rejected");
 3618 |   /* ---- V8 attribution edge cases (P2 #49) ---- */
 3619 |   t("Attribution: earnings only", (()=>{ const r=wsAttributionDecompose({},100,110,10,11,0,0); return r&&r.epsGrowth!=null&&Math.abs(r.epsGrowth-.1)<1e-9&&r.multChange!=null&&Math.abs(r.multChange)<1e-9; })(), "pure EPS growth");
 3620 |   t("Attribution: multiple only", (()=>{ const r=wsAttributionDecompose({},100,120,10,10,0,0); return r&&r.multChange!=null&&Math.abs(r.multChange-.2)<1e-9&&Math.abs(r.epsGrowth)<1e-9; })(), "pure multiple expansion");
 3621 |   t("Attribution: dividend only", (()=>{ const r=wsAttributionDecompose({},100,100,10,10,.05,0); return r&&r.divContrib!=null&&Math.abs(r.divContrib-.05)<1e-9&&Math.abs(r.totalReturn-.05)<1e-9; })(), "dividend only");
 3622 |   t("Attribution: FX only", (()=>{ const r=wsAttributionDecompose({},100,100,10,10,0,.03); return r&&r.fxContrib!=null&&Math.abs(r.fxContrib-.03)<1e-9; })(), "FX only");
 3623 |   t("Attribution: mixed", (()=>{ const r=wsAttributionDecompose({},100,120,10,11,.02,.01); return r&&r.epsGrowth!=null&&r.multChange!=null&&r.divContrib!=null&&r.fxContrib!=null&&r.totalReturn!=null; })(), "all components present");
 3624 |   t("Attribution: zero EPS", (()=>{ const r=wsAttributionDecompose({},100,120,0,5,0,0); return r&&r.epsGrowth==null&&r.multChange==null; })(), "zero EPS -> no split");
 3625 |   t("Attribution: negative EPS", (()=>{ const r=wsAttributionDecompose({},100,80,-5,-8,0,0); return r&&r.epsGrowth!=null&&r.priceRet<0; })(), "negative EPS");
 3626 |   t("Attribution: missing EPS", (()=>{ const r=wsAttributionDecompose({},100,110,null,null,0,0); return r&&r.epsGrowth==null&&r.priceRet!=null&&Math.abs(r.priceRet-.1)<1e-9; })(), "missing EPS -> price only");
 3627 |   /* ---- V8 TWR/MWR validation (P2 #41-43) ---- */
 3628 |   t("TWR no flows = compounded", (()=>{ const s=[{date:Date.now()-60*86400000,mv:100,cashFlow:0},{date:Date.now()-30*86400000,mv:110,cashFlow:0},{date:Date.now(),mv:121,cashFlow:0}]; return Math.abs(wsTWR(s)-.21)<1e-6; })(), "1.1*1.1-1");
 3629 |   t("TWR removes deposit timing", (()=>{ // underlying returns 10% then 10%; a +10 flow occurs during period 2 (on the last snapshot)
 3630 |     const a=[{date:Date.now()-60*86400000,mv:100,cashFlow:0},{date:Date.now()-30*86400000,mv:110,cashFlow:0},{date:Date.now(),mv:121,cashFlow:0}];
 3631 |     const b=[{date:Date.now()-60*86400000,mv:100,cashFlow:0},{date:Date.now()-30*86400000,mv:110,cashFlow:0},{date:Date.now(),mv:131,cashFlow:10}];
 3632 |     const ta=wsTWR(a),tb=wsTWR(b); return ta!=null&&tb!=null&&Math.abs(ta-.21)<1e-6&&Math.abs(ta-tb)<1e-6; })(), "deposit timing removed");
 3633 |   t("TWR removes withdrawal timing", (()=>{ const a=[{date:Date.now()-60*86400000,mv:100,cashFlow:0},{date:Date.now()-30*86400000,mv:110,cashFlow:0},{date:Date.now(),mv:121,cashFlow:0}];
 3634 |     const b=[{date:Date.now()-60*86400000,mv:100,cashFlow:0},{date:Date.now()-30*86400000,mv:110,cashFlow:0},{date:Date.now(),mv:111,cashFlow:-10}];
 3635 |     const tb=wsTWR(b); return tb!=null&&Math.abs(tb-.21)<1e-6; })(), "withdrawal timing removed");
 3636 |   t("MWR valid and finite", (()=>{ const s=[{date:Date.now()-60*86400000,mv:100,cashFlow:0},{date:Date.now(),mv:110,cashFlow:0}]; const mwr=wsMWR(s); return mwr!=null&&isFinite(mwr)&&mwr>-1&&mwr<2; })(), "MWR finite 100->110");
 3637 |   t("TWR multiple flows linked", (()=>{ const s=[{date:Date.now()-90*86400000,mv:100,cashFlow:0},{date:Date.now()-60*86400000,mv:110,cashFlow:10},{date:Date.now()-30*86400000,mv:140,cashFlow:-5},{date:Date.now(),mv:135,cashFlow:0}]; const t=wsTWR(s); return t!=null&&isFinite(t); })(), "multi-flow TWR finite");
 3638 |   /* ---- V8 benchmark validation (P2 #47) ---- */
 3639 |   t("Benchmark validate frequency mismatch", (()=>{ const now=Date.now(); const snaps=[]; for(let i=0;i<4;i++)snaps.push({date:now-(3-i)*30*86400000,mv:100+i}); const bench=[]; for(let i=0;i<4;i++)bench.push({date:now-(3-i)*1*86400000,level:100+i}); const v=wsBenchmarkValidate(snaps,bench,"EUR"); return v.ok===false&&v.issues.some(i=>/frequenc/i.test(i)); })(), "frequency mismatch flagged");
 3640 |   t("Benchmark validate insufficient obs", (()=>{ const v=wsBenchmarkValidate([{date:1,mv:1},{date:2,mv:2}],[{date:1,level:1},{date:2,level:2}],"EUR"); return v.ok===false; })(), "<4 obs flagged");
 3641 |   t("Benchmark validate currency mismatch", (()=>{ const snaps=[{date:1,mv:1},{date:2,mv:2},{date:3,mv:3},{date:4,mv:4}]; const bench=[{date:1,level:1},{date:2,level:2},{date:3,level:3},{date:4,level:4}]; bench._currency="USD"; const v=wsBenchmarkValidate(snaps,bench,"EUR"); return v.ok===false&&v.issues.some(i=>/currency/i.test(i)); })(), "currency mismatch flagged");
 3642 |   /* ---- V8 Portfolio golden dataset (P0 #68) ----
 3643 |      Base EUR. DEPOSIT 100000; BUY 100 @100 fees 10; SELL 20 @120 fees 5; DIVIDEND 80 @2; plus a USD position 10 @100 with FX 0.90. */
 3644 |   t("V8 golden: deposit+buy", (()=>{ const ws=wsPortfolio(); ws.fxRates={USD:0.90}; ws.transactions=[
 3645 |     {id:"TX-20260818-000001-1",date:"2024-01-01",security:"CASH",type:"DEPOSIT",amount:100000,currency:"EUR",timestamp:1},
 3646 |     {id:"TX-20260818-000002-2",date:"2024-01-02",security:"A",type:"BUY",quantity:100,price:100,fees:10,tax:0,currency:"EUR",timestamp:2}
 3647 |   ]; wsComputePositions(); const h=ws.holdings.A; return h&&Math.abs(h.quantity-100)<1e-9&&Math.abs(h.costBasis-10000)<1e-6&&Math.abs(h.fees-10)<1e-6; })(), "qty 100 cost 10000 fees 10");
 3648 |   t("V8 golden: sell realized pnl", (()=>{ const ws=wsPortfolio(); ws.transactions=[
```

### line 7601

```js
 7589 |    Stored in App.state.analyses[] (persisted to localStorage).
 7590 |    ============================================================ */
 7591 | 
 7592 | /* ---- Save the current full analysis to the library ---- */
 7593 | function saveToLibrary(note){
 7594 |   const s=App.state;
 7595 |   const rec={
 7596 |     id: "A"+String((s.analyses||[]).length+1).padStart(3,"0"),
 7597 |     name: s.currentInvestment.name||"Untitled Analysis",
 7598 |     type: s.currentInvestment.type||"stock",
 7599 |     savedAt: Date.now(), iso:new Date().toISOString(),
 7600 |     note: note||"",
 7601 |     // capture the full analysis state (clean, no circular refs)
 7602 |     currentInvestment: cleanState(s.currentInvestment),
 7603 |     stockData: cleanState(s.stockData),
 7604 |     bondData: cleanState(s.bondData),
 7605 |     projectData: cleanState(s.projectData),
 7606 |     fm: cleanState(s.fm),
 7607 |     thesis: cleanState(s.thesis),
 7608 |     research: cleanState(s.research),
 7609 |     history: { prices: (s.history&&s.history.prices)?s.history.prices.slice(0,2000):[], benchmark:(s.history&&s.history.benchmark)?s.history.benchmark.slice(0,2000):[] },
 7610 |     results: cleanState(s.results),
 7611 |     modelVersion: App.meta.modelVersion,
 7612 |     schemaVersion: App.meta.schemaVersion
 7613 |   };
 7614 |   if(!s.analyses) s.analyses=[];
 7615 |   s.analyses.push(rec);
 7616 |   StorageManager.save();
 7617 |   AuditTrailEngine.record("Library","Analysis","saved",null,rec.name,"Saved to analysis library: "+rec.name);
 7618 |   toast("Analysis saved to library: "+rec.name,"good");
 7619 |   return rec;
 7620 | }
 7621 | function cleanState(obj){
 7622 |   try{ return JSON.parse(JSON.stringify(obj||{}, function(k,v){ if(typeof v==="function")return undefined; if(k==="meta")return undefined; return v; }))||{}; }
 7623 |   catch(e){ return {}; }
 7624 | }
 7625 | 
 7626 | /* ---- Load an analysis from the library back into the app ---- */
 7627 | function loadFromLibrary(idx){
 7628 |   const s=App.state; const rec=s.analyses[idx]; if(!rec)return false;
 7629 |   s.currentInvestment=rec.currentInvestment||{name:rec.name,type:rec.type};
 7630 |   s.stockData=rec.stockData||{}; s.bondData=rec.bondData||{}; s.projectData=rec.projectData||{};
 7631 |   s.fm=rec.fm||{}; s.thesis=rec.thesis||{}; s.research=rec.research||{};
 7632 |   s.history=rec.history||{prices:[],benchmark:[]};
 7633 |   s.results=rec.results||{};
 7634 |   AuditTrailEngine.record("Library","Analysis","loaded",null,rec.name,"Loaded analysis from library: "+rec.name);
 7635 |   StorageManager.save();
 7636 |   applyTheme(); renderAll(); dashboardRender();
 7637 |   return true;
 7638 | }
 7639 | 
 7640 | /* ---- Delete an analysis from the library ---- */
 7641 | function deleteFromLibrary(idx){
 7642 |   const s=App.state; const rec=s.analyses[idx]; if(!rec)return;
 7643 |   if(!confirm("Delete analysis '"+rec.name+"' from the library? This does not affect the current session."))return;
 7644 |   s.analyses.splice(idx,1); StorageManager.save();
 7645 |   AuditTrailEngine.record("Library","Analysis","deleted",null,rec.name,"Deleted analysis from library");
 7646 |   toast("Analysis deleted.","info");
 7647 |   libraryRender();
 7648 | }
 7649 | 
 7650 | /* ---- Compare two library analyses on key metrics ---- */
 7651 | function compareLibraryAnalyses(i,j){
 7652 |   const a=App.state.analyses[i], b=App.state.analyses[j]; if(!a||!b)return null;
 7653 |   const get=(sn,path)=>{ let o=sn; for(const p of path.split(".")){ if(o==null)return null; o=o[p]; } return o; };
 7654 |   const rows=[];
 7655 |   const add=(label,path,fmtf)=>{ const va=get(a,path), vb=get(b,path); if(va==null&&vb==null)return; rows.push({label,va:va!=null?fmtf(va):"—",vb:vb!=null?fmtf(vb):"—"}); };
 7656 |   add("DCF value / share","results.stock.valuation.perShare",fmt.money);
 7657 |   add("Margin of safety","results.stock.valuation.mos",fmt.pct);
 7658 |   add("Default PD","results.stock.defaultPD",fmt.pct);
 7659 |   add("Revenue growth","stockData.growth",fmt.pct);
 7660 |   add("WACC","results.stock.valInputs.wacc",fmt.pct);
 7661 |   add("NPV","results.loan.npv",fmt.money);
 7662 |   return {a,b,rows};
 7663 | }
 7664 | 
 7665 | /* ---- Render the Analysis Library (nav view) ---- */
```

### line 7670

```js
 7658 |   add("Default PD","results.stock.defaultPD",fmt.pct);
 7659 |   add("Revenue growth","stockData.growth",fmt.pct);
 7660 |   add("WACC","results.stock.valInputs.wacc",fmt.pct);
 7661 |   add("NPV","results.loan.npv",fmt.money);
 7662 |   return {a,b,rows};
 7663 | }
 7664 | 
 7665 | /* ---- Render the Analysis Library (nav view) ---- */
 7666 | function libraryRender(){
 7667 |   const s=App.state; const list=s.analyses||[];
 7668 |   const el=$("#libraryOut"); if(!el)return;
 7669 |   let h=`<div class="card"><div class="card-title">Analysis Library <span class="hint">persistent · local</span></div>
 7670 |   <div class="row mb"><button class="btn btn-primary" id="lib_save">Save Current Analysis</button><span class="small dim">Save captures the full model, thesis, research and results to this library (stored locally).</span></div>`;
 7671 |   if(!list.length){
 7672 |     h+=`<div class="banner info">No saved analyses yet. Run an analysis, then click "Save Current Analysis" to add it to your library. Saved analyses persist across sessions.</div></div>`;
 7673 |   } else {
 7674 |     h+=`<div class="tablewrap"><table class="data"><thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Saved</th><th>Note</th><th class="num">DCF</th><th class="num">MoS</th><th></th></tr></thead><tbody>`;
 7675 |     list.forEach((rec,i)=>{
 7676 |       const dcf=rec.results&&rec.results.stock&&rec.results.stock.valuation?rec.results.stock.valuation.perShare:null;
 7677 |       const mos=rec.results&&rec.results.stock&&rec.results.stock.valuation?rec.results.stock.valuation.mos:null;
 7678 |       h+=`<tr><td>${esc(rec.id)}</td><td>${esc(rec.name)}</td><td>${esc(rec.type)}</td><td class="small">${new Date(rec.savedAt).toLocaleString()}</td><td class="small">${esc(rec.note||"—")}</td>
 7679 |       <td class="num">${dcf!=null?fmt.money(dcf):"—"}</td><td class="num ${mos!=null&&mos>=0?'pos':'neg'}">${mos!=null?fmt.pct(mos):"—"}</td>
 7680 |       <td><button class="btn btn-sm" data-lib-load="${i}">Load</button><button class="btn btn-sm btn-danger" data-lib-del="${i}">Delete</button></td></tr>`;
 7681 |     });
 7682 |     h+=`</tbody></table></div>`;
 7683 |     // Compare controls
 7684 |     h+=`<div class="row mt"><span class="small">Compare:</span>
 7685 |       <select id="lib_cmpA">${list.map((r,i)=>`<option value="${i}">${esc(r.name)}</option>`).join("")}</select>
 7686 |       <select id="lib_cmpB">${list.map((r,i)=>`<option value="${i}">${esc(r.name)}</option>`).join("")}</select>
 7687 |       <button class="btn btn-sm" id="lib_cmp">Compare</button></div>
 7688 |       <div id="libCmpOut" class="mt"></div>`;
 7689 |     h+=`</div>`;
 7690 |   }
 7691 |   el.innerHTML=h;
 7692 |   wire("lib_save","click",()=>{ const note=prompt("Optional note for this saved analysis:","")||""; saveToLibrary(note); libraryRender(); });
 7693 |   $$("#libraryOut [data-lib-load]").forEach(b=>b.addEventListener("click",()=>{ loadFromLibrary(Number(b.dataset.libLoad)); toast("Analysis loaded.","good"); libraryRender(); }));
 7694 |   $$("#libraryOut [data-lib-del]").forEach(b=>b.addEventListener("click",()=>deleteFromLibrary(Number(b.dataset.libDel))));
 7695 |   const cmp=$("#lib_cmp"); if(cmp)cmp.addEventListener("click",()=>{ const i=Number($("#lib_cmpA").value), j=Number($("#lib_cmpB").value); const c=compareLibraryAnalyses(i,j); const out=$("#libCmpOut"); if(out)out.innerHTML = c? cmpLibHTML(c): `<div class="banner warn">Select two analyses to compare.</div>`; });
 7696 | }
 7697 | function cmpLibHTML(c){
 7698 |   return `<div class="card"><div class="card-title">Analysis Comparison: ${esc(c.a.name)} vs ${esc(c.b.name)}</div>
 7699 |   <div class="tablewrap"><table class="data"><thead><tr><th>Metric</th><th class="num">${esc(c.a.name)}</th><th class="num">${esc(c.b.name)}</th></tr></thead><tbody>
 7700 |   ${c.rows.map(r=>`<tr><td>${r.label}</td><td class="num">${r.va}</td><td class="num">${r.vb}</td></tr>`).join("")}
 7701 |   </tbody></table></div></div>`;
 7702 | }
 7703 | 
 7704 | /* ---- Wire into nav + dashboard + showLoad ---- */
 7705 | function wireLibrary(){
 7706 |   // Data Center already has dataset stats; add a library section there too.
 7707 |   // Add a command palette entry
 7708 |   CommandPalette.commands.push(
 7709 |     {label:"Open Analysis Library",run:()=>AppInit.go("library")},
 7710 |     {label:"Save to Analysis Library",run:()=>{ saveToLibrary(""); toast("Saved to library.","good"); }}
 7711 |   );
 7712 | }
 7713 | 
 7714 | 
 7715 | /* ============================================================
 7716 |    #1 — REVIEW QUEUE (persistent, actionable, severity-sorted)
 7717 |    Aggregates alerts across modules into one queue with:
 7718 |    severity, issue, affected module, why it matters, action.
 7719 |    ============================================================ */
 7720 | 
 7721 | /* ---- Queue storage: App.state.reviewQueue = [{id,sev,issue,module,why,action,status,t}] ---- */
 7722 | 
 7723 | function reviewQueueRender(){
 7724 |   const q=App.state.reviewQueue||(App.state.reviewQueue=[]);
 7725 |   // Refresh from current model state (add, don't duplicate)
 7726 |   reviewQueueGather();
 7727 |   const counts={critical:0,warning:0,review:0,info:0};
 7728 |   q.forEach(r=>{ if(counts[r.sev]!=null)counts[r.sev]++; });
 7729 |   const total=q.length;
 7730 |   const el=$("#reviewQueueOut"); if(!el)return;
 7731 | 
 7732 |   let h=`<div class="card"><div class="card-title">Review Queue <span class="hint">${total} items</span></div>
 7733 |   <div class="row mb"><span class="small dim">Severity: ${pill("Critical "+counts.critical,counts.critical>0?"bad":"info")} ${pill("Warning "+counts.warning,counts.warning>0?"warn":"info")} ${pill("Review "+counts.review,counts.review>0?"warn":"info")} ${pill("Info "+counts.info,"info")}</span>
 7734 |   <button class="btn btn-sm" id="rq_resolveAll">Resolve All</button><button class="btn btn-sm btn-danger" id="rq_clear">Clear Queue</button></div>`;
```

### line 10324

```js
10312 |     if(!perf.snapshots)perf.snapshots=[]; perf.snapshots.push({date:Date.now(),mv,flow,cashFlow:flow}); StorageManager.save(); AuditTrailEngine.record("Performance","Snapshot","add",null,fmt.money(mv),"Performance snapshot recorded"); wsPerformanceRender(); });
10313 |   $$("#perfOut [data-ps]").forEach(x=>x.addEventListener("click",()=>{ perf.snapshots.splice(Number(x.dataset.ps),1); StorageManager.save(); wsPerformanceRender(); }));
10314 | }
10315 | 
10316 | /* ---- Add performance tab to portfolio view ---- */
10317 | 
10318 | 
10319 | /* ============================================================
10320 |    V7 — ITEM 2: BENCHMARK CAPTURE RATIOS + ATTRIBUTION
10321 |    V7 — ITEM 3: DEDICATED NOTIFICATIONS FEED
10322 |    ============================================================ */
10323 | 
10324 | /* ---- Benchmark capture ratios (upside/downside capture) ---- */
10325 | function wsCaptureRatios(portRet, benchRet, annualFactor){
10326 |   // portRet, benchRet: arrays of aligned periodic returns
10327 |   annualFactor=annualFactor||252;
10328 |   if(!portRet||!benchRet||portRet.length<2||portRet.length!==benchRet.length)return null;
10329 |   const upsP=[]; const upsB=[]; const dnsP=[]; const dnsB=[];
10330 |   for(let i=0;i<portRet.length;i++){
10331 |     if(benchRet[i]>0){ upsP.push(portRet[i]); upsB.push(benchRet[i]); }
10332 |     else if(benchRet[i]<0){ dnsP.push(portRet[i]); dnsB.push(benchRet[i]); }
10333 |   }
10334 |   const sumUpsP=upsP.reduce((a,b)=>a+b,0), sumUpsB=upsB.reduce((a,b)=>a+b,0);
10335 |   const sumDnsP=dnsP.reduce((a,b)=>a+b,0), sumDnsB=dnsB.reduce((a,b)=>a+b,0);
10336 |   const upside= sumUpsB>0? sumUpsP/sumUpsB:null;
10337 |   const downside= sumDnsB<0? sumDnsP/sumDnsB:null;
10338 |   // beta, tracking error, information ratio, alpha
10339 |   const beta=CalcEngine.beta(portRet,benchRet);
10340 |   const te=CalcEngine.stdev(portRet.map((r,i)=>r-benchRet[i]),0);
10341 |   const ir= te>0? (CalcEngine.mean(portRet)-CalcEngine.mean(benchRet))*Math.sqrt(annualFactor)/te:null;
10342 |   const alpha=CalcEngine.alpha(portRet,benchRet,0.02/annualFactor);
10343 |   return {upside,downside,beta,te,ir,alpha,periods:portRet.length};
10344 | }
10345 | 
10346 | /* ---- Benchmark center render ---- */
10347 | function wsBenchmarkRender(){
10348 |   const perf=wsPerf();
10349 |   // benchmark series stored as {date, level}
10350 |   const bench=perf.benchmark||[];
10351 |   // portfolio periodic returns from snapshots
10352 |   const snaps=perf.snapshots||[];
10353 |   let h=`<div class="card"><div class="card-title">Benchmark Center</div>
10354 |   <p class="small dim">Configure a benchmark series (index levels). Capture ratios, alpha, beta and tracking error are computed from aligned periodic returns. Benchmark must be aligned by date, currency, frequency and total-return basis.</p>
10355 |   <div class="fields g3">
10356 |     ${AppUI.frow("Benchmark name","","bm_name",perf.benchName||"")}
10357 |     ${AppUI.frow("Benchmark series (level:date, comma)","","bm_series",(bench.map(b=>b.level+":"+new Date(b.date).toISOString().slice(0,10)).join(", "))||"")}
10358 |   </div>
10359 |   <button class="btn btn-sm mt" id="bm_apply">Apply Benchmark</button>
10360 |   <div id="bmOut" class="mt"></div></div>`;
10361 |   const el=$("#benchOut"); if(el)el.innerHTML=h;
10362 |   const b=$("#bm_apply"); if(b)b.addEventListener("click",()=>{ perf.benchName=$("#bm_name").value;
10363 |     const arr=[]; $("#bm_series").value.split(",").forEach(s=>{ const p=s.split(":"); if(p.length===2){ const d=new Date(p[1]); if(!isNaN(d))arr.push({level:Number(p[0]),date:d.getTime()}); } });
10364 |     perf.benchmark=arr.sort((a,b)=>a.date-b.date); StorageManager.save(); wsBenchmarkRender(); computeBenchmark(); });
10365 |   computeBenchmark();
10366 | }
10367 | /* ---- Benchmark validation (P2 #47) ----
10368 |    Checks alignment, frequency, currency basis, and sufficient observations.
10369 |    Returns {ok, issues}. Mismatch => "BENCHMARK COMPARISON INVALID". */
10370 | function wsBenchmarkValidate(snaps, bench, baseCurrency){
10371 |   const issues=[];
10372 |   if(!snaps||snaps.length<2) issues.push("Need at least two portfolio snapshots.");
10373 |   if(!bench||bench.length<2) issues.push("Need at least two benchmark points.");
10374 |   if(!issues.length){
10375 |     // frequency: median interval of snapshots vs benchmark (days)
10376 |     const medDays=arr=>{ if(!arr||arr.length<2)return null; const d=[]; for(let i=1;i<arr.length;i++){ const x=arr[i].date-arr[i-1].date; if(x>0)d.push(x); } if(!d.length)return null; d.sort((a,b)=>a-b); return d[Math.floor(d.length/2)]/86400000; };
10377 |     const sf=medDays(snaps), bf=medDays(bench);
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
```

