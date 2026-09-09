'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const F=require('../src/finance/engine.js');
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t,`${a} not within ${t} of ${b}`);

// Numerical safety & statistics
test('isFiniteNumber rejects non-finite/non-number values',()=>{assert.equal(F.isFiniteNumber(0),true);assert.equal(F.isFiniteNumber(NaN),false);assert.equal(F.isFiniteNumber(Infinity),false);assert.equal(F.isFiniteNumber(null),false);});
test('safeDivide distinguishes zero denominator from zero numerator',()=>{assert.equal(F.safeDivide(0,5),0);assert.equal(F.safeDivide(5,0),null);});
test('mean known answer',()=>near(F.mean([1,2,3,4]),2.5));
test('REG-STAT-001 median even sample averages middle observations',()=>near(F.median([1,2,3,4]),2.5));
test('median one observation',()=>assert.equal(F.median([1]),1));
test('median two observations',()=>assert.equal(F.median([1,2]),1.5));
test('median odd observations',()=>assert.equal(F.median([1,2,3]),2));
test('median negative known answer',()=>assert.equal(F.median([-2,-1,3,10]),1));
test('median accepts unsorted input',()=>assert.equal(F.median([10,-2,3,-1]),1));
test('median does not mutate caller array',()=>{const a=[4,1,3,2],b=a.slice();F.median(a);assert.deepEqual(a,b);});
test('sample variance known answer',()=>near(F.variance([1,2,3,4],1),5/3));
test('population standard deviation known answer',()=>near(F.stdev([1,2,3,4],0),Math.sqrt(1.25)));
test('covariance known answer',()=>near(F.covariance([1,2,3],[2,4,6],1),2));
test('correlation perfect positive',()=>near(F.correlation([1,2,3],[2,4,6]),1));
test('correlation flat series is unavailable',()=>assert.equal(F.correlation([1,1,1],[2,3,4]),null));

// Returns / cash-flow math
test('simple return',()=>near(F.simpleReturn(100,125),.25));
test('log return',()=>near(F.logReturn(100,Math.E*100),1));
test('CAGR',()=>near(F.cagr(100,121,2),.1));
test('TWR chains subperiod returns',()=>near(F.timeWeightedReturn([.1,-.1]),-.01));
test('NPV known answer',()=>near(F.npv([-1000,1100],.1),0,1e-10));
test('IRR known answer',()=>near(F.irr([-1000,1100]),.1,1e-8));
test('IRR no sign change returns null',()=>assert.equal(F.irr([100,20,10]),null));
test('XIRR one-year known answer',()=>near(F.xirr([-1000,1100],['2025-01-01','2026-01-01']),.1,1e-8));

// Risk and drawdown
test('annualized volatility uses supplied frequency',()=>{const r=[-.01,.01,-.01,.01];near(F.annualizedVolatility(r,12),F.stdev(r,1)*Math.sqrt(12));});
test('constant return volatility is zero',()=>assert.equal(F.annualizedVolatility([0,0,0],252),0));
test('beta known identity',()=>near(F.beta([.01,.02,.03],[.02,.04,.06]),.5));
test('REG-DD-001 recovery targets prior peak, not trough',()=>{const d=F.maximumDrawdown([100,90,70,80,95,100]);assert.equal(d.peakI,0);assert.equal(d.troughI,2);assert.equal(d.recoveryI,5);assert.equal(d.recoveryPeriod,3);assert.equal(d.recovered,true);});
test('recoveryPeriod compatibility returns observations after trough',()=>assert.equal(F.recoveryPeriod([100,90,70,80,95,100],2),3));
test('immediate recovery is one observation',()=>assert.equal(F.recoveryPeriod([100,70,100],1),1));
test('unrecovered drawdown returns null recovery',()=>{const d=F.maximumDrawdown([100,90,70,80,95]);assert.equal(d.recovered,false);assert.equal(d.recoveryPeriod,null);assert.equal(F.recoveryPeriod([100,90,70,80,95],2),null);});
test('multiple drawdowns selects maximum drawdown episode',()=>{const d=F.maximumDrawdown([100,80,100,95,60,100]);assert.equal(d.peakI,2);assert.equal(d.troughI,4);assert.equal(d.recoveryI,5);near(d.mdd,-.4);});
test('one observation has zero drawdown',()=>{const d=F.maximumDrawdown([100]);assert.equal(d.mdd,0);assert.equal(d.recoveryPeriod,0);});
test('monotonic increasing has max drawdown zero',()=>assert.equal(F.maximumDrawdown([1,2,3,4]).mdd,0));
test('monotonic decreasing is unrecovered',()=>{const d=F.maximumDrawdown([4,3,2,1]);assert.equal(d.recovered,false);assert.equal(d.troughI,3);});
test('repeated equal peaks recover exactly at previous peak',()=>{const d=F.maximumDrawdown([100,100,80,100]);assert.equal(d.recoveryI,3);assert.equal(d.recoveryPeriod,1);});
test('trough at final observation is unrecovered',()=>assert.equal(F.maximumDrawdown([100,90,80]).recovered,false));
test('calendar recovery duration available when timestamps supplied',()=>{const d=F.maximumDrawdown([100,80,100],['2026-01-01','2026-01-03','2026-01-08']);assert.equal(d.recoveryCalendarDays,5);});

