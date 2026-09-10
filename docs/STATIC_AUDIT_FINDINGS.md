# Static Audit Contextual Findings

This file is generated from the deployable `dist/index.html`. Every regex lead from `scripts/static-audit.js` is enumerated with a source line, owner hint, stable fingerprint and contextual disposition. These are review leads, not automatic defects.

- Target: `index.html`
- Total pattern hits: **449**
- Calculation-sensitive / algorithmic-review hits: **231**
- Unclassified hits: **0**

## Counts by pattern

| Pattern | Count |
|---|---:|
| truthy-value checks | 161 |
| Math.round usage | 58 |
| Infinity literals | 14 |
| generic OR zero | 162 |
| toFixed usage | 24 |
| parseInt usage | 3 |
| fallback-to-zero coercions | 23 |
| NaN literals | 4 |

## Counts by contextual disposition

| Disposition | Count |
|---|---:|
| algorithm/parser sentinel | 18 |
| algorithmic rounding | 2 |
| calculation-sensitive numeric fallback | 164 |
| calculation-sensitive presence guard | 65 |
| DOM/object presence guard | 96 |
| general numeric/default fallback | 4 |
| input/parser boundary | 3 |
| parser/default fallback | 3 |
| presentation/UI rounding | 80 |
| UI/default-state fallback | 14 |

## Calculation-sensitive / algorithmic-review leads

### 68dea8f6309f43be — truthy-value checks — line 1047

- Owner hint: `load`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!raw)`
- Source: `const raw=localStorage.getItem(KEY); if(!raw) return null;`

### 85248d165bfabb43 — generic OR zero — line 1123

- Owner hint: `macd`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `function macd(arr,fast=12,slow=26){ const ef=ema(arr,fast), es=ema(arr,slow); const line=arr.map((_,i)=>ef[i]!=null&&es[i]!=null? ef[i]-es[i]:null); return {line, signal:ema(line.filter(x=>x!=null).length?line.map((x,i)=>x==null? (i>0? line.slice(0,i).reduce((s,v)=>s+(v||0),0)/i:0):x):line,9), hist:[]}; }`

### 55f1701428e8a88d — generic OR zero — line 1383

- Owner hint: `compute`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `r.roic=safe(r.ebit*(1-(f.tax||0)), r.equity+r.debt-f.cash);`

### 00b204e3fc45d784 — generic OR zero — line 1385

- Owner hint: `compute`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `r.quickRatio=safe((r.currentAssets-(r.inventory||0)), r.currentLiabilities);`

### 53c513c884dbd631 — truthy-value checks — line 1447

- Owner hint: `ratingPD`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!r)`
- Source: `function ratingPD(rating,horizon,table){ table=table||defaultPDTable; const r=table[rating]; if(!r) return null; return r[horizon]??null; }`

### 2678bef6609ccfc6 — truthy-value checks — line 1558

- Owner hint: `simScore`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!w)`
- Source: `for(const f of FEATURES){ const w=weights[f]; if(!w) continue; const q=query.features[f]; const v=c.features[f]; if(q==null||v==null) continue;`

### 26a5ac875abcd40c — truthy-value checks — line 1559

- Owner hint: `simScore`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!s)`
- Source: `const s=stats[f]; if(!s) continue; const dz=Math.abs((q-s.m)/s.s-(v-s.m)/s.s); sim+=w*Math.exp(-dz); wsum+=w; }`

### 5dda0e5496a9989a — generic OR zero — line 2011

- Owner hint: `score`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const push=(key,label,val,maxVal,minVal)=>{ if(val==null){return;} const w=weights[key]||0; const norm= maxVal-minVal>0? (Math.max(minVal,Math.min(maxVal,val))-minVal)/(maxVal-minVal):.5; s+= w/total*norm*100; detail.push({label,value:val,weight:w,normalized:norm}); };`

### e4635d18736e35bf — generic OR zero — line 2275

- Owner hint: `formFields`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `${AppUI.frow("Dividend per share",App.state.settings.currency,"stk_div",d.dividend||0)}`

### 211ca307a5850b71 — generic OR zero — line 2411

- Owner hint: `debtVal`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `function debtVal(){ const d=App.state.stockData; return d.debt||0; }`

### 2ffa1110ccc19ff5 — generic OR zero — line 2634

- Owner hint: `renderDCFTab`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `terminalMethod:d.terminalMethod||"growth", exitMultiple:d.exitMultiple||8, netDebt:g("dcf_nd")||0, shares:g("dcf_sh")||1, horizon:g("dcf_yr")||5});`

### 6d4456477990b62b — generic OR zero — line 2640

- Owner hint: `renderDCFTab`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `<div id="dcfOutChart" class="mt"></div><div class="mt">${dcfTable({...r,valInputs:{netDebt:g("dcf_nd")||0}})}</div>\`;`

### 1d4cc58ab5735023 — generic OR zero — line 2676

- Owner hint: `renderDDMCompsTab`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `${AppUI.frow("Dividend per share",App.state.settings.currency,"ddm_div",d.dividend||0)}`

### 5c6c328a6ac79d7e — generic OR zero — line 2706

- Owner hint: `renderCapmTab`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `${AppUI.frow("Market value of debt",App.state.settings.currency,"cap_dv",d.debt||0)}`

### ecf8722b676df6c3 — fallback-to-zero coercions — line 2712

- Owner hint: `renderCapmTab`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#cap_ev").value)||0, dv=Number($("#cap_dv").value)||0`
- Source: `const ev=Number($("#cap_ev").value)||0, dv=Number($("#cap_dv").value)||0, cd=Number($("#cap_cd").value)/100, tax=Number($("#cap_tax").value)/100;`

### b8a063c1060babe9 — generic OR zero — line 2712

- Owner hint: `renderCapmTab`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const ev=Number($("#cap_ev").value)||0, dv=Number($("#cap_dv").value)||0, cd=Number($("#cap_cd").value)/100, tax=Number($("#cap_tax").value)/100;`

### b8a063c1060babe9 — generic OR zero — line 2712

- Owner hint: `renderCapmTab`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const ev=Number($("#cap_ev").value)||0, dv=Number($("#cap_dv").value)||0, cd=Number($("#cap_cd").value)/100, tax=Number($("#cap_tax").value)/100;`

### 6e0473dbf4c45a37 — generic OR zero — line 3110

- Owner hint: `renderStatsTab`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const hist={}; r1.forEach(v=>{ const b=Math.floor(v/.1)*.1; hist[b]=(hist[b]||0)+1; });`

### 6140bc2e7003de20 — generic OR zero — line 3243

- Owner hint: `renderScoreTab`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `<div class="grid g2">${["return","safety","valuation","liquidity","historical"].map(k=>\`<div class="sliderrow"><label style="width:130px">${k}</label><input type="range" id="sw_${k}" min="0" max="100" value="${w[k]||0}"><output>${w[k]||0}%</output></div>\`).join("")}</div>`

### 6140bc2e7003de20 — generic OR zero — line 3243

- Owner hint: `renderScoreTab`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `<div class="grid g2">${["return","safety","valuation","liquidity","historical"].map(k=>\`<div class="sliderrow"><label style="width:130px">${k}</label><input type="range" id="sw_${k}" min="0" max="100" value="${w[k]||0}"><output>${w[k]||0}%</output></div>\`).join("")}</div>`

### e9430ab94c979a1b — fallback-to-zero coercions — line 3245

- Owner hint: `renderScoreTab`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#sw_"+k).value)||0`
- Source: `wire("btnScore","click",()=>{ const nw={}; ["return","safety","valuation","liquidity","historical"].forEach(k=>nw[k]=Number($("#sw_"+k).value)||0); const norm=ScoringEngine.normalizeWeights(nw); App.state.scoreWeights=norm; StorageManager.save();`

### 7ea67a2b4a9c8bb4 — generic OR zero — line 3245

- Owner hint: `renderScoreTab`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `wire("btnScore","click",()=>{ const nw={}; ["return","safety","valuation","liquidity","historical"].forEach(k=>nw[k]=Number($("#sw_"+k).value)||0); const norm=ScoringEngine.normalizeWeights(nw); App.state.scoreWeights=norm; StorageManager.save();`

### b57d10c6b07a82df — truthy-value checks — line 4067

- Owner hint: `load`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!snap)`
- Source: `function load(idx){ const s=App.state; const snap=s.snapshots[idx]; if(!snap)return null;`

### cea309b6e32f773f — generic OR zero — line 4305

- Owner hint: `build`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const b0=m.bs0||{}; const rev0=b0.revenue!=null?b0.revenue:(sd.revenue||0);`

### 2d817bc1d7a80227 — generic OR zero — line 4309

- Owner hint: `build`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `let debt0=b0.debt||0, equity=b0.equity|| (b0.assets? b0.assets-b0.liabilities: 0);`

### 666f5955038e04a8 — generic OR zero — line 4310

- Owner hint: `build`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `let ppne=b0.ppne||0, otherAssets=b0.otherAssets||0, otherLiab=b0.otherLiab||0;`

### 666f5955038e04a8 — generic OR zero — line 4310

- Owner hint: `build`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `let ppne=b0.ppne||0, otherAssets=b0.otherAssets||0, otherLiab=b0.otherLiab||0;`

### 666f5955038e04a8 — generic OR zero — line 4310

- Owner hint: `build`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `let ppne=b0.ppne||0, otherAssets=b0.otherAssets||0, otherLiab=b0.otherLiab||0;`

### f66262a1d059263c — generic OR zero — line 4318

- Owner hint: `build`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const liabEq0=(b0.ap||0)+debt0+(b0.ocl||0)+otherLiab+equity;`

### f66262a1d059263c — generic OR zero — line 4318

- Owner hint: `build`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const liabEq0=(b0.ap||0)+debt0+(b0.ocl||0)+otherLiab+equity;`

### 4e7cd1f17b93e3e6 — generic OR zero — line 4361

- Owner hint: `interestCalc`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `function interestCalc(m, debt, i){ const rows=m.debt&&m.debt.rows?m.debt.rows:[]; if(!rows.length) return debt*0.05; const rate=rows[0].rate||0.05; return debt*rate; }`

### 34091e8715725a1e — generic OR zero — line 4366

- Owner hint: `debtSchedule`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `for(let i=0;i<n;i++){ const r=rows[Math.min(i,rows.length-1)]; out.push({y:m.startYear+i, opening:r.opening, rate:r.rate, interest:r.opening*r.rate, repayment:r.repayment||0, ending:Math.max(0,r.opening-(r.repayment||0)), amort:r.amort||0}); }`

### 34091e8715725a1e — generic OR zero — line 4366

- Owner hint: `debtSchedule`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `for(let i=0;i<n;i++){ const r=rows[Math.min(i,rows.length-1)]; out.push({y:m.startYear+i, opening:r.opening, rate:r.rate, interest:r.opening*r.rate, repayment:r.repayment||0, ending:Math.max(0,r.opening-(r.repayment||0)), amort:r.amort||0}); }`

### 34091e8715725a1e — generic OR zero — line 4366

- Owner hint: `debtSchedule`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `for(let i=0;i<n;i++){ const r=rows[Math.min(i,rows.length-1)]; out.push({y:m.startYear+i, opening:r.opening, rate:r.rate, interest:r.opening*r.rate, repayment:r.repayment||0, ending:Math.max(0,r.opening-(r.repayment||0)), amort:r.amort||0}); }`

### 8822ac560bff8cbc — truthy-value checks — line 4495

- Owner hint: `curve`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!rating)`
- Source: `if(!rating)return null;`

### 0c3c73b98994cb6f — generic OR zero — line 4529

- Owner hint: `run`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const base={revenue0:sd.revenue0||sd.revenue, tax:sd.tax||.21, capexPct:sd.capexPct||.06, wcPct:sd.wcPct||.02, dandaPct:sd.dandaPct||.05, wacc:sd.wacc||.09, terminalGrowth:sd.terminalGrowth||.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt||0)-(sd.cash||0)), shares:sd.shares||1, horizon:sd.horizon||5, growth:sd.growth||.1, ebitdaMargin:sd.ebitdaMargin||.2};`

### 0c3c73b98994cb6f — generic OR zero — line 4529

- Owner hint: `run`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const base={revenue0:sd.revenue0||sd.revenue, tax:sd.tax||.21, capexPct:sd.capexPct||.06, wcPct:sd.wcPct||.02, dandaPct:sd.dandaPct||.05, wacc:sd.wacc||.09, terminalGrowth:sd.terminalGrowth||.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt||0)-(sd.cash||0)), shares:sd.shares||1, horizon:sd.horizon||5, growth:sd.growth||.1, ebitdaMargin:sd.ebitdaMargin||.2};`

### c9eddac12faee87a — generic OR zero — line 4571

- Owner hint: `build`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(r&&r.valInputs){ const ri=ValuationEngine.residualIncome(sd.equity||0, (sd.netIncome&&sd.equity)?sd.netIncome/sd.equity:.1, r.costEquity||.1, 5, .1); if(sd.equity){ const mos=ri.value/sd.price-1; methods.push({method:"Residual Income",value:ri.value,upside:mos,confidence:0.5,risk:"Clean-surplus assumptions",appl:"Moderate",src:"book value & ROE"}); } }`

### 3a510ec00507458b — generic OR zero — line 4590

- Owner hint: `driversHTML`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const base={revenue0:sd.revenue0||sd.revenue, tax:sd.tax||.21, capexPct:sd.capexPct||.06, wcPct:sd.wcPct||.02, dandaPct:sd.dandaPct||.05, wacc:sd.wacc||.09, terminalGrowth:sd.terminalGrowth||.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt||0)-(sd.cash||0)), shares:sd.shares||1, horizon:sd.horizon||5, growth:sd.growth||.1, ebitdaMargin:sd.ebitdaMargin||.2};`

### 3a510ec00507458b — generic OR zero — line 4590

- Owner hint: `driversHTML`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const base={revenue0:sd.revenue0||sd.revenue, tax:sd.tax||.21, capexPct:sd.capexPct||.06, wcPct:sd.wcPct||.02, dandaPct:sd.dandaPct||.05, wacc:sd.wacc||.09, terminalGrowth:sd.terminalGrowth||.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt||0)-(sd.cash||0)), shares:sd.shares||1, horizon:sd.horizon||5, growth:sd.growth||.1, ebitdaMargin:sd.ebitdaMargin||.2};`

### 3fdc47743403312a — generic OR zero — line 4592

- Owner hint: `driversHTML`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const test=(label,key,delta)=>{ const a=ValuationEngine.dcf({...base,[key]:(base[key]||0)-delta}).perShare; const b=ValuationEngine.dcf({...base,[key]:(base[key]||0)+delta}).perShare; const impact=Math.abs(b-a)/Math.abs(baseVal||1); rows.push({label,impact}); };`

### 3fdc47743403312a — generic OR zero — line 4592

- Owner hint: `driversHTML`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const test=(label,key,delta)=>{ const a=ValuationEngine.dcf({...base,[key]:(base[key]||0)-delta}).perShare; const b=ValuationEngine.dcf({...base,[key]:(base[key]||0)+delta}).perShare; const impact=Math.abs(b-a)/Math.abs(baseVal||1); rows.push({label,impact}); };`

### 8c0929c15f7976ca — generic OR zero — line 4608

- Owner hint: `build`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const totalW=items.reduce((a,b)=>a+(b.weight||0),0);`

### ac40e4bb8b806f70 — generic OR zero — line 4609

- Owner hint: `build`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const expRet=items.reduce((a,b)=>a+(b.weight/totalW)*((b.expectedReturn)||0),0);`

### 6b9eab8a47edfff1 — generic OR zero — line 4621

- Owner hint: `build`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `items.forEach(b=>{ const w=b.weight/totalW; const k=b.country||"—"; byCountry[k]=(byCountry[k]||0)+w; });`

### ab40ffc4302a8fec — generic OR zero — line 4622

- Owner hint: `build`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `items.forEach(b=>{ const w=b.weight/totalW; const k=b.currency||"—"; byCurr[k]=(byCurr[k]||0)+w; });`

### 13dc4116d056b46e — truthy-value checks — line 4626

