(function(root, factory){
  const core = (typeof module === 'object' && module.exports) ? require('./engine.js') : root.FinanceCore;
  const api = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LegacyCalculationCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(Core){
  'use strict';

  const VERSION='1.0.0';
  const EPS=1e-12;
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const has=(o,k)=>o!=null&&Object.prototype.hasOwnProperty.call(o,k)&&o[k]!=null;
  const pick=(o,k,fallback)=>has(o,k)?o[k]:fallback;

  function normalizeStressInputs(sd){
    if(!sd||typeof sd!=='object')return null;
    const revenue0=has(sd,'revenue0')?sd.revenue0:sd.revenue;
    const base={
      revenue0,
      tax:pick(sd,'tax',.21),
      capexPct:pick(sd,'capexPct',.06),
      wcPct:pick(sd,'wcPct',.02),
      dandaPct:pick(sd,'dandaPct',.05),
      wacc:pick(sd,'wacc',.09),
      terminalGrowth:pick(sd,'terminalGrowth',.025),
      netDebt:has(sd,'netDebt')?sd.netDebt:((finite(sd.debt)?sd.debt:0)-(finite(sd.cash)?sd.cash:0)),
      shares:pick(sd,'shares',1),
      horizon:pick(sd,'horizon',5),
      growth:pick(sd,'growth',.10),
      ebitdaMargin:pick(sd,'ebitdaMargin',.20)
    };
    if(!finite(base.revenue0)||base.revenue0<0)return null;
    for(const k of ['tax','capexPct','wcPct','dandaPct','wacc','terminalGrowth','netDebt','shares','growth','ebitdaMargin']){
      if(!finite(base[k]))return null;
    }
    if(base.tax<0||base.tax>1||base.shares<=0||!Number.isInteger(base.horizon)||base.horizon<=0||base.horizon>200)return null;
    return base;
  }

  function stressRun(sd,scenarios,options={}){
    if(!Core||typeof Core.dcf!=='function')return null;
    const base=normalizeStressInputs(sd);
    if(!base)return null;
    const baseVal=Core.dcf(base);
    const defaultPD=has(options,'defaultPD')?options.defaultPD:.05;
    if(!finite(defaultPD)||defaultPD<0||defaultPD>1)return null;
    const list=Array.isArray(scenarios)&&scenarios.length?scenarios:[];
    const out=list.map((sc,i)=>{
      sc=sc||{};
      const rev=pick(sc,'rev',0),margin=pick(sc,'margin',0),wacc=pick(sc,'wacc',0),pdMult=pick(sc,'pdMult',1);
      if(![rev,margin,wacc,pdMult].every(finite)||pdMult<0){
        return {name:sc.name||`Scenario ${i+1}`,desc:sc.desc||'',value:null,downside:null,pd:null,baseVal:baseVal&&finite(baseVal.perShare)?baseVal.perShare:null,error:'Invalid stress scenario inputs.'};
      }
      const g=Math.max(-.99,base.growth+rev);
      const m=base.ebitdaMargin+margin;
      const w=base.wacc+wacc;
      const dcf=Core.dcf({...base,growth:g,ebitdaMargin:m,wacc:w});
      const val=dcf&&finite(dcf.perShare)?dcf.perShare:null;
      const basePerShare=baseVal&&finite(baseVal.perShare)?baseVal.perShare:null;
      const downside=val!=null&&basePerShare!=null&&Math.abs(basePerShare)>EPS?val/basePerShare-1:null;
      const pd=Math.min(1,defaultPD*pdMult);
      return {name:sc.name||`Scenario ${i+1}`,desc:sc.desc||'',value:val,downside,pd,baseVal:basePerShare,error:dcf&&dcf.error?dcf.error:null};
    });
    return {baseVal:baseVal&&finite(baseVal.perShare)?baseVal.perShare:null,out,base};
  }

  function portfolioBuild(items,options={}){
    if(!Array.isArray(items)||!items.length)return null;
    const rho=has(options,'correlation')?options.correlation:.4;
    const rf=has(options,'riskFreeRate')?options.riskFreeRate:.03;
    if(!finite(rho)||rho<-1||rho>1||!finite(rf))return null;
    const clean=[];
    for(const item of items){
      if(!item||!finite(item.weight)||item.weight<0||!finite(item.expectedReturn)||!finite(item.volatility)||item.volatility<0)return null;
      clean.push({...item});
    }
    const totalWeight=clean.reduce((s,x)=>s+x.weight,0);
    if(!finite(totalWeight)||totalWeight<=EPS)return null;
    const weights=clean.map(x=>x.weight/totalWeight);
    const expRet=clean.reduce((s,x,i)=>s+weights[i]*x.expectedReturn,0);
    let variance=0;
    for(let i=0;i<clean.length;i++){
      variance+=weights[i]*weights[i]*clean[i].volatility*clean[i].volatility;
      for(let j=i+1;j<clean.length;j++){
        variance+=2*rho*weights[i]*weights[j]*clean[i].volatility*clean[j].volatility;
      }
    }
    if(variance<0&&variance>-EPS)variance=0;
    if(!finite(variance)||variance<0)return null;
    const vol=Math.sqrt(variance);
    const sharpe=vol>EPS?(expRet-rf)/vol:null;
    const hhi=weights.reduce((s,w)=>s+w*w,0);
    const maxW=Math.max(...weights);
    const concentration=hhi>=.5?'High':hhi>.25?'Moderate':'Diversified';
    const byClass={},bySector={},byCountry={},byCurr={};
    const add=(obj,key,w)=>obj[key]=(obj[key]||0)+w;
    clean.forEach((x,i)=>{
      const w=weights[i];
      add(byClass,x.assetClass||'Other',w);
      add(bySector,x.sector||'Other',w);
      add(byCountry,x.country||'—',w);
      add(byCurr,x.currency||'—',w);
    });
    return {expRet,vol,sharpe,hhi,concentration,maxW,byClass,bySector,byCountry,byCurr,items:clean,totalWeight,correlation:rho,riskFreeRate:rf};
  }

  function portfolioStress(port,scenario={}){
    if(!port||!Array.isArray(port.items)||!port.items.length)return null;
    const totalWeight=port.items.reduce((s,x)=>s+(finite(x.weight)?x.weight:NaN),0);
    if(!finite(totalWeight)||totalWeight<=EPS)return null;
    const eq=pick(scenario,'eq',0),earnings=pick(scenario,'earnings',0),rate=pick(scenario,'rate',0),bondSpread=pick(scenario,'bondSpread',0);
    if(![eq,earnings,rate,bondSpread].every(finite))return null;
    let totalImpact=0;
    const details=[];
    for(const item of port.items){
      if(!item||!finite(item.weight)||item.weight<0||!finite(item.volatility)||item.volatility<0)return null;
      const w=item.weight/totalWeight;
      let shock=0;
      const cls=String(item.assetClass||'').toLowerCase();
      if(cls.includes('equity')||cls.includes('stock')){
        shock+=eq+earnings*.3;
      }else if(cls.includes('bond')||cls.includes('fixed')){
        shock-=rate*item.volatility;
        shock-=bondSpread*item.volatility;
      }else if(cls.includes('cash')){
        shock+=0;
      }else{
        shock+=eq*.5;
      }
      const impact=w*shock;
      totalImpact+=impact;
      details.push({name:item.name,w,shock,impact});
    }
    return {totalImpact,details};
  }

  function valuationMatrix(sd,result){
    if(!sd||!finite(sd.price)||sd.price<=0)return null;
    const r=result||{};
    const methods=[];
    const price=sd.price;

    if(r.valuation&&finite(r.valuation.perShare)){
      const value=r.valuation.perShare;
      methods.push({method:'DCF',value,upside:value/price-1,confidence:r.dataQuality&&finite(r.dataQuality.score)?r.dataQuality.score/100:.7,risk:'Sensitive to WACC & terminal growth',appl:'High',src:'cash-flow forecast available'});
    }

    if(finite(r.ddm)){
      methods.push({method:'DDM',value:r.ddm,upside:r.ddm/price-1,confidence:.6,risk:'Depends on dividend growth & required return',appl:finite(sd.dividend)&&sd.dividend>0?'High':'Low',src:finite(sd.dividend)&&sd.dividend>0?'dividend data available':'company does not distribute meaningful dividends'});
    }else{
      methods.push({method:'DDM',value:null,upside:null,confidence:null,risk:'Dividend assumptions missing',appl:'Low',src:'no dividend data'});
    }

    if(r.comps){
      const implied=r.comps.impliedMean;
      const peers=Array.isArray(r.comps.peers)?r.comps.peers:[];
      const value=finite(implied)&&implied>EPS?price/implied:null;
      methods.push({method:'Comparable',value,upside:value!=null?value/price-1:null,confidence:peers.length>=4?.6:.4,risk:'Peer comparability',appl:'Moderate',src:`${peers.length} peers`});
    }

    const shares=sd.shares;
    if(Core&&typeof Core.residualIncome==='function'&&finite(sd.equity)&&sd.equity>0&&finite(sd.netIncome)&&finite(shares)&&shares>0&&finite(r.costEquity)&&r.costEquity>0){
      const roe=sd.netIncome/sd.equity;
      const ri=Core.residualIncome({bookValue0:sd.equity,roe,costEquity:r.costEquity,horizon:5,terminalRoe:.10,payoutRatio:0,terminalGrowth:0});
      if(ri&&!ri.error&&finite(ri.value)){
        const value=ri.value/shares;
        methods.push({method:'Residual Income',value,upside:value/price-1,confidence:.5,risk:'Clean-surplus assumptions',appl:'Moderate',src:'book value, ROE & diluted shares'});
      }
    }

    const vals=methods.filter(m=>finite(m.value)).map(m=>m.value);
    return {methods,low:vals.length?Math.min(...vals):null,high:vals.length?Math.max(...vals):null,base:vals.length?vals.reduce((s,v)=>s+v,0)/vals.length:null,current:price};
  }

  function valuationDrivers(sd){
    if(!Core||typeof Core.dcf!=='function'||!sd||typeof sd!=='object')return null;
    const base=normalizeStressInputs(sd);
    if(!base)return null;
    const baseDCF=Core.dcf(base);
    if(!baseDCF||!finite(baseDCF.perShare)||Math.abs(baseDCF.perShare)<=EPS)return null;
    const defs=[
      ['WACC','wacc',.01],
      ['Revenue growth','growth',.05],
      ['EBITDA margin','ebitdaMargin',.03],
      ['Terminal growth','terminalGrowth',.01],
      ['CapEx','capexPct',.02]
    ];
    const rows=[];
    for(const [label,key,delta] of defs){
      const low=Core.dcf({...base,[key]:base[key]-delta});
      const high=Core.dcf({...base,[key]:base[key]+delta});
      if(!low||!high||!finite(low.perShare)||!finite(high.perShare))continue;
      rows.push({label,impact:Math.abs(high.perShare-low.perShare)/Math.abs(baseDCF.perShare)});
    }
    rows.sort((a,b)=>b.impact-a.impact);
    return rows;
  }

  return {VERSION,normalizeStressInputs,stressRun,portfolioBuild,portfolioStress,valuationMatrix,valuationDrivers};
});