// Technical indicators
test('SMA explicit warm-up',()=>assert.deepEqual(F.sma([1,2,3,4],3),[null,null,2,3]));
test('EMA explicit warm-up starts with SMA seed',()=>{const e=F.ema([1,2,3,4],3);assert.deepEqual(e.slice(0,2),[null,null]);near(e[2],2);near(e[3],3);});
test('REG-MACD-001 histogram is populated and equals MACD minus signal',()=>{const a=Array.from({length:80},(_,i)=>100+i*.5+Math.sin(i/5));const r=F.macd(a,12,26,9);let count=0;r.hist.forEach((v,i)=>{if(v!=null){count++;near(v,r.macd[i]-r.signal[i],1e-12);}});assert.ok(count>0);});
test('MACD constant series converges to zero line/signal/histogram',()=>{const r=F.macd(Array(60).fill(100));r.hist.filter(v=>v!=null).forEach(v=>near(v,0,1e-12));});
test('MACD increasing series produces finite populated histogram',()=>{const r=F.macd(Array.from({length:70},(_,i)=>i+1));assert.ok(r.hist.some(Number.isFinite));});
test('MACD decreasing series produces finite populated histogram',()=>{const r=F.macd(Array.from({length:70},(_,i)=>100-i));assert.ok(r.hist.some(Number.isFinite));});
test('MACD short dataset keeps unavailable values null',()=>assert.ok(F.macd(Array.from({length:20},(_,i)=>i+1)).hist.every(v=>v==null)));
test('MACD custom periods work',()=>assert.ok(F.macd(Array.from({length:30},(_,i)=>i+1),3,7,4).hist.some(Number.isFinite)));
test('MACD rejects fast >= slow',()=>assert.throws(()=>F.macd([1,2,3,4],5,5,2),/fast < slow/));
test('MACD rejects nonfinite input',()=>assert.throws(()=>F.macd([1,2,NaN,4],2,3,2),/finite/));
test('REG-RSI-001 no-loss RSI is 100, not NaN/Infinity',()=>{const r=F.rsi(Array.from({length:30},(_,i)=>i+1),14);assert.equal(r.at(-1),100);});
test('RSI no-gain series is 0',()=>assert.equal(F.rsi(Array.from({length:30},(_,i)=>30-i),14).at(-1),0));
test('RSI flat series convention is 50',()=>assert.equal(F.rsi(Array(30).fill(100),14).at(-1),50));
test('RSI short dataset is unavailable',()=>assert.ok(F.rsi([1,2,3],14).every(v=>v==null)));

// Bonds
test('zero-coupon bond price known answer',()=>near(F.bondPrice(1000,0,.05,2,1),1000/1.05**2,1e-10));
test('annual par bond prices at par',()=>near(F.bondPrice(1000,50,.05,10,1),1000,1e-8));
test('semiannual par bond prices at par',()=>near(F.bondPrice(1000,50,.05,10,2),1000,1e-8));
test('quarterly par bond prices at par',()=>near(F.bondPrice(1000,50,.05,10,4),1000,1e-8));
test('premium bond when coupon exceeds yield',()=>assert.ok(F.bondPrice(1000,70,.05,10,2)>1000));
test('discount bond when coupon below yield',()=>assert.ok(F.bondPrice(1000,30,.05,10,2)<1000));
test('short maturity price finite',()=>assert.ok(Number.isFinite(F.bondPrice(1000,50,.06,.5,2))));
test('long maturity price finite',()=>assert.ok(Number.isFinite(F.bondPrice(1000,50,.06,50,2))));
test('near-zero yield price finite',()=>assert.ok(Number.isFinite(F.bondPrice(1000,50,1e-10,10,2))));
test('high positive yield price finite and lower',()=>assert.ok(F.bondPrice(1000,50,.5,10,2)<F.bondPrice(1000,50,.05,10,2)));
test('REG-BOND-001 semiannual modified duration matches independent reference',()=>{const mac=F.macaulayDuration(1000,50,2,10,.06);near(mac,7.894997340182341,1e-10);near(F.modifiedDuration(mac,.06,2),7.665045961342078,1e-10);});
test('annual modified duration uses annual denominator',()=>{const mac=F.macaulayDuration(1000,50,1,10,.06);near(F.modifiedDuration(mac,.06,1),mac/1.06);});
test('quarterly modified duration uses periodic denominator',()=>{const mac=F.macaulayDuration(1000,50,4,10,.06);near(F.modifiedDuration(mac,.06,4),mac/(1+.06/4));});
test('bond price decreases when yield rises',()=>assert.ok(F.bondPrice(1000,50,.07,10,2)<F.bondPrice(1000,50,.06,10,2)));
test('YTM solves back to original yield',()=>{const p=F.bondPrice(1000,50,.06,10,2);near(F.ytmFromPrice(p,1000,50,2,10),.06,1e-8);});
test('convexity positive for vanilla positive-cash-flow bond',()=>assert.ok(F.bondConvexity(1000,50,2,10,.06)>0));
test('DV01 positive for vanilla bond',()=>assert.ok(F.dv01(1000,50,.06,10,2)>0));
test('current yield',()=>near(F.currentYield(1000,50),.05));