- Owner hint: `stress`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!port)`
- Source: `if(!port)return null;`

### 75f623cd56016873 — generic OR zero — line 4628

- Owner hint: `stress`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `port.items.forEach(b=>{ const w=b.weight/port.items.reduce((a,c)=>a+(c.weight||0),0); let shock=0;`

### 4be5cb892a219926 — generic OR zero — line 4630

- Owner hint: `stress`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(cls.includes("equity")||cls.includes("stock")){ shock+=(scenario.eq||0); shock+=(scenario.earnings||0)*0.3; }`

### 4be5cb892a219926 — generic OR zero — line 4630

- Owner hint: `stress`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(cls.includes("equity")||cls.includes("stock")){ shock+=(scenario.eq||0); shock+=(scenario.earnings||0)*0.3; }`

### c13ddec8f8f622de — generic OR zero — line 4631

- Owner hint: `stress`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `else if(cls.includes("bond")||cls.includes("fixed")){ shock+=(scenario.rate||0)*(-(b.volatility||0.05)); shock+=(scenario.bondSpread||0)*(-(b.volatility||0.05)); }`

### c13ddec8f8f622de — generic OR zero — line 4631

- Owner hint: `stress`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `else if(cls.includes("bond")||cls.includes("fixed")){ shock+=(scenario.rate||0)*(-(b.volatility||0.05)); shock+=(scenario.bondSpread||0)*(-(b.volatility||0.05)); }`

### c13ddec8f8f622de — generic OR zero — line 4631

- Owner hint: `stress`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `else if(cls.includes("bond")||cls.includes("fixed")){ shock+=(scenario.rate||0)*(-(b.volatility||0.05)); shock+=(scenario.bondSpread||0)*(-(b.volatility||0.05)); }`

### c13ddec8f8f622de — generic OR zero — line 4631

- Owner hint: `stress`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `else if(cls.includes("bond")||cls.includes("fixed")){ shock+=(scenario.rate||0)*(-(b.volatility||0.05)); shock+=(scenario.bondSpread||0)*(-(b.volatility||0.05)); }`

### 4585fccb6f23c0e2 — generic OR zero — line 4633

- Owner hint: `stress`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `else { shock+=(scenario.eq||0)*0.5; }`

### d89c57f812ee16c8 — generic OR zero — line 4690

- Owner hint: `fmRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `<tr><td>COGS % revenue</td>${fm.cogsPct.map((v,i)=>\`<td><input type="text" value="${((v||0)*100).toFixed(1)}" id="fm_cogs_${i}" style="width:64px"></td>\`).join("")}</tr>`

### 6899a578e2ce29fd — generic OR zero — line 4691

- Owner hint: `fmRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `<tr><td>SG&A % revenue</td>${fm.sgaPct.map((v,i)=>\`<td><input type="text" value="${((v||0)*100).toFixed(1)}" id="fm_sga_${i}" style="width:64px"></td>\`).join("")}</tr>`

### 0f90f342d56fdae1 — generic OR zero — line 4692

- Owner hint: `fmRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `<tr><td>R&D % revenue</td>${fm.rndPct.map((v,i)=>\`<td><input type="text" value="${((v||0)*100).toFixed(1)}" id="fm_rnd_${i}" style="width:64px"></td>\`).join("")}</tr>`

### 9505be0d3a7a4566 — generic OR zero — line 4705

- Owner hint: `fmRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `${(fm.debt.rows||[{name:"Senior Debt",opening:sd.debt||0,rate:.05,repayment:0}]).map((r,i)=>\`<tr data-i="${i}"><td><input type="text" value="${esc(r.name)}" id="d_${i}_n" style="width:120px"></td><td><input type="text" value="${r.opening}" id="d_${i}_o" style="width:90px"></td><td><input type="text" value="${(r.rate*100).toFixed(2)}" id="d_${i}_r" style="width:70px"></td><td><input type="text" value="${r.repayment}" id="d_${i}_p" style="width:90px"></td><td><button class="btn btn-sm btn-danger" data-del="${i}">×</button></td></tr>\`).join("")}`

### 33568d38970b9660 — generic OR zero — line 4713

- Owner hint: `fmRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `${AppUI.frow("Minimum cash",App.state.settings.currency,"cov_mc",fm.covenants.minCash||0)}`

### 4f4c5f10089b6a04 — fallback-to-zero coercions — line 4727

- Owner hint: `readDebt`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#d_"+i+"_o").value)||0`
- Source: `function readDebt(){ const fm=App.state.fm; if(!fm.debt.rows)return; const rows=[]; $$("#debtRows tr[data-i]").forEach(tr=>{ const i=Number(tr.dataset.i); rows.push({name:$("#d_"+i+"_n").value, opening:Number($("#d_"+i+"_o").value)||0, rate:(()=>{const v=Number($("#d_"+i+"_r").value);return Number.isFinite(v)?v/100:.05;})(), repayment:Number($("#d_"+i+"_p").value)||0}); }); fm.debt.rows=rows; }`

### 4f4c5f10089b6a04 — fallback-to-zero coercions — line 4727

- Owner hint: `readDebt`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#d_"+i+"_p").value)||0`
- Source: `function readDebt(){ const fm=App.state.fm; if(!fm.debt.rows)return; const rows=[]; $$("#debtRows tr[data-i]").forEach(tr=>{ const i=Number(tr.dataset.i); rows.push({name:$("#d_"+i+"_n").value, opening:Number($("#d_"+i+"_o").value)||0, rate:(()=>{const v=Number($("#d_"+i+"_r").value);return Number.isFinite(v)?v/100:.05;})(), repayment:Number($("#d_"+i+"_p").value)||0}); }); fm.debt.rows=rows; }`

### 3fdea3997be29629 — generic OR zero — line 4727

- Owner hint: `readDebt`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `function readDebt(){ const fm=App.state.fm; if(!fm.debt.rows)return; const rows=[]; $$("#debtRows tr[data-i]").forEach(tr=>{ const i=Number(tr.dataset.i); rows.push({name:$("#d_"+i+"_n").value, opening:Number($("#d_"+i+"_o").value)||0, rate:(()=>{const v=Number($("#d_"+i+"_r").value);return Number.isFinite(v)?v/100:.05;})(), repayment:Number($("#d_"+i+"_p").value)||0}); }); fm.debt.rows=rows; }`

### 3fdea3997be29629 — generic OR zero — line 4727

- Owner hint: `readDebt`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `function readDebt(){ const fm=App.state.fm; if(!fm.debt.rows)return; const rows=[]; $$("#debtRows tr[data-i]").forEach(tr=>{ const i=Number(tr.dataset.i); rows.push({name:$("#d_"+i+"_n").value, opening:Number($("#d_"+i+"_o").value)||0, rate:(()=>{const v=Number($("#d_"+i+"_r").value);return Number.isFinite(v)?v/100:.05;})(), repayment:Number($("#d_"+i+"_p").value)||0}); }); fm.debt.rows=rows; }`

### e4c383bd2f56679a — fallback-to-zero coercions — line 4730

- Owner hint: `readFMAndRun`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number(e.value)||0`
- Source: `const readArr=(arr,prefix,factor)=>{ const out=[]; for(let i=0;i<n;i++){ const e=$("#"+prefix+"_"+i); out.push(e? (Number(e.value)||0)/factor:0); } return out; };`

### a319ee3d6f4572e3 — generic OR zero — line 4730

- Owner hint: `readFMAndRun`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const readArr=(arr,prefix,factor)=>{ const out=[]; for(let i=0;i<n;i++){ const e=$("#"+prefix+"_"+i); out.push(e? (Number(e.value)||0)/factor:0); } return out; };`

### 8584695c35aee01c — fallback-to-zero coercions — line 4732

- Owner hint: `readFMAndRun`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number(e.value)||0`
- Source: `const readNum=(prefix,factor)=>{ const out=[]; for(let i=0;i<n;i++){ const e=$("#"+prefix+"_"+i); out.push(e? Number(e.value)||0:0); } return out; };`

### de0934d429691f1e — generic OR zero — line 4732

- Owner hint: `readFMAndRun`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const readNum=(prefix,factor)=>{ const out=[]; for(let i=0;i<n;i++){ const e=$("#"+prefix+"_"+i); out.push(e? Number(e.value)||0:0); } return out; };`

### 00a3c9f7e337d757 — truthy-value checks — line 4792

- Owner hint: `whatWouldChange`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!r)`
- Source: `function whatWouldChange(){ const r=App.state.results.stock; if(!r)return \`<div class="small dim">Run Stock Analysis first.</div>\`; const sd=App.state.stockData; if(!sd)return "";`

### 00a3c9f7e337d757 — truthy-value checks — line 4792

- Owner hint: `whatWouldChange`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!sd)`
- Source: `function whatWouldChange(){ const r=App.state.results.stock; if(!r)return \`<div class="small dim">Run Stock Analysis first.</div>\`; const sd=App.state.stockData; if(!sd)return "";`

### e45caab7a86c53c6 — generic OR zero — line 4793

- Owner hint: `whatWouldChange`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const base={revenue0:sd.revenue0||sd.revenue, tax:sd.tax||.21, capexPct:sd.capexPct||.06, wcPct:sd.wcPct||.02, dandaPct:sd.dandaPct||.05, wacc:sd.wacc||.09, terminalGrowth:sd.terminalGrowth||.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt||0)-(sd.cash||0)), shares:sd.shares||1, horizon:sd.horizon||5, growth:sd.growth||.1, ebitdaMargin:sd.ebitdaMargin||.2};`

### e45caab7a86c53c6 — generic OR zero — line 4793

- Owner hint: `whatWouldChange`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const base={revenue0:sd.revenue0||sd.revenue, tax:sd.tax||.21, capexPct:sd.capexPct||.06, wcPct:sd.wcPct||.02, dandaPct:sd.dandaPct||.05, wacc:sd.wacc||.09, terminalGrowth:sd.terminalGrowth||.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt||0)-(sd.cash||0)), shares:sd.shares||1, horizon:sd.horizon||5, growth:sd.growth||.1, ebitdaMargin:sd.ebitdaMargin||.2};`

### 6d48855bf75399e4 — generic OR zero — line 4831

- Owner hint: `riskDashboardHTML`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `<div class="metricline"><span class="l">EAD (net debt)</span><span class="v">${sd&&sd.debt!=null?fmt.money((sd.debt||0)-(sd.cash||0)):"—"}</span></div></div>`

### 6d48855bf75399e4 — generic OR zero — line 4831

- Owner hint: `riskDashboardHTML`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `<div class="metricline"><span class="l">EAD (net debt)</span><span class="v">${sd&&sd.debt!=null?fmt.money((sd.debt||0)-(sd.cash||0)):"—"}</span></div></div>`

### e2058aca023e9bdc — generic OR zero — line 5027

- Owner hint: `assumptions`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `netDebt:A("netDebt", sd.netDebt!=null?sd.netDebt:((sd.debt||0)-(sd.cash||0))),`

### e2058aca023e9bdc — generic OR zero — line 5027

- Owner hint: `assumptions`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `netDebt:A("netDebt", sd.netDebt!=null?sd.netDebt:((sd.debt||0)-(sd.cash||0))),`

### cce24c73902c4ce3 — generic OR zero — line 5033

- Owner hint: `assumptions`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `debt:A("debt", sd.debt||0),`

### 185bd6f48fc5256e — generic OR zero — line 5034

- Owner hint: `assumptions`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `cash:A("cash", sd.cash||0),`

### 4572339a3d8bc9e1 — generic OR zero — line 5035

- Owner hint: `assumptions`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `equity:A("equity", sd.equity||0),`

### a7b0d02159423e6c — generic OR zero — line 5038

- Owner hint: `assumptions`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `dividend:A("dividend", sd.dividend||0),`

### 31e0b1e43feb7279 — generic OR zero — line 5148

- Owner hint: `run`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const re=a.rf+a.beta*a.erp; const V=(a.marketCap||0)+a.debt; const wacc= V>0? (a.marketCap/V)*re + (a.debt/V)*0.05*(1-a.tax) : a.wacc;`

### ea681936e4f12ddb — generic OR zero — line 5320

- Owner hint: `monitor`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `add("Revenue growth","15%",a.revenueGrowth,fmt.pct, Math.abs((a.revenueGrowth||0)-.15)<=.04?"good": Math.abs((a.revenueGrowth||0)-.15)<=.08?"warn":"bad");`

### ea681936e4f12ddb — generic OR zero — line 5320

- Owner hint: `monitor`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `add("Revenue growth","15%",a.revenueGrowth,fmt.pct, Math.abs((a.revenueGrowth||0)-.15)<=.04?"good": Math.abs((a.revenueGrowth||0)-.15)<=.08?"warn":"bad");`

### 9446158c81a2377b — generic OR zero — line 5322

- Owner hint: `monitor`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `add("EBITDA margin","22%",a.ebitdaMargin,fmt.pct, Math.abs((a.ebitdaMargin||0)-.22)<=.03?"good": Math.abs((a.ebitdaMargin||0)-.22)<=.06?"warn":"bad");`

### 9446158c81a2377b — generic OR zero — line 5322

- Owner hint: `monitor`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `add("EBITDA margin","22%",a.ebitdaMargin,fmt.pct, Math.abs((a.ebitdaMargin||0)-.22)<=.03?"good": Math.abs((a.ebitdaMargin||0)-.22)<=.06?"warn":"bad");`

### 0238c085f57b2305 — generic OR zero — line 5448

- Owner hint: `betaAlphaAligned`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const alpha=CalcEngine.alpha(al.matchedReturnsA, al.matchedReturnsB, rfPerPeriod||0);`

### 364a82ac3f0b726d — generic OR zero — line 5461

- Owner hint: `rollingSharpe`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `function rollingSharpe(returns,window,rfPerPeriod){ const out=[]; for(let i=window-1;i<returns.length;i++){ const w=returns.slice(i-window+1,i+1); out.push(CalcEngine.sharpe(w,rfPerPeriod||0)); } return out; }`

### 6cfbe80596b0d543 — truthy-value checks — line 5617

- Owner hint: `build`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!mx)`
- Source: `const mx=ValuationMatrixV2.build(sd); if(!mx)return null;`

### db52eaa89b605d98 — truthy-value checks — line 5996

- Owner hint: `enhanceRisk`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!r)`
- Source: `const r=App.state.results.risk; if(!r)return;`

### 494459f83ee4552b — truthy-value checks — line 5998

- Owner hint: `enhanceRisk`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!target)`
- Source: `if(!target)return;`

### dbec7a73f887cbab — fallback-to-zero coercions — line 6174

- Owner hint: `mcBootstrapRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#"+n).value)||0`
- Source: `const g=n=>Number($("#"+n).value)||0;`

### cbecac37e8f64b77 — generic OR zero — line 6174

- Owner hint: `mcBootstrapRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const g=n=>Number($("#"+n).value)||0;`

### 6c56d3f4e29d355c — fallback-to-zero coercions — line 6220

- Owner hint: `walkForwardRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#"+n)?.value)||0`
- Source: `if(hasHist) wire("wf_run","click",()=>{ const g=n=>Number($("#"+n)?.value)||0;`

### e119a896bc11540e — generic OR zero — line 6220

- Owner hint: `walkForwardRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(hasHist) wire("wf_run","click",()=>{ const g=n=>Number($("#"+n)?.value)||0;`

### 2e058f70a3e0d379 — fallback-to-zero coercions — line 6261

- Owner hint: `backtestRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#"+n)?.value)||0`
- Source: `const g=n=>Number($("#"+n)?.value)||0;`

### dca8b838086e4b7b — generic OR zero — line 6261

- Owner hint: `backtestRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const g=n=>Number($("#"+n)?.value)||0;`

### 47adbf1de86d6c55 — fallback-to-zero coercions — line 6349

- Owner hint: `computeMoatScore`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#rs_moat_"+i)?.value)||0`
- Source: `function computeMoatScore(){ let sum=0;for(let i=0;i<9;i++)sum+=Number($("#rs_moat_"+i)?.value)||0; const sc=Math.round(sum/9); const s=$("#rs_moatScore"); if(s)s.textContent="Competitive Strength (moat) ≈ "+sc+"/100 — requires qualitative rationale."; }`

### 9e4e29dc1e29ac3d — generic OR zero — line 6349

- Owner hint: `computeMoatScore`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `function computeMoatScore(){ let sum=0;for(let i=0;i<9;i++)sum+=Number($("#rs_moat_"+i)?.value)||0; const sc=Math.round(sum/9); const s=$("#rs_moatScore"); if(s)s.textContent="Competitive Strength (moat) ≈ "+sc+"/100 — requires qualitative rationale."; }`

### e8a87b6569fac843 — truthy-value checks — line 6612

- Owner hint: `committeeBuild`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!r)`
- Source: `const r=App.state.results.stock; const sd=App.state.stockData; if(!r)return \`<div class="banner warn">Run the stock analysis first.</div>\`;`

### b2f7ce1188265c17 — truthy-value checks — line 6851

- Owner hint: `committeeMemo`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!r)`
- Source: `const r=App.state.results.stock; const sd=App.state.stockData; if(!r)return \`<div class="banner warn">Run the stock analysis first.</div>\`;`

### e68d4524b7e5bb7e — generic OR zero — line 6976

- Owner hint: `factorExposure`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const totalW=items.reduce((a,b)=>a+(b.weight||0),0);`

### 65077ec2b4240437 — generic OR zero — line 6977

- Owner hint: `factorExposure`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `items.forEach(b=>{ const w=(b.weight||0)/totalW; const t=(b.type||"").toLowerCase();`

### b2b94d772c0f45b7 — generic OR zero — line 7022

- Owner hint: `performanceAttribution`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const totalW=items.reduce((a,b)=>a+(b.weight||0),0);`

### 77f12f8fdb5a75fb — generic OR zero — line 7025

- Owner hint: `performanceAttribution`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const bench=benchmarkRet||0.08;`

### 4d489f7fd76bd4a8 — generic OR zero — line 7026

- Owner hint: `performanceAttribution`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `items.forEach(b=>{ const w=(b.weight||0)/totalW; const r=b.expectedReturn||0;`

### 4d489f7fd76bd4a8 — generic OR zero — line 7026

- Owner hint: `performanceAttribution`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `items.forEach(b=>{ const w=(b.weight||0)/totalW; const r=b.expectedReturn||0;`

### dd48f9b721bb6b6c — truthy-value checks — line 7194

- Owner hint: `creditRatios`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!sd)`
- Source: `if(!sd)return null;`

### da36a337177b32a7 — fallback-to-zero coercions — line 7339

- Owner hint: `segmentForecastRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#seg_"+i+"_share")?.value)||0`
- Source: `const share=Number($("#seg_"+i+"_share")?.value)||0;`

### 55c0bfddd0229fca — generic OR zero — line 7339

- Owner hint: `segmentForecastRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const share=Number($("#seg_"+i+"_share")?.value)||0;`

### f93317b3ef02518e — fallback-to-zero coercions — line 7341

- Owner hint: `segmentForecastRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#seg_"+i+"_g_"+y)?.value)||0`
- Source: `for(let y=0;y<ny;y++){ growth.push((Number($("#seg_"+i+"_g_"+y)?.value)||0)/100); margin.push((Number($("#seg_"+i+"_m_"+y)?.value)||0)/100); }`

### f93317b3ef02518e — fallback-to-zero coercions — line 7341

- Owner hint: `segmentForecastRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#seg_"+i+"_m_"+y)?.value)||0`
- Source: `for(let y=0;y<ny;y++){ growth.push((Number($("#seg_"+i+"_g_"+y)?.value)||0)/100); margin.push((Number($("#seg_"+i+"_m_"+y)?.value)||0)/100); }`

### 7009a99933e66333 — generic OR zero — line 7341

- Owner hint: `segmentForecastRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `for(let y=0;y<ny;y++){ growth.push((Number($("#seg_"+i+"_g_"+y)?.value)||0)/100); margin.push((Number($("#seg_"+i+"_m_"+y)?.value)||0)/100); }`

### 7009a99933e66333 — generic OR zero — line 7341

- Owner hint: `segmentForecastRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `for(let y=0;y<ny;y++){ growth.push((Number($("#seg_"+i+"_g_"+y)?.value)||0)/100); margin.push((Number($("#seg_"+i+"_m_"+y)?.value)||0)/100); }`

### 61285879537bfa9a — generic OR zero — line 7367

- Owner hint: `sotpRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(!sotp.parts.length) sotp.parts=[{name:"Core Business",value:sd.marketCap||0,multiple:10,metric:sd.netIncome||0},{name:"Cash / Investments",value:sd.cash||0,multiple:1,metric:sd.cash||0}];`

### 61285879537bfa9a — generic OR zero — line 7367

- Owner hint: `sotpRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(!sotp.parts.length) sotp.parts=[{name:"Core Business",value:sd.marketCap||0,multiple:10,metric:sd.netIncome||0},{name:"Cash / Investments",value:sd.cash||0,multiple:1,metric:sd.cash||0}];`

### 61285879537bfa9a — generic OR zero — line 7367

- Owner hint: `sotpRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(!sotp.parts.length) sotp.parts=[{name:"Core Business",value:sd.marketCap||0,multiple:10,metric:sd.netIncome||0},{name:"Cash / Investments",value:sd.cash||0,multiple:1,metric:sd.cash||0}];`

### 61285879537bfa9a — generic OR zero — line 7367

- Owner hint: `sotpRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(!sotp.parts.length) sotp.parts=[{name:"Core Business",value:sd.marketCap||0,multiple:10,metric:sd.netIncome||0},{name:"Cash / Investments",value:sd.cash||0,multiple:1,metric:sd.cash||0}];`

### 248f49d2039ff963 — generic OR zero — line 7482

- Owner hint: `mulberry`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `var initial=cfg.initial||100, expectedReturn=cfg.expectedReturn||0, volatility=cfg.volatility||0;`

### 248f49d2039ff963 — generic OR zero — line 7482

- Owner hint: `mulberry`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `var initial=cfg.initial||100, expectedReturn=cfg.expectedReturn||0, volatility=cfg.volatility||0;`

### 172cb085d8326337 — truthy-value checks — line 7628

- Owner hint: `loadFromLibrary`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!rec)`
- Source: `const s=App.state; const rec=s.analyses[idx]; if(!rec)return false;`

### 213efa3ecfec24f4 — truthy-value checks — line 7642

- Owner hint: `deleteFromLibrary`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!rec)`
- Source: `const s=App.state; const rec=s.analyses[idx]; if(!rec)return;`

### 8fb66a2ba5e185b2 — truthy-value checks — line 7835

- Owner hint: `searchAll`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!title)`
- Source: `if(!title)return;`

### f8ce69869ae55e4c — truthy-value checks — line 8018

- Owner hint: `block`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!ex)`
- Source: `const ex=exampleFor(key); if(!ex)return "";`

### 5543a01fdfc9b10c — truthy-value checks — line 8270

- Owner hint: `parseFile`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!sheetKey)`
- Source: `if(!sheetKey)return {ok:false,msg:"No worksheet found in the XLSX file."};`

### d753d41fb2d0b553 — truthy-value checks — line 8456

- Owner hint: `check`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!port)`
- Source: `if(!port)return [];`

### 10fa0bd655891c3a — generic OR zero — line 8458

- Owner hint: `check`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const items=port.items||[]; const totalW=items.reduce((a,b)=>a+(b.weight||0),0)||1;`

### cbcc1736a227b0c9 — generic OR zero — line 8460

- Owner hint: `check`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `items.forEach(b=>{ const w=(b.weight||0)/totalW;`

### 473c4d74ae83b009 — generic OR zero — line 8464

- Owner hint: `check`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const bySector={}; items.forEach(b=>{ const k=b.sector||"Other"; bySector[k]=(bySector[k]||0)+(b.weight||0)/totalW; });`

### 473c4d74ae83b009 — generic OR zero — line 8464

- Owner hint: `check`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const bySector={}; items.forEach(b=>{ const k=b.sector||"Other"; bySector[k]=(bySector[k]||0)+(b.weight||0)/totalW; });`

### 2c4252597794777d — generic OR zero — line 8466

- Owner hint: `check`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const cash=items.filter(b=>(b.assetClass||"").toLowerCase().includes("cash")).reduce((a,b)=>a+(b.weight||0)/totalW,0);`

### f6f16a46f1d835fc — truthy-value checks — line 8478

- Owner hint: `compute`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!port)`
- Source: `if(!port)return null;`

### 11488fa0536fa6ac — generic OR zero — line 8480

- Owner hint: `compute`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const n=items.length; const totalW=items.reduce((a,c)=>a+(c.weight||0),0)||1;`

### a24fd34bb22dc4e8 — generic OR zero — line 8481

- Owner hint: `compute`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const weights=items.map(b=> (b.weight||0)/totalW );`

### c073c2172ab67244 — truthy-value checks — line 9143

- Owner hint: `maximumSharpe`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!mv)`
- Source: `const mv=minimumVariance(items,corr); if(!mv)return null;`

### 74bae0b7c5735202 — generic OR zero — line 9396

- Owner hint: `forProject`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(npv!=null) reasons.push("NPV "+fmt.money(npv)+" at "+fmt.pct(res.r||0)+" discount rate.");`

### 8c62e4ce36ae5371 — generic OR zero — line 9595

- Owner hint: `wsTxSortKey`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const t=tx.timestamp||0;`

### 41401a4db6950c47 — generic OR zero — line 9614

- Owner hint: `wsDividendAmounts`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const withholding= tx.withholdingTax!=null? tx.withholdingTax : (tx.tax||0);`

### e844823d04b7675e — generic OR zero — line 9616

- Owner hint: `wsDividendAmounts`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `return {gross:gross!=null?gross:net, withholding:withholding||0, net};`

### c38ecc1fcf224488 — generic OR zero — line 9652

- Owner hint: `wsCalculateFromLedger`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `cash[cur]-=(cost+(tx.fees||0)+(tx.tax||0));`

### c38ecc1fcf224488 — generic OR zero — line 9652

- Owner hint: `wsCalculateFromLedger`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `cash[cur]-=(cost+(tx.fees||0)+(tx.tax||0));`

### daad4022b3d432ea — generic OR zero — line 9663

- Owner hint: `wsCalculateFromLedger`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `pos.realizedPnl+= proceedsActual-costPortion-(tx.fees||0)-(tx.tax||0);`

### daad4022b3d432ea — generic OR zero — line 9663

- Owner hint: `wsCalculateFromLedger`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `pos.realizedPnl+= proceedsActual-costPortion-(tx.fees||0)-(tx.tax||0);`

### e01952ad7d11de96 — generic OR zero — line 9666

- Owner hint: `wsCalculateFromLedger`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `pos.fees+=(tx.fees||0);`

### b1a0b5db6332e56c — generic OR zero — line 9667

- Owner hint: `wsCalculateFromLedger`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `cash[cur]+=(proceedsActual-(tx.fees||0)-(tx.tax||0));`

### b1a0b5db6332e56c — generic OR zero — line 9667

- Owner hint: `wsCalculateFromLedger`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `cash[cur]+=(proceedsActual-(tx.fees||0)-(tx.tax||0));`

### 125e5475736b1a10 — generic OR zero — line 9672

- Owner hint: `wsCalculateFromLedger`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `pos.divIncome+= da.gross||0;   // gross investment income`

### 2dc7922ad094cc0c — generic OR zero — line 9673

- Owner hint: `wsCalculateFromLedger`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `pos.divNet+= da.net||0;        // net received`

### 6c2244d23ee851f0 — generic OR zero — line 9674

- Owner hint: `wsCalculateFromLedger`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `cash[cur]+=(da.net||0);`

### b5189f9952b351fa — generic OR zero — line 9676

- Owner hint: `wsCalculateFromLedger`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(positions[key]) positions[key].fees+=(tx.amount||0);`

### 9f19d78fd26ec947 — generic OR zero — line 9677

- Owner hint: `wsCalculateFromLedger`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `cash[cur]-=(tx.amount||0);`

### fa2061a24883a0e0 — generic OR zero — line 9679

- Owner hint: `wsCalculateFromLedger`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `cash[cur]+=(tx.amount||0);`

### 9f19d78fd26ec947 — generic OR zero — line 9681

- Owner hint: `wsCalculateFromLedger`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `cash[cur]-=(tx.amount||0);`

### 69b136a4b11ed507 — truthy-value checks — line 9720

- Owner hint: `wsFxConvert`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!m)`
- Source: `function wsFxConvert(amount,currency){ const m=wsFxRateMeta(currency); if(!m)return null; return amount*m.rate; }`

### 11a26dc9ad19a04b — truthy-value checks — line 9729

- Owner hint: `wsMarketValue`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!pg)`
- Source: `if(!pg) return; // price MISSING`

### e8d613d064bf93bf — truthy-value checks — line 9732

- Owner hint: `wsMarketValue`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!fxM)`
- Source: `if(!fxM){ missingFx++; return; }`

### a1fce9062b860717 — truthy-value checks — line 9748

- Owner hint: `wsPositionBaseValue`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!p)`
- Source: `const ws=wsPortfolio(); const p=ws.holdings&&ws.holdings[k]; if(!p)return null;`

### a366b052d64b7799 — truthy-value checks — line 9750

- Owner hint: `wsPositionBaseValue`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!pg)`
- Source: `const pg=wsGetPrice(k, ws); if(!pg)return null;`

### c8d9df3d35a07f0e — generic OR zero — line 9766

- Owner hint: `wsCashSummary`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const bal=ws.cashAccounts[c].balance||0; localCash[c]=bal;`

### 7331411bd7f52c2a — truthy-value checks — line 9803

- Owner hint: `wsReconcile`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!h)`
- Source: `if(!h){ issues.push({sev:"warning",text:"Position "+k+" exists in ledger but not in stored holdings."}); return; }`

### 9c995f91e15ed399 — generic OR zero — line 9805

- Owner hint: `wsReconcile`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(Math.abs((h.costBasis||0)-(d.costBasis||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Cost basis mismatch "+k});`

### 9c995f91e15ed399 — generic OR zero — line 9805

- Owner hint: `wsReconcile`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(Math.abs((h.costBasis||0)-(d.costBasis||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Cost basis mismatch "+k});`

### 487ad4dded53c7b9 — generic OR zero — line 9806

- Owner hint: `wsReconcile`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(Math.abs((h.realizedPnl||0)-(d.realizedPnl||0))>ReconciliationConfig.pnlTolerance) issues.push({sev:"warning",text:"Realized P&L mismatch "+k});`

### 487ad4dded53c7b9 — generic OR zero — line 9806

- Owner hint: `wsReconcile`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(Math.abs((h.realizedPnl||0)-(d.realizedPnl||0))>ReconciliationConfig.pnlTolerance) issues.push({sev:"warning",text:"Realized P&L mismatch "+k});`

### 6bdb761675cd62bf — generic OR zero — line 9807

- Owner hint: `wsReconcile`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(Math.abs((h.divIncome||0)-(d.divIncome||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Dividend mismatch "+k});`

### 6bdb761675cd62bf — generic OR zero — line 9807

- Owner hint: `wsReconcile`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(Math.abs((h.divIncome||0)-(d.divIncome||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Dividend mismatch "+k});`

### 8a655a3c0ed5004b — generic OR zero — line 9808

- Owner hint: `wsReconcile`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(Math.abs((h.fees||0)-(d.fees||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Fees mismatch "+k});`

### 8a655a3c0ed5004b — generic OR zero — line 9808

- Owner hint: `wsReconcile`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `if(Math.abs((h.fees||0)-(d.fees||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Fees mismatch "+k});`

### c199e17927ac0f06 — generic OR zero — line 9812

- Owner hint: `wsReconcile`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const stored=(ws.cashAccounts&&ws.cashAccounts[c]&&ws.cashAccounts[c].balance)||0;`

### 89d4962e99d740d6 — truthy-value checks — line 9825

- Owner hint: `wsValidateTransaction`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!tx)`
- Source: `if(!tx) return {ok:false,errors:["Transaction is empty."]};`

### 9bb24f83ef02c45b — truthy-value checks — line 9885

- Owner hint: `wsUnrealized`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!p)`
- Source: `const p=(wsPortfolio().holdings||{})[security]; if(!p)return null;`

### 68103860d0465217 — fallback-to-zero coercions — line 9927

- Owner hint: `wsPortfolioRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number(p[1])||0`
- Source: `const pa=$("#ws_pricesApply"); if(pa)pa.addEventListener("click",()=>{ const m={}; $("#ws_prices").value.split(",").forEach(s=>{ const p=s.split(":"); if(p.length===2)m[p[0].trim()]=Number(p[1])||0; }); ws.prices=m; StorageManager.save(); wsPortfolioRender(); wsRebalanceRender(); });`

### 6fd31b67bc075719 — generic OR zero — line 9927

- Owner hint: `wsPortfolioRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const pa=$("#ws_pricesApply"); if(pa)pa.addEventListener("click",()=>{ const m={}; $("#ws_prices").value.split(",").forEach(s=>{ const p=s.split(":"); if(p.length===2)m[p[0].trim()]=Number(p[1])||0; }); ws.prices=m; StorageManager.save(); wsPortfolioRender(); wsRebalanceRender(); });`

### 0efd04885b5e6495 — fallback-to-zero coercions — line 10046

- Owner hint: `wsRebalanceRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#tw_target").value)||0)/100,min:(Number($("#tw_min").value)||0`
- Source: `ws.targetWeights[sec]={target:(Number($("#tw_target").value)||0)/100,min:(Number($("#tw_min").value)||0)/100,max:(Number($("#tw_max").value)||100)/100}; StorageManager.save(); wsRebalanceRender(); });`

### e17acd8f9a9033f3 — generic OR zero — line 10046

- Owner hint: `wsRebalanceRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `ws.targetWeights[sec]={target:(Number($("#tw_target").value)||0)/100,min:(Number($("#tw_min").value)||0)/100,max:(Number($("#tw_max").value)||100)/100}; StorageManager.save(); wsRebalanceRender(); });`

### e17acd8f9a9033f3 — generic OR zero — line 10046

- Owner hint: `wsRebalanceRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `ws.targetWeights[sec]={target:(Number($("#tw_target").value)||0)/100,min:(Number($("#tw_min").value)||0)/100,max:(Number($("#tw_max").value)||100)/100}; StorageManager.save(); wsRebalanceRender(); });`

### b8679a8a0d4086d0 — generic OR zero — line 10235

- Owner hint: `wsTWR`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const start=snapshots[i-1].mv||0;`

### 8bb27eff15a3198b — generic OR zero — line 10236

- Owner hint: `wsTWR`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const end=snapshots[i].mv||0;`

### 4dd0c5198455f803 — generic OR zero — line 10237

- Owner hint: `wsTWR`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const flow=snapshots[i].cashFlow||0;`

### 821ca644399e7f27 — generic OR zero — line 10251

- Owner hint: `wsMWR`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `flows.push(-(snapshots[0].mv||0)); dates.push(snapshots[0].date);`

### c478fd71ad8b5240 — generic OR zero — line 10253

- Owner hint: `wsMWR`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `flows.push(-(snapshots[i].cashFlow||0)); dates.push(snapshots[i].date);`

### f7fa270f377916b2 — generic OR zero — line 10256

- Owner hint: `wsMWR`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `flows.push((last.mv||0)); dates.push(last.date);`

### fe0162c57d012017 — fallback-to-zero coercions — line 10311

- Owner hint: `wsPerformanceRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#perf_flow").value)||0`
- Source: `const b=$("#perf_snap"); if(b)b.addEventListener("click",()=>{ const mv=Number($("#perf_mv").value)||wsMarketValue().mv||0; const flow=Number($("#perf_flow").value)||0;`

### 6403974e4b8bb381 — generic OR zero — line 10311

- Owner hint: `wsPerformanceRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const b=$("#perf_snap"); if(b)b.addEventListener("click",()=>{ const mv=Number($("#perf_mv").value)||wsMarketValue().mv||0; const flow=Number($("#perf_flow").value)||0;`

### 6403974e4b8bb381 — generic OR zero — line 10311

- Owner hint: `wsPerformanceRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const b=$("#perf_snap"); if(b)b.addEventListener("click",()=>{ const mv=Number($("#perf_mv").value)||wsMarketValue().mv||0; const flow=Number($("#perf_flow").value)||0;`

### ae766e4fc15b7c10 — truthy-value checks — line 10710

- Owner hint: `wsFreshness`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!asOf)`
- Source: `if(!asOf)return {state:WS_FRESH.MISSING,days:null};`

### aaf66820a02b83c7 — truthy-value checks — line 10725

- Owner hint: `status`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!p)`
- Source: `function status(name){ const p=registered[name]; if(!p)return {connected:false}; return {connected:p.connected||false,source:p.source||"not connected",live:p.live||false}; }`

### bbbd2d99d9b62d44 — fallback-to-zero coercions — line 10756

- Owner hint: `wsMarketDataRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#md_price").value)||0`
- Source: `book[sec]={price:Number($("#md_price").value)||0,currency:$("#md_cur").value,asOf:new Date($("#md_asof").value).getTime(),source:$("#md_src").value||"USER PROVIDED"};`

### 3c5a12d134033665 — generic OR zero — line 10756

- Owner hint: `wsMarketDataRender`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `book[sec]={price:Number($("#md_price").value)||0,currency:$("#md_cur").value,asOf:new Date($("#md_asof").value).getTime(),source:$("#md_src").value||"USER PROVIDED"};`

### 7194c892c86870b2 — truthy-value checks — line 10789

- Owner hint: `save`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!dbOk)`
- Source: `if(!dbOk){ resolve({ok:false,reason:"IndexedDB unavailable — metadata only."}); return; }`

### ec9044d5b0e5e90c — truthy-value checks — line 10800

- Owner hint: `get`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!dbOk)`
- Source: `if(!dbOk){ resolve(null); return; }`

### 3dc6390462c8a8f4 — truthy-value checks — line 10811

- Owner hint: `remove`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!dbOk)`
- Source: `if(!dbOk){ resolve(false); return; }`

### f716299f38dd7884 — truthy-value checks — line 11138

- Owner hint: `wsModeDashboard`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!o)`
- Source: `const o=$("#wsModeOut"); if(!o)return;`

### a2578427e605503f — generic OR zero — line 11884

- Owner hint: `wsPerfRisk`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const sharpe= CalcEngine.sharpe(periodRets,0.02/annualFactor||0.02/252);`

### 19400b41288f81f2 — generic OR zero — line 11885

- Owner hint: `wsPerfRisk`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const sortino= CalcEngine.sortino(periodRets,0.02/annualFactor||0.02/252);`

### 12c3d4d2a08af5ac — fallback-to-zero coercions — line 11959

- Owner hint: `periodReturnsArray`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number($("#pf_flow").value)||0`
- Source: `const b=$("#pf_snap"); if(b)b.addEventListener("click",()=>{ const mv2=Number($("#pf_mv").value)||mv.mv||0; const flow=Number($("#pf_flow").value)||0;`

### 46e2cf57b7f8aae8 — generic OR zero — line 11959

- Owner hint: `periodReturnsArray`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const b=$("#pf_snap"); if(b)b.addEventListener("click",()=>{ const mv2=Number($("#pf_mv").value)||mv.mv||0; const flow=Number($("#pf_flow").value)||0;`

### 46e2cf57b7f8aae8 — generic OR zero — line 11959

- Owner hint: `periodReturnsArray`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const b=$("#pf_snap"); if(b)b.addEventListener("click",()=>{ const mv2=Number($("#pf_mv").value)||mv.mv||0; const flow=Number($("#pf_flow").value)||0;`

### 0f16b9639f7e281d — truthy-value checks — line 12060

- Owner hint: `irr`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!bracket)`
- Source: `function irr(flows){ assertFiniteArray(flows,'flows'); if(flows.length<2||!flows.some(x=>x<0)||!flows.some(x=>x>0))return null; const f=r=>npv(flows,r); const points=[]; for(let i=0;i<=800;i++){ const x=-0.9999+i*(10.9999/800); const y=f(x); if(y!=null&&Number.isFinite(y))points.push([x,y]); } let bracket=null; for(let i=1;i<points.length;i++){ if(points[i-1][1]===0)return points[i-1][0]; if(points[i-1][1]*points[i][1]<0){ bracket=[points[i-1][0],points[i][0]]; break; } } if(!bracket)return null; let [lo,hi]=bracket,flo=f(lo); for(let i=0;i<300;i++){const mid=(lo+hi)/2,fm=f(mid);if(Math.abs(fm)<1e-11)return mid;if(flo*fm<=0)hi=mid;else{lo=mid;flo=fm;}}return (lo+hi)/2; }`

### 281850d60ebd0b14 — toFixed usage — line 12282

- Owner hint: `build`
- Disposition: **algorithmic rounding**
- Match: `.toFixed(`
- Source: `if(marginVariance!=null&&Math.abs(marginVariance)>.005)warnings.push({severity:'CAUTION',code:'FM-MARGIN-001',year:y,message:\`Detailed cost assumptions imply EBITDA margin ${(mar*100).toFixed(2)}%, versus target ${(marginTarget*100).toFixed(2)}%.\`});`

### 281850d60ebd0b14 — toFixed usage — line 12282

- Owner hint: `build`
- Disposition: **algorithmic rounding**
- Match: `.toFixed(`
- Source: `if(marginVariance!=null&&Math.abs(marginVariance)>.005)warnings.push({severity:'CAUTION',code:'FM-MARGIN-001',year:y,message:\`Detailed cost assumptions imply EBITDA margin ${(mar*100).toFixed(2)}%, versus target ${(marginTarget*100).toFixed(2)}%.\`});`

### 6d003cf0dceb9b06 — truthy-value checks — line 12359

- Owner hint: `stressRun`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!base)`
- Source: `if(!base)return null;`

### 6708eebe7019f627 — generic OR zero — line 12412

- Owner hint: `portfolioBuild`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `const add=(obj,key,w)=>obj[key]=(obj[key]||0)+w;`

### c36b68003c41e63d — truthy-value checks — line 12494

- Owner hint: `valuationDrivers`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!base)`
- Source: `if(!base)return null;`

### ff998e764566a608 — truthy-value checks — line 12702

- Owner hint: `solveAssetValue`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!eMid)`
- Source: `const mid=(lo+hi)/2,eMid=mertonEquity(mid,sigmaV,D,r,T);if(!eMid)return null;`

### c5fd04e381eba93b — truthy-value checks — line 12722

- Owner hint: `merton`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!eq)`
- Source: `if(!eq)return {error:'Merton solver produced a non-finite state.',converged:false,pd:null,E,sigmaE,D,r,T};`

### 6f9527b623ced2cb — truthy-value checks — line 12726

- Owner hint: `merton`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!converged)`
- Source: `if(!converged)return {error:'Merton solver did not converge to the requested tolerance.',converged:false,pd:null,V,sigmaV,d1:eq.d1,d2:eq.d2,distanceToDefault:eq.d2,E,sigmaE,D,r,T,iterations,residualEquity,residualVol};`

### 75de0cb65365124b — generic OR zero — line 12732

- Owner hint: `mertonTrace`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `return {iterations:x.iterations||0,converged:!!x.converged,residual:finite(x.residualEquity)?Math.abs(x.residualEquity):null,residualVol:finite(x.residualVol)?Math.abs(x.residualVol):null,distanceToDefault:finite(x.distanceToDefault)?x.distanceToDefault:null,pd:finite(x.pd)?x.pd:null,error:x.error||null};`

### a6ff05064257af02 — truthy-value checks — line 12810

- Owner hint: `preferenceScore`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!normalized)`
- Source: `const normalized=normalizeWeightObject(weights);if(!normalized)return null;`

### 90c3f4df742f9f10 — truthy-value checks — line 12853

- Owner hint: `factorExposure`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!norm)`
- Source: `const norm=normalizeItems(items);if(!norm)return null;`

### 37f18cc5dc266dc0 — truthy-value checks — line 12895

- Owner hint: `riskContribution`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!norm)`
- Source: `const norm=normalizeItems(port.items);if(!norm)return null;`

### db28f0d35ee8b9f9 — truthy-value checks — line 12926

- Owner hint: `minimumVariance`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!cov)`
- Source: `const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;`

### 6ebe1dae9c4d0c49 — truthy-value checks — line 12940

- Owner hint: `maximumSharpe`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!cov)`
- Source: `const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;`

### b48fd9e62be33f6a — truthy-value checks — line 12941

- Owner hint: `maximumSharpe`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!w)`
- Source: `let w=minimumVariance(items,corrMatrix);if(!w)return null;`

### 9363d8354a5cf401 — truthy-value checks — line 12952

- Owner hint: `maximumSharpe`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!improved)`
- Source: `if(!improved){step*=.5;if(step<1e-7)break;}`

### 8fbd131fd8129e71 — truthy-value checks — line 12958

- Owner hint: `riskParity`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!cov)`
- Source: `const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;`

### 21da93e5cada76ee — truthy-value checks — line 12994

- Owner hint: `sumOfParts`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!p)`
- Source: `if(!p)return null;let value=null,source=null;`

### fcafec5d6d68021e — fallback-to-zero coercions — line 13004

- Owner hint: `mulberry32`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `Number(seed)||0`
- Source: `function mulberry32(seed){let a=(Number(seed)||0)>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}`

### 5447e421fae7d39a — generic OR zero — line 13004

- Owner hint: `mulberry32`
- Disposition: **calculation-sensitive numeric fallback**
- Match: `||0`
- Source: `function mulberry32(seed){let a=(Number(seed)||0)>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}`

### 46b95fc05cdf21fb — truthy-value checks — line 13041

- Owner hint: `timeWeightedReturnFromSnapshots`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!returns)`
- Source: `const returns=periodReturnsFromSnapshots(snapshots);if(!returns)return null;`

### 1fbf6e8f8dbc62be — truthy-value checks — line 13169

- Owner hint: `calculateLedger`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!key)`
- Source: `if(!key){warnings.push({index,code:'LEDGER-DIVIDEND-INVALID',message:'Dividend security is missing.'});return;}`

### 039df648b08bacbf — truthy-value checks — line 13170

- Owner hint: `calculateLedger`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!da)`
- Source: `const da=dividendAmounts(tx);if(!da){warnings.push({index,code:'LEDGER-DIVIDEND-INVALID',message:'Invalid dividend transaction skipped.'});return;}`

### 21e5050c4cb0effc — truthy-value checks — line 13198

- Owner hint: `positionUnrealized`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!position)`
- Source: `if(!position)return null;const qty=finite(position.quantity)?position.quantity:position.qty;`

### a4aa547737bc4aa5 — truthy-value checks — line 13243

- Owner hint: `cashSummary`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!Core)`
- Source: `if(!Core){ console.error('Financial certification runtime: FinanceCore missing'); return; }`

### e7ba025a2b25b2f0 — truthy-value checks — line 13247

- Owner hint: `cashSummary`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!ModelCore)`
- Source: `if(!ModelCore)installReport.warnings.push('FinancialModelCore missing; three-statement model is outside the expanded certification boundary.');`

### 66b8cc75af75c7b6 — truthy-value checks — line 13248

- Owner hint: `cashSummary`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!LegacyCore)`
- Source: `if(!LegacyCore)installReport.warnings.push('LegacyCalculationCore missing; stress, portfolio and multi-method valuation remain outside the expanded certification boundary.');`

### 1256fcfbc6727250 — truthy-value checks — line 13249

- Owner hint: `cashSummary`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!RiskCore)`
- Source: `if(!RiskCore)installReport.warnings.push('RiskCreditCore missing; VaR/ES, credit curves, Altman and Merton remain outside the expanded certification boundary.');`

### 3216bf7792f58e74 — truthy-value checks — line 13253

- Owner hint: `cashSummary`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!a)`
- Source: `const a=Core.abbreviate(v); if(!a) return '—';`

### 6b95b77be0e9ccec — truthy-value checks — line 13482

- Owner hint: `top-level/unknown`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!W)`
- Source: `if(!W){console.error('Financial certification runtime: WorkstationCalculationCore missing');return;}`

