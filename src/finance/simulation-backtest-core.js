(function(root,factory){
  let Core=null;
  if(typeof module==='object'&&module.exports)Core=require('./engine.js');
  else Core=root.FinanceCore;
  const api=factory(Core);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SimulationBacktestCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Core){
  'use strict';
  const VERSION='1.0.0';
  const EPS=1e-12;
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const has=(o,k)=>o!=null&&Object.prototype.hasOwnProperty.call(o,k);
  const mean=a=>Core&&typeof Core.mean==='function'?Core.mean(a):(a.length?a.reduce((s,v)=>s+v,0)/a.length:null);
  const stdev=a=>Core&&typeof Core.stdev==='function'?Core.stdev(a,0):(a.length?Math.sqrt(a.reduce((s,v)=>s+(v-mean(a))**2,0)/a.length):null);

  function mulberry32(seed){
    let a=(seed>>>0);
    return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
  }
  function normal01(rng){
    let u=0,v=0;
    while(u<=Number.EPSILON)u=rng();
    while(v<=Number.EPSILON)v=rng();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }
  function quantileSorted(sorted,p){
    if(!Array.isArray(sorted)||!sorted.length||!finite(p)||p<0||p>1)return null;
    if(sorted.length===1)return sorted[0];
    const x=(sorted.length-1)*p,lo=Math.floor(x),hi=Math.ceil(x),w=x-lo;
    return sorted[lo]*(1-w)+sorted[hi]*w;
  }
  function monteCarloRun(cfg){
    cfg=cfg||{};
    const initial=has(cfg,'initial')?cfg.initial:100;
    const expectedReturn=has(cfg,'expectedReturn')?cfg.expectedReturn:.10;
    const volatility=has(cfg,'volatility')?cfg.volatility:.25;
    const horizonYears=has(cfg,'horizonYears')?cfg.horizonYears:1;
    const simulations=has(cfg,'simulations')?cfg.simulations:10000;
    const seed=has(cfg,'seed')?cfg.seed:1234;
    const target=has(cfg,'target')?cfg.target:110;
    const stepsPerYear=has(cfg,'stepsPerYear')?cfg.stepsPerYear:12;
    if(!finite(initial)||initial<=0||!finite(expectedReturn)||!finite(volatility)||volatility<0||!finite(horizonYears)||horizonYears<=0)return null;
    if(!Number.isInteger(simulations)||simulations<=0||simulations>100000||!Number.isInteger(seed)||!Number.isInteger(stepsPerYear)||stepsPerYear<=0||stepsPerYear>10000||!finite(target))return null;
    const totalSteps=Math.max(1,Math.round(horizonYears*stepsPerYear));
    const dt=horizonYears/totalSteps,drift=(expectedReturn-.5*volatility*volatility)*dt,diffusion=volatility*Math.sqrt(dt),rng=mulberry32(seed);
    const finals=[],subsample=[],stride=Math.max(1,Math.floor(simulations/200));
    for(let sim=0;sim<simulations;sim++){
      let s=initial;
      if(volatility===0)s*=Math.exp(expectedReturn*horizonYears);
      else for(let step=0;step<totalSteps;step++)s*=Math.exp(drift+diffusion*normal01(rng));
      if(!finite(s))return null;
      finals.push(s);
      if(sim%stride===0)subsample.push(s);
    }
    finals.sort((a,b)=>a-b);
    const m=mean(finals),pLoss=finals.filter(v=>v<initial).length/simulations,pTarget=finals.filter(v=>v>=target).length/simulations;
    return {
      initial,simulations,median:quantileSorted(finals,.5),p5:quantileSorted(finals,.05),p25:quantileSorted(finals,.25),p75:quantileSorted(finals,.75),p95:quantileSorted(finals,.95),
      min:finals[0],max:finals[finals.length-1],mean:m,pLoss,pTarget,pExceed:pTarget,target,subsample,seed,
      expectedReturn,volatility,horizonYears,stepsPerYear,totalSteps,method:'Geometric Brownian motion (deterministic seeded simulation)'
    };
  }

  function toTime(v){
    if(finite(v))return v;
    const t=new Date(v).getTime();return Number.isFinite(t)?t:null;
  }
  function validatePrices(prices){
    if(!Array.isArray(prices)||prices.length<2)return null;
    const out=[];
    for(let i=0;i<prices.length;i++){
      const p=prices[i],date=p?toTime(p.date):null,close=p?p.close:null;
      if(date==null||!finite(close)||close<=0)return null;
      if(i>0&&date<=out[i-1].date)return null;
      out.push({date,close,originalIndex:i,raw:p});
    }
    return out;
  }
  function inferPeriodsPerYear(series){
    if(!Array.isArray(series)||series.length<3)return {periodsPerYear:null,label:'insufficient',source:'timestamps'};
    const diffs=[];for(let i=1;i<series.length;i++){const d=(series[i].date-series[i-1].date)/86400000;if(finite(d)&&d>0)diffs.push(d);}
    if(!diffs.length)return {periodsPerYear:null,label:'unknown',source:'timestamps'};
    diffs.sort((a,b)=>a-b);const mid=Math.floor(diffs.length/2),medianDays=diffs.length%2?diffs[mid]:(diffs[mid-1]+diffs[mid])/2;
    if(medianDays<=2)return {periodsPerYear:252,label:'business-daily',source:'timestamps',medianDays};
    if(medianDays<=10)return {periodsPerYear:52,label:'weekly',source:'timestamps',medianDays};
    if(medianDays<=40)return {periodsPerYear:12,label:'monthly',source:'timestamps',medianDays};
    if(medianDays<=100)return {periodsPerYear:4,label:'quarterly',source:'timestamps',medianDays};
    return {periodsPerYear:1,label:'annual',source:'timestamps',medianDays};
  }
  function smaAt(series,index,window){
    if(!Number.isInteger(index)||!Number.isInteger(window)||window<=0||index<window-1)return null;
    let s=0;for(let i=index-window+1;i<=index;i++)s+=series[i].close;return s/window;
  }
  function defaultSignal(series,index){
    if(index<50)return 0;
    const s50=smaAt(series,index,50);if(s50==null)return 0;
    const s200=index>=199?smaAt(series,index,200):s50;
    return s50>s200?1:s50<s200?-1:0;
  }
  function positionFromSignal(sig,longThreshold,shortThreshold){
    if(!finite(sig))return null;
    return sig>=longThreshold?1:sig<=shortThreshold?-1:0;
  }
  function seriesValueAtOrBefore(series,date){
    if(!Array.isArray(series)||!series.length)return null;
    let lo=0,hi=series.length-1,best=-1;
    while(lo<=hi){const m=(lo+hi)>>1;if(series[m].date<=date){best=m;lo=m+1;}else hi=m-1;}
    return best>=0?series[best].close:null;
  }
  function beta(a,b){
    if(Core&&typeof Core.beta==='function')return Core.beta(a,b);
    if(a.length!==b.length||a.length<2)return null;const ma=mean(a),mb=mean(b);let cov=0,v=0;for(let i=0;i<a.length;i++){cov+=(a[i]-ma)*(b[i]-mb);v+=(b[i]-mb)**2;}return v>EPS?cov/v:null;
  }
  function maximumDrawdown(values){
    if(Core&&typeof Core.maximumDrawdown==='function')return Core.maximumDrawdown(values);
    let peak=-Infinity,mdd=0;for(const x of values){if(x>peak)peak=x;if(peak>0)mdd=Math.min(mdd,x/peak-1);}return {mdd};
  }
  function backtestRun(cfg){
    cfg=cfg||{};
    const all=validatePrices(cfg.prices);
    if(!all||all.length<30)return {available:false,reason:'Backtest unavailable — insufficient or invalid historical price data.'};
    const start=cfg.startDate==null?null:toTime(cfg.startDate),end=cfg.endDate==null?null:toTime(cfg.endDate);
    if(cfg.startDate!=null&&start==null||cfg.endDate!=null&&end==null||start!=null&&end!=null&&start>end)return {available:false,reason:'Backtest unavailable — invalid selected date range.'};
    const series=all.filter(p=>(start==null||p.date>=start)&&(end==null||p.date<=end));
    if(series.length<30)return {available:false,reason:'Backtest unavailable — insufficient data in selected period.'};
    const initialCapital=has(cfg,'initialCapital')?cfg.initialCapital:100000;
    const transactionCost=has(cfg,'transactionCost')?cfg.transactionCost:.0010;
    const slippage=has(cfg,'slippage')?cfg.slippage:.0005;
    const rebalanceEvery=has(cfg,'rebalanceEvery')?cfg.rebalanceEvery:1;
    const longThreshold=has(cfg,'longThreshold')?cfg.longThreshold:.0001;
    const shortThreshold=has(cfg,'shortThreshold')?cfg.shortThreshold:-.0001;
    const riskFreeAnnual=has(cfg,'riskFreeRate')?cfg.riskFreeRate:.02;
    if(!finite(initialCapital)||initialCapital<=0)return {available:false,reason:'Backtest unavailable — initial capital must be a positive finite value.'};
    if(!finite(transactionCost)||transactionCost<0||transactionCost>=1||!finite(slippage)||slippage<0||slippage>=1)return {available:false,reason:'Backtest unavailable — transaction cost and slippage must be finite rates between 0 and 1.'};
    if(!Number.isInteger(rebalanceEvery)||rebalanceEvery<=0)return {available:false,reason:'Backtest unavailable — rebalance interval must be a positive integer.'};
    if(!finite(longThreshold)||!finite(shortThreshold)||shortThreshold>longThreshold)return {available:false,reason:'Backtest unavailable — signal thresholds are invalid.'};
    if(!finite(riskFreeAnnual)||riskFreeAnnual<=-1)return {available:false,reason:'Backtest unavailable — risk-free rate is invalid.'};
    const userSignal=Array.isArray(cfg.signal)?cfg.signal:null;
    const signalFor=entry=>{
      if(userSignal&&entry.originalIndex<userSignal.length&&userSignal[entry.originalIndex]!=null)return finite(userSignal[entry.originalIndex])?userSignal[entry.originalIndex]:null;
      return defaultSignal(all,entry.originalIndex);
    };
    const firstSignal=signalFor(series[0]);
    let curPos=positionFromSignal(firstSignal,longThreshold,shortThreshold);
    if(curPos==null)return {available:false,reason:'Backtest unavailable — signal series contains a non-finite value.'};
    let stratVal=initialCapital,costs=0,tradeCount=0,totalTurnover=0;
    if(curPos!==0){const turnover=Math.abs(curPos),cost=stratVal*turnover*(transactionCost+slippage);stratVal=Math.max(0,stratVal-cost);costs+=cost;totalTurnover+=turnover;tradeCount++;}
    const equityCurve=[stratVal],positionCurve=[curPos],periodReturns=[];
    for(let i=1;i<series.length;i++){
      const marketReturn=series[i].close/series[i-1].close-1;
      const before=stratVal;
      stratVal=Math.max(0,stratVal*(1+curPos*marketReturn));
      if(i%rebalanceEvery===0){
        const sig=signalFor(series[i]);if(sig==null)return {available:false,reason:'Backtest unavailable — signal series contains a non-finite value.'};
        const newPos=positionFromSignal(sig,longThreshold,shortThreshold),turnover=Math.abs(newPos-curPos);
        if(turnover>0&&stratVal>0){const cost=stratVal*turnover*(transactionCost+slippage);stratVal=Math.max(0,stratVal-cost);costs+=cost;totalTurnover+=turnover;tradeCount++;}
        curPos=newPos;
      }
      periodReturns.push(before>0?stratVal/before-1:-1);
      equityCurve.push(stratVal);positionCurve.push(curPos);
    }
    const totalReturn=stratVal/initialCapital-1;
    const days=(series[series.length-1].date-series[0].date)/86400000,years=days/365.25;
    const cagr=years>0?(stratVal<=0?-1:Math.pow(stratVal/initialCapital,1/years)-1):null;
    const cadence=inferPeriodsPerYear(series),annualizationFactor=cadence.periodsPerYear||252;
    const vol=Core&&typeof Core.annualizedVolatility==='function'?Core.annualizedVolatility(periodReturns,annualizationFactor):stdev(periodReturns)*Math.sqrt(annualizationFactor);
    const rfPerPeriod=Math.pow(1+riskFreeAnnual,1/annualizationFactor)-1;
    const sharpePeriodic=Core&&typeof Core.sharpe==='function'?Core.sharpe(periodReturns,rfPerPeriod):null;
    const sortinoPeriodic=Core&&typeof Core.sortino==='function'?Core.sortino(periodReturns,rfPerPeriod):null;
    const sharpe=sharpePeriodic==null?null:sharpePeriodic*Math.sqrt(annualizationFactor),sortino=sortinoPeriodic==null?null:sortinoPeriodic*Math.sqrt(annualizationFactor);
    const dd=maximumDrawdown(equityCurve),mdd=dd&&finite(dd.mdd)?dd.mdd:null,calmar=mdd!=null&&mdd<0&&cagr!=null?cagr/Math.abs(mdd):null;
    let activeRet=null,benchmarkCagr=null,benchBeta=null,alpha=null,te=null,ir=null,alignedPeriods=0;
    const bench=validatePrices(cfg.benchmarkPrices||[]);
    if(bench&&bench.length>=2){
      const stratAligned=[],benchAligned=[];
      for(let i=1;i<series.length;i++){
        const bp=seriesValueAtOrBefore(bench,series[i-1].date),bc=seriesValueAtOrBefore(bench,series[i].date);
        if(bp!=null&&bc!=null&&bp>0){stratAligned.push(periodReturns[i-1]);benchAligned.push(bc/bp-1);}
      }
      alignedPeriods=stratAligned.length;
      const b0=seriesValueAtOrBefore(bench,series[0].date),b1=seriesValueAtOrBefore(bench,series[series.length-1].date);
      if(b0!=null&&b1!=null&&b0>0&&years>0){benchmarkCagr=Math.pow(b1/b0,1/years)-1;activeRet=cagr==null?null:cagr-benchmarkCagr;}
      if(alignedPeriods>=2){
        benchBeta=beta(stratAligned,benchAligned);
        const ms=mean(stratAligned),mb=mean(benchAligned);
        alpha=benchBeta==null?null:((ms-rfPerPeriod)-benchBeta*(mb-rfPerPeriod))*annualizationFactor;
        const diffs=stratAligned.map((r,i)=>r-benchAligned[i]),sd=stdev(diffs);
        te=sd==null?null:sd*Math.sqrt(annualizationFactor);
        ir=sd!=null&&sd>EPS?mean(diffs)/sd*Math.sqrt(annualizationFactor):null;
      }
    }
    const hitRate=periodReturns.length?periodReturns.filter(r=>r>0).length/periodReturns.length:null;
    const grossWin=periodReturns.filter(r=>r>0).reduce((s,r)=>s+r,0),grossLoss=Math.abs(periodReturns.filter(r=>r<0).reduce((s,r)=>s+r,0));
    const profitFactor=grossLoss>EPS?grossWin/grossLoss:null;
    return {
      available:true,totalReturn,cagr,vol,mdd,sharpe,sortino,calmar,activeRet,beta:benchBeta,alpha,te,ir,hitRate,profitFactor,
      trades:tradeCount,costs,totalTurnover,period:[series[0].date,series[series.length-1].date],n:series.length,
      annualizationFactor,periodLabel:cadence.label,frequencySource:cadence.source,benchmarkCagr,alignedPeriods,equityCurve,positionCurve,
      methodology:'close-to-close positions; signals observed at a close apply from the next period; transaction costs/slippage deducted at each turnover event'
    };
  }

  return {VERSION,finite,mulberry32,normal01,quantileSorted,monteCarloRun,validatePrices,inferPeriodsPerYear,defaultSignal,positionFromSignal,backtestRun};
});