// Valuation / cost of capital
test('CAPM known answer',()=>near(F.capm(.03,1.2,.055),.096));
test('WACC known answer',()=>{const r=F.wacc({equity:600,debt:400,costEquity:.1,costDebt:.05,taxRate:.25});near(r.value,.075);near(r.weights.equity,.6);});
test('WACC rejects zero total capital',()=>assert.match(F.wacc({equity:0,debt:0,costEquity:.1,costDebt:.05,taxRate:.2}).error,/Total capital/));
test('WACC rejects impossible tax rate',()=>assert.match(F.wacc({equity:1,debt:1,costEquity:.1,costDebt:.05,taxRate:1.5}).error,/Tax rate/));
const dcfBase={revenue0:1000,growth:.05,ebitdaMargin:.2,tax:.21,capexPct:.05,wcPct:.02,dandaPct:.04,wacc:.09,terminalGrowth:.025,netDebt:100,shares:100,horizon:5};
test('DCF FCFF known-answer cross-check against independent formula',()=>{const r=F.dcf(dcfBase);assert.equal(r.status,'valid');let rev=1000,pv=0,last;for(let t=1;t<=5;t++){rev*=1.05;const ebitda=rev*.2,da=rev*.04,ebit=ebitda-da,nopat=ebit*.79,fcff=nopat+da-rev*.05-rev*.02;pv+=fcff/1.09**t;last=fcff;}const tv=last*1.025/(.09-.025),ev=pv+tv/1.09**5,ps=(ev-100)/100;near(r.perShare,ps,1e-10);});
test('REG-DCF-001 g = WACC is rejected',()=>assert.equal(F.dcf({...dcfBase,terminalGrowth:.09}).status,'invalid'));
test('DCF g > WACC is rejected',()=>assert.equal(F.dcf({...dcfBase,terminalGrowth:.10}).status,'invalid'));
test('DCF g just below WACC is valid but cautioned',()=>{const r=F.dcf({...dcfBase,wacc:.08,terminalGrowth:.079});assert.equal(r.status,'valid');assert.ok(r.warnings.some(w=>w.code==='DCF-SENS-001'));});
test('DCF negative terminal growth can be valid',()=>assert.equal(F.dcf({...dcfBase,terminalGrowth:-.01}).status,'valid'));
test('DCF zero WACC rejected',()=>assert.equal(F.dcf({...dcfBase,wacc:0,terminalGrowth:-.01}).status,'invalid'));
test('DCF negative WACC rejected',()=>assert.equal(F.dcf({...dcfBase,wacc:-.01,terminalGrowth:-.02}).status,'invalid'));
test('DCF higher WACC lowers value',()=>assert.ok(F.dcf({...dcfBase,wacc:.10}).perShare<F.dcf({...dcfBase,wacc:.08}).perShare));
test('DCF higher terminal growth raises value when valid',()=>assert.ok(F.dcf({...dcfBase,terminalGrowth:.03}).perShare>F.dcf({...dcfBase,terminalGrowth:.02}).perShare));
test('DCF higher FCF driver raises value',()=>assert.ok(F.dcf({...dcfBase,ebitdaMargin:.25}).perShare>F.dcf({...dcfBase,ebitdaMargin:.20}).perShare));
test('DCF higher net debt lowers equity value',()=>assert.ok(F.dcf({...dcfBase,netDebt:200}).perShare<F.dcf({...dcfBase,netDebt:100}).perShare));
test('DCF higher share count lowers per-share value',()=>assert.ok(F.dcf({...dcfBase,shares:200}).perShare<F.dcf({...dcfBase,shares:100}).perShare));
test('Gordon DDM known answer',()=>near(F.gordonDDM(2,.03,.08),2*1.03/.05));
test('Gordon DDM invalid denominator blocked',()=>assert.equal(F.gordonDDM(2,.08,.08),null));
test('multi-stage DDM guards terminal denominator',()=>assert.match(F.multiStageDDM(1,[{years:5,growth:.05}],.08,.08).error,/exceed/));
test('DDM required return increase lowers value',()=>assert.ok(F.gordonDDM(2,.03,.09)<F.gordonDDM(2,.03,.08)));
test('DDM dividend increase raises value',()=>assert.ok(F.gordonDDM(3,.03,.08)>F.gordonDDM(2,.03,.08)));
test('Residual income begins with beginning book value charge',()=>{const r=F.residualIncome({bookValue0:100,roe:.12,costEquity:.10,horizon:2,terminalRoe:.10,payoutRatio:0,terminalGrowth:0});assert.equal(r.rows[0].beginningBV,100);near(r.rows[0].residualIncome,2);});
test('Comparables even peer median is averaged',()=>assert.equal(F.comparables(10,[4,6,8,10]).median,7));

