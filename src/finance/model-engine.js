(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.FinancialModelCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='1.0.0';
  const EPS=1e-12;
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const pick=(v,fallback)=>finite(v)?v:fallback;
  const ratio=(a,b)=>finite(a)&&finite(b)&&Math.abs(b)>EPS?a/b:null;
  const clone=v=>JSON.parse(JSON.stringify(v==null?{}:v));

  function defaults(currency='EUR'){
    return {
      name:'',currency,years:5,startYear:new Date().getFullYear()+1,
      growth:[],margin:[],tax:[],capexPct:[],daPct:[],dso:[],dio:[],dpo:[],ocaPct:[],oclPct:[],sgaPct:[],rndPct:[],cogsPct:[],
      bs0:{cash:0,ar:0,inventory:0,oca:0,ppne:0,otherAssets:0,ap:0,debt:0,ocl:0,otherLiab:0,equity:0,revenue:0,cogs:0,ebitda:0,da:0,ebit:0,ni:0,interestExp:0},
      debt:{rows:[]},covenants:{}
    };
  }
  function fillSeries(target,key,n,fallback){
    const a=Array.isArray(target[key])?target[key]:[];
    for(let i=0;i<n;i++)if(!finite(a[i]))a[i]=fallback;
    target[key]=a.slice(0,n);
  }
  function fillDefaults(model,stockData={}){
    const m=model&&typeof model==='object'?model:{};const sd=stockData||{};
    if(!Number.isInteger(m.years)||m.years<=0||m.years>100)m.years=5;
    if(!Number.isInteger(m.startYear))m.startYear=new Date().getFullYear()+1;
    fillSeries(m,'growth',m.years,pick(sd.growth,.10));
    fillSeries(m,'margin',m.years,pick(sd.ebitdaMargin,.20));
    fillSeries(m,'tax',m.years,pick(sd.tax,.21));
    fillSeries(m,'capexPct',m.years,pick(sd.capexPct,.06));
    fillSeries(m,'daPct',m.years,pick(sd.dandaPct,.05));
    fillSeries(m,'dso',m.years,45);fillSeries(m,'dio',m.years,45);fillSeries(m,'dpo',m.years,40);
    fillSeries(m,'ocaPct',m.years,.05);fillSeries(m,'oclPct',m.years,.06);
    // 65% COGS + 12% SG&A + 3% R&D = 20% EBITDA margin, matching the default margin target.
    fillSeries(m,'cogsPct',m.years,.65);fillSeries(m,'sgaPct',m.years,.12);fillSeries(m,'rndPct',m.years,.03);
    m.bs0=m.bs0&&typeof m.bs0==='object'?m.bs0:{};
    m.debt=m.debt&&typeof m.debt==='object'?m.debt:{rows:[]};
    m.debt.rows=Array.isArray(m.debt.rows)?m.debt.rows:[];
    m.covenants=m.covenants&&typeof m.covenants==='object'?m.covenants:{};
    return m;
  }
  function normalize(model,stockData={}){return fillDefaults(clone(model),stockData);}

  function debtSchedule(model,fallbackOpeningDebt=0){
    const rows=model&&model.debt&&Array.isArray(model.debt.rows)?model.debt.rows:[];
    if(!rows.length)return null;
    const instruments=rows.map((r,i)=>({
      name:r&&r.name!=null?String(r.name):`Debt ${i+1}`,
      opening:Math.max(0,pick(r&&r.opening,0)),
      rate:pick(r&&r.rate,.05),
      annualRepayment:Math.max(0,pick(r&&r.repayment,0)),
      annualAmort:Math.max(0,pick(r&&r.amort,0))
    }));
    if(instruments.length===1&&instruments[0].opening===0&&finite(fallbackOpeningDebt)&&fallbackOpeningDebt>0)instruments[0].opening=fallbackOpeningDebt;
    const balances=instruments.map(x=>x.opening);const out=[];
    for(let i=0;i<model.years;i++){
      let opening=0,interest=0,repayment=0,ending=0;const detail=[];
      for(let j=0;j<instruments.length;j++){
        const inst=instruments[j];const op=balances[j];const int=op*inst.rate;const requested=inst.annualRepayment+inst.annualAmort;const paid=Math.min(op,requested);const end=Math.max(0,op-paid);
        opening+=op;interest+=int;repayment+=paid;ending+=end;balances[j]=end;
        detail.push({name:inst.name,opening:op,rate:inst.rate,interest:int,repayment:paid,ending:end});
      }
      out.push({y:model.startYear+i,opening,rate:ratio(interest,opening),interest,repayment,ending,instruments:detail});
    }
    return out;
  }

  function build(model,stockData={}){
    const sd=stockData||{};const m=normalize(model,sd);const n=m.years;const b0=m.bs0;
    const revenue0=finite(b0.revenue)?b0.revenue:(finite(sd.revenue)?sd.revenue:100);
    const warnings=[];
    const opening={
      cash:pick(b0.cash,0),ar:pick(b0.ar,0),inventory:pick(b0.inventory,0),oca:pick(b0.oca,0),ppne:pick(b0.ppne,0),otherAssets:pick(b0.otherAssets,0),
      ap:pick(b0.ap,0),debt:pick(b0.debt,0),ocl:pick(b0.ocl,0),otherLiab:pick(b0.otherLiab,0),equity:pick(b0.equity,0)
    };
    const schedule=debtSchedule(m,opening.debt);if(schedule)opening.debt=schedule[0].opening;
    const openingAssets=opening.cash+opening.ar+opening.inventory+opening.oca+opening.ppne+opening.otherAssets;
    const openingLiabEq=opening.ap+opening.debt+opening.ocl+opening.otherLiab+opening.equity;
    const openingDiff=openingAssets-openingLiabEq;
    const out={status:'valid',warnings,years:[],income:[],balance:[],cash:[],wc:[],revs:[],check:null,meta:m,debtSchedule:schedule,opening:{...opening,assets:openingAssets,liabEquity:openingLiabEq,diff:openingDiff}};
    let prevRevenue=revenue0,prevCash=opening.cash,prevPPNE=opening.ppne,prevEquity=opening.equity,prevDebt=opening.debt;
    let prevNWC=opening.ar+opening.inventory+opening.oca-opening.ap-opening.ocl;
    for(let i=0;i<n;i++){
      const y=m.startYear+i;const g=m.growth[i];
      if(g<=-1)warnings.push({severity:'ERROR',code:'FM-GROWTH-001',year:y,message:'Growth at or below -100% is not economically valid; revenue is floored at zero.'});
      const revenue=Math.max(0,prevRevenue*(1+g));
      const cogs=revenue*m.cogsPct[i];const gross=revenue-cogs;const sga=revenue*m.sgaPct[i];const rnd=revenue*m.rndPct[i];const opex=sga+rnd;
      const ebitda=gross-opex;const mar=ratio(ebitda,revenue);const marginTarget=m.margin[i];const marginVariance=mar==null?null:mar-marginTarget;
      if(marginVariance!=null&&Math.abs(marginVariance)>.005)warnings.push({severity:'CAUTION',code:'FM-MARGIN-001',year:y,message:`Detailed cost assumptions imply EBITDA margin ${(mar*100).toFixed(2)}%, versus target ${(marginTarget*100).toFixed(2)}%.`});
      const danda=revenue*m.daPct[i];const ebit=ebitda-danda;
      const debtRow=schedule?schedule[i]:null;const openingDebt=debtRow?debtRow.opening:prevDebt;const interest=debtRow?debtRow.interest:openingDebt*.05;
      const ebt=ebit-interest;const taxes=ebt*m.tax[i];const ni=ebt-taxes;
      const arEnd=revenue/365*m.dso[i];const invEnd=cogs/365*m.dio[i];const apEnd=cogs/365*m.dpo[i];
      const ocaEnd=revenue*m.ocaPct[i];const oclEnd=revenue*m.oclPct[i];const nwc=arEnd+invEnd+ocaEnd-apEnd-oclEnd;const deltaNWC=nwc-prevNWC;
      const capex=revenue*m.capexPct[i];const ppneEnd=prevPPNE+capex-danda;
      const endingDebt=debtRow?debtRow.ending:openingDebt;const debtDelta=endingDebt-openingDebt;
      const freeCashFlow=ni+danda-capex-deltaNWC;const netChange=freeCashFlow+debtDelta;const cash=prevCash+netChange;const equity=prevEquity+ni;
      const nonCashAssets=arEnd+invEnd+ocaEnd+ppneEnd+opening.otherAssets;const assets=nonCashAssets+cash;const liabEquity=apEnd+endingDebt+oclEnd+opening.otherLiab+equity;
      out.years.push(y);out.revs.push(revenue);
      out.income.push({y,revenue,cogs,gross,sga,rnd,opex,ebitda,danda,ebit,interest,ebt,taxes,ni,g,mar,marginTarget,marginVariance,cogsPct:m.cogsPct[i],sgaPct:m.sgaPct[i],rndPct:m.rndPct[i]});
      out.wc.push({y,ar:arEnd,inv:invEnd,oca:ocaEnd,ap:apEnd,ocl:oclEnd,nwc,deltaNWC});
      out.balance.push({y,cash,ar:arEnd,inv:invEnd,oca:ocaEnd,ppne:ppneEnd,otherAssets:opening.otherAssets,ap:apEnd,debt:endingDebt,ocl:oclEnd,otherLiab:opening.otherLiab,equity,assets,liabEquity});
      out.cash.push({y,ni,danda,capex,deltaNWC,debtDelta,freeCashFlow,netChange,cash,ties:Math.abs((assets-liabEquity)-openingDiff)<0.01});
      prevRevenue=revenue;prevCash=cash;prevPPNE=ppneEnd;prevEquity=equity;prevDebt=endingDebt;prevNWC=nwc;
    }
    const last=out.balance[out.balance.length-1];const diff=last.assets-last.liabEquity;
    out.check={diff,openingDiff,ok:Math.abs(diff)<0.01,carriesOpeningDifference:Math.abs(diff-openingDiff)<0.01,assets:last.assets,liabEquity:last.liabEquity,cashFlowTies:out.cash.every(c=>c.ties===true)};
    out.covenants=computeCovenants(out,m);
    return out;
  }

  function computeCovenants(out,m){
    const c=m&&m.covenants?m.covenants:{};const cov=[];const income=out.income.at(-1);const balance=out.balance.at(-1);if(!income||!balance)return cov;
    const currentLiabilities=balance.ap+balance.ocl;const currentAssets=balance.cash+balance.ar+balance.inv;const currentRatio=ratio(currentAssets,currentLiabilities);
    if(finite(c.debtEbitda)&&finite(balance.debt)&&finite(income.ebitda)&&Math.abs(income.ebitda)>EPS){const v=balance.debt/income.ebitda;const head=c.debtEbitda-v;cov.push({name:'Debt/EBITDA',value:v,limit:c.debtEbitda,headroom:head,status:v<=c.debtEbitda?(head<0.5?'warn':'ok'):'breach',format:'ratio'});}
    if(finite(c.ic)&&finite(income.interest)&&income.interest>EPS){const v=income.ebit/income.interest;const head=v-c.ic;cov.push({name:'Interest coverage',value:v,limit:c.ic,headroom:head,status:v>=c.ic?(head<0.5?'warn':'ok'):'breach',format:'ratio'});}
    if(finite(c.currentRatio)&&currentRatio!=null){const head=currentRatio-c.currentRatio;cov.push({name:'Current ratio',value:currentRatio,limit:c.currentRatio,headroom:head,status:currentRatio>=c.currentRatio?(head<0.2?'warn':'ok'):'breach',format:'ratio'});}
    if(finite(c.minCash)){const v=out.cash.at(-1).cash;const head=v-c.minCash;cov.push({name:'Minimum cash',value:v,limit:c.minCash,headroom:head,status:v>=c.minCash?(head<Math.abs(c.minCash)*.2?'warn':'ok'):'breach',format:'money'});}
    return cov;
  }

  return {VERSION,defaults,fillDefaults,normalize,debtSchedule,build,computeCovenants};
});