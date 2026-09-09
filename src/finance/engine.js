(function(root, factory){
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.FinanceCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  'use strict';

  const VERSION = '1.1.0';
  const EPS = 1e-12;
  const BP = 1e-4;
  const DAY_MS = 86400000;

  const isFiniteNumber = v => typeof v === 'number' && Number.isFinite(v);
  const nearlyZero = v => isFiniteNumber(v) && Math.abs(v) <= EPS;
  function asFinite(v, name='value'){
    if (!isFiniteNumber(v)) throw new TypeError(`${name} must be a finite number`);
    return v;
  }
  function assertFiniteArray(a, name='values'){
    if (!Array.isArray(a)) throw new TypeError(`${name} must be an array`);
    a.forEach((v,i)=>asFinite(v, `${name}[${i}]`));
    return a;
  }
  function safeDivide(numerator, denominator){
    if (!isFiniteNumber(numerator) || !isFiniteNumber(denominator) || nearlyZero(denominator)) return null;
    const q = numerator / denominator;
    return Number.isFinite(q) ? q : null;
  }
  function validateRange(value,min,max,{inclusive=true}={}){
    return isFiniteNumber(value) && (inclusive ? value>=min && value<=max : value>min && value<max);
  }
  function validatePositive(value,{allowZero=false}={}){
    return isFiniteNumber(value) && (allowZero ? value>=0 : value>0);
  }
  function validPeriod(period){ return Number.isInteger(period) && period > 0; }

  function mean(a){ assertFiniteArray(a); return a.length ? a.reduce((s,v)=>s+v,0)/a.length : null; }
  function median(a){
    assertFiniteArray(a); if (!a.length) return null;
    const b = a.slice().sort((x,y)=>x-y); const m=Math.floor(b.length/2);
    return b.length%2 ? b[m] : (b[m-1]+b[m])/2;
  }
  function variance(a, ddof=1){
    assertFiniteArray(a); if (!Number.isInteger(ddof)||ddof<0) throw new RangeError('ddof must be a non-negative integer');
    if (a.length<=ddof) return null; const m=mean(a);
    return a.reduce((s,v)=>s+(v-m)*(v-m),0)/(a.length-ddof);
  }
  function stdev(a,ddof=1){ const v=variance(a,ddof); return v==null?null:Math.sqrt(v); }
  function covariance(a,b,ddof=1){
    assertFiniteArray(a,'a'); assertFiniteArray(b,'b'); if(a.length!==b.length) throw new RangeError('arrays must have equal length');
    if(a.length<=ddof) return null; const ma=mean(a),mb=mean(b); let s=0;
    for(let i=0;i<a.length;i++) s+=(a[i]-ma)*(b[i]-mb); return s/(a.length-ddof);
  }
  function correlation(a,b){ const c=covariance(a,b,1), sa=stdev(a,1), sb=stdev(b,1); return c==null||!sa||!sb?null:c/(sa*sb); }

  function npv(flows,rate){ assertFiniteArray(flows,'flows'); asFinite(rate,'rate'); if(rate<=-1)return null; let pv=0; for(let t=0;t<flows.length;t++)pv+=flows[t]/Math.pow(1+rate,t); return Number.isFinite(pv)?pv:null; }
  function signChanges(flows){ let prev=0,c=0; for(const f of flows){ if(Math.abs(f)<=EPS)continue; const s=Math.sign(f); if(prev&&s!==prev)c++; prev=s; } return c; }
  function irr(flows){ assertFiniteArray(flows,'flows'); if(flows.length<2||!flows.some(x=>x<0)||!flows.some(x=>x>0))return null; const f=r=>npv(flows,r); const points=[]; for(let i=0;i<=800;i++){ const x=-0.9999+i*(10.9999/800); const y=f(x); if(y!=null&&Number.isFinite(y))points.push([x,y]); } let bracket=null; for(let i=1;i<points.length;i++){ if(points[i-1][1]===0)return points[i-1][0]; if(points[i-1][1]*points[i][1]<0){ bracket=[points[i-1][0],points[i][0]]; break; } } if(!bracket)return null; let [lo,hi]=bracket,flo=f(lo); for(let i=0;i<300;i++){const mid=(lo+hi)/2,fm=f(mid);if(Math.abs(fm)<1e-11)return mid;if(flo*fm<=0)hi=mid;else{lo=mid;flo=fm;}}return (lo+hi)/2; }
  function xnpv(rate,flows,dates){ assertFiniteArray(flows,'flows'); if(!Array.isArray(dates)||dates.length!==flows.length||rate<=-1)return null; const t0=new Date(dates[0]).getTime(); if(!Number.isFinite(t0))return null; let pv=0; for(let i=0;i<flows.length;i++){ const ti=new Date(dates[i]).getTime(); if(!Number.isFinite(ti))return null; const years=(ti-t0)/(365*DAY_MS); pv+=flows[i]/Math.pow(1+rate,years); } return Number.isFinite(pv)?pv:null; }
  function xirr(flows,dates){ assertFiniteArray(flows,'flows'); if(!flows.some(x=>x<0)||!flows.some(x=>x>0))return null; const f=r=>xnpv(r,flows,dates); let lo=-0.9999,hi=1,flo=f(lo),fhi=f(hi),guard=0; while(flo!=null&&fhi!=null&&flo*fhi>0&&guard++<12){hi*=2;fhi=f(hi);} if(flo==null||fhi==null||flo*fhi>0)return null; for(let i=0;i<300;i++){const mid=(lo+hi)/2,fm=f(mid);if(fm==null)return null;if(Math.abs(fm)<1e-10)return mid;if(flo*fm<=0){hi=mid;fhi=fm;}else{lo=mid;flo=fm;}}return (lo+hi)/2; }

  function simpleReturn(beginning,ending){ asFinite(beginning,'beginning');asFinite(ending,'ending'); return beginning===0?null:ending/beginning-1; }
  function logReturn(beginning,ending){ asFinite(beginning,'beginning');asFinite(ending,'ending'); return beginning>0&&ending>0?Math.log(ending/beginning):null; }
  function cagr(beginning,ending,years){ asFinite(beginning,'beginning');asFinite(ending,'ending');asFinite(years,'years'); return beginning>0&&ending>=0&&years>0?Math.pow(ending/beginning,1/years)-1:null; }
  function timeWeightedReturn(subperiodReturns){ assertFiniteArray(subperiodReturns,'subperiodReturns'); return subperiodReturns.reduce((p,r)=>p*(1+r),1)-1; }
  function annualizedVolatility(returns,periodsPerYear){ const sd=stdev(returns,1); return sd==null||!validatePositive(periodsPerYear)?null:sd*Math.sqrt(periodsPerYear); }
  function downsideDeviation(returns,target=0){ assertFiniteArray(returns,'returns');asFinite(target,'target'); if(!returns.length)return null; const squares=returns.map(r=>Math.min(r-target,0)**2); return Math.sqrt(squares.reduce((s,v)=>s+v,0)/squares.length); }
  function sharpe(returns,rfPerPeriod=0){ const sd=stdev(returns,1),m=mean(returns); return sd==null||sd<=EPS||m==null?null:(m-rfPerPeriod)/sd; }
  function sortino(returns,target=0){ const dd=downsideDeviation(returns,target),m=mean(returns); return dd==null||dd<=EPS||m==null?null:(m-target)/dd; }
  function beta(returns,benchmark){ const c=covariance(returns,benchmark,1),v=variance(benchmark,1); return c==null||v==null||Math.abs(v)<=EPS?null:c/v; }

  function maximumDrawdown(values,timestamps=null){
    assertFiniteArray(values,'values'); if(!values.length) return {mdd:null,peakI:null,troughI:null,recoveryI:null,recovered:false,recoveryPeriod:null,recoveryCalendarDays:null,drawdownDuration:null,drawdowns:[]};
    if(values.some(v=>v<=0)) throw new RangeError('drawdown values must be positive');
    let runningPeak=values[0], runningPeakI=0, mdd=0, peakI=0, troughI=0;
    const drawdowns=[];
    for(let i=0;i<values.length;i++){
      if(values[i]>=runningPeak){ runningPeak=values[i]; runningPeakI=i; }
      const dd=values[i]/runningPeak-1; drawdowns.push(dd);
      if(dd<mdd){mdd=dd;peakI=runningPeakI;troughI=i;}
    }
    let recoveryI=null;
    if(mdd<0){ const priorPeak=values[peakI]; for(let i=troughI+1;i<values.length;i++){ if(values[i]>=priorPeak){recoveryI=i;break;} } }
    else recoveryI=troughI;
    const recovered=recoveryI!=null;
    let recoveryCalendarDays=null;
    if(recovered && timestamps && timestamps[troughI]!=null && timestamps[recoveryI]!=null){
      const a=new Date(timestamps[troughI]).getTime(),b=new Date(timestamps[recoveryI]).getTime();
      if(Number.isFinite(a)&&Number.isFinite(b)) recoveryCalendarDays=(b-a)/DAY_MS;
    }
    return {mdd,peakI,troughI,recoveryI,recovered,recoveryPeriod:recovered?recoveryI-troughI:null,recoveryPeriodUnit:'observations',recoveryCalendarDays,drawdownDuration:troughI-peakI,drawdownDurationUnit:'observations',drawdowns};
  }
  function recoveryPeriod(values,troughIdx){
    assertFiniteArray(values,'values'); if(!Number.isInteger(troughIdx)||troughIdx<0||troughIdx>=values.length) return null;
    if(values.some(v=>v<=0)) return null;
    let peakI=0; for(let i=1;i<=troughIdx;i++) if(values[i]>=values[peakI]) peakI=i;
    const peak=values[peakI]; for(let i=troughIdx+1;i<values.length;i++) if(values[i]>=peak) return i-troughIdx;
    return null;
  }

  function sma(arr,period){ assertFiniteArray(arr,'arr'); if(!validPeriod(period)) throw new RangeError('period must be a positive integer'); const out=Array(arr.length).fill(null); let s=0; for(let i=0;i<arr.length;i++){s+=arr[i];if(i>=period)s-=arr[i-period];if(i>=period-1)out[i]=s/period;} return out; }
  function ema(arr,period){
    assertFiniteArray(arr,'arr'); if(!validPeriod(period)) throw new RangeError('period must be a positive integer'); const out=Array(arr.length).fill(null); if(arr.length<period)return out;
    let seed=0;for(let i=0;i<period;i++)seed+=arr[i];let e=seed/period;out[period-1]=e;const k=2/(period+1);
    for(let i=period;i<arr.length;i++){e=arr[i]*k+e*(1-k);out[i]=e;}return out;
  }
  function emaAvailable(values,period){
    if(!validPeriod(period))throw new RangeError('period must be a positive integer'); const out=Array(values.length).fill(null); const idx=[];const nums=[];
    values.forEach((v,i)=>{if(v!=null){asFinite(v,`values[${i}]`);idx.push(i);nums.push(v);}}); if(nums.length<period)return out;
    const e=ema(nums,period);e.forEach((v,j)=>{if(v!=null)out[idx[j]]=v;});return out;
  }
  function macd(arr,fast=12,slow=26,signalPeriod=9){
    assertFiniteArray(arr,'arr'); if(!validPeriod(fast)||!validPeriod(slow)||!validPeriod(signalPeriod)||fast>=slow) throw new RangeError('MACD requires positive integer periods with fast < slow');
    const ef=ema(arr,fast),es=ema(arr,slow);const line=arr.map((_,i)=>ef[i]!=null&&es[i]!=null?ef[i]-es[i]:null);const signal=emaAvailable(line,signalPeriod);
    const histogram=line.map((v,i)=>v!=null&&signal[i]!=null?v-signal[i]:null);return {line,macd:line,signal,histogram,hist:histogram,fast,slow,signalPeriod};
  }
  function rsi(arr,period=14){
    assertFiniteArray(arr,'arr'); if(!validPeriod(period))throw new RangeError('period must be a positive integer'); const out=Array(arr.length).fill(null); if(arr.length<=period)return out;
    let gain=0,loss=0;for(let i=1;i<=period;i++){const d=arr[i]-arr[i-1];if(d>0)gain+=d;else if(d<0)loss-=d;}gain/=period;loss/=period;
    const calc=(g,l)=> l<=EPS?(g<=EPS?50:100):(g<=EPS?0:100-100/(1+g/l));out[period]=calc(gain,loss);
    for(let i=period+1;i<arr.length;i++){const d=arr[i]-arr[i-1],cg=d>0?d:0,cl=d<0?-d:0;gain=(gain*(period-1)+cg)/period;loss=(loss*(period-1)+cl)/period;out[i]=calc(gain,loss);}return out;
  }

  function bondPeriods(years,frequency){ asFinite(years,'years'); if(!validPeriod(frequency)||years<=0)throw new RangeError('positive years and integer frequency required'); const n=years*frequency; if(Math.abs(n-Math.round(n))>1e-9)throw new RangeError('years × frequency must be an integer number of periods'); return Math.round(n); }
  function bondPrice(face,couponAnnual,ytm,years,frequency=2){ asFinite(face,'face');asFinite(couponAnnual,'couponAnnual');asFinite(ytm,'ytm');const n=bondPeriods(years,frequency);if(face<=0)throw new RangeError('face must be positive');const y=ytm/frequency;if(y<=-1) return null;const c=couponAnnual/frequency;let p=0;for(let t=1;t<=n;t++)p+=(t===n?c+face:c)/Math.pow(1+y,t);return Number.isFinite(p)?p:null; }
  function macaulayDuration(face,couponAnnual,frequency,years,ytm){const price=bondPrice(face,couponAnnual,ytm,years,frequency);if(price==null||price<=0)return null;const n=bondPeriods(years,frequency),y=ytm/frequency,c=couponAnnual/frequency;let weighted=0;for(let t=1;t<=n;t++){const cf=t===n?c+face:c;weighted+=(t/frequency)*cf/Math.pow(1+y,t);}return weighted/price;}
  function modifiedDuration(macDur,ytm,frequency=1){asFinite(macDur,'macDur');asFinite(ytm,'ytm');if(!validPeriod(frequency))throw new RangeError('frequency must be a positive integer');const d=1+ytm/frequency;return d<=EPS?null:macDur/d;}
  function bondConvexity(face,couponAnnual,frequency,years,ytm){const price=bondPrice(face,couponAnnual,ytm,years,frequency);if(price==null||price<=0)return null;const n=bondPeriods(years,frequency),y=ytm/frequency,c=couponAnnual/frequency;let s=0;for(let t=1;t<=n;t++){const cf=t===n?c+face:c;s+=cf*t*(t+1)/Math.pow(1+y,t+2);}return s/(price*frequency*frequency);}
  function currentYield(price,couponAnnual){ return safeDivide(couponAnnual,price); }
  function ytmFromPrice(price,face,couponAnnual,frequency,years){
    if(!validatePositive(price)||!validatePositive(face)||!isFiniteNumber(couponAnnual)||couponAnnual<0||!validPeriod(frequency)||!validatePositive(years))return null;
    const f=y=>bondPrice(face,couponAnnual,y,years,frequency)-price; let lo=-0.99*frequency,hi=1;let flo=f(lo),fhi=f(hi);let guard=0;
    while(flo!=null&&fhi!=null&&flo*fhi>0&&guard++<20){hi*=2;fhi=f(hi);} if(flo==null||fhi==null||flo*fhi>0)return null;
    for(let i=0;i<300;i++){const mid=(lo+hi)/2,fm=f(mid);if(fm==null)return null;if(Math.abs(fm)<1e-10)return mid;if(flo*fm<=0){hi=mid;fhi=fm;}else{lo=mid;flo=fm;}}return (lo+hi)/2;
  }
  function dv01(face,couponAnnual,ytm,years,frequency=2){const down=bondPrice(face,couponAnnual,ytm-BP,years,frequency),up=bondPrice(face,couponAnnual,ytm+BP,years,frequency);return down==null||up==null?null:(down-up)/2;}

  function capm(riskFree,betaValue,equityRiskPremium){[riskFree,betaValue,equityRiskPremium].forEach((v,i)=>asFinite(v,['riskFree','beta','equityRiskPremium'][i]));return riskFree+betaValue*equityRiskPremium;}
  function wacc(input){
    const {equity=0,debt=0,preferred=0,costEquity=0,costDebt=0,costPreferred=0,taxRate=0}=input||{};[equity,debt,preferred,costEquity,costDebt,costPreferred,taxRate].forEach((v,i)=>asFinite(v,['equity','debt','preferred','costEquity','costDebt','costPreferred','taxRate'][i]));
    if(equity<0||debt<0||preferred<0)return {error:'Capital values cannot be negative.'}; if(taxRate<0||taxRate>1)return {error:'Tax rate must be between 0 and 1.'};const total=equity+debt+preferred;if(total<=EPS)return {error:'Total capital must be positive.'};
    const value=(equity/total)*costEquity+(debt/total)*costDebt*(1-taxRate)+(preferred/total)*costPreferred;return {value,total,weights:{equity:equity/total,debt:debt/total,preferred:preferred/total}};
  }

  function dcf(opts){
    const o=Object.assign({terminalMethod:'growth',exitMultiple:8,netDebt:0,shares:1,horizon:5},opts||{});const req=['revenue0','growth','ebitdaMargin','tax','capexPct','wcPct','dandaPct','wacc','terminalGrowth','netDebt','shares'];for(const k of req)if(!isFiniteNumber(o[k]))return {error:`${k} must be a finite number.`,status:'invalid'};
    if(o.revenue0<0)return {error:'Starting revenue cannot be negative.',status:'invalid'};if(!Number.isInteger(o.horizon)||o.horizon<=0||o.horizon>200)return {error:'Horizon must be a positive integer up to 200.',status:'invalid'};if(o.tax<0||o.tax>1)return {error:'Tax rate must be between 0 and 1.',status:'invalid'};if(o.shares<=0)return {error:'Diluted shares outstanding must be positive.',status:'invalid'};if(o.wacc<=0)return {error:'Discount rate must be positive for this DCF model.',status:'invalid'};
    const warnings=[];if(o.terminalMethod==='growth'){if(o.terminalGrowth>=o.wacc)return {error:'Terminal growth must be lower than the discount rate for a perpetual-growth valuation.',status:'invalid'};if(o.wacc-o.terminalGrowth<0.005)warnings.push({severity:'CAUTION',code:'DCF-SENS-001',message:'Terminal growth is very close to the discount rate. Small assumption changes may cause extreme valuation changes.'});}
    const rows=[];let revenue=o.revenue0,pv=0;for(let t=1;t<=o.horizon;t++){revenue*=1+o.growth;const ebitda=revenue*o.ebitdaMargin,danda=revenue*o.dandaPct,ebit=ebitda-danda,nopat=ebit*(1-o.tax),fcff=nopat+danda-revenue*o.capexPct-revenue*o.wcPct,df=Math.pow(1+o.wacc,t),pvF=fcff/df;if(![revenue,ebitda,danda,ebit,nopat,fcff,df,pvF].every(Number.isFinite))return {error:'DCF produced a non-finite forecast value.',status:'invalid'};pv+=pvF;rows.push({t,revenue,ebitda,danda,ebit,nopat,fcff,df,pvF});}
    const last=rows[rows.length-1];let tv;if(o.terminalMethod==='growth')tv=last.fcff*(1+o.terminalGrowth)/(o.wacc-o.terminalGrowth);else{if(!isFiniteNumber(o.exitMultiple)||o.exitMultiple<=0)return {error:'Exit multiple must be positive.',status:'invalid'};tv=last.ebitda*o.exitMultiple;}const tvPv=tv/Math.pow(1+o.wacc,o.horizon),ev=pv+tvPv,equity=ev-o.netDebt,perShare=equity/o.shares;if(![tv,tvPv,ev,equity,perShare].every(Number.isFinite))return {error:'DCF produced a non-finite valuation.',status:'invalid'};
    return {status:'valid',warnings,methodology:o.terminalMethod==='growth'?'FCFF DCF — Gordon Growth':'FCFF DCF — Exit Multiple',rows,pv,tv,tvPv,ev,netDebt:o.netDebt,equity,perShare,terminalShare:Math.abs(ev)>EPS?tvPv/ev:null,horizon:o.horizon,assumptions:{wacc:o.wacc,terminalGrowth:o.terminalGrowth,terminalMethod:o.terminalMethod}};
  }
  function gordonDDM(dividend0,growth,requiredReturn){[dividend0,growth,requiredReturn].forEach((v,i)=>asFinite(v,['dividend0','growth','requiredReturn'][i]));if(requiredReturn<=growth)return null;return dividend0*(1+growth)/(requiredReturn-growth);}
  function multiStageDDM(dividend0,stages,terminalGrowth,requiredReturn){asFinite(dividend0,'dividend0');asFinite(terminalGrowth,'terminalGrowth');asFinite(requiredReturn,'requiredReturn');if(requiredReturn<=terminalGrowth)return {error:'Required return must exceed terminal growth.'};if(!Array.isArray(stages))return {error:'stages must be an array'};let pv=0,d=dividend0,t=0;for(const s of stages){if(!s||!Number.isInteger(s.years)||s.years<0||!isFiniteNumber(s.growth))return {error:'Invalid DDM stage.'};for(let i=0;i<s.years;i++){t++;d*=1+s.growth;pv+=d/Math.pow(1+requiredReturn,t);}}const tv=d*(1+terminalGrowth)/(requiredReturn-terminalGrowth);const pvTV=tv/Math.pow(1+requiredReturn,t);return {value:pv+pvTV,terminalValue:tv,pvTerminal:pvTV,terminalShare:safeDivide(pvTV,pv+pvTV)};}
  function residualIncome(input){
    const o=Object.assign({payoutRatio:0,terminalGrowth:0},input||{});const keys=['bookValue0','roe','costEquity','horizon','terminalRoe','payoutRatio','terminalGrowth'];for(const k of keys){if(k==='horizon')continue;if(!isFiniteNumber(o[k]))return {error:`${k} must be finite.`};}if(!Number.isInteger(o.horizon)||o.horizon<=0)return {error:'horizon must be a positive integer'};if(o.bookValue0<0)return {error:'bookValue0 cannot be negative'};if(o.payoutRatio<0||o.payoutRatio>1)return {error:'payoutRatio must be between 0 and 1'};if(o.costEquity<=o.terminalGrowth)return {error:'Cost of equity must exceed terminal growth.'};let bv=o.bookValue0,pvRI=0;const rows=[];for(let t=1;t<=o.horizon;t++){const beginningBV=bv,netIncome=beginningBV*o.roe,equityCharge=beginningBV*o.costEquity,ri=netIncome-equityCharge,dividend=netIncome*o.payoutRatio;bv=beginningBV+netIncome-dividend;const pv=ri/Math.pow(1+o.costEquity,t);pvRI+=pv;rows.push({t,beginningBV,netIncome,equityCharge,residualIncome:ri,dividend,endingBV:bv,pvRI:pv});}const nextRI=bv*(o.terminalRoe-o.costEquity);const continuingValue=nextRI/(o.costEquity-o.terminalGrowth),pvContinuing=continuingValue/Math.pow(1+o.costEquity,o.horizon),value=o.bookValue0+pvRI+pvContinuing;return {value,bookValue0:o.bookValue0,pvRI,continuingValue,pvContinuing,endingBookValue:bv,rows};
  }
  function comparables(companyMultiple,peers){if(companyMultiple!=null)asFinite(companyMultiple,'companyMultiple');assertFiniteArray(peers,'peers');const vals=peers.filter(v=>v>0);if(!vals.length)return null;const mn=mean(vals),md=median(vals);return {mean:mn,median:md,peers:vals,impliedMean:companyMultiple!=null&&mn>0?companyMultiple/mn:null,impliedMedian:companyMultiple!=null&&md>0?companyMultiple/md:null};}

  function portfolioReturn(weights,returns){assertFiniteArray(weights,'weights');assertFiniteArray(returns,'returns');if(weights.length!==returns.length||!weights.length)return null;const sum=weights.reduce((s,v)=>s+v,0);if(Math.abs(sum-1)>1e-8)return null;return weights.reduce((s,w,i)=>s+w*returns[i],0);}
  function portfolioVariance(weights,covMatrix){assertFiniteArray(weights,'weights');if(!Array.isArray(covMatrix)||covMatrix.length!==weights.length)return null;for(const row of covMatrix){assertFiniteArray(row,'covMatrix row');if(row.length!==weights.length)return null;}let v=0;for(let i=0;i<weights.length;i++)for(let j=0;j<weights.length;j++)v+=weights[i]*covMatrix[i][j]*weights[j];return v<0&&v>-EPS?0:v;}

  function financialRatios(f){
    const n=k=>isFiniteNumber(f&&f[k])?f[k]:null;const r={};r.revenue=n('revenue');r.cogs=n('cogs');r.opex=n('opex');r.gross=n('grossProfit');if(r.gross==null&&r.revenue!=null&&r.cogs!=null)r.gross=r.revenue-r.cogs;r.ebitda=n('ebitda');r.ebit=n('ebit');r.netIncome=n('netIncome');r.cash=n('cash');r.debt=n('debt');r.assets=n('assets');r.liabilities=n('liabilities');r.equity=n('equity');r.workingCapital=n('workingCapital');r.retained=n('retained');r.mve=n('mve');r.currentAssets=n('currentAssets');r.currentLiabilities=n('currentLiabilities');r.inventory=n('inventory');
    r.grossMargin=safeDivide(r.gross,r.revenue);r.operatingMargin=safeDivide(r.ebit,r.revenue);r.ebitdaMargin=safeDivide(r.ebitda,r.revenue);r.netMargin=safeDivide(r.netIncome,r.revenue);r.roa=safeDivide(r.netIncome,r.assets);r.roe=safeDivide(r.netIncome,r.equity);const tax=isFiniteNumber(f&&f.tax)?f.tax:0;const invested=(r.equity!=null&&r.debt!=null&&r.cash!=null)?r.equity+r.debt-r.cash:null;r.roic=r.ebit==null||invested==null?null:safeDivide(r.ebit*(1-tax),invested);r.currentRatio=safeDivide(r.currentAssets,r.currentLiabilities);r.quickRatio=r.currentAssets==null||r.inventory==null?null:safeDivide(r.currentAssets-r.inventory,r.currentLiabilities);r.debtEquity=safeDivide(r.debt,r.equity);r.debtAssets=safeDivide(r.debt,r.assets);r.debtEbitda=safeDivide(r.debt,r.ebitda);r.interestCoverage=safeDivide(r.ebit,n('interestExpense'));r.assetTurnover=safeDivide(r.revenue,r.assets);r.equityMultiplier=safeDivide(r.assets,r.equity);r.netDebt=r.debt!=null&&r.cash!=null?r.debt-r.cash:null;return r;
  }

  function guessHeader(headerRow){
    if(!Array.isArray(headerRow))return {date:null,open:null,high:null,low:null,close:null,adjClose:null,volume:null};const first=headerRow.map(c=>String(c??'').trim().toLowerCase());const map={date:null,open:null,high:null,low:null,close:null,adjClose:null,volume:null};
    first.forEach((c,i)=>{if(map.date==null&&/^(date|day|timestamp|time|datum)\b/.test(c))map.date=i;if(map.adjClose==null&&/^(adj(?:usted)?\s*close|adjusted\s*price)$/.test(c))map.adjClose=i;if(map.close==null&&/^(close|closing\s*price|price)$/.test(c))map.close=i;if(map.open==null&&/^open\b/.test(c))map.open=i;if(map.high==null&&/^high\b/.test(c))map.high=i;if(map.low==null&&/^low\b/.test(c))map.low=i;if(map.volume==null&&/vol(?:ume)?/.test(c))map.volume=i;});
    if(map.date==null&&first.length)map.date=0;if(map.close==null&&map.adjClose!=null)map.close=map.adjClose;if(map.close==null){for(let i=0;i<first.length;i++){if(i!==map.date&&first[i]!=='' ){map.close=i;break;}}}return map;
  }

  function abbreviate(value){
    if(!isFiniteNumber(value))return null;const a=Math.abs(value);let scale=1,suffix='';if(a>=1e12){scale=1e12;suffix='T';}else if(a>=1e9){scale=1e9;suffix='B';}else if(a>=1e6){scale=1e6;suffix='M';}else if(a>=1e3){scale=1e3;suffix='K';}return {scaled:Object.is(value,-0)?0:value/scale,suffix,scale};
  }

  return {
    VERSION,EPS,BP,isFiniteNumber,safeDivide,validateRange,validatePositive,
    mean,median,variance,stdev,covariance,correlation,npv,irr,xnpv,xirr,signChanges,
    simpleReturn,logReturn,cagr,timeWeightedReturn,annualizedVolatility,downsideDeviation,sharpe,sortino,beta,
    maximumDrawdown,recoveryPeriod,sma,ema,macd,rsi,
    bondPrice,macaulayDuration,modifiedDuration,bondConvexity,currentYield,ytmFromPrice,dv01,
    capm,wacc,dcf,gordonDDM,multiStageDDM,residualIncome,comparables,
    portfolioReturn,portfolioVariance,financialRatios,guessHeader,abbreviate
  };
});