### fdf36342a9752fb4 — truthy-value checks — line 13531

- Owner hint: `top-level/unknown`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!p)`
- Source: `wsPositionBaseValue=security=>{const ws=typeof wsPortfolio==='function'?wsPortfolio():null,p=ws&&ws.holdings?ws.holdings[security]:null;if(!p)return null;const pg=typeof wsGetPrice==='function'?wsGetPrice(security,ws):null;if(!pg)return null;const fx=typeof wsFxRate==='function'?wsFxRate(p.currency||(typeof wsBaseCurrency==='function'?wsBaseCurrency():'EUR')):null;return L.positionBaseValue(p,pg.price,fx);};`

### fdf36342a9752fb4 — truthy-value checks — line 13531

- Owner hint: `top-level/unknown`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!pg)`
- Source: `wsPositionBaseValue=security=>{const ws=typeof wsPortfolio==='function'?wsPortfolio():null,p=ws&&ws.holdings?ws.holdings[security]:null;if(!p)return null;const pg=typeof wsGetPrice==='function'?wsGetPrice(security,ws):null;if(!pg)return null;const fx=typeof wsFxRate==='function'?wsFxRate(p.currency||(typeof wsBaseCurrency==='function'?wsBaseCurrency():'EUR')):null;return L.positionBaseValue(p,pg.price,fx);};`

### d9fd9e504cb740d8 — truthy-value checks — line 13539

- Owner hint: `top-level/unknown`
- Disposition: **calculation-sensitive presence guard**
- Match: `if(!ws)`
- Source: `wsCashSummary=()=>{const ws=typeof wsPortfolio==='function'?wsPortfolio():null;if(!ws)return null;const mv=typeof wsMarketValue==='function'?wsMarketValue():null;return L.cashSummary(ws.cashAccounts||{},ws.fxRates||{},typeof wsBaseCurrency==='function'?wsBaseCurrency():'EUR',mv&&Number.isFinite(mv.mv)?mv.mv:0);};`

## Complete lead inventory

