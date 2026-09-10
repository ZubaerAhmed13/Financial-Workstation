(function(root,factory){
  let Core=null,Risk=null;
  if(typeof module==='object'&&module.exports){
    Core=require('./engine.js');
    Risk=require('./risk-credit-core.js');
  }else{
    Core=root.FinanceCore;
    Risk=root.RiskCreditCore;
  }
  const api=factory(Core,Risk);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.WorkstationCalculationCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Risk){
  'use strict';
  const VERSION='1.0.0';
  const EPS=1e-12;
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const has=(o,k)=>o!=null&&Object.prototype.hasOwnProperty.call(o,k);
  const safeDivide=(n,d)=>finite(n)&&finite(d)&&Math.abs(d)>EPS?n/d:null;

  function normalizeWeightObject(weights){
    if(!weights||typeof weights!=='object'||Array.isArray(weights))return null;
    const entries=Object.entries(weights);
    if(!entries.length||entries.some(([,v])=>!finite(v)||v<0))return null;
    const total=entries.reduce((s,[,v])=>s+v,0);
    if(!finite(total)||total<=EPS)return null;
    return Object.fromEntries(entries.map(([k,v])=>[k,v/total]));
  }
  function normalizeItems(items){
    if(!Array.isArray(items)||!items.length)return null;
    if(items.some(x=>!x||!finite(x.weight)||x.weight<0))return null;
    const total=items.reduce((s,x)=>s+x.weight,0);
    if(!finite(total)||total<=EPS)return null;
    return {total,items:items.map(x=>Object.assign({},x,{normalizedWeight:x.weight/total}))};
  }

  function standardizeCases(cases,features){
    if(!Array.isArray(cases)||!Array.isArray(features))return null;
    const stats={};
    for(const f of features){
      const vals=cases.map(c=>c&&c.features?c.features[f]:null).filter(finite);
      const m=Core&&Core.mean?Core.mean(vals):(vals.length?vals.reduce((s,v)=>s+v,0)/vals.length:null);
      let s=Core&&Core.stdev?Core.stdev(vals,0):null;
      if(!finite(s)||s<=EPS)s=1;
      stats[f]={m,s,n:vals.length};
    }
    return stats;
  }
  function similarityScore(query,candidate,stats,weights,features){
    if(!query||!candidate||!query.features||!candidate.features||!stats||!weights)return 0;
    const keys=Array.isArray(features)&&features.length?features:Object.keys(weights);
    let sim=0,wsum=0;
    for(const f of keys){
      const w=weights[f]; if(!finite(w)||w<=0)continue;
      const q=query.features[f],v=candidate.features[f],s=stats[f];
      if(!finite(q)||!finite(v)||!s||!finite(s.m)||!finite(s.s)||s.s<=EPS)continue;
      const dz=Math.abs((q-s.m)/s.s-(v-s.m)/s.s);
      sim+=w*Math.exp(-dz);wsum+=w;
    }
    return wsum>EPS?sim/wsum:0;
  }

  const PREFERENCE_RANGES={
    return:{label:'Expected return',min:-.3,max:.5,metric:'expectedReturn'},
    safety:{label:'Safety (1 - default PD)',min:0,max:1,metric:'safety'},
    valuation:{label:'Margin of safety',min:-.5,max:.5,metric:'marginOfSafety'},
    liquidity:{label:'Liquidity score',min:0,max:1,metric:'liquidity'},
    historical:{label:'Case outcome score',min:0,max:1,metric:'historical'}
  };
  const DEFAULT_PREFERENCE_WEIGHTS={return:30,safety:30,valuation:20,liquidity:10,historical:10};
  function preferenceScore(metrics,weights=DEFAULT_PREFERENCE_WEIGHTS){
    metrics=metrics||{};
    const normalized=normalizeWeightObject(weights);if(!normalized)return null;
    let score=0;const detail=[];
    for(const [key,cfg] of Object.entries(PREFERENCE_RANGES)){
      const val=metrics[cfg.metric],w=normalized[key];
      if(!finite(w)||w<=0||!finite(val))continue;
      const norm=cfg.max>cfg.min?(clamp(val,cfg.min,cfg.max)-cfg.min)/(cfg.max-cfg.min):.5;
      score+=w*norm*100;detail.push({label:cfg.label,value:val,weight:weights[key],normalized:norm});
    }
    return {score:Math.round(score),detail,weights:Object.assign({},weights)};
  }
  function dataQualityScore(ctx){
    ctx=ctx||{};let earned=0,total=0;const reasons=[];
    const add=(weight,fraction,msg)=>{const f=clamp(finite(fraction)?fraction:(fraction?1:0),0,1);total+=weight;earned+=weight*f;if(f<1)reasons.push(msg);};
    add(20,ctx.history&&Array.isArray(ctx.history.prices)?Math.min(1,ctx.history.prices.length/120):0,'Limited historical price series (fewer than ~120 observations).');
    add(15,ctx.financials&&ctx.financials.assets!=null&&ctx.financials.netIncome!=null?1:0,'Financial statements incomplete.');
    add(20,ctx.dcf&&ctx.dcf.wacc!=null&&finite(ctx.dcf.perShare)?1:0,'Valuation model(s) unavailable or incomplete.');
    add(15,Array.isArray(ctx.peers)?Math.min(1,ctx.peers.length/3):0,'Few or no comparable companies entered.');
    const matches=Array.isArray(ctx.caseMatches)?ctx.caseMatches.length:0;
    add(10,matches>0?1:0,'No similar historical (synthetic) cases matched.');
    add(10,Math.min(1,matches/10),'Small case-match sample.');
    add(10,ctx.dataOk!==false?1:0,'Some inputs failed validation.');
    const score=total>0?Math.round(earned/total*100):0;
    const label=score>=80?'High':score>=60?'Moderate':score>=40?'Low':'Very Low';
    return {score,label,reasons};
  }
  function peerDataCoverage(peers){
    if(!Array.isArray(peers)||!peers.length)return null;
    let covered=0;
    for(const p of peers){
      if(p&&finite(p.marketCap)&&p.marketCap>0)covered++;
      if(p&&finite(p.growth))covered++;
      if(p&&finite(p.margin))covered++;
      if(p&&finite(p.roe))covered++;
      if(p&&finite(p.multiple))covered++;
    }
    const coverage=covered/(5*peers.length);return {score:Math.round(coverage*100),coverage,n:peers.length};
  }
  function moatScore(values){
    if(!Array.isArray(values)||!values.length||values.some(v=>!finite(v)||v<0||v>100))return null;
    return Math.round(values.reduce((s,v)=>s+v,0)/values.length);
  }

  function factorExposure(items){
    const norm=normalizeItems(items);if(!norm)return null;
    const exposures={Market:1,Size:0,Value:0,Growth:0,Momentum:0,Quality:0,LowVol:0};
    for(const b of norm.items){
      const w=b.normalizedWeight,t=String(b.type||b.assetClass||'').toLowerCase();
      if(t.includes('stock')||t.includes('equity')){
        const vol=finite(b.volatility)?b.volatility:.25;
        const ret=finite(b.expectedReturn)?b.expectedReturn:.1;
        const mos=finite(b.marginOfSafety)?b.marginOfSafety:0;
        exposures.Size+=w*.5;
        exposures.Value+=w*(mos>.1?1:mos>-.1?0:-1);
        exposures.Growth+=w*(ret>.15?1:ret>.08?0:-1);
        exposures.Momentum+=w*(ret>.12?1:-.3);
        exposures.Quality+=w*(mos>-.05?.5:-.5);
        exposures.LowVol+=w*(vol<.2?1:vol>.4?-1:0);
      }
    }
    return Object.entries(exposures).map(([factor,exposure])=>({factor,exposure:Math.round(exposure*100)/100,risk:Math.abs(exposure)>.6?'High':Math.abs(exposure)>.3?'Medium':'Low'}));
  }
  function performanceAttribution(items,benchmarkRet){
    const norm=normalizeItems(items);if(!norm||!finite(benchmarkRet))return null;
    if(norm.items.some(x=>!finite(x.expectedReturn)))return null;
    let totalPortRet=0,allocationProxy=0;const rows=[];
    for(const b of norm.items){
      const w=b.normalizedWeight,r=b.expectedReturn,active=r-benchmarkRet;
      const contribution=w*r,alloc=w*active;
      totalPortRet+=contribution;allocationProxy+=alloc;
      rows.push({name:b.name,weight:w,return:r,contribution,allocation:alloc,selection:null});
    }
    return {rows,allocEffect:allocationProxy,selectionEffect:null,totalPortRet,benchmark:benchmarkRet,activeReturn:totalPortRet-benchmarkRet,methodology:'single-benchmark allocation proxy; selection unavailable without benchmark constituent weights/returns'};
  }

  function validateCorrelationMatrix(corr,n){
    if(!Array.isArray(corr)||corr.length!==n)return false;
    for(let i=0;i<n;i++){
      if(!Array.isArray(corr[i])||corr[i].length!==n)return false;
      for(let j=0;j<n;j++)if(!finite(corr[i][j])||corr[i][j]<-1||corr[i][j]>1||Math.abs(corr[i][j]-corr[j]?.[i])>1e-8)return false;
      if(Math.abs(corr[i][i]-1)>1e-8)return false;
    }
    return true;
  }
  function riskContribution(port,corrMatrix){
    if(!port||!Array.isArray(port.items)||port.items.length<2)return null;
    const norm=normalizeItems(port.items);if(!norm)return null;
    const items=norm.items,n=items.length;
    if(items.some(x=>!finite(x.volatility)||x.volatility<0))return null;
    const corr=corrMatrix||Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:.4));
    if(!validateCorrelationMatrix(corr,n))return null;
    const weights=items.map(x=>x.normalizedWeight),vols=items.map(x=>x.volatility);
    let varP=0;for(let i=0;i<n;i++)for(let j=0;j<n;j++)varP+=weights[i]*weights[j]*vols[i]*vols[j]*corr[i][j];
    if(varP<0&&varP>-EPS)varP=0;if(!finite(varP)||varP<0)return null;
    const volP=Math.sqrt(varP);
    const rows=items.map((b,i)=>{
      let covarianceWithPortfolio=0;for(let j=0;j<n;j++)covarianceWithPortfolio+=weights[j]*vols[i]*vols[j]*corr[i][j];
      const mcr=volP>EPS?covarianceWithPortfolio/volP:null;
      const component=mcr==null?null:weights[i]*mcr;
      const riskShare=varP>EPS?weights[i]*covarianceWithPortfolio/varP:null;
      return {name:b.name,weight:weights[i],volatility:vols[i],mcr,component,riskShare};
    });
    return {rows,volP,varP};
  }

  function covarianceFromItems(items,corrMatrix){
    if(!Array.isArray(items)||!items.length||items.some(x=>!x||!finite(x.volatility)||x.volatility<0))return null;
    const n=items.length;
    const corr=corrMatrix||Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:.4));
    if(!validateCorrelationMatrix(corr,n))return null;
    return corr.map((row,i)=>row.map((rho,j)=>rho*items[i].volatility*items[j].volatility));
  }
  function equalWeight(items){
    if(!Array.isArray(items)||!items.length)return null;return Array(items.length).fill(1/items.length);
  }
  function minimumVariance(items,corrMatrix){
    if(!Array.isArray(items)||items.length<2)return null;
    const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;
    const invVol=items.map(x=>x.volatility>EPS?1/x.volatility:1/EPS);const s=invVol.reduce((a,b)=>a+b,0);
    let w=invVol.map(v=>v/s);
    const step=.08;
    for(let it=0;it<2500;it++){
      const grad=w.map((_,i)=>2*cov[i].reduce((acc,c,j)=>acc+c*w[j],0));
      let next=w.map((x,i)=>Math.max(0,x-step*grad[i]));const z=next.reduce((a,b)=>a+b,0);
      if(z<=EPS)return null;next=next.map(x=>x/z);
      const diff=next.reduce((m,x,i)=>Math.max(m,Math.abs(x-w[i])),0);w=next;if(diff<1e-12)break;
    }
    return w;
  }
  function maximumSharpe(items,corrMatrix,riskFreeRate=0){
    if(!Array.isArray(items)||items.length<2||!finite(riskFreeRate)||items.some(x=>!finite(x.expectedReturn)))return null;
    const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;
    let w=minimumVariance(items,corrMatrix);if(!w)return null;
    const objective=x=>{
      const ret=x.reduce((s,v,i)=>s+v*items[i].expectedReturn,0);let vr=0;for(let i=0;i<x.length;i++)for(let j=0;j<x.length;j++)vr+=x[i]*x[j]*cov[i][j];
      return vr>EPS?(ret-riskFreeRate)/Math.sqrt(vr):-Infinity;
    };
    let best=objective(w),step=.08;
    for(let it=0;it<3000;it++){
      let improved=false;
      for(let i=0;i<w.length;i++)for(let j=0;j<w.length;j++)if(i!==j&&w[j]>0){
        const d=Math.min(step,w[j]),x=w.slice();x[i]+=d;x[j]-=d;const q=objective(x);if(q>best+1e-12){w=x;best=q;improved=true;}
      }
      if(!improved){step*=.5;if(step<1e-7)break;}
    }
    return w;
  }
  function riskParity(items,corrMatrix){
    if(!Array.isArray(items)||items.length<2)return null;
    const cov=covarianceFromItems(items,corrMatrix);if(!cov)return null;
    let w=equalWeight(items);
    for(let it=0;it<3000;it++){
      const marginal=w.map((_,i)=>cov[i].reduce((s,c,j)=>s+c*w[j],0));
      const contrib=w.map((x,i)=>x*marginal[i]);
      const target=contrib.reduce((a,b)=>a+b,0)/w.length;
      if(!finite(target)||target<=EPS){
        if(items.every(x=>x.volatility<=EPS))return equalWeight(items);
        return null;
      }
      const next=w.map((x,i)=>contrib[i]>EPS?x*Math.sqrt(target/contrib[i]):x);
      const sum=next.reduce((a,b)=>a+b,0);if(sum<=EPS)return null;
      for(let i=0;i<next.length;i++)next[i]/=sum;
      const diff=next.reduce((m,x,i)=>Math.max(m,Math.abs(x-w[i])),0);w=next;if(diff<1e-10)break;
    }
    return w;
  }

  function segmentForecast(totalRevenue,segments,years){
    if(!finite(totalRevenue)||totalRevenue<0||!Number.isInteger(years)||years<=0||!Array.isArray(segments)||!segments.length)return null;
    const out=[];let shareTotal=0;
    for(const s of segments){
      if(!s||!finite(s.share)||s.share<0||!Array.isArray(s.growth)||!Array.isArray(s.margin)||s.growth.length<years||s.margin.length<years)return null;
      if(s.growth.slice(0,years).some(v=>!finite(v)||v<=-1)||s.margin.slice(0,years).some(v=>!finite(v)))return null;
      shareTotal+=s.share;let r=totalRevenue*s.share;const revs=[];
      for(let y=0;y<years;y++){revs.push(r);r*=1+s.growth[y];if(!finite(r))return null;}
      out.push({name:s.name,revs,margins:s.margin.slice(0,years)});
    }
    const totalRevs=Array(years).fill(0),totalEbitda=Array(years).fill(0);
    for(const s of out)for(let y=0;y<years;y++){totalRevs[y]+=s.revs[y];totalEbitda[y]+=s.revs[y]*s.margins[y];}
    return {segments:out,totalRevs,totalEbitda,shareTotal,shareReconciles:Math.abs(shareTotal-1)<=1e-8};
  }
  function sumOfParts(parts,netDebt,shares){
    if(!Array.isArray(parts)||!parts.length||!finite(netDebt)||!finite(shares)||shares<=0)return null;
    const valued=[];
    for(const p of parts){
      if(!p)return null;let value=null,source=null;
      if(has(p,'value')&&p.value!=null){if(!finite(p.value))return null;value=p.value;source='explicit';}
      else if(finite(p.multiple)&&finite(p.metric)){value=p.multiple*p.metric;source='multiple';}
      else return null;
      if(!finite(value))return null;valued.push(Object.assign({},p,{value,source}));
    }
    const totalEV=valued.reduce((s,p)=>s+p.value,0),equityValue=totalEV-netDebt,perShare=equityValue/shares;
    return {parts:valued,totalEV,netDebt,equityValue,shares,perShare};
  }

  function mulberry32(seed){let a=(Number(seed)||0)>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
  function normal01(rng){let u=0,v=0;while(u<=Number.EPSILON)u=rng();while(v<=Number.EPSILON)v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
  function monteCarloGBM(cfg){
    cfg=cfg||{};const initial=has(cfg,'initial')?cfg.initial:100,mu=has(cfg,'expectedReturn')?cfg.expectedReturn:0,sigma=has(cfg,'volatility')?cfg.volatility:0;
    const years=has(cfg,'years')?cfg.years:1,steps=has(cfg,'steps')?cfg.steps:252,paths=has(cfg,'paths')?cfg.paths:1000,seed=has(cfg,'seed')?cfg.seed:42;
    if(!finite(initial)||initial<=0||!finite(mu)||!finite(sigma)||sigma<0||!finite(years)||years<=0||!Number.isInteger(steps)||steps<=0||!Number.isInteger(paths)||paths<=0||paths>100000)return null;
    const rng=mulberry32(seed),dt=years/steps,drift=(mu-.5*sigma*sigma)*dt,diff=sigma*Math.sqrt(dt),terminal=[];
    for(let p=0;p<paths;p++){let x=initial;for(let i=0;i<steps;i++)x*=Math.exp(drift+diff*normal01(rng));terminal.push(x);}
    terminal.sort((a,b)=>a-b);return {initial,expectedReturn:mu,volatility:sigma,years,steps,paths,seed,terminal};
  }

  function dividendAmounts(tx){
    if(!tx||typeof tx!=='object')return null;
    const gross=finite(tx.gross)?tx.gross:(finite(tx.amount)?tx.amount:null);
    const withholding=has(tx,'withholdingTax')?tx.withholdingTax:(has(tx,'tax')?tx.tax:0);
    const net=finite(tx.net)?tx.net:(gross!=null&&finite(withholding)?gross-withholding:null);
    if(gross==null||!finite(withholding)||withholding<0||net==null)return null;
    return {gross,withholding,net};
  }
  function fxConvert(amount,rate){return finite(amount)&&finite(rate)&&rate>0?amount*rate:null;}
  function positionUnrealized(position,price){
    if(!position||!finite(position.qty)||!finite(position.costBasis)||!finite(price)||price<0)return null;
    const marketValue=position.qty*price,unrealizedPnl=marketValue-position.costBasis;
    return {marketValue,unrealizedPnl,returnOnCost:safeDivide(unrealizedPnl,position.costBasis)};
  }

  function periodReturnsFromSnapshots(snapshots){
    if(!Array.isArray(snapshots)||snapshots.length<2)return [];
    const out=[];
    for(let i=1;i<snapshots.length;i++){
      const prev=snapshots[i-1],cur=snapshots[i];if(!prev||!cur||!finite(prev.mv)||prev.mv<=0||!finite(cur.mv))return null;
      const flow=cur.cashFlow==null?0:cur.cashFlow;if(!finite(flow))return null;
      out.push((cur.mv-flow)/prev.mv-1);
    }
    return out;
  }
  function timeWeightedReturnFromSnapshots(snapshots){
    const returns=periodReturnsFromSnapshots(snapshots);if(!returns)return null;
    return Core&&Core.timeWeightedReturn?Core.timeWeightedReturn(returns):returns.reduce((p,r)=>p*(1+r),1)-1;
  }
  function moneyWeightedReturnFromSnapshots(snapshots){
    if(!Array.isArray(snapshots)||snapshots.length<2||!Core||typeof Core.xirr!=='function')return null;
    const first=snapshots[0],last=snapshots[snapshots.length-1];if(!first||!last||!finite(first.mv)||!finite(last.mv)||first.mv<0||last.mv<0)return null;
    const flows=[-first.mv],dates=[first.date];
    for(let i=1;i<snapshots.length-1;i++){const f=snapshots[i].cashFlow==null?0:snapshots[i].cashFlow;if(!finite(f))return null;flows.push(-f);dates.push(snapshots[i].date);}
    const lastFlow=last.cashFlow==null?0:last.cashFlow;if(!finite(lastFlow))return null;flows.push(last.mv-lastFlow);dates.push(last.date);
    if(dates.some(d=>!Number.isFinite(new Date(d).getTime())))return null;
    return Core.xirr(flows,dates);
  }
  function annualizeReturn(twr,days){
    if(!finite(twr)||!finite(days)||days<=0||1+twr<0)return null;const years=days/365.25;if(years<=0)return null;const v=Math.pow(1+twr,1/years)-1;return finite(v)?v:null;
  }
  function performanceRisk(periodReturns,annualFactor,riskFreeAnnual=.02){
    if(!Array.isArray(periodReturns)||periodReturns.length<2||periodReturns.some(v=>!finite(v)||v<=-1)||!finite(annualFactor)||annualFactor<=0||!finite(riskFreeAnnual)||riskFreeAnnual<=-1)return null;
    const vol=Core&&Core.annualizedVolatility?Core.annualizedVolatility(periodReturns,annualFactor):null;
    const rfPerPeriod=Math.pow(1+riskFreeAnnual,1/annualFactor)-1;
    const sharpePeriodic=Core&&Core.sharpe?Core.sharpe(periodReturns,rfPerPeriod):null;
    const sortinoPeriodic=Core&&Core.sortino?Core.sortino(periodReturns,rfPerPeriod):null;
    const sharpe=sharpePeriodic==null?null:sharpePeriodic*Math.sqrt(annualFactor),sortino=sortinoPeriodic==null?null:sortinoPeriodic*Math.sqrt(annualFactor);
    const wealth=[];let level=100;for(const r of periodReturns){level*=1+r;wealth.push(level);}
    const dd=Core&&Core.maximumDrawdown?Core.maximumDrawdown(wealth):null,mdd=dd?dd.mdd:null;
    const cumRet=level/100-1,years=periodReturns.length/annualFactor,cagr=years>0&&1+cumRet>=0?Math.pow(1+cumRet,1/years)-1:null;
    const calmar=mdd!=null&&mdd<0&&cagr!=null?cagr/Math.abs(mdd):null;
    const histVaR95=Risk&&Risk.historicalVaR?Risk.historicalVaR(periodReturns,.95):null,histVaR99=Risk&&Risk.historicalVaR?Risk.historicalVaR(periodReturns,.99):null;
    const es95=Risk&&Risk.expectedShortfall?Risk.expectedShortfall(periodReturns,.95):null,es99=Risk&&Risk.expectedShortfall?Risk.expectedShortfall(periodReturns,.99):null;
    return {vol,sharpe,sortino,mdd,cagr,calmar,histVaR95,histVaR99,es95,es99,cumRet,annualFactor,riskFreeAnnual,rfPerPeriod};
  }
  function captureRatios(portReturns,benchReturns,annualFactor){
    if(!Array.isArray(portReturns)||!Array.isArray(benchReturns)||portReturns.length!==benchReturns.length||portReturns.length<2||portReturns.some(v=>!finite(v))||benchReturns.some(v=>!finite(v))||!finite(annualFactor)||annualFactor<=0)return null;
    const up=[],upB=[],down=[],downB=[],active=[];for(let i=0;i<portReturns.length;i++){active.push(portReturns[i]-benchReturns[i]);if(benchReturns[i]>0){up.push(portReturns[i]);upB.push(benchReturns[i]);}else if(benchReturns[i]<0){down.push(portReturns[i]);downB.push(benchReturns[i]);}}
    const mean=a=>Core&&Core.mean?Core.mean(a):(a.length?a.reduce((s,v)=>s+v,0)/a.length:null);
    const upside=up.length?safeDivide(mean(up),mean(upB)):null,downside=down.length?safeDivide(mean(down),mean(downB)):null;
    const beta=Core&&Core.beta?Core.beta(portReturns,benchReturns):null;
    const te=Core&&Core.annualizedVolatility?Core.annualizedVolatility(active,annualFactor):null;
    const activeMean=mean(active),ir=te!=null&&te>EPS&&activeMean!=null?(activeMean*annualFactor)/te:null;
    const alpha=beta!=null?(mean(portReturns)-beta*mean(benchReturns))*annualFactor:null;
    return {upside,downside,beta,te,ir,alpha,n:portReturns.length};
  }

  return {
    VERSION,finite,safeDivide,normalizeWeightObject,normalizeItems,standardizeCases,similarityScore,
    PREFERENCE_RANGES,DEFAULT_PREFERENCE_WEIGHTS,preferenceScore,dataQualityScore,peerDataCoverage,moatScore,
    factorExposure,performanceAttribution,validateCorrelationMatrix,riskContribution,covarianceFromItems,equalWeight,minimumVariance,maximumSharpe,riskParity,
    segmentForecast,sumOfParts,mulberry32,monteCarloGBM,dividendAmounts,fxConvert,positionUnrealized,
    periodReturnsFromSnapshots,timeWeightedReturnFromSnapshots,moneyWeightedReturnFromSnapshots,annualizeReturn,performanceRisk,captureRatios
  };
});
