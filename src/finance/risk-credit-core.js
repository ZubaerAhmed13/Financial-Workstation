(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.RiskCreditCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='1.0.0';
  const EPS=1e-12;
  const DAY_MS=86400000;

  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  function finiteArray(values){return Array.isArray(values)&&values.length>0&&values.every(finite);}
  function safeDivide(a,b){return finite(a)&&finite(b)&&Math.abs(b)>EPS?a/b:null;}
  function mean(a){return finiteArray(a)?a.reduce((s,v)=>s+v,0)/a.length:null;}
  function stdev(a){if(!finiteArray(a)||a.length<2)return null;const m=mean(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)*(v-m),0)/(a.length-1));}
  function validConfidence(c){return finite(c)&&c>0&&c<1;}

  function quantile(values,p){
    if(!finiteArray(values)||!finite(p)||p<0||p>1)return null;
    const a=values.slice().sort((x,y)=>x-y);
    if(a.length===1)return a[0];
    const h=(a.length-1)*p,lo=Math.floor(h),hi=Math.ceil(h),w=h-lo;
    return a[lo]*(1-w)+a[hi]*w;
  }

  function historicalVaR(returns,confidence){
    if(!finiteArray(returns)||!validConfidence(confidence))return null;
    return quantile(returns,1-confidence);
  }

  function expectedShortfall(returns,confidence){
    if(!finiteArray(returns)||!validConfidence(confidence))return null;
    const a=returns.slice().sort((x,y)=>x-y);
    const mass=(1-confidence)*a.length;
    if(mass<=EPS)return null;
    const whole=Math.floor(mass),frac=mass-whole;
    let sum=0;
    for(let i=0;i<whole;i++)sum+=a[i];
    if(frac>EPS)sum+=a[Math.min(whole,a.length-1)]*frac;
    return sum/mass;
  }

  // Acklam inverse-normal approximation. Accurate enough for analytical VaR work
  // and, unlike the legacy branch, supports any valid confidence rather than only 95/99%.
  function normalInvCDF(p){
    if(!finite(p)||p<=0||p>=1)return null;
    const a=[-3.969683028665376e1,2.209460984245205e2,-2.759285104469687e2,1.38357751867269e2,-3.066479806614716e1,2.506628277459239];
    const b=[-5.447609879822406e1,1.615858368580409e2,-1.556989798598866e2,6.680131188771972e1,-1.328068155288572e1];
    const c=[-7.784894002430293e-3,-3.223964580411365e-1,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783];
    const d=[7.784695709041462e-3,3.224671290700398e-1,2.445134137142996,3.754408661907416];
    const plow=.02425,phigh=1-plow;
    let q,r;
    if(p<plow){q=Math.sqrt(-2*Math.log(p));return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
    if(p>phigh){q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
    q=p-.5;r=q*q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  }

  function parametricVaR(volatility,mu,confidence){
    if(!finite(volatility)||volatility<0||!finite(mu)||!validConfidence(confidence))return null;
    const z=normalInvCDF(1-confidence);
    return z==null?null:mu+z*volatility;
  }

  function terminalReturns(finalValues,currentValue){
    if(!finiteArray(finalValues)||!finite(currentValue)||currentValue<=0)return null;
    return finalValues.map(v=>v/currentValue-1);
  }
  function mcVaR(finalValues,currentValue,confidence){const r=terminalReturns(finalValues,currentValue);return r?historicalVaR(r,confidence):null;}
  function mcES(finalValues,currentValue,confidence){const r=terminalReturns(finalValues,currentValue);return r?expectedShortfall(r,confidence):null;}

  function inferPeriodsPerYear(seriesOrDates){
    if(!Array.isArray(seriesOrDates))return {periodsPerYear:null,label:'periodic',medianDays:null,source:'unknown'};
    const times=seriesOrDates.map(v=>{
      const raw=v&&typeof v==='object'&&'date'in v?v.date:v;
      const t=raw instanceof Date?raw.getTime():(typeof raw==='number'?raw:new Date(raw).getTime());
      return Number.isFinite(t)?t:null;
    }).filter(v=>v!=null).sort((a,b)=>a-b);
    const unique=[...new Set(times)];
    if(unique.length<2)return {periodsPerYear:null,label:'periodic',medianDays:null,source:'unknown'};
    const diffs=[];for(let i=1;i<unique.length;i++){const days=(unique[i]-unique[i-1])/DAY_MS;if(days>0)diffs.push(days);}
    if(!diffs.length)return {periodsPerYear:null,label:'periodic',medianDays:null,source:'unknown'};
    const md=quantile(diffs,.5);
    let periodsPerYear,label;
    if(md<=2.5){periodsPerYear=252;label='daily';}
    else if(md<=10.5){periodsPerYear=52;label='weekly';}
    else if(md<=45){periodsPerYear=12;label='monthly';}
    else if(md<=120){periodsPerYear=4;label='quarterly';}
    else if(md<=220){periodsPerYear=2;label='semiannual';}
    else {periodsPerYear=1;label='annual';}
    return {periodsPerYear,label,medianDays:md,source:'timestamp-median'};
  }

  function returnRiskSummary(returns,periodsPerYear,rfAnnual=0,benchmarkReturns=null){
    if(!finiteArray(returns)||!finite(periodsPerYear)||periodsPerYear<=0||!finite(rfAnnual)||rfAnnual<=-1)return null;
    const mu=mean(returns),sd=stdev(returns);
    if(mu==null)return null;
    const annualizedReturn=mu>-1?Math.pow(1+mu,periodsPerYear)-1:null;
    const annualizedVolatility=sd==null?null:sd*Math.sqrt(periodsPerYear);
    const rfPerPeriod=Math.pow(1+rfAnnual,1/periodsPerYear)-1;
    const sharpe=sd!=null&&sd>EPS?(mu-rfPerPeriod)/sd*Math.sqrt(periodsPerYear):null;
    const downside=Math.sqrt(returns.reduce((s,v)=>{const d=Math.min(v-rfPerPeriod,0);return s+d*d;},0)/returns.length);
    const sortino=downside>EPS?(mu-rfPerPeriod)/downside*Math.sqrt(periodsPerYear):null;
    let beta=null,alpha=null;
    if(finiteArray(benchmarkReturns)&&benchmarkReturns.length===returns.length&&returns.length>1){
      const bm=mean(benchmarkReturns),bs=stdev(benchmarkReturns);
      if(bs!=null&&bs>EPS){
        let cov=0;for(let i=0;i<returns.length;i++)cov+=(returns[i]-mu)*(benchmarkReturns[i]-bm);cov/=(returns.length-1);
        beta=cov/(bs*bs);
        const alphaPeriod=mu-(rfPerPeriod+beta*(bm-rfPerPeriod));
        alpha=alphaPeriod*periodsPerYear;
      }
    }
    return {periodMean:mu,periodVolatility:sd,annualizedReturn,annualizedVolatility,rfPerPeriod,sharpe,sortino,beta,alpha,periodsPerYear};
  }

  function ratio(n,d){return finite(n)&&finite(d)&&Math.abs(d)>EPS?n/d:null;}
  function altmanZ(f){
    f=f||{};
    const X1=ratio(f.workingCapital,f.assets),X2=ratio(f.retained,f.assets),X3=ratio(f.ebit,f.assets),X4=ratio(f.mve,f.liabilities),X5=ratio(f.revenue,f.assets);
    if([X1,X2,X3,X4,X5].some(v=>v==null))return {z:null,terms:null,msg:'Missing or invalid data for Altman Z (need finite working capital, retained earnings, EBIT, market value of equity, liabilities, revenue, and non-zero assets/liabilities).'};
    const z=1.2*X1+1.4*X2+3.3*X3+.6*X4+X5;
    const zone=z<1.81?'Distress zone':z<2.99?'Grey zone':'Safer zone';
    return {z,X1,X2,X3,X4,X5,terms:{X1,X2,X3,X4,X5},zone,msg:`Z = ${z.toFixed(2)} (${zone}). The Z-Score is a heuristic, not a guarantee of bankruptcy.`};
  }
  function altmanZPrime(f){
    f=f||{};
    const X1=ratio(f.workingCapital,f.assets),X2=ratio(f.retained,f.assets),X3=ratio(f.ebit,f.assets),X4=ratio(f.equity,f.liabilities),X5=ratio(f.revenue,f.assets);
    if([X1,X2,X3,X4,X5].some(v=>v==null))return {z:null,terms:null,msg:'Missing or invalid data for Altman Z-prime.'};
    const z=.717*X1+.847*X2+3.107*X3+.420*X4+.998*X5;
    const zone=z<1.23?'Distress zone':z<2.9?'Grey zone':'Safer zone';
    return {z,X1,X2,X3,X4,X5,terms:{X1,X2,X3,X4,X5},zone,msg:`Z'-score = ${z.toFixed(2)} (${zone}). Private/emerging-market variant.`};
  }

  const DEFAULT_PD_TABLE=Object.freeze({
    AAA:Object.freeze({1:.0002,3:.0009,5:.002,10:.007}),
    AA:Object.freeze({1:.0006,3:.003,5:.006,10:.02}),
    A:Object.freeze({1:.0012,3:.006,5:.012,10:.04}),
    BBB:Object.freeze({1:.005,3:.02,5:.04,10:.10}),
    BB:Object.freeze({1:.02,3:.08,5:.15,10:.28}),
    B:Object.freeze({1:.06,3:.18,5:.30,10:.48}),
    CCC:Object.freeze({1:.25,3:.45,5:.55,10:.70}),
    CC:Object.freeze({1:.40,3:.60,5:.70,10:.80})
  });

  function ratingPD(rating,horizon,table=DEFAULT_PD_TABLE){
    if(typeof rating!=='string'||!finite(horizon)||horizon<=0||!table||typeof table!=='object')return null;
    const key=rating.trim().toUpperCase(),row=table[key];if(!row||typeof row!=='object')return null;
    const exact=row[horizon];if(finite(exact)&&exact>=0&&exact<=1)return exact;
    const pts=Object.keys(row).map(k=>[Number(k),row[k]]).filter(([h,p])=>finite(h)&&h>0&&finite(p)&&p>=0&&p<=1).sort((a,b)=>a[0]-b[0]);
    if(pts.length<2||horizon<pts[0][0]||horizon>pts[pts.length-1][0])return null;
    for(let i=1;i<pts.length;i++){
      const [h0,p0]=pts[i-1],[h1,p1]=pts[i];
      if(horizon>=h0&&horizon<=h1){const w=(horizon-h0)/(h1-h0);return p0+w*(p1-p0);}
    }
    return null;
  }
  function creditCurve(rating,horizons=[1,3,5,7,10],table=DEFAULT_PD_TABLE){
    if(!Array.isArray(horizons)||!horizons.length)return null;
    const key=typeof rating==='string'?rating.trim().toUpperCase():'';if(!key||!table[key])return null;
    const pd=horizons.map(h=>ratingPD(key,h,table));
    return {horiz:horizons.slice(),pd,rating:key};
  }
  function expectedLossRate(pd,recovery){return finite(pd)&&pd>=0&&pd<=1&&finite(recovery)&&recovery>=0&&recovery<=1?pd*(1-recovery):null;}
  function expectedLossAmount(pd,recovery,ead){const rate=expectedLossRate(pd,recovery);return rate!=null&&finite(ead)&&ead>=0?rate*ead:null;}

  function erf(x){
    const sign=x<0?-1:1;const ax=Math.abs(x),t=1/(1+.3275911*ax);
    const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-ax*ax);
    return sign*y;
  }
  function normCDF(x){return .5*(1+erf(x/Math.SQRT2));}
  function mertonEquity(V,sigmaV,D,r,T){
    if(![V,sigmaV,D,r,T].every(finite)||V<=0||sigmaV<=0||D<=0||T<=0)return null;
    const srt=sigmaV*Math.sqrt(T),d1=(Math.log(V/D)+(r+.5*sigmaV*sigmaV)*T)/srt,d2=d1-srt;
    const value=V*normCDF(d1)-D*Math.exp(-r*T)*normCDF(d2);
    return Number.isFinite(value)?{value,d1,d2,Nd1:normCDF(d1),Nd2:normCDF(d2)}:null;
  }
  function solveAssetValue(E,sigmaV,D,r,T){
    let lo=Math.max(E*1e-9,EPS),hi=Math.max(E+D*Math.exp(-r*T),E+D,1);
    let eHi=mertonEquity(hi,sigmaV,D,r,T);let guard=0;
    while((!eHi||eHi.value<E)&&guard++<80){hi*=2;eHi=mertonEquity(hi,sigmaV,D,r,T);}
    if(!eHi||eHi.value<E)return null;
    for(let i=0;i<160;i++){
      const mid=(lo+hi)/2,eMid=mertonEquity(mid,sigmaV,D,r,T);if(!eMid)return null;
      if(Math.abs(eMid.value-E)/E<1e-11)return mid;
      if(eMid.value>E)hi=mid;else lo=mid;
    }
    return (lo+hi)/2;
  }
  function merton(E,sigmaE,D,r,T){
    if(![E,sigmaE,D,r,T].every(finite)||E<=0||D<=0||sigmaE<=0||T<=0)return {error:'Need finite positive market equity, debt, equity volatility, and horizon; risk-free rate must be finite.',converged:false,pd:null};
    let sigmaV=Math.max(sigmaE*E/(E+D),1e-6),V=E+D*Math.exp(-r*T),iterations=0,converged=false;
    for(let i=0;i<160;i++){
      iterations=i+1;
      const solvedV=solveAssetValue(E,sigmaV,D,r,T);if(solvedV==null)break;
      const eq=mertonEquity(solvedV,sigmaV,D,r,T);if(!eq||eq.Nd1<=EPS)break;
      const targetSigma=sigmaE*E/(solvedV*eq.Nd1);if(!finite(targetSigma)||targetSigma<=0)break;
      const nextSigma=.5*sigmaV+.5*targetSigma;
      const relV=Math.abs(solvedV-V)/Math.max(Math.abs(V),1),relS=Math.abs(nextSigma-sigmaV)/Math.max(Math.abs(sigmaV),1e-6);
      V=solvedV;sigmaV=nextSigma;
      if(relV<1e-10&&relS<1e-10){converged=true;break;}
    }
    const eq=mertonEquity(V,sigmaV,D,r,T);
    if(!eq)return {error:'Merton solver produced a non-finite state.',converged:false,pd:null,E,sigmaE,D,r,T};
    const sigmaECalc=sigmaV*(V/E)*eq.Nd1;
    const residualEquity=(eq.value-E)/E,residualVol=(sigmaECalc-sigmaE)/sigmaE;
    if(Math.abs(residualEquity)<1e-7&&Math.abs(residualVol)<1e-7)converged=true;
    if(!converged)return {error:'Merton solver did not converge to the requested tolerance.',converged:false,pd:null,V,sigmaV,d1:eq.d1,d2:eq.d2,distanceToDefault:eq.d2,E,sigmaE,D,r,T,iterations,residualEquity,residualVol};
    const pd=normCDF(-eq.d2);
    return {V,sigmaV,d1:eq.d1,d2:eq.d2,distanceToDefault:eq.d2,pd,E,sigmaE,D,r,T,iterations,converged:true,residualEquity,residualVol,note:'Structural model estimate. Sensitive to input assumptions; not a prediction.'};
  }
  function mertonTrace(E,sigmaE,D,r,T){
    const x=merton(E,sigmaE,D,r,T);
    return {iterations:x.iterations||0,converged:!!x.converged,residual:finite(x.residualEquity)?Math.abs(x.residualEquity):null,residualVol:finite(x.residualVol)?Math.abs(x.residualVol):null,distanceToDefault:finite(x.distanceToDefault)?x.distanceToDefault:null,pd:finite(x.pd)?x.pd:null,error:x.error||null};
  }

  return Object.freeze({VERSION,finite,quantile,normalInvCDF,historicalVaR,parametricVaR,expectedShortfall,mcVaR,mcES,inferPeriodsPerYear,returnRiskSummary,altmanZ,altmanZPrime,DEFAULT_PD_TABLE,ratingPD,creditCurve,expectedLossRate,expectedLossAmount,merton,mertonTrace});
});