| Fingerprint | Pattern | Line | Owner | Disposition | Source |
|---|---|---:|---|---|---|
| `02cfc14dcff55d71` | truthy-value checks | 955 | `toast` | DOM/object presence guard | `const host=$("#toastHost"); if(!host) return;` |
| `558cd5c1b866f8ef` | Math.round usage | 963 | `toast` | presentation/UI rounding | `num:(v,dp=2)=>{ if(v==null\|\|!isFinite(v)) return "—"; const d=Math.pow(10,dp); return String(Math.round(v*d)/d).replace(/\B(?=(\d{3})+(?!\d))/g,","); },` |
| `68dea8f6309f43be` | truthy-value checks | 1047 | `load` | calculation-sensitive presence guard | `const raw=localStorage.getItem(KEY); if(!raw) return null;` |
| `871c889e52cbafc0` | Infinity literals | 1101 | `maxDrawdown` | algorithm/parser sentinel | `function maxDrawdown(prices){ let peak=-Infinity, mdd=0, peakI=0, troughI=0, p=0,t=0;` |
| `85248d165bfabb43` | generic OR zero | 1123 | `macd` | calculation-sensitive numeric fallback | `function macd(arr,fast=12,slow=26){ const ef=ema(arr,fast), es=ema(arr,slow); const line=arr.map((_,i)=>ef[i]!=null&&es[i]!=null? ef[i]-es[i]:null); return {line, signal:ema(line.filter(x=>x!=null).length?line.map((x,i)=>x==null? (i>0? line.slice(0,i).reduce((s,v)=>s+(v\|\|0),0)/i:0):x):line,9), hist:[]}; }` |
| `55f1701428e8a88d` | generic OR zero | 1383 | `compute` | calculation-sensitive numeric fallback | `r.roic=safe(r.ebit*(1-(f.tax\|\|0)), r.equity+r.debt-f.cash);` |
| `00b204e3fc45d784` | generic OR zero | 1385 | `compute` | calculation-sensitive numeric fallback | `r.quickRatio=safe((r.currentAssets-(r.inventory\|\|0)), r.currentLiabilities);` |
| `2817d4108ec74e9b` | toFixed usage | 1408 | `altmanZ` | presentation/UI rounding | `return {z,X1,X2,X3,X4,X5,zone,msg:\`Z = ${z.toFixed(2)} (${zone}). The Z-Score is a heuristic, not a guarantee of bankruptcy.\`}; }` |
| `c6dcfed21d5b7e15` | toFixed usage | 1416 | `altmanZPrime` | presentation/UI rounding | `return {z,zone,msg:\`Z'-score = ${z.toFixed(2)} (${zone}). Private/emerging-market variant.\`}; }` |
| `53c513c884dbd631` | truthy-value checks | 1447 | `ratingPD` | calculation-sensitive presence guard | `function ratingPD(rating,horizon,table){ table=table\|\|defaultPDTable; const r=table[rating]; if(!r) return null; return r[horizon]??null; }` |
| `2678bef6609ccfc6` | truthy-value checks | 1558 | `simScore` | calculation-sensitive presence guard | `for(const f of FEATURES){ const w=weights[f]; if(!w) continue; const q=query.features[f]; const v=c.features[f]; if(q==null\|\|v==null) continue;` |
| `26a5ac875abcd40c` | truthy-value checks | 1559 | `simScore` | calculation-sensitive presence guard | `const s=stats[f]; if(!s) continue; const dz=Math.abs((q-s.m)/s.s-(v-s.m)/s.s); sim+=w*Math.exp(-dz); wsum+=w; }` |
| `e41db54fda6bb948` | Math.round usage | 1613 | `run` | presentation/UI rounding | `const dt=1/stepsPerYear; const n=Math.round(horizonYears*stepsPerYear);` |
| `41aec4e20381577e` | Math.round usage | 1929 | `score` | presentation/UI rounding | `const s= total>0? Math.round(score/total*100):0;` |
| `40f4a3788f9db66c` | Math.round usage | 1970 | `overall` | presentation/UI rounding | `parts.robustness={score:Math.round(robustness)};` |
| `5dda0e5496a9989a` | generic OR zero | 2011 | `score` | calculation-sensitive numeric fallback | `const push=(key,label,val,maxVal,minVal)=>{ if(val==null){return;} const w=weights[key]\|\|0; const norm= maxVal-minVal>0? (Math.max(minVal,Math.min(maxVal,val))-minVal)/(maxVal-minVal):.5; s+= w/total*norm*100; detail.push({label,value:val,weight:w,normalized:norm}); };` |
| `8e2bf66e49386591` | Math.round usage | 2017 | `score` | presentation/UI rounding | `return {score:Math.round(s), detail, weights};` |
| `5b6839ccc84a5977` | Infinity literals | 2038 | `lineChart` | algorithm/parser sentinel | `let allMin=Infinity,allMax=-Infinity; for(const s of series){ for(const v of s.data){ if(v!=null&&isFinite(v)){ if(v<allMin)allMin=v; if(v>allMax)allMax=v; } } }` |
| `5b6839ccc84a5977` | Infinity literals | 2038 | `lineChart` | algorithm/parser sentinel | `let allMin=Infinity,allMax=-Infinity; for(const s of series){ for(const v of s.data){ if(v!=null&&isFinite(v)){ if(v<allMin)allMin=v; if(v>allMax)allMax=v; } } }` |
| `168bf7d9b1fbf827` | Infinity literals | 2039 | `lineChart` | algorithm/parser sentinel | `if(allMin===Infinity){allMin=0;allMax=1;}` |
| `38305785436f1094` | Infinity literals | 2064 | `barChart` | algorithm/parser sentinel | `let allMin=Infinity,allMax=-Infinity; for(const s of series) for(const v of s.data){ if(v!=null&&isFinite(v)){allMin=Math.min(allMin,v);allMax=Math.max(allMax,v);} } if(allMin===Infinity){allMin=0;allMax=1;} if(allMin>0)allMin=0; const pad=(allMax-allMin)*.08; allMax+=pad;` |
| `38305785436f1094` | Infinity literals | 2064 | `barChart` | algorithm/parser sentinel | `let allMin=Infinity,allMax=-Infinity; for(const s of series) for(const v of s.data){ if(v!=null&&isFinite(v)){allMin=Math.min(allMin,v);allMax=Math.max(allMax,v);} } if(allMin===Infinity){allMin=0;allMax=1;} if(allMin>0)allMin=0; const pad=(allMax-allMin)*.08; allMax+=pad;` |
| `38305785436f1094` | Infinity literals | 2064 | `barChart` | algorithm/parser sentinel | `let allMin=Infinity,allMax=-Infinity; for(const s of series) for(const v of s.data){ if(v!=null&&isFinite(v)){allMin=Math.min(allMin,v);allMax=Math.max(allMax,v);} } if(allMin===Infinity){allMin=0;allMax=1;} if(allMin>0)allMin=0; const pad=(allMax-allMin)*.08; allMax+=pad;` |
| `290dc3e010ee6d18` | Infinity literals | 2088 | `heatmap` | algorithm/parser sentinel | `let mn=Infinity,mx=-Infinity; for(const row of cells) for(const v of row) if(v!=null&&isFinite(v)){mn=Math.min(mn,v);mx=Math.max(mx,v);} if(mn===Infinity){mn=0;mx=1;}` |
| `290dc3e010ee6d18` | Infinity literals | 2088 | `heatmap` | algorithm/parser sentinel | `let mn=Infinity,mx=-Infinity; for(const row of cells) for(const v of row) if(v!=null&&isFinite(v)){mn=Math.min(mn,v);mx=Math.max(mx,v);} if(mn===Infinity){mn=0;mx=1;}` |
| `290dc3e010ee6d18` | Infinity literals | 2088 | `heatmap` | algorithm/parser sentinel | `let mn=Infinity,mx=-Infinity; for(const row of cells) for(const v of row) if(v!=null&&isFinite(v)){mn=Math.min(mn,v);mx=Math.max(mx,v);} if(mn===Infinity){mn=0;mx=1;}` |
| `feafc897e5f7b411` | Math.round usage | 2098 | `mixColor` | presentation/UI rounding | `function mixColor(a,b,t){ const p=hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]; const ca=p(a),cb=p(b); const lerp=(x,y,u)=>x+(y-x)*u; return "rgb("+Math.round(lerp(ca[0],cb[0],t))+","+Math.round(lerp(ca[1],cb[1],t))+","+Math.round(lerp(ca[2],cb[2],t))+")"; }` |
| `feafc897e5f7b411` | Math.round usage | 2098 | `mixColor` | presentation/UI rounding | `function mixColor(a,b,t){ const p=hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]; const ca=p(a),cb=p(b); const lerp=(x,y,u)=>x+(y-x)*u; return "rgb("+Math.round(lerp(ca[0],cb[0],t))+","+Math.round(lerp(ca[1],cb[1],t))+","+Math.round(lerp(ca[2],cb[2],t))+")"; }` |
| `feafc897e5f7b411` | Math.round usage | 2098 | `mixColor` | presentation/UI rounding | `function mixColor(a,b,t){ const p=hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]; const ca=p(a),cb=p(b); const lerp=(x,y,u)=>x+(y-x)*u; return "rgb("+Math.round(lerp(ca[0],cb[0],t))+","+Math.round(lerp(ca[1],cb[1],t))+","+Math.round(lerp(ca[2],cb[2],t))+")"; }` |
| `cd3fd36a26d9795b` | parseInt usage | 2098 | `mixColor` | input/parser boundary | `function mixColor(a,b,t){ const p=hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]; const ca=p(a),cb=p(b); const lerp=(x,y,u)=>x+(y-x)*u; return "rgb("+Math.round(lerp(ca[0],cb[0],t))+","+Math.round(lerp(ca[1],cb[1],t))+","+Math.round(lerp(ca[2],cb[2],t))+")"; }` |
| `cd3fd36a26d9795b` | parseInt usage | 2098 | `mixColor` | input/parser boundary | `function mixColor(a,b,t){ const p=hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]; const ca=p(a),cb=p(b); const lerp=(x,y,u)=>x+(y-x)*u; return "rgb("+Math.round(lerp(ca[0],cb[0],t))+","+Math.round(lerp(ca[1],cb[1],t))+","+Math.round(lerp(ca[2],cb[2],t))+")"; }` |
| `cd3fd36a26d9795b` | parseInt usage | 2098 | `mixColor` | input/parser boundary | `function mixColor(a,b,t){ const p=hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]; const ca=p(a),cb=p(b); const lerp=(x,y,u)=>x+(y-x)*u; return "rgb("+Math.round(lerp(ca[0],cb[0],t))+","+Math.round(lerp(ca[1],cb[1],t))+","+Math.round(lerp(ca[2],cb[2],t))+")"; }` |
| `e4635d18736e35bf` | generic OR zero | 2275 | `formFields` | calculation-sensitive numeric fallback | `${AppUI.frow("Dividend per share",App.state.settings.currency,"stk_div",d.dividend\|\|0)}` |
| `211ca307a5850b71` | generic OR zero | 2411 | `debtVal` | calculation-sensitive numeric fallback | `function debtVal(){ const d=App.state.stockData; return d.debt\|\|0; }` |
| `2ffa1110ccc19ff5` | generic OR zero | 2634 | `renderDCFTab` | calculation-sensitive numeric fallback | `terminalMethod:d.terminalMethod\|\|"growth", exitMultiple:d.exitMultiple\|\|8, netDebt:g("dcf_nd")\|\|0, shares:g("dcf_sh")\|\|1, horizon:g("dcf_yr")\|\|5});` |
| `6d4456477990b62b` | generic OR zero | 2640 | `renderDCFTab` | calculation-sensitive numeric fallback | `<div id="dcfOutChart" class="mt"></div><div class="mt">${dcfTable({...r,valInputs:{netDebt:g("dcf_nd")\|\|0}})}</div>\`;` |
| `1d4cc58ab5735023` | generic OR zero | 2676 | `renderDDMCompsTab` | calculation-sensitive numeric fallback | `${AppUI.frow("Dividend per share",App.state.settings.currency,"ddm_div",d.dividend\|\|0)}` |
| `5c6c328a6ac79d7e` | generic OR zero | 2706 | `renderCapmTab` | calculation-sensitive numeric fallback | `${AppUI.frow("Market value of debt",App.state.settings.currency,"cap_dv",d.debt\|\|0)}` |
| `ecf8722b676df6c3` | fallback-to-zero coercions | 2712 | `renderCapmTab` | calculation-sensitive numeric fallback | `const ev=Number($("#cap_ev").value)\|\|0, dv=Number($("#cap_dv").value)\|\|0, cd=Number($("#cap_cd").value)/100, tax=Number($("#cap_tax").value)/100;` |
| `b8a063c1060babe9` | generic OR zero | 2712 | `renderCapmTab` | calculation-sensitive numeric fallback | `const ev=Number($("#cap_ev").value)\|\|0, dv=Number($("#cap_dv").value)\|\|0, cd=Number($("#cap_cd").value)/100, tax=Number($("#cap_tax").value)/100;` |
| `b8a063c1060babe9` | generic OR zero | 2712 | `renderCapmTab` | calculation-sensitive numeric fallback | `const ev=Number($("#cap_ev").value)\|\|0, dv=Number($("#cap_dv").value)\|\|0, cd=Number($("#cap_cd").value)/100, tax=Number($("#cap_tax").value)/100;` |
| `3166dc47c0693400` | truthy-value checks | 2754 | `calcBond` | DOM/object presence guard | `const b=App.state.bondData; const g=n=>{const v=$("#"+n)?.value; if(!v)return null; const x=Number(v); return isFinite(x)?x:null;};` |
| `b76397307eebd5d4` | truthy-value checks | 3024 | `renderFamousCases` | DOM/object presence guard | `const p=$("#famousCasesPanel"); if(!p) return;` |
| `c44109ea129b5d6d` | generic OR zero | 3035 | `caseRender` | UI/default-state fallback | `$("#caseProvenanceBanner").innerHTML=\`<b>Case Library: ${esc(ensureCaseDB().length).toLocaleString()} records.</b> This includes <b>${CaseEngineState.syntheticCount\|\|0} synthetic</b> records (generated locally for teaching/testing — <b>not</b> real history) and <b>${CaseEngineState.realCount\|\|0} real historical reference cases</b> (the Ten Most Famous Financial Cases: 1929 crash, Barings, LTCM, Enron, WorldCom, Parmalat, Lehman, Madoff, Wirecard, FTX) sourced from the provided reference study. Real cases are tagged "real-reference" and their numeric features are qualitative estimates from the narrative, not audited financials. You can import more real, properly-sourced data via <b>Import Real Cases</b> (tagged "user-imported").\`;` |
| `c44109ea129b5d6d` | generic OR zero | 3035 | `caseRender` | UI/default-state fallback | `$("#caseProvenanceBanner").innerHTML=\`<b>Case Library: ${esc(ensureCaseDB().length).toLocaleString()} records.</b> This includes <b>${CaseEngineState.syntheticCount\|\|0} synthetic</b> records (generated locally for teaching/testing — <b>not</b> real history) and <b>${CaseEngineState.realCount\|\|0} real historical reference cases</b> (the Ten Most Famous Financial Cases: 1929 crash, Barings, LTCM, Enron, WorldCom, Parmalat, Lehman, Madoff, Wirecard, FTX) sourced from the provided reference study. Real cases are tagged "real-reference" and their numeric features are qualitative estimates from the narrative, not audited financials. You can import more real, properly-sourced data via <b>Import Real Cases</b> (tagged "user-imported").\`;` |
| `6e0473dbf4c45a37` | generic OR zero | 3110 | `renderStatsTab` | calculation-sensitive numeric fallback | `const hist={}; r1.forEach(v=>{ const b=Math.floor(v/.1)*.1; hist[b]=(hist[b]\|\|0)+1; });` |
| `eeef2fa12c9ebfb0` | Math.round usage | 3131 | `renderWeightTab` | presentation/UI rounding | `const rows=Object.entries(w).map(([k,v])=>\`<div class="sliderrow" style="margin-bottom:8px"><label style="width:140px">${k.replace(/([A-Z])/g," $1")}</label><input type="range" id="wt_${k}" min="0" max="50" value="${Math.round(v*100)}"><output>${Math.round(v*100)}%</output></div>\`);` |
| `eeef2fa12c9ebfb0` | Math.round usage | 3131 | `renderWeightTab` | presentation/UI rounding | `const rows=Object.entries(w).map(([k,v])=>\`<div class="sliderrow" style="margin-bottom:8px"><label style="width:140px">${k.replace(/([A-Z])/g," $1")}</label><input type="range" id="wt_${k}" min="0" max="50" value="${Math.round(v*100)}"><output>${Math.round(v*100)}%</output></div>\`);` |
| `39e22cb69e7075e5` | fallback-to-zero coercions | 3136 | `renderWeightTab` | UI/default-state fallback | `const updTotal=()=>{ let t=0; Object.keys(w).forEach(k=>{ t+=(Number($("#wt_"+k)?.value)\|\|0); }); $("#weightTotal").textContent="Total: "+t+"% (will normalize to 100%)"; };` |
| `1e884b03a4a5d668` | generic OR zero | 3136 | `renderWeightTab` | UI/default-state fallback | `const updTotal=()=>{ let t=0; Object.keys(w).forEach(k=>{ t+=(Number($("#wt_"+k)?.value)\|\|0); }); $("#weightTotal").textContent="Total: "+t+"% (will normalize to 100%)"; };` |
| `48b41223718ca9c4` | fallback-to-zero coercions | 3138 | `renderWeightTab` | UI/default-state fallback | `wire("btnSaveW","click",()=>{ const nw={}; Object.keys(w).forEach(k=>{ nw[k]=(Number($("#wt_"+k).value)\|\|0)/100; }); const norm=SimilarityEngine.normalizeWeights(nw); App.state.caseWeights=norm; SimilarityEngine.userWeights=norm; StorageManager.save(); toast("Weights applied (normalized).","good"); });` |
| `dba91aac79b6ec47` | generic OR zero | 3138 | `renderWeightTab` | UI/default-state fallback | `wire("btnSaveW","click",()=>{ const nw={}; Object.keys(w).forEach(k=>{ nw[k]=(Number($("#wt_"+k).value)\|\|0)/100; }); const norm=SimilarityEngine.normalizeWeights(nw); App.state.caseWeights=norm; SimilarityEngine.userWeights=norm; StorageManager.save(); toast("Weights applied (normalized).","good"); });` |
| `6140bc2e7003de20` | generic OR zero | 3243 | `renderScoreTab` | calculation-sensitive numeric fallback | `<div class="grid g2">${["return","safety","valuation","liquidity","historical"].map(k=>\`<div class="sliderrow"><label style="width:130px">${k}</label><input type="range" id="sw_${k}" min="0" max="100" value="${w[k]\|\|0}"><output>${w[k]\|\|0}%</output></div>\`).join("")}</div>` |
| `6140bc2e7003de20` | generic OR zero | 3243 | `renderScoreTab` | calculation-sensitive numeric fallback | `<div class="grid g2">${["return","safety","valuation","liquidity","historical"].map(k=>\`<div class="sliderrow"><label style="width:130px">${k}</label><input type="range" id="sw_${k}" min="0" max="100" value="${w[k]\|\|0}"><output>${w[k]\|\|0}%</output></div>\`).join("")}</div>` |
| `e9430ab94c979a1b` | fallback-to-zero coercions | 3245 | `renderScoreTab` | calculation-sensitive numeric fallback | `wire("btnScore","click",()=>{ const nw={}; ["return","safety","valuation","liquidity","historical"].forEach(k=>nw[k]=Number($("#sw_"+k).value)\|\|0); const norm=ScoringEngine.normalizeWeights(nw); App.state.scoreWeights=norm; StorageManager.save();` |
| `7ea67a2b4a9c8bb4` | generic OR zero | 3245 | `renderScoreTab` | calculation-sensitive numeric fallback | `wire("btnScore","click",()=>{ const nw={}; ["return","safety","valuation","liquidity","historical"].forEach(k=>nw[k]=Number($("#sw_"+k).value)\|\|0); const norm=ScoringEngine.normalizeWeights(nw); App.state.scoreWeights=norm; StorageManager.save();` |
| `17222efada96b16e` | Math.round usage | 3304 | `analystCockpitHeader` | presentation/UI rounding | `const conviction= dataConf!=null? Math.round(Math.min(100,Math.max(0,(mos!=null?50+mos*100:50)*.5+dataConf*.3+modelConf*.2))) : null;` |
| `fc419413ccfd1bb9` | truthy-value checks | 3326 | `datacenterRender` | DOM/object presence guard | `if(!host)return;` |
| `5c9738ca13f0059f` | truthy-value checks | 3346 | `dashboardRender` | DOM/object presence guard | `if(!any){ const d=$("#dashEmpty"); if(d)d.classList.remove("hidden"); const c=$("#dashContent"); if(c)c.classList.add("hidden"); return; }` |
| `565a1b31eb582c02` | truthy-value checks | 3393 | `caseStatsHTML` | DOM/object presence guard | `function caseStatsHTML(){ const cs=App.state.results.cases&&App.state.results.cases.stats; if(!cs) return "";` |
| `80ce2624fdaad966` | Math.round usage | 3418 | `settingsRender` | presentation/UI rounding | `s.defaultDiscountRate=Number($("#set_dr").value)/100\|\|.1; s.defaultSimCount=Math.round(Number($("#set_sim").value))\|\|10000; s.defaultK=Math.round(Number($("#set_k").value))\|\|10; s.caseMode=$("#set_mode").value;` |
| `80ce2624fdaad966` | Math.round usage | 3418 | `settingsRender` | presentation/UI rounding | `s.defaultDiscountRate=Number($("#set_dr").value)/100\|\|.1; s.defaultSimCount=Math.round(Number($("#set_sim").value))\|\|10000; s.defaultK=Math.round(Number($("#set_k").value))\|\|10; s.caseMode=$("#set_mode").value;` |
| `4e5066778d0cd15e` | truthy-value checks | 3429 | `reportList` | DOM/object presence guard | `if(!has){ const o=$("#reportOutput"); if(o)o.innerHTML=\`<div class="card"><div class="banner warn">No analysis results to report yet. Run at least one analysis module first.</div></div>\`; return; }` |
| `0847b330a4a5a0bd` | truthy-value checks | 3598 | `runTests` | DOM/object presence guard | `t("Inbox & timeline render into wsSections", (()=>{ const el=document.getElementById("wsSections"); if(!el)return true; wsInboxRender(); wsTimelineRender(); return (el.innerHTML\|\|"").length>0; })(), "inbox/timeline populated");` |
| `f8bb25643b4baa72` | truthy-value checks | 3730 | `top-level/unknown` | DOM/object presence guard | `t("V8 render: core analysis views", (()=>{ const hasDom=!!document.querySelector("#view-stock"); if(!hasDom)return true; const fns=[stockRender,bondRender,loanRender,companyRender,caseRender,scenarioRender,mcRender,compareRender,fmRender,stressRender,forecastRender,backtestRender,researchRender]; let ok=true; try{ fns.forEach(fn=>fn()); }catch(e){ ok=false; } return ok; })(), "all analysis render fns run");` |
| `a66e3ada5d8ea419` | truthy-value checks | 3885 | `init` | DOM/object presence guard | `$("#csvImportFile").addEventListener("change",e=>{ const f=e.target.files[0]; if(!f)return; const isXlsx=/\.xlsx$/i.test(f.name);` |
| `26d95ace0b071600` | truthy-value checks | 3889 | `init` | DOM/object presence guard | `$("#benchImportFile").addEventListener("change",e=>{ const f=e.target.files[0]; if(!f)return; const reader=new FileReader(); reader.onload=()=>{ const r=CsvParser.importPriceSeries(reader.result,null); if(!r.ok){toast("CSV error: "+r.msg,"bad");return;} App.state.history.benchmark=r.series; StorageManager.save(); toast("Benchmark imported.","good"); renderCSVTab(); }; reader.readAsText(f); });` |
| `ba9d9b020f04c1fa` | truthy-value checks | 3890 | `init` | DOM/object presence guard | `$("#userCasesFile").addEventListener("change",e=>{ const f=e.target.files[0]; if(!f)return; importUserCases(f); });` |
| `7ecec5fd8fe2cea2` | truthy-value checks | 3893 | `init` | DOM/object presence guard | `$("#importAllFile").addEventListener("change",e=>{ const f=e.target.files[0]; if(!f)return; const reader=new FileReader(); reader.onload=()=>{ try{ if(StorageManager.importAll(reader.result)){ StorageManager.save(); toast("Data imported.","good"); AppInit.go("dashboard"); dashboardRender(); } else toast("Invalid JSON.","bad"); }catch(err){ toast("Import failed: "+err.message,"bad"); } }; reader.readAsText(f); });` |
| `abf7f497e93da1c3` | truthy-value checks | 3895 | `init` | DOM/object presence guard | `$("#importAnalysisFile").addEventListener("change",e=>{ const f=e.target.files[0]; if(!f)return; const reader=new FileReader(); reader.onload=()=>{ try{ const d=JSON.parse(reader.result); App.state.currentInvestment=d.currentInvestment\|\|App.state.currentInvestment; App.state.stockData=d.stockData\|\|App.state.stockData; App.state.bondData=d.bondData\|\|App.state.bondData; App.state.projectData=d.projectData\|\|App.state.projectData; App.state.history=d.history\|\|App.state.history; StorageManager.save(); toast("Analysis imported.","good"); AppInit.go("stock"); stockRender(); }catch(err){toast("Import failed.","bad");} }; reader.readAsText(f); });` |
| `9c9e9353940c6030` | truthy-value checks | 3906 | `init` | DOM/object presence guard | `wire("btnExportReportHtml","click",()=>{ const rp=$("#reportOutput"); if(!rp)return; const el=rp.querySelector(".report-page"); if(el){ download("financial-report.html","<!DOCTYPE html><html><head><meta charset='utf-8'><title>Financial Report</title><style>body{font-family:sans-serif;color:#111;max-width:820px;margin:0 auto;padding:20px}.report-section{padding:20px 0;border-bottom:1px solid #ddd}h2{font-size:1.1rem;border-bottom:1px solid #ccc;padding-bottom:6px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #ddd;padding:6px;text-align:left}.report-cover{padding:40px 30px;background:#f5f7fa}</style></head><body>"+el.outerHTML+"</body></html>"); toast("Report exported as HTML.","good"); } });` |
| `b57d10c6b07a82df` | truthy-value checks | 4067 | `load` | calculation-sensitive presence guard | `function load(idx){ const s=App.state; const snap=s.snapshots[idx]; if(!snap)return null;` |
| `4cc9eca4b2f6b2ab` | truthy-value checks | 4089 | `compare` | DOM/object presence guard | `const va=g(a,m.path), vb=g(b,m.path); const has=va!=null\|\|vb!=null; if(!has)return null;` |
| `db5a1a143dac006c` | Math.round usage | 4199 | `compute` | presentation/UI rounding | `dims.completeness= compTotal? Math.round(compScore/compTotal*100):0;` |
| `8ffbdb1bea4cdeaa` | Math.round usage | 4207 | `compute` | presentation/UI rounding | `dims.coverage= s.history&&s.history.prices? Math.min(100,Math.round(s.history.prices.length/5)):0;` |
| `a6d38ac0e2de88f4` | Math.round usage | 4210 | `compute` | presentation/UI rounding | `const overall=Math.round((dims.completeness+dims.consistency+dims.timeliness+dims.reliability+dims.coverage+dims.modelSuitability)/6);` |
| `16f0f42a9271e3d9` | Math.round usage | 4244 | `compute` | presentation/UI rounding | `const overall=Math.round(total/bits.length);` |
| `d106ad66499079b3` | Math.round usage | 4259 | `renderHTML` | presentation/UI rounding | `const overall=Math.round(bits.reduce((a,b)=>a+b[1],0)/bits.length);` |
| `cea309b6e32f773f` | generic OR zero | 4305 | `build` | calculation-sensitive numeric fallback | `const b0=m.bs0\|\|{}; const rev0=b0.revenue!=null?b0.revenue:(sd.revenue\|\|0);` |
| `2d817bc1d7a80227` | generic OR zero | 4309 | `build` | calculation-sensitive numeric fallback | `let debt0=b0.debt\|\|0, equity=b0.equity\|\| (b0.assets? b0.assets-b0.liabilities: 0);` |
| `666f5955038e04a8` | generic OR zero | 4310 | `build` | calculation-sensitive numeric fallback | `let ppne=b0.ppne\|\|0, otherAssets=b0.otherAssets\|\|0, otherLiab=b0.otherLiab\|\|0;` |
| `666f5955038e04a8` | generic OR zero | 4310 | `build` | calculation-sensitive numeric fallback | `let ppne=b0.ppne\|\|0, otherAssets=b0.otherAssets\|\|0, otherLiab=b0.otherLiab\|\|0;` |
| `666f5955038e04a8` | generic OR zero | 4310 | `build` | calculation-sensitive numeric fallback | `let ppne=b0.ppne\|\|0, otherAssets=b0.otherAssets\|\|0, otherLiab=b0.otherLiab\|\|0;` |
| `f66262a1d059263c` | generic OR zero | 4318 | `build` | calculation-sensitive numeric fallback | `const liabEq0=(b0.ap\|\|0)+debt0+(b0.ocl\|\|0)+otherLiab+equity;` |
| `f66262a1d059263c` | generic OR zero | 4318 | `build` | calculation-sensitive numeric fallback | `const liabEq0=(b0.ap\|\|0)+debt0+(b0.ocl\|\|0)+otherLiab+equity;` |
| `4e7cd1f17b93e3e6` | generic OR zero | 4361 | `interestCalc` | calculation-sensitive numeric fallback | `function interestCalc(m, debt, i){ const rows=m.debt&&m.debt.rows?m.debt.rows:[]; if(!rows.length) return debt*0.05; const rate=rows[0].rate\|\|0.05; return debt*rate; }` |
| `34091e8715725a1e` | generic OR zero | 4366 | `debtSchedule` | calculation-sensitive numeric fallback | `for(let i=0;i<n;i++){ const r=rows[Math.min(i,rows.length-1)]; out.push({y:m.startYear+i, opening:r.opening, rate:r.rate, interest:r.opening*r.rate, repayment:r.repayment\|\|0, ending:Math.max(0,r.opening-(r.repayment\|\|0)), amort:r.amort\|\|0}); }` |
| `34091e8715725a1e` | generic OR zero | 4366 | `debtSchedule` | calculation-sensitive numeric fallback | `for(let i=0;i<n;i++){ const r=rows[Math.min(i,rows.length-1)]; out.push({y:m.startYear+i, opening:r.opening, rate:r.rate, interest:r.opening*r.rate, repayment:r.repayment\|\|0, ending:Math.max(0,r.opening-(r.repayment\|\|0)), amort:r.amort\|\|0}); }` |
| `34091e8715725a1e` | generic OR zero | 4366 | `debtSchedule` | calculation-sensitive numeric fallback | `for(let i=0;i<n;i++){ const r=rows[Math.min(i,rows.length-1)]; out.push({y:m.startYear+i, opening:r.opening, rate:r.rate, interest:r.opening*r.rate, repayment:r.repayment\|\|0, ending:Math.max(0,r.opening-(r.repayment\|\|0)), amort:r.amort\|\|0}); }` |
| `78268703168d172f` | truthy-value checks | 4421 | `debtTableHTML` | DOM/object presence guard | `const ds=out.debtSchedule; if(!ds)return \`<div class="banner info">No debt schedule entered — add debt instruments in the Debt & Covenants tab.</div>\`;` |
| `8822ac560bff8cbc` | truthy-value checks | 4495 | `curve` | calculation-sensitive presence guard | `if(!rating)return null;` |
| `66fa9a9615951817` | truthy-value checks | 4503 | `curveHTML` | DOM/object presence guard | `if(!curve)return \`<div class="banner info">Enter a credit rating in the Default Risk or Bond module to see the PD term structure.</div>\`;` |
| `760f53a4f01ebabf` | Math.round usage | 4513 | `compute` | presentation/UI rounding | `function compute(pd,recovery,ead){ const lgd=1-recovery; return {pd,recovery,ead,lgd,el:Math.round(pd*lgd*ead*100)/100}; }` |
| `0c3c73b98994cb6f` | generic OR zero | 4529 | `run` | calculation-sensitive numeric fallback | `const base={revenue0:sd.revenue0\|\|sd.revenue, tax:sd.tax\|\|.21, capexPct:sd.capexPct\|\|.06, wcPct:sd.wcPct\|\|.02, dandaPct:sd.dandaPct\|\|.05, wacc:sd.wacc\|\|.09, terminalGrowth:sd.terminalGrowth\|\|.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt\|\|0)-(sd.cash\|\|0)), shares:sd.shares\|\|1, horizon:sd.horizon\|\|5, growth:sd.growth\|\|.1, ebitdaMargin:sd.ebitdaMargin\|\|.2};` |
| `0c3c73b98994cb6f` | generic OR zero | 4529 | `run` | calculation-sensitive numeric fallback | `const base={revenue0:sd.revenue0\|\|sd.revenue, tax:sd.tax\|\|.21, capexPct:sd.capexPct\|\|.06, wcPct:sd.wcPct\|\|.02, dandaPct:sd.dandaPct\|\|.05, wacc:sd.wacc\|\|.09, terminalGrowth:sd.terminalGrowth\|\|.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt\|\|0)-(sd.cash\|\|0)), shares:sd.shares\|\|1, horizon:sd.horizon\|\|5, growth:sd.growth\|\|.1, ebitdaMargin:sd.ebitdaMargin\|\|.2};` |
| `cfad8275894615c8` | truthy-value checks | 4545 | `stressHTML` | DOM/object presence guard | `if(!res)return \`<div class="banner warn">Run the Stock Analysis first to populate DCF inputs for stress testing.</div>\`;` |
| `c9eddac12faee87a` | generic OR zero | 4571 | `build` | calculation-sensitive numeric fallback | `if(r&&r.valInputs){ const ri=ValuationEngine.residualIncome(sd.equity\|\|0, (sd.netIncome&&sd.equity)?sd.netIncome/sd.equity:.1, r.costEquity\|\|.1, 5, .1); if(sd.equity){ const mos=ri.value/sd.price-1; methods.push({method:"Residual Income",value:ri.value,upside:mos,confidence:0.5,risk:"Clean-surplus assumptions",appl:"Moderate",src:"book value & ROE"}); } }` |
| `8c94a829f2425642` | truthy-value checks | 4578 | `matrixHTML` | DOM/object presence guard | `if(!mx)return \`<div class="banner info">Run the Stock Analysis to build the multi-method valuation matrix.</div>\`;` |
| `3a510ec00507458b` | generic OR zero | 4590 | `driversHTML` | calculation-sensitive numeric fallback | `const base={revenue0:sd.revenue0\|\|sd.revenue, tax:sd.tax\|\|.21, capexPct:sd.capexPct\|\|.06, wcPct:sd.wcPct\|\|.02, dandaPct:sd.dandaPct\|\|.05, wacc:sd.wacc\|\|.09, terminalGrowth:sd.terminalGrowth\|\|.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt\|\|0)-(sd.cash\|\|0)), shares:sd.shares\|\|1, horizon:sd.horizon\|\|5, growth:sd.growth\|\|.1, ebitdaMargin:sd.ebitdaMargin\|\|.2};` |
| `3a510ec00507458b` | generic OR zero | 4590 | `driversHTML` | calculation-sensitive numeric fallback | `const base={revenue0:sd.revenue0\|\|sd.revenue, tax:sd.tax\|\|.21, capexPct:sd.capexPct\|\|.06, wcPct:sd.wcPct\|\|.02, dandaPct:sd.dandaPct\|\|.05, wacc:sd.wacc\|\|.09, terminalGrowth:sd.terminalGrowth\|\|.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt\|\|0)-(sd.cash\|\|0)), shares:sd.shares\|\|1, horizon:sd.horizon\|\|5, growth:sd.growth\|\|.1, ebitdaMargin:sd.ebitdaMargin\|\|.2};` |
| `3fdc47743403312a` | generic OR zero | 4592 | `driversHTML` | calculation-sensitive numeric fallback | `const test=(label,key,delta)=>{ const a=ValuationEngine.dcf({...base,[key]:(base[key]\|\|0)-delta}).perShare; const b=ValuationEngine.dcf({...base,[key]:(base[key]\|\|0)+delta}).perShare; const impact=Math.abs(b-a)/Math.abs(baseVal\|\|1); rows.push({label,impact}); };` |
| `3fdc47743403312a` | generic OR zero | 4592 | `driversHTML` | calculation-sensitive numeric fallback | `const test=(label,key,delta)=>{ const a=ValuationEngine.dcf({...base,[key]:(base[key]\|\|0)-delta}).perShare; const b=ValuationEngine.dcf({...base,[key]:(base[key]\|\|0)+delta}).perShare; const impact=Math.abs(b-a)/Math.abs(baseVal\|\|1); rows.push({label,impact}); };` |
| `8c0929c15f7976ca` | generic OR zero | 4608 | `build` | calculation-sensitive numeric fallback | `const totalW=items.reduce((a,b)=>a+(b.weight\|\|0),0);` |
| `ac40e4bb8b806f70` | generic OR zero | 4609 | `build` | calculation-sensitive numeric fallback | `const expRet=items.reduce((a,b)=>a+(b.weight/totalW)*((b.expectedReturn)\|\|0),0);` |
| `2d0c37dfbe517907` | generic OR zero | 4619 | `build` | general numeric/default fallback | `items.forEach(b=>{ const w=b.weight/totalW; const k=b.assetClass\|\|"Other"; byClass[k]=(byClass[k]\|\|0)+w; });` |
| `aafffe074aed54bf` | generic OR zero | 4620 | `build` | general numeric/default fallback | `items.forEach(b=>{ const w=b.weight/totalW; const k=b.sector\|\|"Other"; bySector[k]=(bySector[k]\|\|0)+w; });` |
| `6b9eab8a47edfff1` | generic OR zero | 4621 | `build` | calculation-sensitive numeric fallback | `items.forEach(b=>{ const w=b.weight/totalW; const k=b.country\|\|"—"; byCountry[k]=(byCountry[k]\|\|0)+w; });` |
| `ab40ffc4302a8fec` | generic OR zero | 4622 | `build` | calculation-sensitive numeric fallback | `items.forEach(b=>{ const w=b.weight/totalW; const k=b.currency\|\|"—"; byCurr[k]=(byCurr[k]\|\|0)+w; });` |
| `13dc4116d056b46e` | truthy-value checks | 4626 | `stress` | calculation-sensitive presence guard | `if(!port)return null;` |
| `75f623cd56016873` | generic OR zero | 4628 | `stress` | calculation-sensitive numeric fallback | `port.items.forEach(b=>{ const w=b.weight/port.items.reduce((a,c)=>a+(c.weight\|\|0),0); let shock=0;` |
| `4be5cb892a219926` | generic OR zero | 4630 | `stress` | calculation-sensitive numeric fallback | `if(cls.includes("equity")\|\|cls.includes("stock")){ shock+=(scenario.eq\|\|0); shock+=(scenario.earnings\|\|0)*0.3; }` |
| `4be5cb892a219926` | generic OR zero | 4630 | `stress` | calculation-sensitive numeric fallback | `if(cls.includes("equity")\|\|cls.includes("stock")){ shock+=(scenario.eq\|\|0); shock+=(scenario.earnings\|\|0)*0.3; }` |
| `c13ddec8f8f622de` | generic OR zero | 4631 | `stress` | calculation-sensitive numeric fallback | `else if(cls.includes("bond")\|\|cls.includes("fixed")){ shock+=(scenario.rate\|\|0)*(-(b.volatility\|\|0.05)); shock+=(scenario.bondSpread\|\|0)*(-(b.volatility\|\|0.05)); }` |
| `c13ddec8f8f622de` | generic OR zero | 4631 | `stress` | calculation-sensitive numeric fallback | `else if(cls.includes("bond")\|\|cls.includes("fixed")){ shock+=(scenario.rate\|\|0)*(-(b.volatility\|\|0.05)); shock+=(scenario.bondSpread\|\|0)*(-(b.volatility\|\|0.05)); }` |
| `c13ddec8f8f622de` | generic OR zero | 4631 | `stress` | calculation-sensitive numeric fallback | `else if(cls.includes("bond")\|\|cls.includes("fixed")){ shock+=(scenario.rate\|\|0)*(-(b.volatility\|\|0.05)); shock+=(scenario.bondSpread\|\|0)*(-(b.volatility\|\|0.05)); }` |
| `c13ddec8f8f622de` | generic OR zero | 4631 | `stress` | calculation-sensitive numeric fallback | `else if(cls.includes("bond")\|\|cls.includes("fixed")){ shock+=(scenario.rate\|\|0)*(-(b.volatility\|\|0.05)); shock+=(scenario.bondSpread\|\|0)*(-(b.volatility\|\|0.05)); }` |
| `4585fccb6f23c0e2` | generic OR zero | 4633 | `stress` | calculation-sensitive numeric fallback | `else { shock+=(scenario.eq\|\|0)*0.5; }` |
| `303beb5c847d1596` | truthy-value checks | 4664 | `checkHTML` | DOM/object presence guard | `if(!res)return "";` |
| `c0414328d27364e9` | toFixed usage | 4685 | `fmRender` | presentation/UI rounding | `<tr><td>Revenue growth %</td>${fm.growth.map((v,i)=>\`<td><input type="text" value="${(v*100).toFixed(1)}" id="fm_g_${i}" style="width:64px"></td>\`).join("")}</tr>` |
| `a39e3c0e6e3f479c` | toFixed usage | 4686 | `fmRender` | presentation/UI rounding | `<tr><td>EBITDA margin target %</td>${fm.margin.map((v,i)=>\`<td><input type="text" value="${(v*100).toFixed(1)}" id="fm_m_${i}" style="width:64px"></td>\`).join("")}</tr>` |
| `0874e1a9828e1c56` | toFixed usage | 4687 | `fmRender` | presentation/UI rounding | `<tr><td>Tax rate %</td>${fm.tax.map((v,i)=>\`<td><input type="text" value="${(v*100).toFixed(1)}" id="fm_t_${i}" style="width:64px"></td>\`).join("")}</tr>` |
| `ab3291303407b7f0` | toFixed usage | 4688 | `fmRender` | presentation/UI rounding | `<tr><td>CapEx % revenue</td>${fm.capexPct.map((v,i)=>\`<td><input type="text" value="${(v*100).toFixed(1)}" id="fm_c_${i}" style="width:64px"></td>\`).join("")}</tr>` |
| `15cdca8947b1b983` | toFixed usage | 4689 | `fmRender` | presentation/UI rounding | `<tr><td>D&A % revenue</td>${fm.daPct.map((v,i)=>\`<td><input type="text" value="${(v*100).toFixed(1)}" id="fm_d_${i}" style="width:64px"></td>\`).join("")}</tr>` |
| `d89c57f812ee16c8` | generic OR zero | 4690 | `fmRender` | calculation-sensitive numeric fallback | `<tr><td>COGS % revenue</td>${fm.cogsPct.map((v,i)=>\`<td><input type="text" value="${((v\|\|0)*100).toFixed(1)}" id="fm_cogs_${i}" style="width:64px"></td>\`).join("")}</tr>` |
| `34b691e95044cc62` | toFixed usage | 4690 | `fmRender` | presentation/UI rounding | `<tr><td>COGS % revenue</td>${fm.cogsPct.map((v,i)=>\`<td><input type="text" value="${((v\|\|0)*100).toFixed(1)}" id="fm_cogs_${i}" style="width:64px"></td>\`).join("")}</tr>` |
| `6899a578e2ce29fd` | generic OR zero | 4691 | `fmRender` | calculation-sensitive numeric fallback | `<tr><td>SG&A % revenue</td>${fm.sgaPct.map((v,i)=>\`<td><input type="text" value="${((v\|\|0)*100).toFixed(1)}" id="fm_sga_${i}" style="width:64px"></td>\`).join("")}</tr>` |
| `5994de34e1d9cc64` | toFixed usage | 4691 | `fmRender` | presentation/UI rounding | `<tr><td>SG&A % revenue</td>${fm.sgaPct.map((v,i)=>\`<td><input type="text" value="${((v\|\|0)*100).toFixed(1)}" id="fm_sga_${i}" style="width:64px"></td>\`).join("")}</tr>` |
| `0f90f342d56fdae1` | generic OR zero | 4692 | `fmRender` | calculation-sensitive numeric fallback | `<tr><td>R&D % revenue</td>${fm.rndPct.map((v,i)=>\`<td><input type="text" value="${((v\|\|0)*100).toFixed(1)}" id="fm_rnd_${i}" style="width:64px"></td>\`).join("")}</tr>` |
| `95b9d801d2b424be` | toFixed usage | 4692 | `fmRender` | presentation/UI rounding | `<tr><td>R&D % revenue</td>${fm.rndPct.map((v,i)=>\`<td><input type="text" value="${((v\|\|0)*100).toFixed(1)}" id="fm_rnd_${i}" style="width:64px"></td>\`).join("")}</tr>` |
| `9505be0d3a7a4566` | generic OR zero | 4705 | `fmRender` | calculation-sensitive numeric fallback | `${(fm.debt.rows\|\|[{name:"Senior Debt",opening:sd.debt\|\|0,rate:.05,repayment:0}]).map((r,i)=>\`<tr data-i="${i}"><td><input type="text" value="${esc(r.name)}" id="d_${i}_n" style="width:120px"></td><td><input type="text" value="${r.opening}" id="d_${i}_o" style="width:90px"></td><td><input type="text" value="${(r.rate*100).toFixed(2)}" id="d_${i}_r" style="width:70px"></td><td><input type="text" value="${r.repayment}" id="d_${i}_p" style="width:90px"></td><td><button class="btn btn-sm btn-danger" data-del="${i}">×</button></td></tr>\`).join("")}` |
| `0f67a583af241df6` | toFixed usage | 4705 | `fmRender` | presentation/UI rounding | `${(fm.debt.rows\|\|[{name:"Senior Debt",opening:sd.debt\|\|0,rate:.05,repayment:0}]).map((r,i)=>\`<tr data-i="${i}"><td><input type="text" value="${esc(r.name)}" id="d_${i}_n" style="width:120px"></td><td><input type="text" value="${r.opening}" id="d_${i}_o" style="width:90px"></td><td><input type="text" value="${(r.rate*100).toFixed(2)}" id="d_${i}_r" style="width:70px"></td><td><input type="text" value="${r.repayment}" id="d_${i}_p" style="width:90px"></td><td><button class="btn btn-sm btn-danger" data-del="${i}">×</button></td></tr>\`).join("")}` |
| `33568d38970b9660` | generic OR zero | 4713 | `fmRender` | calculation-sensitive numeric fallback | `${AppUI.frow("Minimum cash",App.state.settings.currency,"cov_mc",fm.covenants.minCash\|\|0)}` |
| `4f4c5f10089b6a04` | fallback-to-zero coercions | 4727 | `readDebt` | calculation-sensitive numeric fallback | `function readDebt(){ const fm=App.state.fm; if(!fm.debt.rows)return; const rows=[]; $$("#debtRows tr[data-i]").forEach(tr=>{ const i=Number(tr.dataset.i); rows.push({name:$("#d_"+i+"_n").value, opening:Number($("#d_"+i+"_o").value)\|\|0, rate:(()=>{const v=Number($("#d_"+i+"_r").value);return Number.isFinite(v)?v/100:.05;})(), repayment:Number($("#d_"+i+"_p").value)\|\|0}); }); fm.debt.rows=rows; }` |
| `4f4c5f10089b6a04` | fallback-to-zero coercions | 4727 | `readDebt` | calculation-sensitive numeric fallback | `function readDebt(){ const fm=App.state.fm; if(!fm.debt.rows)return; const rows=[]; $$("#debtRows tr[data-i]").forEach(tr=>{ const i=Number(tr.dataset.i); rows.push({name:$("#d_"+i+"_n").value, opening:Number($("#d_"+i+"_o").value)\|\|0, rate:(()=>{const v=Number($("#d_"+i+"_r").value);return Number.isFinite(v)?v/100:.05;})(), repayment:Number($("#d_"+i+"_p").value)\|\|0}); }); fm.debt.rows=rows; }` |
| `3fdea3997be29629` | generic OR zero | 4727 | `readDebt` | calculation-sensitive numeric fallback | `function readDebt(){ const fm=App.state.fm; if(!fm.debt.rows)return; const rows=[]; $$("#debtRows tr[data-i]").forEach(tr=>{ const i=Number(tr.dataset.i); rows.push({name:$("#d_"+i+"_n").value, opening:Number($("#d_"+i+"_o").value)\|\|0, rate:(()=>{const v=Number($("#d_"+i+"_r").value);return Number.isFinite(v)?v/100:.05;})(), repayment:Number($("#d_"+i+"_p").value)\|\|0}); }); fm.debt.rows=rows; }` |
| `3fdea3997be29629` | generic OR zero | 4727 | `readDebt` | calculation-sensitive numeric fallback | `function readDebt(){ const fm=App.state.fm; if(!fm.debt.rows)return; const rows=[]; $$("#debtRows tr[data-i]").forEach(tr=>{ const i=Number(tr.dataset.i); rows.push({name:$("#d_"+i+"_n").value, opening:Number($("#d_"+i+"_o").value)\|\|0, rate:(()=>{const v=Number($("#d_"+i+"_r").value);return Number.isFinite(v)?v/100:.05;})(), repayment:Number($("#d_"+i+"_p").value)\|\|0}); }); fm.debt.rows=rows; }` |
| `e4c383bd2f56679a` | fallback-to-zero coercions | 4730 | `readFMAndRun` | calculation-sensitive numeric fallback | `const readArr=(arr,prefix,factor)=>{ const out=[]; for(let i=0;i<n;i++){ const e=$("#"+prefix+"_"+i); out.push(e? (Number(e.value)\|\|0)/factor:0); } return out; };` |
| `a319ee3d6f4572e3` | generic OR zero | 4730 | `readFMAndRun` | calculation-sensitive numeric fallback | `const readArr=(arr,prefix,factor)=>{ const out=[]; for(let i=0;i<n;i++){ const e=$("#"+prefix+"_"+i); out.push(e? (Number(e.value)\|\|0)/factor:0); } return out; };` |
| `8584695c35aee01c` | fallback-to-zero coercions | 4732 | `readFMAndRun` | calculation-sensitive numeric fallback | `const readNum=(prefix,factor)=>{ const out=[]; for(let i=0;i<n;i++){ const e=$("#"+prefix+"_"+i); out.push(e? Number(e.value)\|\|0:0); } return out; };` |
| `de0934d429691f1e` | generic OR zero | 4732 | `readFMAndRun` | calculation-sensitive numeric fallback | `const readNum=(prefix,factor)=>{ const out=[]; for(let i=0;i<n;i++){ const e=$("#"+prefix+"_"+i); out.push(e? Number(e.value)\|\|0:0); } return out; };` |
| `7573f5972477a01f` | truthy-value checks | 4781 | `whatCouldGoWrong` | DOM/object presence guard | `function whatCouldGoWrong(){ const r=App.state.results.stock; if(!r)return \`<div class="small dim">Run Stock Analysis first.</div>\`; const risks=[]; const f=r.financials\|\|{};` |
| `00a3c9f7e337d757` | truthy-value checks | 4792 | `whatWouldChange` | calculation-sensitive presence guard | `function whatWouldChange(){ const r=App.state.results.stock; if(!r)return \`<div class="small dim">Run Stock Analysis first.</div>\`; const sd=App.state.stockData; if(!sd)return "";` |
| `00a3c9f7e337d757` | truthy-value checks | 4792 | `whatWouldChange` | calculation-sensitive presence guard | `function whatWouldChange(){ const r=App.state.results.stock; if(!r)return \`<div class="small dim">Run Stock Analysis first.</div>\`; const sd=App.state.stockData; if(!sd)return "";` |
| `e45caab7a86c53c6` | generic OR zero | 4793 | `whatWouldChange` | calculation-sensitive numeric fallback | `const base={revenue0:sd.revenue0\|\|sd.revenue, tax:sd.tax\|\|.21, capexPct:sd.capexPct\|\|.06, wcPct:sd.wcPct\|\|.02, dandaPct:sd.dandaPct\|\|.05, wacc:sd.wacc\|\|.09, terminalGrowth:sd.terminalGrowth\|\|.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt\|\|0)-(sd.cash\|\|0)), shares:sd.shares\|\|1, horizon:sd.horizon\|\|5, growth:sd.growth\|\|.1, ebitdaMargin:sd.ebitdaMargin\|\|.2};` |
| `e45caab7a86c53c6` | generic OR zero | 4793 | `whatWouldChange` | calculation-sensitive numeric fallback | `const base={revenue0:sd.revenue0\|\|sd.revenue, tax:sd.tax\|\|.21, capexPct:sd.capexPct\|\|.06, wcPct:sd.wcPct\|\|.02, dandaPct:sd.dandaPct\|\|.05, wacc:sd.wacc\|\|.09, terminalGrowth:sd.terminalGrowth\|\|.025, netDebt:sd.netDebt!=null?sd.netDebt:((sd.debt\|\|0)-(sd.cash\|\|0)), shares:sd.shares\|\|1, horizon:sd.horizon\|\|5, growth:sd.growth\|\|.1, ebitdaMargin:sd.ebitdaMargin\|\|.2};` |
| `6d48855bf75399e4` | generic OR zero | 4831 | `riskDashboardHTML` | calculation-sensitive numeric fallback | `<div class="metricline"><span class="l">EAD (net debt)</span><span class="v">${sd&&sd.debt!=null?fmt.money((sd.debt\|\|0)-(sd.cash\|\|0)):"—"}</span></div></div>` |
| `6d48855bf75399e4` | generic OR zero | 4831 | `riskDashboardHTML` | calculation-sensitive numeric fallback | `<div class="metricline"><span class="l">EAD (net debt)</span><span class="v">${sd&&sd.debt!=null?fmt.money((sd.debt\|\|0)-(sd.cash\|\|0)):"—"}</span></div></div>` |
| `e1d6d7e71d0c741a` | NaN literals | 4911 | `portfolioRender` | algorithm/parser sentinel | `if(saved.length){ wire("pf_build","click",()=>{ const items=saved.map((inv,i)=>{ const rawW=Number($("#pw_"+i).value); const w=Number.isFinite(rawW)?rawW/100:NaN; return {name:inv.name,type:inv.type,assetClass:inv.type,weight:w,expectedReturn:inv.metrics.expectedReturn!=null?inv.metrics.expectedReturn:null,volatility:inv.metrics.volatility!=null?inv.metrics.volatility:null,sector:inv.type,country:"—",currency:App.state.settings.currency}; }); App.state.portfolio.weights=items.map(i=>i.weight); const port=PortfolioEngine.build(items); App.state.portfolio.result=port; renderPortfolio(port); StorageManager.save(); });` |
| `7955e3fac137232d` | truthy-value checks | 4914 | `renderPortfolio` | DOM/object presence guard | `function renderPortfolio(port){ if(!port){ const o=$("#pfOut"); if(o)o.innerHTML=\`<div class="banner warn">Portfolio calculation requires positive total weight and finite expected-return/volatility inputs for every included asset.</div>\`; return; }` |
| `e2058aca023e9bdc` | generic OR zero | 5027 | `assumptions` | calculation-sensitive numeric fallback | `netDebt:A("netDebt", sd.netDebt!=null?sd.netDebt:((sd.debt\|\|0)-(sd.cash\|\|0))),` |
| `e2058aca023e9bdc` | generic OR zero | 5027 | `assumptions` | calculation-sensitive numeric fallback | `netDebt:A("netDebt", sd.netDebt!=null?sd.netDebt:((sd.debt\|\|0)-(sd.cash\|\|0))),` |
| `cce24c73902c4ce3` | generic OR zero | 5033 | `assumptions` | calculation-sensitive numeric fallback | `debt:A("debt", sd.debt\|\|0),` |
| `185bd6f48fc5256e` | generic OR zero | 5034 | `assumptions` | calculation-sensitive numeric fallback | `cash:A("cash", sd.cash\|\|0),` |
| `4572339a3d8bc9e1` | generic OR zero | 5035 | `assumptions` | calculation-sensitive numeric fallback | `equity:A("equity", sd.equity\|\|0),` |
| `a7b0d02159423e6c` | generic OR zero | 5038 | `assumptions` | calculation-sensitive numeric fallback | `dividend:A("dividend", sd.dividend\|\|0),` |
| `31e0b1e43feb7279` | generic OR zero | 5148 | `run` | calculation-sensitive numeric fallback | `const re=a.rf+a.beta*a.erp; const V=(a.marketCap\|\|0)+a.debt; const wacc= V>0? (a.marketCap/V)*re + (a.debt/V)*0.05*(1-a.tax) : a.wacc;` |
| `74a2b68267ca7551` | truthy-value checks | 5218 | `renderHTML` | DOM/object presence guard | `if(!bp)return \`<div class="banner info">Breakpoint analysis requires a current price. Run after entering price.</div>\`;` |
| `95351e46c8d8cab5` | truthy-value checks | 5282 | `html` | DOM/object presence guard | `if(!d)return "";` |
| `e3f4e6b91a6bc86f` | Math.round usage | 5303 | `compute` | presentation/UI rounding | `const score=Math.max(0,Math.min(100,Math.round(100 - maxChange*100)));` |
| `ea681936e4f12ddb` | generic OR zero | 5320 | `monitor` | calculation-sensitive numeric fallback | `add("Revenue growth","15%",a.revenueGrowth,fmt.pct, Math.abs((a.revenueGrowth\|\|0)-.15)<=.04?"good": Math.abs((a.revenueGrowth\|\|0)-.15)<=.08?"warn":"bad");` |
| `ea681936e4f12ddb` | generic OR zero | 5320 | `monitor` | calculation-sensitive numeric fallback | `add("Revenue growth","15%",a.revenueGrowth,fmt.pct, Math.abs((a.revenueGrowth\|\|0)-.15)<=.04?"good": Math.abs((a.revenueGrowth\|\|0)-.15)<=.08?"warn":"bad");` |
| `9446158c81a2377b` | generic OR zero | 5322 | `monitor` | calculation-sensitive numeric fallback | `add("EBITDA margin","22%",a.ebitdaMargin,fmt.pct, Math.abs((a.ebitdaMargin\|\|0)-.22)<=.03?"good": Math.abs((a.ebitdaMargin\|\|0)-.22)<=.06?"warn":"bad");` |
| `9446158c81a2377b` | generic OR zero | 5322 | `monitor` | calculation-sensitive numeric fallback | `add("EBITDA margin","22%",a.ebitdaMargin,fmt.pct, Math.abs((a.ebitdaMargin\|\|0)-.22)<=.03?"good": Math.abs((a.ebitdaMargin\|\|0)-.22)<=.06?"warn":"bad");` |
| `867d59d3432870fb` | Math.round usage | 5332 | `integrity` | presentation/UI rounding | `const score=Math.round(good/m.length*100);` |
| `a3d6d63d335b615a` | truthy-value checks | 5356 | `assumptionsRender` | DOM/object presence guard | `const o=$("#asmOut"); if(!o)return;` |
| `e28b5345d3ee5507` | toFixed usage | 5373 | `assumptionsRender` | presentation/UI rounding | `const promptMsg = \`Enter analyst override for ${key}. System value: ${isPct?(sysNum*100).toFixed(2)+"%":isX?sysNum.toFixed(2)+"x":fmt.num(sysNum,2)}\`;` |
| `e28b5345d3ee5507` | toFixed usage | 5373 | `assumptionsRender` | presentation/UI rounding | `const promptMsg = \`Enter analyst override for ${key}. System value: ${isPct?(sysNum*100).toFixed(2)+"%":isX?sysNum.toFixed(2)+"x":fmt.num(sysNum,2)}\`;` |
| `b4b88d8f8d51e451` | truthy-value checks | 5383 | `renderFullAnalysisResults` | DOM/object presence guard | `const pr=App.state.pipeline; if(!pr)return;` |
| `d53f63c3e8490c35` | truthy-value checks | 5392 | `renderModelRisk` | DOM/object presence guard | `if(!mr)return "";` |
| `32563f61c5e4f668` | truthy-value checks | 5400 | `pipelinePanel` | DOM/object presence guard | `const p=$("#pipelinePanel"); if(!p)return;` |
| `0238c085f57b2305` | generic OR zero | 5448 | `betaAlphaAligned` | calculation-sensitive numeric fallback | `const alpha=CalcEngine.alpha(al.matchedReturnsA, al.matchedReturnsB, rfPerPeriod\|\|0);` |
| `364a82ac3f0b726d` | generic OR zero | 5461 | `rollingSharpe` | calculation-sensitive numeric fallback | `function rollingSharpe(returns,window,rfPerPeriod){ const out=[]; for(let i=window-1;i<returns.length;i++){ const w=returns.slice(i-window+1,i+1); out.push(CalcEngine.sharpe(w,rfPerPeriod\|\|0)); } return out; }` |
| `5f178b0ac209ac1d` | Infinity literals | 5462 | `rollingDrawdown` | algorithm/parser sentinel | `function rollingDrawdown(closes){ const out=[]; let peak=-Infinity; for(let i=0;i<closes.length;i++){ if(closes[i]>peak)peak=closes[i]; out.push(closes[i]/peak-1); } return out; }` |
| `d2fe2d140c23ce5f` | Infinity literals | 5474 | `trace` | algorithm/parser sentinel | `let iters=0, conv=false, resid=Infinity;` |
| `d99727c6408ff10b` | truthy-value checks | 5489 | `diagHTML` | DOM/object presence guard | `if(!merton) return \`<div class="banner info">Run the Default Risk module to obtain Merton outputs.</div>\`;` |
| `7b03e4da7631981e` | truthy-value checks | 5562 | `checksHTML` | DOM/object presence guard | `if(!checks)return "";` |
| `2d55169bc5a311c7` | truthy-value checks | 5602 | `html` | DOM/object presence guard | `if(!rows)return "";` |
| `6cfbe80596b0d543` | truthy-value checks | 5617 | `build` | calculation-sensitive presence guard | `const mx=ValuationMatrixV2.build(sd); if(!mx)return null;` |
| `9c8e878d39a764b1` | truthy-value checks | 5629 | `html` | DOM/object presence guard | `if(!r)return "";` |
| `87265dee3fde1b40` | generic OR zero | 5648 | `build` | parser/default fallback | `const newBorrow=r.newBorrow\|\|0;` |
| `3198bd9162bccf5f` | generic OR zero | 5649 | `build` | parser/default fallback | `const rate=r.rate\|\|0.05;` |
| `27f36ed0a04ff1a2` | generic OR zero | 5651 | `build` | parser/default fallback | `const repay=r.repayment\|\|0;` |
| `8f06c097bcb87b26` | truthy-value checks | 5660 | `html` | DOM/object presence guard | `if(!ds)return \`<div class="banner info">No debt schedule. Add instruments in the Financial Model → Debt tab.</div>\`;` |
| `369485431098dc5d` | truthy-value checks | 5791 | `compute` | DOM/object presence guard | `const r=App.state.results.stock; if(!r)return null;` |
| `b30981ff327439bd` | truthy-value checks | 5808 | `html` | DOM/object presence guard | `if(!res)return "";` |
| `7f0650c1e8373d08` | truthy-value checks | 5977 | `enhanceFM` | DOM/object presence guard | `const out=App.state.fm&&App.state.fm.result; if(!out)return;` |
| `db52eaa89b605d98` | truthy-value checks | 5996 | `enhanceRisk` | calculation-sensitive presence guard | `const r=App.state.results.risk; if(!r)return;` |
| `494459f83ee4552b` | truthy-value checks | 5998 | `enhanceRisk` | calculation-sensitive presence guard | `if(!target)return;` |
| `f692194e8d0a3683` | truthy-value checks | 6094 | `enhanceReport` | DOM/object presence guard | `const o=$("#reportOutput"); if(!o)return;` |
| `c4bf0f3695232044` | truthy-value checks | 6095 | `enhanceReport` | DOM/object presence guard | `const page=o.querySelector(".report-page"); if(!page)return;` |
| `d12974630dd7a76f` | truthy-value checks | 6172 | `mcBootstrapRender` | DOM/object presence guard | `if(!hasHist)return;` |
| `dbec7a73f887cbab` | fallback-to-zero coercions | 6174 | `mcBootstrapRender` | calculation-sensitive numeric fallback | `const g=n=>Number($("#"+n).value)\|\|0;` |
| `cbecac37e8f64b77` | generic OR zero | 6174 | `mcBootstrapRender` | calculation-sensitive numeric fallback | `const g=n=>Number($("#"+n).value)\|\|0;` |
| `1e1bb649161fda7f` | Math.round usage | 6175 | `mcBootstrapRender` | presentation/UI rounding | `const r=BootstrapMC.run({initial:g("bc_s0"),returns:rets,horizonYears:g("bc_T"),simulations:Math.min(50000,Math.max(100,Math.round(g("bc_n")))),seed:App.state.mcSeed\|\|1234,target:g("bc_target"),stepsPerYear:252});` |
| `a24bf2e99fb351c9` | Math.round usage | 6183 | `mcBootstrapRender` | presentation/UI rounding | `const n=Math.round(g("bc_T")*252);` |
| `6c56d3f4e29d355c` | fallback-to-zero coercions | 6220 | `walkForwardRender` | calculation-sensitive numeric fallback | `if(hasHist) wire("wf_run","click",()=>{ const g=n=>Number($("#"+n)?.value)\|\|0;` |
| `e119a896bc11540e` | generic OR zero | 6220 | `walkForwardRender` | calculation-sensitive numeric fallback | `if(hasHist) wire("wf_run","click",()=>{ const g=n=>Number($("#"+n)?.value)\|\|0;` |
| `409ce71aec600acc` | Math.round usage | 6221 | `walkForwardRender` | presentation/UI rounding | `const r=WalkForward.run({prices:hist.prices, trainSize:Math.round(g("wf_train")), testSize:Math.round(g("wf_test")), initialCapital:100000, transactionCost:g("wf_tc")/100, slippage:g("wf_slip")/100});` |
| `409ce71aec600acc` | Math.round usage | 6221 | `walkForwardRender` | presentation/UI rounding | `const r=WalkForward.run({prices:hist.prices, trainSize:Math.round(g("wf_train")), testSize:Math.round(g("wf_test")), initialCapital:100000, transactionCost:g("wf_tc")/100, slippage:g("wf_slip")/100});` |
| `f1f8e93266238f48` | truthy-value checks | 6227 | `optimizerRender` | DOM/object presence guard | `const el=$("#optimizerForm"); if(!el)return;` |
| `2e058f70a3e0d379` | fallback-to-zero coercions | 6261 | `backtestRender` | calculation-sensitive numeric fallback | `const g=n=>Number($("#"+n)?.value)\|\|0;` |
| `dca8b838086e4b7b` | generic OR zero | 6261 | `backtestRender` | calculation-sensitive numeric fallback | `const g=n=>Number($("#"+n)?.value)\|\|0;` |
| `cda9ea5b8ff3217d` | Math.round usage | 6264 | `backtestRender` | presentation/UI rounding | `rebalanceEvery:Math.max(1,Math.round(g("bt_reb"))), transactionCost:g("bt_tc")/100, slippage:g("bt_slip")/100,` |
| `47adbf1de86d6c55` | fallback-to-zero coercions | 6349 | `computeMoatScore` | calculation-sensitive numeric fallback | `function computeMoatScore(){ let sum=0;for(let i=0;i<9;i++)sum+=Number($("#rs_moat_"+i)?.value)\|\|0; const sc=Math.round(sum/9); const s=$("#rs_moatScore"); if(s)s.textContent="Competitive Strength (moat) ≈ "+sc+"/100 — requires qualitative rationale."; }` |
| `9e4e29dc1e29ac3d` | generic OR zero | 6349 | `computeMoatScore` | calculation-sensitive numeric fallback | `function computeMoatScore(){ let sum=0;for(let i=0;i<9;i++)sum+=Number($("#rs_moat_"+i)?.value)\|\|0; const sc=Math.round(sum/9); const s=$("#rs_moatScore"); if(s)s.textContent="Competitive Strength (moat) ≈ "+sc+"/100 — requires qualitative rationale."; }` |
| `903da0f45b02769d` | Math.round usage | 6349 | `computeMoatScore` | presentation/UI rounding | `function computeMoatScore(){ let sum=0;for(let i=0;i<9;i++)sum+=Number($("#rs_moat_"+i)?.value)\|\|0; const sc=Math.round(sum/9); const s=$("#rs_moatScore"); if(s)s.textContent="Competitive Strength (moat) ≈ "+sc+"/100 — requires qualitative rationale."; }` |
| `dea2f5388fb66996` | truthy-value checks | 6483 | `reverseDcfHTML` | DOM/object presence guard | `if(!r)return \`<div class="banner warn">Enter a current price (Stock Analysis) first.</div>\`;` |
| `d3f17cf73bcd59e1` | truthy-value checks | 6498 | `valuationCrossRender` | DOM/object presence guard | `const r=App.state.results.stock; if(!r)return;` |
| `e8a87b6569fac843` | truthy-value checks | 6612 | `committeeBuild` | calculation-sensitive presence guard | `const r=App.state.results.stock; const sd=App.state.stockData; if(!r)return \`<div class="banner warn">Run the stock analysis first.</div>\`;` |
| `1488cd67fe3a911e` | Math.round usage | 6621 | `committeeBuild` | presentation/UI rounding | `const conviction= Math.round((mos!=null?(Math.min(100,Math.max(0,50+mos*100))):50)*.5 + dataConf*.3 + modelConf*.2);` |
| `ea1dc3bac03f3d2b` | Math.round usage | 6625 | `committeeBuild` | presentation/UI rounding | `{dim:"Valuation",score: mos!=null?Math.round(50+mos*100):50,conf:dataConf>=80?"High":dataConf>=60?"Medium":"Low"},` |
| `bea3a3b3a9fb14d0` | Math.round usage | 6626 | `committeeBuild` | presentation/UI rounding | `{dim:"Balance Sheet",score: f.debtEquity!=null? Math.round(100-Math.min(60,f.debtEquity*15)):50, conf:"Medium"},` |
| `5be7195cf4e74769` | Math.round usage | 6628 | `committeeBuild` | presentation/UI rounding | `{dim:"Growth",score: a.revenueGrowth!=null?Math.round(Math.min(100,Math.max(0,50+a.revenueGrowth*100))):50, conf:"Medium"},` |
| `06d3fc21dc22814a` | Math.round usage | 6629 | `committeeBuild` | presentation/UI rounding | `{dim:"Risk",score: r.risk&&r.risk.volatility!=null? Math.round(100-Math.min(80,r.risk.volatility*120)):50, conf:"Medium"}` |
| `86a1be7ec7d9ea38` | truthy-value checks | 6778 | `governanceRender` | DOM/object presence guard | `if(!gb){ const govCard=document.getElementById("governanceOut"); }` |
| `b2f7ce1188265c17` | truthy-value checks | 6851 | `committeeMemo` | calculation-sensitive presence guard | `const r=App.state.results.stock; const sd=App.state.stockData; if(!r)return \`<div class="banner warn">Run the stock analysis first.</div>\`;` |
| `5c487c88ba1765f5` | Math.round usage | 6858 | `committeeMemo` | presentation/UI rounding | `const conviction= dataConf!=null? Math.round(Math.min(100,Math.max(0,(mos!=null?50+mos*100:50)*.5+dataConf*.3+modelConf*.2))):null;` |
| `91ff4fea9b1d5a5b` | truthy-value checks | 6931 | `forecastAccuracyOutput` | DOM/object presence guard | `const out=$("#faOut"); if(!out)return;` |
| `e68d4524b7e5bb7e` | generic OR zero | 6976 | `factorExposure` | calculation-sensitive numeric fallback | `const totalW=items.reduce((a,b)=>a+(b.weight\|\|0),0);` |
| `65077ec2b4240437` | generic OR zero | 6977 | `factorExposure` | calculation-sensitive numeric fallback | `items.forEach(b=>{ const w=(b.weight\|\|0)/totalW; const t=(b.type\|\|"").toLowerCase();` |
| `89520d23851f60b4` | Math.round usage | 6995 | `factorExposure` | presentation/UI rounding | `const out=Object.entries(exposures).map(([factor,exposure])=>({factor,exposure:Math.round(exposure*100)/100,risk:Math.abs(exposure)>0.6?"High":Math.abs(exposure)>0.3?"Medium":"Low"}));` |
| `036bd5d261ab7a7e` | truthy-value checks | 6999 | `factorHTML` | DOM/object presence guard | `if(!expos)return "";` |
| `b2b94d772c0f45b7` | generic OR zero | 7022 | `performanceAttribution` | calculation-sensitive numeric fallback | `const totalW=items.reduce((a,b)=>a+(b.weight\|\|0),0);` |
| `77f12f8fdb5a75fb` | generic OR zero | 7025 | `performanceAttribution` | calculation-sensitive numeric fallback | `const bench=benchmarkRet\|\|0.08;` |
| `4d489f7fd76bd4a8` | generic OR zero | 7026 | `performanceAttribution` | calculation-sensitive numeric fallback | `items.forEach(b=>{ const w=(b.weight\|\|0)/totalW; const r=b.expectedReturn\|\|0;` |
| `4d489f7fd76bd4a8` | generic OR zero | 7026 | `performanceAttribution` | calculation-sensitive numeric fallback | `items.forEach(b=>{ const w=(b.weight\|\|0)/totalW; const r=b.expectedReturn\|\|0;` |
| `52dc63004222ce06` | truthy-value checks | 7035 | `attributionHTML` | DOM/object presence guard | `if(!attr)return "";` |
| `060bc6acee81328b` | truthy-value checks | 7055 | `trackingErrorHTML` | DOM/object presence guard | `if(!te)return "";` |
| `48cf24d0eb63f82b` | truthy-value checks | 7063 | `portfolioAdvancedRender` | DOM/object presence guard | `const port=App.state.portfolio&&App.state.portfolio.result; if(!port)return;` |
| `26ffd334558bb5ef` | truthy-value checks | 7067 | `portfolioAdvancedRender` | DOM/object presence guard | `const target=$("#pfAdvanced"); if(!target)return;` |
| `6f7cafe6a4a66f08` | Math.round usage | 7152 | `run` | presentation/UI rounding | `const n=Math.round((horizonYears\|\|1)*stepsPerYear);` |
| `a982d928d88d85e4` | truthy-value checks | 7172 | `html` | DOM/object presence guard | `if(!r)return \`<div class="banner warn">Historical Bootstrap requires at least 5 historical return observations. Import a price series first.</div>\`;` |
| `dd48f9b721bb6b6c` | truthy-value checks | 7194 | `creditRatios` | calculation-sensitive presence guard | `if(!sd)return null;` |
| `1d79d45bb51d9c14` | truthy-value checks | 7211 | `creditRatiosHTML` | DOM/object presence guard | `if(!cr)return "";` |
| `13708c86ed6f81e1` | Math.round usage | 7242 | `fieldMappingReview` | presentation/UI rounding | `<td class="num">${Math.round(e.conf*100)}%</td>` |
| `0efab4a712b7605f` | toFixed usage | 7318 | `segmentForecastRender` | presentation/UI rounding | `const growRow=(s,i)=>s.growth.map((v,y)=>\`<input type="text" value="${(v*100).toFixed(1)}" id="seg_${i}_g_${y}" style="width:56px">\`).join("");` |
| `5f9a2f9bc5c66a16` | toFixed usage | 7319 | `segmentForecastRender` | presentation/UI rounding | `const marginRow=(s,i)=>s.margin.map((v,y)=>\`<input type="text" value="${(v*100).toFixed(1)}" id="seg_${i}_m_${y}" style="width:56px">\`).join("");` |
| `da36a337177b32a7` | fallback-to-zero coercions | 7339 | `segmentForecastRender` | calculation-sensitive numeric fallback | `const share=Number($("#seg_"+i+"_share")?.value)\|\|0;` |
| `55c0bfddd0229fca` | generic OR zero | 7339 | `segmentForecastRender` | calculation-sensitive numeric fallback | `const share=Number($("#seg_"+i+"_share")?.value)\|\|0;` |
| `f93317b3ef02518e` | fallback-to-zero coercions | 7341 | `segmentForecastRender` | calculation-sensitive numeric fallback | `for(let y=0;y<ny;y++){ growth.push((Number($("#seg_"+i+"_g_"+y)?.value)\|\|0)/100); margin.push((Number($("#seg_"+i+"_m_"+y)?.value)\|\|0)/100); }` |
| `f93317b3ef02518e` | fallback-to-zero coercions | 7341 | `segmentForecastRender` | calculation-sensitive numeric fallback | `for(let y=0;y<ny;y++){ growth.push((Number($("#seg_"+i+"_g_"+y)?.value)\|\|0)/100); margin.push((Number($("#seg_"+i+"_m_"+y)?.value)\|\|0)/100); }` |
| `7009a99933e66333` | generic OR zero | 7341 | `segmentForecastRender` | calculation-sensitive numeric fallback | `for(let y=0;y<ny;y++){ growth.push((Number($("#seg_"+i+"_g_"+y)?.value)\|\|0)/100); margin.push((Number($("#seg_"+i+"_m_"+y)?.value)\|\|0)/100); }` |
| `7009a99933e66333` | generic OR zero | 7341 | `segmentForecastRender` | calculation-sensitive numeric fallback | `for(let y=0;y<ny;y++){ growth.push((Number($("#seg_"+i+"_g_"+y)?.value)\|\|0)/100); margin.push((Number($("#seg_"+i+"_m_"+y)?.value)\|\|0)/100); }` |
| `237941a0a9115869` | truthy-value checks | 7347 | `segmentForecastRender` | DOM/object presence guard | `if(!segCalc){ $("#segOut").innerHTML=\`<div class="banner warn">Segment forecast requires finite non-negative revenue/shares and finite growth/margin assumptions for every year.</div>\`; return; }` |
| `61285879537bfa9a` | generic OR zero | 7367 | `sotpRender` | calculation-sensitive numeric fallback | `if(!sotp.parts.length) sotp.parts=[{name:"Core Business",value:sd.marketCap\|\|0,multiple:10,metric:sd.netIncome\|\|0},{name:"Cash / Investments",value:sd.cash\|\|0,multiple:1,metric:sd.cash\|\|0}];` |
| `61285879537bfa9a` | generic OR zero | 7367 | `sotpRender` | calculation-sensitive numeric fallback | `if(!sotp.parts.length) sotp.parts=[{name:"Core Business",value:sd.marketCap\|\|0,multiple:10,metric:sd.netIncome\|\|0},{name:"Cash / Investments",value:sd.cash\|\|0,multiple:1,metric:sd.cash\|\|0}];` |
| `61285879537bfa9a` | generic OR zero | 7367 | `sotpRender` | calculation-sensitive numeric fallback | `if(!sotp.parts.length) sotp.parts=[{name:"Core Business",value:sd.marketCap\|\|0,multiple:10,metric:sd.netIncome\|\|0},{name:"Cash / Investments",value:sd.cash\|\|0,multiple:1,metric:sd.cash\|\|0}];` |
| `61285879537bfa9a` | generic OR zero | 7367 | `sotpRender` | calculation-sensitive numeric fallback | `if(!sotp.parts.length) sotp.parts=[{name:"Core Business",value:sd.marketCap\|\|0,multiple:10,metric:sd.netIncome\|\|0},{name:"Cash / Investments",value:sd.cash\|\|0,multiple:1,metric:sd.cash\|\|0}];` |
| `3d7098709f8ddc71` | NaN literals | 7384 | `sotpRender` | algorithm/parser sentinel | `const sharesRaw=$("#sotp_shares").value; const shares=String(sharesRaw).trim()===""?NaN:Number(sharesRaw);` |
| `47a14f4bb1df9a8c` | truthy-value checks | 7388 | `sotpRender` | DOM/object presence guard | `if(!sotpCalc){ $("#sotpOut").innerHTML=\`<div class="banner warn">SOTP requires positive diluted shares and a finite explicit value or finite multiple × metric for every part.</div>\`; return; }` |
| `1cbac39442bc3e8d` | fallback-to-zero coercions | 7424 | `earningsQualityTrend` | UI/default-state fallback | `const ps=t.periods.map((p,i)=>({period:$("#eqt_"+i+"_p")?.value\|\|("P"+(i+1)),ni:Number($("#eqt_"+i+"_ni")?.value)\|\|0,cfo:Number($("#eqt_"+i+"_cfo")?.value)\|\|0,fcf:Number($("#eqt_"+i+"_fcf")?.value)\|\|0,rev:Number($("#eqt_"+i+"_rev")?.value)\|\|0,wc:Number($("#eqt_"+i+"_wc")?.value)\|\|0}));` |
| `f811a9321a1a0636` | generic OR zero | 7424 | `earningsQualityTrend` | UI/default-state fallback | `const ps=t.periods.map((p,i)=>({period:$("#eqt_"+i+"_p")?.value\|\|("P"+(i+1)),ni:Number($("#eqt_"+i+"_ni")?.value)\|\|0,cfo:Number($("#eqt_"+i+"_cfo")?.value)\|\|0,fcf:Number($("#eqt_"+i+"_fcf")?.value)\|\|0,rev:Number($("#eqt_"+i+"_rev")?.value)\|\|0,wc:Number($("#eqt_"+i+"_wc")?.value)\|\|0}));` |
| `f811a9321a1a0636` | generic OR zero | 7424 | `earningsQualityTrend` | UI/default-state fallback | `const ps=t.periods.map((p,i)=>({period:$("#eqt_"+i+"_p")?.value\|\|("P"+(i+1)),ni:Number($("#eqt_"+i+"_ni")?.value)\|\|0,cfo:Number($("#eqt_"+i+"_cfo")?.value)\|\|0,fcf:Number($("#eqt_"+i+"_fcf")?.value)\|\|0,rev:Number($("#eqt_"+i+"_rev")?.value)\|\|0,wc:Number($("#eqt_"+i+"_wc")?.value)\|\|0}));` |
| `f811a9321a1a0636` | generic OR zero | 7424 | `earningsQualityTrend` | UI/default-state fallback | `const ps=t.periods.map((p,i)=>({period:$("#eqt_"+i+"_p")?.value\|\|("P"+(i+1)),ni:Number($("#eqt_"+i+"_ni")?.value)\|\|0,cfo:Number($("#eqt_"+i+"_cfo")?.value)\|\|0,fcf:Number($("#eqt_"+i+"_fcf")?.value)\|\|0,rev:Number($("#eqt_"+i+"_rev")?.value)\|\|0,wc:Number($("#eqt_"+i+"_wc")?.value)\|\|0}));` |
| `f811a9321a1a0636` | generic OR zero | 7424 | `earningsQualityTrend` | UI/default-state fallback | `const ps=t.periods.map((p,i)=>({period:$("#eqt_"+i+"_p")?.value\|\|("P"+(i+1)),ni:Number($("#eqt_"+i+"_ni")?.value)\|\|0,cfo:Number($("#eqt_"+i+"_cfo")?.value)\|\|0,fcf:Number($("#eqt_"+i+"_fcf")?.value)\|\|0,rev:Number($("#eqt_"+i+"_rev")?.value)\|\|0,wc:Number($("#eqt_"+i+"_wc")?.value)\|\|0}));` |
| `f811a9321a1a0636` | generic OR zero | 7424 | `earningsQualityTrend` | UI/default-state fallback | `const ps=t.periods.map((p,i)=>({period:$("#eqt_"+i+"_p")?.value\|\|("P"+(i+1)),ni:Number($("#eqt_"+i+"_ni")?.value)\|\|0,cfo:Number($("#eqt_"+i+"_cfo")?.value)\|\|0,fcf:Number($("#eqt_"+i+"_fcf")?.value)\|\|0,rev:Number($("#eqt_"+i+"_rev")?.value)\|\|0,wc:Number($("#eqt_"+i+"_wc")?.value)\|\|0}));` |
| `248f49d2039ff963` | generic OR zero | 7482 | `mulberry` | calculation-sensitive numeric fallback | `var initial=cfg.initial\|\|100, expectedReturn=cfg.expectedReturn\|\|0, volatility=cfg.volatility\|\|0;` |
| `248f49d2039ff963` | generic OR zero | 7482 | `mulberry` | calculation-sensitive numeric fallback | `var initial=cfg.initial\|\|100, expectedReturn=cfg.expectedReturn\|\|0, volatility=cfg.volatility\|\|0;` |
| `030b472ed5c2b571` | Math.round usage | 7487 | `norm` | presentation/UI rounding | `var mu=expectedReturn, sigma=volatility, dt=1/stepsPerYear, n=Math.round(horizonYears*stepsPerYear);` |
| `36129a3fa79a21f1` | truthy-value checks | 7536 | `run` | DOM/object presence guard | `if(!w){` |
| `08c0b139c8065ea1` | fallback-to-zero coercions | 7554 | `runMC` | UI/default-state fallback | `const g=n=>Number($("#"+n).value)\|\|0;` |
| `dd6f034e7a370ca3` | generic OR zero | 7554 | `runMC` | UI/default-state fallback | `const g=n=>Number($("#"+n).value)\|\|0;` |
| `f607c3ace225c9c2` | Math.round usage | 7556 | `runMC` | presentation/UI rounding | `const sims=Math.min(50000,Math.max(100,Math.round(g("mc_n"))));` |
| `8a060f29472044a7` | Math.round usage | 7563 | `runMC` | presentation/UI rounding | `const onProgress=(done,total)=>{ const p=Math.round(done/total*100); const bar=$("#mcProgressBar"); if(bar)bar.style.width=p+"%"; const lab=$("#mcProgressLabel"); if(lab)lab.textContent=Math.min(p,100)+"% complete ("+fmt.num(done,0)+"/"+fmt.num(total,0)+")"; };` |
| `5afaa35ac92b9912` | truthy-value checks | 7565 | `runMC` | DOM/object presence guard | `if(!r){ // worker failed -> fallback already done; r from fallback is set via MonteCarlo.run` |
| `172cb085d8326337` | truthy-value checks | 7628 | `loadFromLibrary` | calculation-sensitive presence guard | `const s=App.state; const rec=s.analyses[idx]; if(!rec)return false;` |
| `213efa3ecfec24f4` | truthy-value checks | 7642 | `deleteFromLibrary` | calculation-sensitive presence guard | `const s=App.state; const rec=s.analyses[idx]; if(!rec)return;` |
| `1a856b5bfc295b43` | truthy-value checks | 7668 | `libraryRender` | DOM/object presence guard | `const el=$("#libraryOut"); if(!el)return;` |
| `a74cc7869ac53a47` | truthy-value checks | 7730 | `reviewQueueRender` | DOM/object presence guard | `const el=$("#reviewQueueOut"); if(!el)return;` |
| `37c7c997501860a2` | truthy-value checks | 7736 | `reviewQueueRender` | DOM/object presence guard | `if(!total){` |
| `8fb66a2ba5e185b2` | truthy-value checks | 7835 | `searchAll` | calculation-sensitive presence guard | `if(!title)return;` |
| `a81603e4b2b58623` | Math.round usage | 7839 | `searchAll` | presentation/UI rounding | `results.push({type,title,sub,run,score:Math.min(100,Math.round(scoreBase*100))});` |
| `117ad365dfce84a0` | truthy-value checks | 7892 | `renderSearchResults` | DOM/object presence guard | `const box=$("#cmdList"); if(!box)return;` |
| `6e60f6cb85a62528` | truthy-value checks | 7956 | `patchRenderMCResult` | DOM/object presence guard | `const host=$("#mcOut"); if(!host)return;` |
| `f8ce69869ae55e4c` | truthy-value checks | 8018 | `block` | calculation-sensitive presence guard | `const ex=exampleFor(key); if(!ex)return "";` |
| `5543a01fdfc9b10c` | truthy-value checks | 8270 | `parseFile` | calculation-sensitive presence guard | `if(!sheetKey)return {ok:false,msg:"No worksheet found in the XLSX file."};` |
| `46031b57dafbf94f` | Math.round usage | 8309 | `compute` | presentation/UI rounding | `stmtDepth=Math.round(hasStmts/10*100);` |
| `d5849bb86ac3ec35` | Math.round usage | 8316 | `compute` | presentation/UI rounding | `dims.priceHistory= s.history&&s.history.prices? Math.min(100,Math.round(s.history.prices.length/5)):0;` |
| `dd11c92644da46a4` | Math.round usage | 8326 | `compute` | presentation/UI rounding | `const overall=Math.round(keys.reduce((a,k)=>a+dims[k],0)/keys.length);` |
| `18fcb87dd6d75474` | Math.round usage | 8400 | `accountingQualityOutput` | presentation/UI rounding | `const coverage=Math.round(filled/total*100);` |
| `d753d41fb2d0b553` | truthy-value checks | 8456 | `check` | calculation-sensitive presence guard | `if(!port)return [];` |
| `10fa0bd655891c3a` | generic OR zero | 8458 | `check` | calculation-sensitive numeric fallback | `const items=port.items\|\|[]; const totalW=items.reduce((a,b)=>a+(b.weight\|\|0),0)\|\|1;` |
| `cbcc1736a227b0c9` | generic OR zero | 8460 | `check` | calculation-sensitive numeric fallback | `items.forEach(b=>{ const w=(b.weight\|\|0)/totalW;` |
| `473c4d74ae83b009` | generic OR zero | 8464 | `check` | calculation-sensitive numeric fallback | `const bySector={}; items.forEach(b=>{ const k=b.sector\|\|"Other"; bySector[k]=(bySector[k]\|\|0)+(b.weight\|\|0)/totalW; });` |
| `473c4d74ae83b009` | generic OR zero | 8464 | `check` | calculation-sensitive numeric fallback | `const bySector={}; items.forEach(b=>{ const k=b.sector\|\|"Other"; bySector[k]=(bySector[k]\|\|0)+(b.weight\|\|0)/totalW; });` |
| `2c4252597794777d` | generic OR zero | 8466 | `check` | calculation-sensitive numeric fallback | `const cash=items.filter(b=>(b.assetClass\|\|"").toLowerCase().includes("cash")).reduce((a,b)=>a+(b.weight\|\|0)/totalW,0);` |
| `f6f16a46f1d835fc` | truthy-value checks | 8478 | `compute` | calculation-sensitive presence guard | `if(!port)return null;` |
| `11488fa0536fa6ac` | generic OR zero | 8480 | `compute` | calculation-sensitive numeric fallback | `const n=items.length; const totalW=items.reduce((a,c)=>a+(c.weight\|\|0),0)\|\|1;` |
| `a24fd34bb22dc4e8` | generic OR zero | 8481 | `compute` | calculation-sensitive numeric fallback | `const weights=items.map(b=> (b.weight\|\|0)/totalW );` |
| `9c8e878d39a764b1` | truthy-value checks | 8497 | `html` | DOM/object presence guard | `if(!r)return "";` |
| `3ec17eb4f00b5c6a` | Math.round usage | 8528 | `dcfRange` | presentation/UI rounding | `const conf= disp==null?0:Math.max(0,Math.min(100,Math.round(80 - disp*20 + (suff-50)*0.3)));` |
| `f673e5d71b050256` | truthy-value checks | 8532 | `html` | DOM/object presence guard | `if(!u)return "";` |
| `7d470eee4826dfa1` | generic OR zero | 8682 | `compute` | general numeric/default fallback | `add("Scenario coverage", scen&&scen.out&&scen.out.length>=3?85:40, (scen&&scen.out&&scen.out.length)\|\|0+" scenarios");` |
| `86db3ad882a5036f` | Math.round usage | 8694 | `compute` | presentation/UI rounding | `const overall=Math.round(parts.reduce((a,p)=>a+p.score,0)/parts.length);` |
| `72fc2c68e636cd57` | Infinity literals | 8715 | `run` | algorithm/parser sentinel | `// zero / negative / NaN / Infinity handling` |
| `7873c26dced4fb6e` | NaN literals | 8715 | `run` | algorithm/parser sentinel | `// zero / negative / NaN / Infinity handling` |
| `abed820fcf5c2d95` | truthy-value checks | 8919 | `render` | DOM/object presence guard | `const box=$("#secMetrics"); if(!box)return;` |
| `24899f515d29c187` | truthy-value checks | 8920 | `render` | DOM/object presence guard | `if(!m){ box.innerHTML=\`<div class="small dim">Select a sector to enable its relevant metrics. Banking metrics are not shown for industrial companies.</div>\`; return; }` |
| `1e77b125a7962b3b` | Math.round usage | 8945 | `score` | presentation/UI rounding | `const score=Math.round(coverage*100);` |
| `a8ebab37f841b3ab` | truthy-value checks | 8949 | `html` | DOM/object presence guard | `if(!p)return "";` |
| `5596fff54cb5a0ba` | Math.round usage | 9047 | `run` | presentation/UI rounding | `const stability= Math.round(posShare*100);` |
| `9c8e878d39a764b1` | truthy-value checks | 9052 | `html` | DOM/object presence guard | `if(!r)return "";` |
| `6642603ad5cd9503` | Math.round usage | 9100 | `refresh` | presentation/UI rounding | `(cal.events\|\|[]).forEach(e=>{ const d=new Date(e.date).getTime(); e._days=Math.round((d-now)/86400000); e._status= e._days<0?"Past": e._days<=5?"Due soon":"Scheduled"; });` |
| `c073c2172ab67244` | truthy-value checks | 9143 | `maximumSharpe` | calculation-sensitive presence guard | `const mv=minimumVariance(items,corr); if(!mv)return null;` |
| `9ec6fe4958e0717b` | truthy-value checks | 9176 | `htmlOptimizer` | DOM/object presence guard | `if(!weights)return \`<div class="banner warn">Optimization requires at least 2 assets with return & volatility data.</div>\`;` |
| `74bae0b7c5735202` | generic OR zero | 9396 | `forProject` | calculation-sensitive numeric fallback | `if(npv!=null) reasons.push("NPV "+fmt.money(npv)+" at "+fmt.pct(res.r\|\|0)+" discount rate.");` |
| `c71227e1cc0bcd32` | truthy-value checks | 9486 | `render` | DOM/object presence guard | `if(!d)return "";` |
| `c73b9b89342975f6` | truthy-value checks | 9570 | `wsPortfolioView` | DOM/object presence guard | `if(!c) return {ok:false,value:null,error:label+" currency is required."};` |
| `8c62e4ce36ae5371` | generic OR zero | 9595 | `wsTxSortKey` | calculation-sensitive numeric fallback | `const t=tx.timestamp\|\|0;` |
| `41401a4db6950c47` | generic OR zero | 9614 | `wsDividendAmounts` | calculation-sensitive numeric fallback | `const withholding= tx.withholdingTax!=null? tx.withholdingTax : (tx.tax\|\|0);` |
| `e844823d04b7675e` | generic OR zero | 9616 | `wsDividendAmounts` | calculation-sensitive numeric fallback | `return {gross:gross!=null?gross:net, withholding:withholding\|\|0, net};` |
| `e01952ad7d11de96` | generic OR zero | 9647 | `wsCalculateFromLedger` | general numeric/default fallback | `pos.fees+=(tx.fees\|\|0);` |
| `c38ecc1fcf224488` | generic OR zero | 9652 | `wsCalculateFromLedger` | calculation-sensitive numeric fallback | `cash[cur]-=(cost+(tx.fees\|\|0)+(tx.tax\|\|0));` |
| `c38ecc1fcf224488` | generic OR zero | 9652 | `wsCalculateFromLedger` | calculation-sensitive numeric fallback | `cash[cur]-=(cost+(tx.fees\|\|0)+(tx.tax\|\|0));` |
| `daad4022b3d432ea` | generic OR zero | 9663 | `wsCalculateFromLedger` | calculation-sensitive numeric fallback | `pos.realizedPnl+= proceedsActual-costPortion-(tx.fees\|\|0)-(tx.tax\|\|0);` |
| `daad4022b3d432ea` | generic OR zero | 9663 | `wsCalculateFromLedger` | calculation-sensitive numeric fallback | `pos.realizedPnl+= proceedsActual-costPortion-(tx.fees\|\|0)-(tx.tax\|\|0);` |
| `e01952ad7d11de96` | generic OR zero | 9666 | `wsCalculateFromLedger` | calculation-sensitive numeric fallback | `pos.fees+=(tx.fees\|\|0);` |
| `b1a0b5db6332e56c` | generic OR zero | 9667 | `wsCalculateFromLedger` | calculation-sensitive numeric fallback | `cash[cur]+=(proceedsActual-(tx.fees\|\|0)-(tx.tax\|\|0));` |
| `b1a0b5db6332e56c` | generic OR zero | 9667 | `wsCalculateFromLedger` | calculation-sensitive numeric fallback | `cash[cur]+=(proceedsActual-(tx.fees\|\|0)-(tx.tax\|\|0));` |
| `125e5475736b1a10` | generic OR zero | 9672 | `wsCalculateFromLedger` | calculation-sensitive numeric fallback | `pos.divIncome+= da.gross\|\|0;   // gross investment income` |
| `2dc7922ad094cc0c` | generic OR zero | 9673 | `wsCalculateFromLedger` | calculation-sensitive numeric fallback | `pos.divNet+= da.net\|\|0;        // net received` |
| `6c2244d23ee851f0` | generic OR zero | 9674 | `wsCalculateFromLedger` | calculation-sensitive numeric fallback | `cash[cur]+=(da.net\|\|0);` |
| `b5189f9952b351fa` | generic OR zero | 9676 | `wsCalculateFromLedger` | calculation-sensitive numeric fallback | `if(positions[key]) positions[key].fees+=(tx.amount\|\|0);` |
| `9f19d78fd26ec947` | generic OR zero | 9677 | `wsCalculateFromLedger` | calculation-sensitive numeric fallback | `cash[cur]-=(tx.amount\|\|0);` |
| `fa2061a24883a0e0` | generic OR zero | 9679 | `wsCalculateFromLedger` | calculation-sensitive numeric fallback | `cash[cur]+=(tx.amount\|\|0);` |
| `9f19d78fd26ec947` | generic OR zero | 9681 | `wsCalculateFromLedger` | calculation-sensitive numeric fallback | `cash[cur]-=(tx.amount\|\|0);` |
| `69b136a4b11ed507` | truthy-value checks | 9720 | `wsFxConvert` | calculation-sensitive presence guard | `function wsFxConvert(amount,currency){ const m=wsFxRateMeta(currency); if(!m)return null; return amount*m.rate; }` |
| `11a26dc9ad19a04b` | truthy-value checks | 9729 | `wsMarketValue` | calculation-sensitive presence guard | `if(!pg) return; // price MISSING` |
| `e8d613d064bf93bf` | truthy-value checks | 9732 | `wsMarketValue` | calculation-sensitive presence guard | `if(!fxM){ missingFx++; return; }` |
| `a1fce9062b860717` | truthy-value checks | 9748 | `wsPositionBaseValue` | calculation-sensitive presence guard | `const ws=wsPortfolio(); const p=ws.holdings&&ws.holdings[k]; if(!p)return null;` |
| `a366b052d64b7799` | truthy-value checks | 9750 | `wsPositionBaseValue` | calculation-sensitive presence guard | `const pg=wsGetPrice(k, ws); if(!pg)return null;` |
| `c8d9df3d35a07f0e` | generic OR zero | 9766 | `wsCashSummary` | calculation-sensitive numeric fallback | `const bal=ws.cashAccounts[c].balance\|\|0; localCash[c]=bal;` |
| `7331411bd7f52c2a` | truthy-value checks | 9803 | `wsReconcile` | calculation-sensitive presence guard | `if(!h){ issues.push({sev:"warning",text:"Position "+k+" exists in ledger but not in stored holdings."}); return; }` |
| `9c995f91e15ed399` | generic OR zero | 9805 | `wsReconcile` | calculation-sensitive numeric fallback | `if(Math.abs((h.costBasis\|\|0)-(d.costBasis\|\|0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Cost basis mismatch "+k});` |
| `9c995f91e15ed399` | generic OR zero | 9805 | `wsReconcile` | calculation-sensitive numeric fallback | `if(Math.abs((h.costBasis\|\|0)-(d.costBasis\|\|0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Cost basis mismatch "+k});` |
| `487ad4dded53c7b9` | generic OR zero | 9806 | `wsReconcile` | calculation-sensitive numeric fallback | `if(Math.abs((h.realizedPnl\|\|0)-(d.realizedPnl\|\|0))>ReconciliationConfig.pnlTolerance) issues.push({sev:"warning",text:"Realized P&L mismatch "+k});` |
| `487ad4dded53c7b9` | generic OR zero | 9806 | `wsReconcile` | calculation-sensitive numeric fallback | `if(Math.abs((h.realizedPnl\|\|0)-(d.realizedPnl\|\|0))>ReconciliationConfig.pnlTolerance) issues.push({sev:"warning",text:"Realized P&L mismatch "+k});` |
| `6bdb761675cd62bf` | generic OR zero | 9807 | `wsReconcile` | calculation-sensitive numeric fallback | `if(Math.abs((h.divIncome\|\|0)-(d.divIncome\|\|0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Dividend mismatch "+k});` |
| `6bdb761675cd62bf` | generic OR zero | 9807 | `wsReconcile` | calculation-sensitive numeric fallback | `if(Math.abs((h.divIncome\|\|0)-(d.divIncome\|\|0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Dividend mismatch "+k});` |
| `8a655a3c0ed5004b` | generic OR zero | 9808 | `wsReconcile` | calculation-sensitive numeric fallback | `if(Math.abs((h.fees\|\|0)-(d.fees\|\|0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Fees mismatch "+k});` |
| `8a655a3c0ed5004b` | generic OR zero | 9808 | `wsReconcile` | calculation-sensitive numeric fallback | `if(Math.abs((h.fees\|\|0)-(d.fees\|\|0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Fees mismatch "+k});` |
| `c199e17927ac0f06` | generic OR zero | 9812 | `wsReconcile` | calculation-sensitive numeric fallback | `const stored=(ws.cashAccounts&&ws.cashAccounts[c]&&ws.cashAccounts[c].balance)\|\|0;` |
| `89d4962e99d740d6` | truthy-value checks | 9825 | `wsValidateTransaction` | calculation-sensitive presence guard | `if(!tx) return {ok:false,errors:["Transaction is empty."]};` |
| `9bb24f83ef02c45b` | truthy-value checks | 9885 | `wsUnrealized` | calculation-sensitive presence guard | `const p=(wsPortfolio().holdings\|\|{})[security]; if(!p)return null;` |
| `22ed49ca589ec342` | truthy-value checks | 9907 | `wsPortfolioRender` | DOM/object presence guard | `Object.keys(pos).forEach(k=>{ const g=wsGetPrice(k,ws); if(!g){ missingKeys.push(k); } else if(g.freshness==="STALE"\|\|g.freshness==="AGING"){ staleKeys.push(k); } });` |
| `68103860d0465217` | fallback-to-zero coercions | 9927 | `wsPortfolioRender` | calculation-sensitive numeric fallback | `const pa=$("#ws_pricesApply"); if(pa)pa.addEventListener("click",()=>{ const m={}; $("#ws_prices").value.split(",").forEach(s=>{ const p=s.split(":"); if(p.length===2)m[p[0].trim()]=Number(p[1])\|\|0; }); ws.prices=m; StorageManager.save(); wsPortfolioRender(); wsRebalanceRender(); });` |
| `6fd31b67bc075719` | generic OR zero | 9927 | `wsPortfolioRender` | calculation-sensitive numeric fallback | `const pa=$("#ws_pricesApply"); if(pa)pa.addEventListener("click",()=>{ const m={}; $("#ws_prices").value.split(",").forEach(s=>{ const p=s.split(":"); if(p.length===2)m[p[0].trim()]=Number(p[1])\|\|0; }); ws.prices=m; StorageManager.save(); wsPortfolioRender(); wsRebalanceRender(); });` |
| `5d457134505bd577` | truthy-value checks | 9962 | `renderExtra` | DOM/object presence guard | `const extra=$("#tx_extra"); if(!extra)return;` |
| `947c7b254097b9c7` | truthy-value checks | 9986 | `renderExtra` | DOM/object presence guard | `if(!sec){ showErr(["Security is required."]); return; }` |
| `b067a1b6fcfe1b89` | truthy-value checks | 10045 | `wsRebalanceRender` | DOM/object presence guard | `wire("tw_add","click",()=>{ const sec=$("#tw_sec").value; if(!sec){toast("Enter security.","warn");return;} if(!ws.targetWeights)ws.targetWeights={};` |
| `0efd04885b5e6495` | fallback-to-zero coercions | 10046 | `wsRebalanceRender` | calculation-sensitive numeric fallback | `ws.targetWeights[sec]={target:(Number($("#tw_target").value)\|\|0)/100,min:(Number($("#tw_min").value)\|\|0)/100,max:(Number($("#tw_max").value)\|\|100)/100}; StorageManager.save(); wsRebalanceRender(); });` |
| `e17acd8f9a9033f3` | generic OR zero | 10046 | `wsRebalanceRender` | calculation-sensitive numeric fallback | `ws.targetWeights[sec]={target:(Number($("#tw_target").value)\|\|0)/100,min:(Number($("#tw_min").value)\|\|0)/100,max:(Number($("#tw_max").value)\|\|100)/100}; StorageManager.save(); wsRebalanceRender(); });` |
| `e17acd8f9a9033f3` | generic OR zero | 10046 | `wsRebalanceRender` | calculation-sensitive numeric fallback | `ws.targetWeights[sec]={target:(Number($("#tw_target").value)\|\|0)/100,min:(Number($("#tw_min").value)\|\|0)/100,max:(Number($("#tw_max").value)\|\|100)/100}; StorageManager.save(); wsRebalanceRender(); });` |
| `da41e3341910b86c` | truthy-value checks | 10202 | `wsHomeRender` | DOM/object presence guard | `$$("#wsHomeOut [data-wsh]").forEach(b=>b.addEventListener("click",()=>{ const sec=b.dataset.wsh; const o=$("#wsSections"); if(!o)return;` |
| `b8679a8a0d4086d0` | generic OR zero | 10235 | `wsTWR` | calculation-sensitive numeric fallback | `const start=snapshots[i-1].mv\|\|0;` |
| `8bb27eff15a3198b` | generic OR zero | 10236 | `wsTWR` | calculation-sensitive numeric fallback | `const end=snapshots[i].mv\|\|0;` |
| `4dd0c5198455f803` | generic OR zero | 10237 | `wsTWR` | calculation-sensitive numeric fallback | `const flow=snapshots[i].cashFlow\|\|0;` |
| `821ca644399e7f27` | generic OR zero | 10251 | `wsMWR` | calculation-sensitive numeric fallback | `flows.push(-(snapshots[0].mv\|\|0)); dates.push(snapshots[0].date);` |
| `c478fd71ad8b5240` | generic OR zero | 10253 | `wsMWR` | calculation-sensitive numeric fallback | `flows.push(-(snapshots[i].cashFlow\|\|0)); dates.push(snapshots[i].date);` |
| `f7fa270f377916b2` | generic OR zero | 10256 | `wsMWR` | calculation-sensitive numeric fallback | `flows.push((last.mv\|\|0)); dates.push(last.date);` |
| `fe0162c57d012017` | fallback-to-zero coercions | 10311 | `wsPerformanceRender` | calculation-sensitive numeric fallback | `const b=$("#perf_snap"); if(b)b.addEventListener("click",()=>{ const mv=Number($("#perf_mv").value)\|\|wsMarketValue().mv\|\|0; const flow=Number($("#perf_flow").value)\|\|0;` |
| `6403974e4b8bb381` | generic OR zero | 10311 | `wsPerformanceRender` | calculation-sensitive numeric fallback | `const b=$("#perf_snap"); if(b)b.addEventListener("click",()=>{ const mv=Number($("#perf_mv").value)\|\|wsMarketValue().mv\|\|0; const flow=Number($("#perf_flow").value)\|\|0;` |
| `6403974e4b8bb381` | generic OR zero | 10311 | `wsPerformanceRender` | calculation-sensitive numeric fallback | `const b=$("#perf_snap"); if(b)b.addEventListener("click",()=>{ const mv=Number($("#perf_mv").value)\|\|wsMarketValue().mv\|\|0; const flow=Number($("#perf_flow").value)\|\|0;` |
| `ae27fae9a7ac1079` | toFixed usage | 10378 | `wsBenchmarkValidate` | presentation/UI rounding | `if(sf!=null&&bf!=null&&Math.abs(sf-bf)>1) issues.push("Portfolio and benchmark have different frequencies ("+sf.toFixed(1)+"d vs "+bf.toFixed(1)+"d).");` |
| `ae27fae9a7ac1079` | toFixed usage | 10378 | `wsBenchmarkValidate` | presentation/UI rounding | `if(sf!=null&&bf!=null&&Math.abs(sf-bf)>1) issues.push("Portfolio and benchmark have different frequencies ("+sf.toFixed(1)+"d vs "+bf.toFixed(1)+"d).");` |
| `c9826fbe1d5c6580` | truthy-value checks | 10388 | `computeBenchmark` | DOM/object presence guard | `const out=$("#bmOut"); if(!out)return;` |
| `68c121b3682dd927` | truthy-value checks | 10401 | `computeBenchmark` | DOM/object presence guard | `if(!c){ out.innerHTML=\`<div class="banner info">Insufficient aligned data to compute capture ratios.</div>\`; return; }` |
| `7bf1c9e69488bbcc` | truthy-value checks | 10435 | `wsNotificationsRender` | DOM/object presence guard | `const el=$("#notifOut"); if(!el)return;` |
| `9404d0cc0a7f1ce7` | truthy-value checks | 10473 | `wsBreadcrumbs` | DOM/object presence guard | `const el=$("#breadcrumbs"); if(!el)return;` |
| `ac190beb4a85befa` | truthy-value checks | 10513 | `wsHeaderWire` | DOM/object presence guard | `const sr=$("#stockResults"); if(!sr)return;` |
| `cd2c7046d4cc63d7` | truthy-value checks | 10661 | `wsAttributionRender` | DOM/object presence guard | `const out=$("#atOut"); if(!out)return;` |
| `1240d9246d78dd35` | truthy-value checks | 10662 | `wsAttributionRender` | DOM/object presence guard | `if(!r){ out.innerHTML=\`<div class="banner warn">Enter start & end price to decompose. EPS enables the earnings/multiple split.</div>\`; return; }` |
| `ae766e4fc15b7c10` | truthy-value checks | 10710 | `wsFreshness` | calculation-sensitive presence guard | `if(!asOf)return {state:WS_FRESH.MISSING,days:null};` |
| `aaf66820a02b83c7` | truthy-value checks | 10725 | `status` | calculation-sensitive presence guard | `function status(name){ const p=registered[name]; if(!p)return {connected:false}; return {connected:p.connected\|\|false,source:p.source\|\|"not connected",live:p.live\|\|false}; }` |
| `f4e60aa3d55a5004` | truthy-value checks | 10755 | `wsMarketDataRender` | DOM/object presence guard | `const b=$("#md_add"); if(b)b.addEventListener("click",()=>{ const sec=$("#md_sec").value; if(!sec){toast("Enter security.","warn");return;}` |
| `bbbd2d99d9b62d44` | fallback-to-zero coercions | 10756 | `wsMarketDataRender` | calculation-sensitive numeric fallback | `book[sec]={price:Number($("#md_price").value)\|\|0,currency:$("#md_cur").value,asOf:new Date($("#md_asof").value).getTime(),source:$("#md_src").value\|\|"USER PROVIDED"};` |
| `3c5a12d134033665` | generic OR zero | 10756 | `wsMarketDataRender` | calculation-sensitive numeric fallback | `book[sec]={price:Number($("#md_price").value)\|\|0,currency:$("#md_cur").value,asOf:new Date($("#md_asof").value).getTime(),source:$("#md_src").value\|\|"USER PROVIDED"};` |
| `7194c892c86870b2` | truthy-value checks | 10789 | `save` | calculation-sensitive presence guard | `if(!dbOk){ resolve({ok:false,reason:"IndexedDB unavailable — metadata only."}); return; }` |
| `ec9044d5b0e5e90c` | truthy-value checks | 10800 | `get` | calculation-sensitive presence guard | `if(!dbOk){ resolve(null); return; }` |
| `3dc6390462c8a8f4` | truthy-value checks | 10811 | `remove` | calculation-sensitive presence guard | `if(!dbOk){ resolve(false); return; }` |
| `99eb4874fa5507d1` | toFixed usage | 10828 | `wsHumanSize` | presentation/UI rounding | `return (i===0?String(Math.round(v)):(v).toFixed(1))+" "+u[i];` |
| `af8ccf97eb84ff69` | Math.round usage | 10828 | `wsHumanSize` | presentation/UI rounding | `return (i===0?String(Math.round(v)):(v).toFixed(1))+" "+u[i];` |
| `bc86799e935f1408` | truthy-value checks | 10853 | `wsLibraryRenderV2` | DOM/object presence guard | `wire("rl2_add","click",async ()=>{ const title=$("#rl2_title").value; if(!title){toast("Enter a title.","warn");return;}` |
| `e0c8a2eade6a1d0b` | truthy-value checks | 10858 | `wsLibraryRenderV2` | DOM/object presence guard | `if(d&&d.blobId){ try{ const removed=await DocStore.remove(d.blobId); if(!removed) blobErr="Could not remove stored file from IndexedDB."; }catch(e){ blobErr="File removal failed: "+e.message; } }` |
| `e6e5c5b150ed0dde` | truthy-value checks | 11006 | `wsWorkspaceSharingRender` | DOM/object presence guard | `$("#ws_importFile").addEventListener("change",e=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{ const txt=r.result;` |
| `f716299f38dd7884` | truthy-value checks | 11138 | `wsModeDashboard` | calculation-sensitive presence guard | `const o=$("#wsModeOut"); if(!o)return;` |
| `01449dd7caa8ea2d` | truthy-value checks | 11220 | `wsConsensusRender` | DOM/object presence guard | `wire("cs_add","click",()=>{ const o=$("#csOut"); if(!o)return; const metric=$("#cs_metric").value, c=Number($("#cs_company").value), cons=$("#cs_consensus").value?Number($("#cs_consensus").value):null, m=Number($("#cs_model").value), a=$("#cs_actual").value?Number($("#cs_actual").value):null;` |
| `1430747d1d9028a6` | truthy-value checks | 11557 | `render` | DOM/object presence guard | `const g=GUIDES[view]; if(!g)return "";` |
| `62d4c84719c604d6` | truthy-value checks | 11589 | `inject` | DOM/object presence guard | `const sec=document.querySelector("#view-"+view); if(!sec)return;` |
| `c011a68f1c732c1b` | truthy-value checks | 11591 | `inject` | DOM/object presence guard | `const html=render(view); if(!html)return;` |
| `52caf5d5b563d0fa` | truthy-value checks | 11685 | `wireCreditPanels` | DOM/object presence guard | `const r=App.state.results.risk; if(!r)return;` |
| `e08f3b0fedf3aea0` | truthy-value checks | 11686 | `wireCreditPanels` | DOM/object presence guard | `const target=$("#rkOut"); if(!target)return;` |
| `b25fbfd3ea49a1be` | truthy-value checks | 11759 | `wireBiasControls` | DOM/object presence guard | `if(!target)return;` |
| `1a892bfabcc153d7` | truthy-value checks | 11761 | `wireBiasControls` | DOM/object presence guard | `if(!host)return;` |
| `73df3719abeefa39` | truthy-value checks | 11774 | `wireGoldenValidation` | DOM/object presence guard | `const target=$("#governanceOut"); if(!target)return;` |
| `e389dd3e116db18d` | toFixed usage | 11795 | `wireGoldenValidation` | presentation/UI rounding | `${results.map(r=>\`<tr><td>${r.name}</td><td class="num">${typeof r.exp==="number"?r.exp.toFixed(4):"—"}</td><td class="num">${r.actual!=null?r.actual.toFixed(4):(r.err\|\|"—")}</td><td>${r.pass?pill("PASS","good"):pill("FAIL","bad")}</td></tr>\`).join("")}</tbody></table></div>\`; });` |
| `e389dd3e116db18d` | toFixed usage | 11795 | `wireGoldenValidation` | presentation/UI rounding | `${results.map(r=>\`<tr><td>${r.name}</td><td class="num">${typeof r.exp==="number"?r.exp.toFixed(4):"—"}</td><td class="num">${r.actual!=null?r.actual.toFixed(4):(r.err\|\|"—")}</td><td>${r.pass?pill("PASS","good"):pill("FAIL","bad")}</td></tr>\`).join("")}</tbody></table></div>\`; });` |
| `a2578427e605503f` | generic OR zero | 11884 | `wsPerfRisk` | calculation-sensitive numeric fallback | `const sharpe= CalcEngine.sharpe(periodRets,0.02/annualFactor\|\|0.02/252);` |
| `19400b41288f81f2` | generic OR zero | 11885 | `wsPerfRisk` | calculation-sensitive numeric fallback | `const sortino= CalcEngine.sortino(periodRets,0.02/annualFactor\|\|0.02/252);` |
| `b1dfaa692df0c5e9` | truthy-value checks | 11947 | `periodReturnsArray` | DOM/object presence guard | `if(!rd)return "";` |
| `12c3d4d2a08af5ac` | fallback-to-zero coercions | 11959 | `periodReturnsArray` | calculation-sensitive numeric fallback | `const b=$("#pf_snap"); if(b)b.addEventListener("click",()=>{ const mv2=Number($("#pf_mv").value)\|\|mv.mv\|\|0; const flow=Number($("#pf_flow").value)\|\|0;` |
| `46e2cf57b7f8aae8` | generic OR zero | 11959 | `periodReturnsArray` | calculation-sensitive numeric fallback | `const b=$("#pf_snap"); if(b)b.addEventListener("click",()=>{ const mv2=Number($("#pf_mv").value)\|\|mv.mv\|\|0; const flow=Number($("#pf_flow").value)\|\|0;` |
| `46e2cf57b7f8aae8` | generic OR zero | 11959 | `periodReturnsArray` | calculation-sensitive numeric fallback | `const b=$("#pf_snap"); if(b)b.addEventListener("click",()=>{ const mv2=Number($("#pf_mv").value)\|\|mv.mv\|\|0; const flow=Number($("#pf_flow").value)\|\|0;` |
| `0f16b9639f7e281d` | truthy-value checks | 12060 | `irr` | calculation-sensitive presence guard | `function irr(flows){ assertFiniteArray(flows,'flows'); if(flows.length<2\|\|!flows.some(x=>x<0)\|\|!flows.some(x=>x>0))return null; const f=r=>npv(flows,r); const points=[]; for(let i=0;i<=800;i++){ const x=-0.9999+i*(10.9999/800); const y=f(x); if(y!=null&&Number.isFinite(y))points.push([x,y]); } let bracket=null; for(let i=1;i<points.length;i++){ if(points[i-1][1]===0)return points[i-1][0]; if(points[i-1][1]*points[i][1]<0){ bracket=[points[i-1][0],points[i][0]]; break; } } if(!bracket)return null; let [lo,hi]=bracket,flo=f(lo); for(let i=0;i<300;i++){const mid=(lo+hi)/2,fm=f(mid);if(Math.abs(fm)<1e-11)return mid;if(flo*fm<=0)hi=mid;else{lo=mid;flo=fm;}}return (lo+hi)/2; }` |
| `fb8496ab76cfe239` | Math.round usage | 12126 | `bondPeriods` | presentation/UI rounding | `function bondPeriods(years,frequency){ asFinite(years,'years'); if(!validPeriod(frequency)\|\|years<=0)throw new RangeError('positive years and integer frequency required'); const n=years*frequency; if(Math.abs(n-Math.round(n))>1e-9)throw new RangeError('years × frequency must be an integer number of periods'); return Math.round(n); }` |
| `fb8496ab76cfe239` | Math.round usage | 12126 | `bondPeriods` | presentation/UI rounding | `function bondPeriods(years,frequency){ asFinite(years,'years'); if(!validPeriod(frequency)\|\|years<=0)throw new RangeError('positive years and integer frequency required'); const n=years*frequency; if(Math.abs(n-Math.round(n))>1e-9)throw new RangeError('years × frequency must be an integer number of periods'); return Math.round(n); }` |
| `281850d60ebd0b14` | toFixed usage | 12282 | `build` | algorithmic rounding | `if(marginVariance!=null&&Math.abs(marginVariance)>.005)warnings.push({severity:'CAUTION',code:'FM-MARGIN-001',year:y,message:\`Detailed cost assumptions imply EBITDA margin ${(mar*100).toFixed(2)}%, versus target ${(marginTarget*100).toFixed(2)}%.\`});` |
| `281850d60ebd0b14` | toFixed usage | 12282 | `build` | algorithmic rounding | `if(marginVariance!=null&&Math.abs(marginVariance)>.005)warnings.push({severity:'CAUTION',code:'FM-MARGIN-001',year:y,message:\`Detailed cost assumptions imply EBITDA margin ${(mar*100).toFixed(2)}%, versus target ${(marginTarget*100).toFixed(2)}%.\`});` |
| `6d003cf0dceb9b06` | truthy-value checks | 12359 | `stressRun` | calculation-sensitive presence guard | `if(!base)return null;` |
| `6708eebe7019f627` | generic OR zero | 12412 | `portfolioBuild` | calculation-sensitive numeric fallback | `const add=(obj,key,w)=>obj[key]=(obj[key]\|\|0)+w;` |
| `b8b57f05a3a70d60` | NaN literals | 12425 | `portfolioStress` | algorithm/parser sentinel | `const totalWeight=port.items.reduce((s,x)=>s+(finite(x.weight)?x.weight:NaN),0);` |
| `c36b68003c41e63d` | truthy-value checks | 12494 | `valuationDrivers` | calculation-sensitive presence guard | `if(!base)return null;` |
| `b038369b332d24d5` | toFixed usage | 12641 | `altmanZ` | presentation/UI rounding | `return {z,X1,X2,X3,X4,X5,terms:{X1,X2,X3,X4,X5},zone,msg:\`Z = ${z.toFixed(2)} (${zone}). The Z-Score is a heuristic, not a guarantee of bankruptcy.\`};` |
| `367145facb0f4fed` | toFixed usage | 12649 | `altmanZPrime` | presentation/UI rounding | `return {z,X1,X2,X3,X4,X5,terms:{X1,X2,X3,X4,X5},zone,msg:\`Z'-score = ${z.toFixed(2)} (${zone}). Private/emerging-market variant.\`};` |
| `ff998e764566a608` | truthy-value checks | 12702 | `solveAssetValue` | calculation-sensitive presence guard | `const mid=(lo+hi)/2,eMid=mertonEquity(mid,sigmaV,D,r,T);if(!eMid)return null;` |
| `c5fd04e381eba93b` | truthy-value checks | 12722 | `merton` | calculation-sensitive presence guard | `if(!eq)return {error:'Merton solver produced a non-finite state.',converged:false,pd:null,E,sigmaE,D,r,T};` |
| `6f9527b623ced2cb` | truthy-value checks | 12726 | `merton` | calculation-sensitive presence guard | `if(!converged)return {error:'Merton solver did not converge to the requested tolerance.',converged:false,pd:null,V,sigmaV,d1:eq.d1,d2:eq.d2,distanceToDefault:eq.d2,E,sigmaE,D,r,T,iterations,residualEquity,residualVol};` |
| `75de0cb65365124b` | generic OR zero | 12732 | `mertonTrace` | calculation-sensitive numeric fallback | `return {iterations:x.iterations\|\|0,converged:!!x.converged,residual:finite(x.residualEquity)?Math.abs(x.residualEquity):null,residualVol:finite(x.residualVol)?Math.abs(x.residualVol):null,distanceToDefault:finite(x.distanceToDefault)?x.distanceToDefault:null,pd:finite(x.pd)?x.pd:null,error:x.error\|\|null};` |
| `a6ff05064257af02` | truthy-value checks | 12810 | `preferenceScore` | calculation-sensitive presence guard | `const normalized=normalizeWeightObject(weights);if(!normalized)return null;` |
| `f1cd594185990b1c` | Math.round usage | 12818 | `preferenceScore` | presentation/UI rounding | `return {score:Math.round(score),detail,weights:Object.assign({},weights)};` |
| `ecc6fffc1dfd3cd9` | Math.round usage | 12831 | `dataQualityScore` | presentation/UI rounding | `const score=total>0?Math.round(earned/total*100):0;` |
| `58ab9dcce1d3fb6e` | Math.round usage | 12845 | `peerDataCoverage` | presentation/UI rounding | `const coverage=covered/(5*peers.length);return {score:Math.round(coverage*100),coverage,n:peers.length};` |
| `a98c4344888d1214` | Math.round usage | 12849 | `moatScore` | presentation/UI rounding | `return Math.round(values.reduce((s,v)=>s+v,0)/values.length);` |
| `90c3f4df742f9f10` | truthy-value checks | 12853 | `factorExposure` | calculation-sensitive presence guard | `const norm=normalizeItems(items);if(!norm)return null;` |
| `64e9433b0756f969` | Math.round usage | 12869 | `factorExposure` | presentation/UI rounding | `return Object.entries(exposures).map(([factor,exposure])=>({factor,exposure:Math.round(exposure*100)/100,risk:Math.abs(exposure)>.6?'High':Math.abs(exposure)>.3?'Medium':'Low'}));` |
| `37f18cc5dc266dc0` | truthy-value checks | 12895 | `riskContribution` | calculation-sensitive presence guard | `const norm=normalizeItems(port.items);if(!norm)return null;` |
| `db28f0d35ee8b9f9` | truthy-value checks | 12926 | `minimumVariance` | calculation-sensitive presence guard | `const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;` |
| `6ebe1dae9c4d0c49` | truthy-value checks | 12940 | `maximumSharpe` | calculation-sensitive presence guard | `const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;` |
| `b48fd9e62be33f6a` | truthy-value checks | 12941 | `maximumSharpe` | calculation-sensitive presence guard | `let w=minimumVariance(items,corrMatrix);if(!w)return null;` |
| `5f633c2d34906b7e` | Infinity literals | 12944 | `maximumSharpe` | algorithm/parser sentinel | `return vr>EPS?(ret-riskFreeRate)/Math.sqrt(vr):-Infinity;` |
| `9363d8354a5cf401` | truthy-value checks | 12952 | `maximumSharpe` | calculation-sensitive presence guard | `if(!improved){step*=.5;if(step<1e-7)break;}` |
| `8fbd131fd8129e71` | truthy-value checks | 12958 | `riskParity` | calculation-sensitive presence guard | `const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;` |
| `21da93e5cada76ee` | truthy-value checks | 12994 | `sumOfParts` | calculation-sensitive presence guard | `if(!p)return null;let value=null,source=null;` |
| `fcafec5d6d68021e` | fallback-to-zero coercions | 13004 | `mulberry32` | calculation-sensitive numeric fallback | `function mulberry32(seed){let a=(Number(seed)\|\|0)>>>0;return function(){a\|=0;a=a+0x6D2B79F5\|0;let t=Math.imul(a^a>>>15,1\|a);t=t+Math.imul(t^t>>>7,61\|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}` |
| `5447e421fae7d39a` | generic OR zero | 13004 | `mulberry32` | calculation-sensitive numeric fallback | `function mulberry32(seed){let a=(Number(seed)\|\|0)>>>0;return function(){a\|=0;a=a+0x6D2B79F5\|0;let t=Math.imul(a^a>>>15,1\|a);t=t+Math.imul(t^t>>>7,61\|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}` |
| `46b95fc05cdf21fb` | truthy-value checks | 13041 | `timeWeightedReturnFromSnapshots` | calculation-sensitive presence guard | `const returns=periodReturnsFromSnapshots(snapshots);if(!returns)return null;` |
| `1fbf6e8f8dbc62be` | truthy-value checks | 13169 | `calculateLedger` | calculation-sensitive presence guard | `if(!key){warnings.push({index,code:'LEDGER-DIVIDEND-INVALID',message:'Dividend security is missing.'});return;}` |
| `039df648b08bacbf` | truthy-value checks | 13170 | `calculateLedger` | calculation-sensitive presence guard | `const da=dividendAmounts(tx);if(!da){warnings.push({index,code:'LEDGER-DIVIDEND-INVALID',message:'Invalid dividend transaction skipped.'});return;}` |
| `21e5050c4cb0effc` | truthy-value checks | 13198 | `positionUnrealized` | calculation-sensitive presence guard | `if(!position)return null;const qty=finite(position.quantity)?position.quantity:position.qty;` |
| `a4aa547737bc4aa5` | truthy-value checks | 13243 | `cashSummary` | calculation-sensitive presence guard | `if(!Core){ console.error('Financial certification runtime: FinanceCore missing'); return; }` |
| `e7ba025a2b25b2f0` | truthy-value checks | 13247 | `cashSummary` | calculation-sensitive presence guard | `if(!ModelCore)installReport.warnings.push('FinancialModelCore missing; three-statement model is outside the expanded certification boundary.');` |
| `66b8cc75af75c7b6` | truthy-value checks | 13248 | `cashSummary` | calculation-sensitive presence guard | `if(!LegacyCore)installReport.warnings.push('LegacyCalculationCore missing; stress, portfolio and multi-method valuation remain outside the expanded certification boundary.');` |
| `1256fcfbc6727250` | truthy-value checks | 13249 | `cashSummary` | calculation-sensitive presence guard | `if(!RiskCore)installReport.warnings.push('RiskCreditCore missing; VaR/ES, credit curves, Altman and Merton remain outside the expanded certification boundary.');` |
| `3216bf7792f58e74` | truthy-value checks | 13253 | `cashSummary` | calculation-sensitive presence guard | `const a=Core.abbreviate(v); if(!a) return '—';` |
| `6782ec725bf36368` | Math.round usage | 13420 | `top-level/unknown` | presentation/UI rounding | `const lgd=1-recovery;return {pd,recovery,ead,lgd,el:Math.round(amount*100)/100};` |
| `6b95b77be0e9ccec` | truthy-value checks | 13482 | `top-level/unknown` | calculation-sensitive presence guard | `if(!W){console.error('Financial certification runtime: WorkstationCalculationCore missing');return;}` |
| `fdf36342a9752fb4` | truthy-value checks | 13531 | `top-level/unknown` | calculation-sensitive presence guard | `wsPositionBaseValue=security=>{const ws=typeof wsPortfolio==='function'?wsPortfolio():null,p=ws&&ws.holdings?ws.holdings[security]:null;if(!p)return null;const pg=typeof wsGetPrice==='function'?wsGetPrice(security,ws):null;if(!pg)return null;const fx=typeof wsFxRate==='function'?wsFxRate(p.currency\|\|(typeof wsBaseCurrency==='function'?wsBaseCurrency():'EUR')):null;return L.positionBaseValue(p,pg.price,fx);};` |
| `fdf36342a9752fb4` | truthy-value checks | 13531 | `top-level/unknown` | calculation-sensitive presence guard | `wsPositionBaseValue=security=>{const ws=typeof wsPortfolio==='function'?wsPortfolio():null,p=ws&&ws.holdings?ws.holdings[security]:null;if(!p)return null;const pg=typeof wsGetPrice==='function'?wsGetPrice(security,ws):null;if(!pg)return null;const fx=typeof wsFxRate==='function'?wsFxRate(p.currency\|\|(typeof wsBaseCurrency==='function'?wsBaseCurrency():'EUR')):null;return L.positionBaseValue(p,pg.price,fx);};` |
| `d9fd9e504cb740d8` | truthy-value checks | 13539 | `top-level/unknown` | calculation-sensitive presence guard | `wsCashSummary=()=>{const ws=typeof wsPortfolio==='function'?wsPortfolio():null;if(!ws)return null;const mv=typeof wsMarketValue==='function'?wsMarketValue():null;return L.cashSummary(ws.cashAccounts\|\|{},ws.fxRates\|\|{},typeof wsBaseCurrency==='function'?wsBaseCurrency():'EUR',mv&&Number.isFinite(mv.mv)?mv.mv:0);};` |
