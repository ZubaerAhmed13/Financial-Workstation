(function(root,factory){
  let Core=null,Sim=null;
  if(typeof module==='object'&&module.exports){
    Core=require('./engine.js');
    Sim=require('./simulation-backtest-core.js');
  }else{
    Core=root.FinanceCore;
    Sim=root.SimulationBacktestCore;
  }
  const api=factory(Core,Sim);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SurfaceRetirementCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Sim){
  'use strict';
  const VERSION='1.0.0';
  const EPS=1e-12;
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const has=(o,k)=>o!=null&&Object.prototype.hasOwnProperty.call(o,k);
  const safeDivide=(n,d)=>finite(n)&&finite(d)&&Math.abs(d)>EPS?n/d:null;
  const mean=a=>Core&&Core.mean?Core.mean(a):(Array.isArray(a)&&a.length?a.reduce((s,v)=>s+v,0)/a.length:null);
  const stdev0=a=>Core&&Core.stdev?Core.stdev(a,0):null;

  function scenarioRun(baseDcf,scenarios,currentPrice,netDebt,shares){
    if(!Core||typeof Core.dcf!=='function'||!baseDcf||!Array.isArray(scenarios)||!finite(netDebt)||!finite(shares)||shares<=0)return null;
    if(currentPrice!=null&&(!finite(currentPrice)||currentPrice<=0))return null;
    const out=[];
    for(const s of scenarios){
      if(!s||![s.growth,s.margin,s.wacc,s.terminalGrowth].every(finite))return null;
      const cfg={
        revenue0:baseDcf.revenue0,growth:s.growth,ebitdaMargin:s.margin,tax:baseDcf.tax,
        capexPct:has(s,'capexPct')?s.capexPct:baseDcf.capexPct,wcPct:has(s,'wcPct')?s.wcPct:baseDcf.wcPct,
        dandaPct:baseDcf.dandaPct,wacc:s.wacc,terminalGrowth:s.terminalGrowth,terminalMethod:baseDcf.terminalMethod,
        exitMultiple:has(s,'exitMultiple')?s.exitMultiple:baseDcf.exitMultiple,netDebt,shares,horizon:baseDcf.horizon
      };
      const dcf=Core.dcf(cfg);const value=dcf&&dcf.error?null:dcf&&dcf.perShare;
      const prob=has(s,'prob')?s.prob:null;if(prob!=null&&(!finite(prob)||prob<0))return null;
      const mos=value!=null&&currentPrice!=null?value/currentPrice-1:null;
      out.push({name:s.name,growth:s.growth,margin:s.margin,wacc:s.wacc,tg:s.terminalGrowth,prob,value,perShare:value,dcf,mos});
    }
    const allProb=out.length>0&&out.every(x=>x.prob!=null),probSum=allProb?out.reduce((s,x)=>s+x.prob,0):0;
    const weighted=allProb&&probSum>EPS&&out.every(x=>finite(x.value))?out.reduce((s,x)=>s+x.prob*x.value,0)/probSum:null;
    return {out,weighted};
  }

  function correlationMatrix(series){
    if(!Core||typeof Core.correlation!=='function'||!Array.isArray(series)||!series.length)return null;
    if(series.some(s=>!s||!Array.isArray(s.returns)||s.returns.some(v=>!finite(v))))return null;
    const n=Math.min(...series.map(s=>s.returns.length));if(n<2)return null;
    const names=series.map(s=>s.name),m=series.length,matrix=Array.from({length:m},()=>Array(m).fill(null));
    for(let i=0;i<m;i++)for(let j=0;j<m;j++)matrix[i][j]=i===j?1:Core.correlation(series[i].returns.slice(-n),series[j].returns.slice(-n));
    return {names,matrix,n};
  }

  function normalizeDate(v){const t=finite(v)?v:new Date(v).getTime();return Number.isFinite(t)?t:null;}
  function alignPriceSeries(a,b){
    if(!Array.isArray(a)||!Array.isArray(b))return null;
    const map=new Map();
    for(const x of b){const d=x?normalizeDate(x.date):null;if(d!=null&&finite(x.close)&&x.close>0)map.set(d,x);}
    const common=[];
    for(const x of a){const d=x?normalizeDate(x.date):null;if(d==null||!finite(x.close)||x.close<=0)continue;const y=map.get(d);if(y)common.push({d,a:x,b:y});}
    common.sort((x,y)=>x.d-y.d);
    const matchedReturnsA=[],matchedReturnsB=[];
    for(let i=1;i<common.length;i++){
      const pa=common[i-1].a.close,ca=common[i].a.close,pb=common[i-1].b.close,cb=common[i].b.close;
      if(pa>0&&ca>0&&pb>0&&cb>0){matchedReturnsA.push(ca/pa-1);matchedReturnsB.push(cb/pb-1);}
    }
    return {n:common.length,matchedReturnsA,matchedReturnsB,dates:common.map(x=>x.d)};
  }
  function betaAlphaAligned(a,b,rfPerPeriod=0){
    if(!Core||!finite(rfPerPeriod))return null;const al=alignPriceSeries(a,b);if(!al||al.matchedReturnsA.length<5)return null;
    const beta=Core.beta(al.matchedReturnsA,al.matchedReturnsB),corr=Core.correlation(al.matchedReturnsA,al.matchedReturnsB);
    const ma=mean(al.matchedReturnsA),mb=mean(al.matchedReturnsB),alpha=beta==null||ma==null||mb==null?null:(ma-rfPerPeriod)-beta*(mb-rfPerPeriod);
    return {beta,alpha,corr,n:al.matchedReturnsA.length,method:'Date-aligned periodic returns'};
  }

  function rollingVol(returns,window,annualFactor){
    if(!Array.isArray(returns)||returns.some(v=>!finite(v))||!Number.isInteger(window)||window<2||!finite(annualFactor)||annualFactor<=0)return null;
    const out=[];for(let i=window-1;i<returns.length;i++){const sd=stdev0(returns.slice(i-window+1,i+1));out.push(sd==null?null:sd*Math.sqrt(annualFactor));}return out;
  }
  function rollingBeta(asset,bench,window){
    if(!Core||!Array.isArray(asset)||!Array.isArray(bench)||asset.length!==bench.length||asset.some(v=>!finite(v))||bench.some(v=>!finite(v))||!Number.isInteger(window)||window<2)return null;
    const out=[];for(let i=window-1;i<asset.length;i++)out.push(Core.beta(asset.slice(i-window+1,i+1),bench.slice(i-window+1,i+1)));return out;
  }
  function rollingSharpe(returns,window,rfPerPeriod=0){
    if(!Core||!Array.isArray(returns)||returns.some(v=>!finite(v))||!Number.isInteger(window)||window<2||!finite(rfPerPeriod))return null;
    const out=[];for(let i=window-1;i<returns.length;i++)out.push(Core.sharpe(returns.slice(i-window+1,i+1),rfPerPeriod));return out;
  }
  function rollingDrawdown(closes){
    if(!Array.isArray(closes)||!closes.length||closes.some(v=>!finite(v)||v<=0))return null;
    const out=[];let peak=closes[0];for(const v of closes){if(v>peak)peak=v;out.push(v/peak-1);}return out;
  }

  function historicalBootstrap(cfg){
    cfg=cfg||{};const returns=cfg.returns,initial=has(cfg,'initial')?cfg.initial:100,simulations=has(cfg,'simulations')?cfg.simulations:10000,seed=has(cfg,'seed')?cfg.seed:1234;
    const periods=has(cfg,'periods')?cfg.periods:(has(cfg,'n')?cfg.n:252),target=has(cfg,'target')?cfg.target:null;
    if(!Array.isArray(returns)||returns.length<5||returns.some(v=>!finite(v)||v<=-1)||!finite(initial)||initial<=0||!Number.isInteger(simulations)||simulations<=0||simulations>100000||!Number.isInteger(seed)||!Number.isInteger(periods)||periods<=0||periods>10000||target!=null&&!finite(target))return null;
    const rng=(Sim&&Sim.mulberry32?Sim.mulberry32(seed):(function(){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})());
    const finals=[];for(let s=0;s<simulations;s++){let v=initial;for(let i=0;i<periods;i++)v*=1+returns[Math.floor(rng()*returns.length)];if(!finite(v))return null;finals.push(v);}
    finals.sort((a,b)=>a-b);const q=p=>Sim&&Sim.quantileSorted?Sim.quantileSorted(finals,p):finals[Math.round((finals.length-1)*p)];
    return {initial,simulations,seed,n:periods,median:q(.5),p5:q(.05),p25:q(.25),p75:q(.75),p95:q(.95),mean:mean(finals),pLoss:finals.filter(v=>v<initial).length/simulations,pExceed:target==null?null:finals.filter(v=>v>=target).length/simulations,target,method:'Historical Bootstrap'};
  }

  function walkForwardRun(cfg){
    cfg=cfg||{};if(!Sim||typeof Sim.backtestRun!=='function'||!Array.isArray(cfg.prices))return {available:false,reason:'Walk-forward unavailable — simulation core missing or prices invalid.'};
    const train=has(cfg,'trainSize')?cfg.trainSize:120,test=has(cfg,'testSize')?cfg.testSize:30;
    if(!Number.isInteger(train)||train<30||!Number.isInteger(test)||test<2||cfg.prices.length<train+test)return {available:false,reason:'Walk-forward unavailable — insufficient historical data for training + test windows.'};
    const windows=[];let i=0;
    while(i+train+test<=cfg.prices.length){
      const common={signal:cfg.signal,initialCapital:cfg.initialCapital,transactionCost:cfg.transactionCost,slippage:cfg.slippage,longThreshold:cfg.longThreshold,shortThreshold:cfg.shortThreshold,rebalanceEvery:cfg.rebalanceEvery,riskFreeRate:cfg.riskFreeRate};
      const inSample=Sim.backtestRun(Object.assign({},common,{prices:cfg.prices.slice(i,i+train)}));
      const testSeries=cfg.prices.slice(i+train,i+train+test),outSample=Sim.backtestRun(Object.assign({},common,{prices:testSeries}));
      windows.push({window:windows.length+1,start:testSeries[0]&&testSeries[0].date,end:testSeries[testSeries.length-1]&&testSeries[testSeries.length-1].date,inSample:inSample.available?inSample.totalReturn:null,outSample:outSample.available?outSample.totalReturn:null,inSharpe:inSample.available?inSample.sharpe:null,outSharpe:outSample.available?outSample.sharpe:null});
      i+=test;
    }
    const oos=windows.map(w=>w.outSample).filter(finite),ins=windows.map(w=>w.inSample).filter(finite);
    if(!oos.length)return {available:true,windows,degradation:null,stability:null,meanOos:null,meanIn:ins.length?mean(ins):null,warning:null};
    const meanOos=mean(oos),meanIn=ins.length?mean(ins):null,degradation=meanIn==null?null:meanOos-meanIn,stability=Math.round(oos.filter(v=>v>0).length/oos.length*100);
    return {available:true,windows,degradation,stability,warning:degradation!=null&&degradation<-.02?'OUT-OF-SAMPLE DETERIORATION DETECTED':null,meanOos,meanIn};
  }

  function creditRatios(sd){
    if(!sd||typeof sd!=='object')return null;
    const netDebt=finite(sd.debt)&&finite(sd.cash)?sd.debt-sd.cash:null;
    const ffo=finite(sd.ffo)?sd.ffo:(finite(sd.netIncome)&&finite(sd.danda)?sd.netIncome+sd.danda:null);
    const dscr=finite(sd.debtService)&&Math.abs(sd.debtService)>EPS&&finite(sd.ebitda)?sd.ebitda/sd.debtService:null;
    return {netDebt,grossDebt:finite(sd.debt)?sd.debt:null,ffo,ffoToDebt:safeDivide(ffo,sd.debt),netDebtEbitda:safeDivide(netDebt,sd.ebitda),dscr,interestCoverage:safeDivide(sd.ebit,sd.interestExpense),recovery:.35};
  }

  function portfolioConstraintCheck(port,constraints){
    if(!port||!Array.isArray(port.items)||!port.items.length)return [];
    const items=port.items;if(items.some(x=>!x||!finite(x.weight)||x.weight<0))return [{sev:'bad',text:'Portfolio contains invalid weights.',module:'Portfolio'}];
    const total=items.reduce((s,x)=>s+x.weight,0);if(total<=EPS)return [{sev:'bad',text:'Portfolio total weight must be positive.',module:'Portfolio'}];
    const c=Object.assign({maxPosition:.08,minPosition:0,sectorLimit:.25,cashMin:.03,countryLimit:.30},constraints||{}),issues=[];
    const sector={},country={};let cash=0;
    for(const x of items){const w=x.weight/total;if(finite(c.maxPosition)&&w>c.maxPosition)issues.push({sev:'warning',text:`Position ${x.name} at ${(w*100).toFixed(1)}% exceeds max ${(c.maxPosition*100).toFixed(1)}%.`,module:'Portfolio'});if(finite(c.minPosition)&&w>0&&w<c.minPosition)issues.push({sev:'review',text:`Position ${x.name} is below minimum size.`,module:'Portfolio'});const s=x.sector||x.assetClass||'Unknown',co=x.country||'Unknown';sector[s]=(sector[s]||0)+w;country[co]=(country[co]||0)+w;if(String(x.assetClass||x.type||'').toLowerCase().includes('cash'))cash+=w;}
    if(finite(c.sectorLimit))for(const [k,w] of Object.entries(sector))if(w>c.sectorLimit)issues.push({sev:'warning',text:`Sector ${k} exceeds configured limit.`,module:'Portfolio'});
    if(finite(c.countryLimit))for(const [k,w] of Object.entries(country))if(k!=='Unknown'&&w>c.countryLimit)issues.push({sev:'warning',text:`Country ${k} exceeds configured limit.`,module:'Portfolio'});
    if(finite(c.cashMin)&&cash+EPS<c.cashMin)issues.push({sev:'review',text:'Cash allocation is below configured minimum.',module:'Portfolio'});
    return issues;
  }

  function thesisConsistency(thesis,sd,valuationPerShare){
    if(!thesis||!thesis.thesis)return null;sd=sd||{};const text=String(thesis.thesis||'')+' '+String(thesis.bull||''),issues=[];
    const margin=/(\d{1,3}(?:\.\d+)?)\s*%\s*(margin|operating margin)/i.exec(text),growth=/(\d{1,3}(?:\.\d+)?)\s*%\s*(growth|revenue growth)/i.exec(text);
    if(margin&&finite(sd.ebitdaMargin)){const t=Number(margin[1]);if(Math.abs(t-sd.ebitdaMargin*100)>3)issues.push(`Thesis margin ~${t}% differs from model margin.`);}
    if(growth&&finite(sd.growth)){const t=Number(growth[1]);if(Math.abs(t-sd.growth*100)>5)issues.push(`Thesis growth ~${t}% differs from model growth.`);}
    if(finite(thesis.target)&&finite(valuationPerShare)&&Math.abs(valuationPerShare)>EPS&&Math.abs(thesis.target-valuationPerShare)/Math.abs(valuationPerShare)>.2)issues.push('Thesis target differs materially from base valuation.');
    return {ok:issues.length===0,issues,target:finite(thesis.target)?thesis.target:null,val:finite(valuationPerShare)?valuationPerShare:null};
  }
  function thesisMonitor(assumptions,financials,defaultPD){
    assumptions=assumptions||{};financials=financials||null;const rows=[];
    const status=(v,target,warn,bad)=>!finite(v)?'bad':Math.abs(v-target)<=warn?'good':Math.abs(v-target)<=bad?'warn':'bad';
    rows.push({driver:'Revenue growth',target:'15%',val:assumptions.revenueGrowth,status:status(assumptions.revenueGrowth,.15,.04,.08)});
    rows.push({driver:'EBITDA margin',target:'22%',val:assumptions.ebitdaMargin,status:status(assumptions.ebitdaMargin,.22,.03,.06)});
    if(financials&&finite(financials.debtEbitda))rows.push({driver:'Debt/EBITDA',target:'< 3×',val:financials.debtEbitda,status:financials.debtEbitda<3?'good':financials.debtEbitda<4?'warn':'bad'});
    if(finite(defaultPD))rows.push({driver:'Default PD',target:'< 5%',val:defaultPD,status:defaultPD<.05?'good':defaultPD<.12?'warn':'bad'});
    return {rows};
  }
  function thesisIntegrity(rows){
    if(!Array.isArray(rows)||!rows.length)return {score:50,status:'Insufficient Data'};const good=rows.filter(r=>r&&r.status==='good').length,score=Math.round(good/rows.length*100);return {score,status:score>=75?'Supported':score>=50?'Under Pressure':score>=25?'Broken':'Insufficient Data'};
  }

  function valuationDispersion(values){
    if(!Array.isArray(values))return null;const v=values.filter(finite);if(v.length<2)return null;const m=mean(v),sd=stdev0(v),cv=m!=null&&Math.abs(m)>EPS?sd/Math.abs(m):null;if(cv==null)return {cv:null,label:'Unavailable',mean:m,count:v.length,spread:Math.max(...v)-Math.min(...v)};return {cv,label:cv>.35?'High':cv>.18?'Moderate':'Low',mean:m,count:v.length,spread:Math.max(...v)-Math.min(...v)};
  }

  function valuationRobustness(baseConfig,tests){
    if(!Core||typeof Core.dcf!=='function'||!baseConfig||!Array.isArray(tests)||!tests.length)return null;const b=Core.dcf(baseConfig),baseVal=b&&b.error?null:b&&b.perShare;if(!finite(baseVal)||Math.abs(baseVal)<=EPS)return {score:0,label:'Unavailable',reasons:['Base valuation is zero or unavailable.'],maxChange:null};
    let maxChange=0,valid=0;for(const t of tests){const cfg=t&&t.config?t.config:t;if(!cfg)continue;const r=Core.dcf(cfg),v=r&&r.error?null:r&&r.perShare;if(finite(v)){maxChange=Math.max(maxChange,Math.abs(v-baseVal)/Math.abs(baseVal));valid++;}}
    if(!valid)return null;const score=Math.max(0,Math.min(100,Math.round(100-maxChange*100)));return {score,label:score>=70?'Robust':score>=45?'Moderately sensitive':'Highly assumption-sensitive',reasons:[`Max change across key-driver stresses: ${(maxChange*100).toFixed(0)}% of base value.`],maxChange,baseVal};
  }

  function modelRiskScore(x){
    x=x||{};let score=0;const reasons=[];
    if(finite(x.dataQuality)){if(x.dataQuality<60){score+=30;reasons.push('Low data quality.');}else if(x.dataQuality<80){score+=15;reasons.push('Moderate data quality.');}}
    if(finite(x.terminalShare)&&x.terminalShare>.7){score+=25;reasons.push('High terminal-value dependence.');}
    if(x.dispersionLabel==='High'){score+=20;reasons.push('High valuation dispersion.');}else if(x.dispersionLabel==='Moderate'){score+=10;reasons.push('Moderate valuation dispersion.');}
    if(Number.isInteger(x.peerCount)&&x.peerCount<4){score+=15;reasons.push('Small peer sample.');}
    if(Number.isInteger(x.historyLength)&&x.historyLength<120){score+=15;reasons.push('Short historical price sample.');}
    if(x.mertonAvailable===false&&x.hasMarketCap===true){score+=10;reasons.push('Structural default model unavailable.');}
    if(finite(x.wacc)&&finite(x.terminalGrowth)&&x.wacc-x.terminalGrowth<.02){score+=20;reasons.push('WACC is close to terminal growth.');}
    if(finite(x.robustnessScore)&&x.robustnessScore<40){score+=20;reasons.push('Low conclusion robustness.');}
    score=Math.min(100,score);return {score,label:score>=60?'VERY HIGH':score>=40?'HIGH':score>=20?'MODERATE':'LOW',reasons};
  }

  function reconciliationDiagnostics(result){
    if(!result)return null;const checks=[];
    if(result.check){checks.push({name:'Balance Sheet',pass:result.check.ok===true,diff:finite(result.check.diff)?result.check.diff:null});checks.push({name:'Cash Flow Reconciliation',pass:result.check.cashFlowTies===true});}
    if(Array.isArray(result.debtSchedule)){const pass=result.debtSchedule.every(r=>r&&(!finite(r.ending)||r.ending>=-EPS));checks.push({name:'Debt Roll-forward',pass});}
    return {checks,ok:checks.length>0&&checks.every(x=>x.pass)};
  }

  return {VERSION,finite,safeDivide,scenarioRun,correlationMatrix,alignPriceSeries,betaAlphaAligned,rollingVol,rollingBeta,rollingSharpe,rollingDrawdown,historicalBootstrap,walkForwardRun,creditRatios,portfolioConstraintCheck,thesisConsistency,thesisMonitor,thesisIntegrity,valuationDispersion,valuationRobustness,modelRiskScore,reconciliationDiagnostics};
});