// Portfolio and accounting
test('portfolio return weighted sum',()=>near(F.portfolioReturn([.6,.4],[.1,.05]),.08));
test('portfolio return rejects weights not summing to one',()=>assert.equal(F.portfolioReturn([.6,.3],[.1,.05]),null));
test('portfolio variance uses covariance matrix',()=>near(F.portfolioVariance([.5,.5],[[.04,.01],[.01,.09]]),.0375));
test('single-asset portfolio invariant',()=>near(F.portfolioVariance([1],[[.04]]),.04));
test('financial ratios preserve valid zero rather than missing',()=>{const r=F.financialRatios({revenue:0,cogs:0,ebitda:0,ebit:0,netIncome:0,cash:0,debt:0,assets:100,liabilities:0,equity:100,currentAssets:10,currentLiabilities:5,inventory:0,interestExpense:0,tax:.2});assert.equal(r.revenue,0);assert.equal(r.cash,0);assert.equal(r.debt,0);assert.equal(r.netIncome,0);});
test('financial ratio zero denominator is unavailable',()=>assert.equal(F.financialRatios({revenue:100,currentAssets:10,currentLiabilities:0}).currentRatio,null));
test('DuPont-compatible component ratios calculate normally',()=>{const r=F.financialRatios({revenue:100,netIncome:10,assets:50,equity:25,cogs:60,ebit:15,ebitda:20,cash:0,debt:25,currentAssets:20,currentLiabilities:10,inventory:5,interestExpense:5,tax:.2});near(r.netMargin,.1);near(r.assetTurnover,2);near(r.equityMultiplier,2);});

// CSV mapping / formatting
test('REG-CSV-001 Date at column index zero is preserved',()=>assert.equal(F.guessHeader(['Date','Close','Volume']).date,0));
test('CSV Date in middle maps correctly',()=>assert.equal(F.guessHeader(['Close','Date','Volume']).date,1));
test('CSV Date in last column maps correctly',()=>assert.equal(F.guessHeader(['Close','Volume','Date']).date,2));
test('CSV Close at column index zero is preserved',()=>assert.equal(F.guessHeader(['Close','Date','Volume']).close,0));
test('CSV Adjusted Close mapping',()=>{const m=F.guessHeader(['Date','Adjusted Close','Volume']);assert.equal(m.adjClose,1);assert.equal(m.close,1);});
test('REG-FMT-001 10,000 scales to 10K',()=>{const r=F.abbreviate(10000);assert.equal(r.scaled,10);assert.equal(r.suffix,'K');});
test('formatter transition 1,000',()=>assert.deepEqual(F.abbreviate(1000),{scaled:1,suffix:'K',scale:1000}));
test('formatter 125,000',()=>assert.equal(F.abbreviate(125000).scaled,125));
test('formatter 1.5M',()=>{const r=F.abbreviate(1500000);assert.equal(r.scaled,1.5);assert.equal(r.suffix,'M');});
test('formatter 2.75B',()=>{const r=F.abbreviate(2750000000);assert.equal(r.scaled,2.75);assert.equal(r.suffix,'B');});
test('formatter 1.2T',()=>{const r=F.abbreviate(1200000000000);assert.equal(r.scaled,1.2);assert.equal(r.suffix,'T');});
test('formatter negative thousands',()=>{const r=F.abbreviate(-10000);assert.equal(r.scaled,-10);assert.equal(r.suffix,'K');});
test('formatter zero and negative zero normalize',()=>{assert.equal(F.abbreviate(0).scaled,0);assert.equal(Object.is(F.abbreviate(-0).scaled,-0),false);});
test('formatter rejects NaN and Infinity',()=>{assert.equal(F.abbreviate(NaN),null);assert.equal(F.abbreviate(Infinity),null);});
