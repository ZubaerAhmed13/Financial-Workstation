(function(){
  'use strict';
  const Core = typeof FinanceCore !== 'undefined' ? FinanceCore : null;
  const ModelCore = typeof FinancialModelCore !== 'undefined' ? FinancialModelCore : null;
  if(!Core){ console.error('Financial certification runtime: FinanceCore missing'); return; }

  const installReport={version:Core.VERSION,modelVersion:ModelCore?ModelCore.VERSION:null,installed:[],warnings:[]};
  const mark=(name)=>installReport.installed.push(name);
  if(!ModelCore)installReport.warnings.push('FinancialModelCore missing; three-statement model is outside the expanded certification boundary.');

  if(typeof fmt!=='undefined' && fmt){
    fmt.big=(v)=>{
      const a=Core.abbreviate(v); if(!a) return '—';
      if(!a.suffix) return fmt.money(a.scaled,2);
      return fmt.money(a.scaled,2)+a.suffix;
    };
    mark('formatter.big');
  }

  if(typeof CalcEngine!=='undefined' && CalcEngine){
    CalcEngine.maxDrawdown=(prices)=>Core.maximumDrawdown(prices);
    CalcEngine.recoveryPeriod=(prices,troughIdx)=>Core.recoveryPeriod(prices,troughIdx);
    CalcEngine.rsi=(arr,per=14)=>Core.rsi(arr,per);
    CalcEngine.macd=(arr,fast=12,slow=26,signal=9)=>{
      const r=Core.macd(arr,fast,slow,signal); return {line:r.line,signal:r.signal,hist:r.hist};
    };
    CalcEngine.sma=(arr,per)=>Core.sma(arr,per);
    CalcEngine.ema=(arr,per)=>Core.ema(arr,per);
    mark('CalcEngine');
  }

  if(typeof CsvParser!=='undefined' && CsvParser){
    CsvParser.guessHeader=(rows)=>Core.guessHeader(rows[0]||rows);
    CsvParser.importPriceSeries=(text,mapping)=>{
      const rows=CsvParser.parse(text); if(rows.length<2)return {ok:false,msg:'Need at least a header and one data row.',map:null,series:[]};
      const map=mapping||Core.guessHeader(rows[0]); const series=[];let invalid=0,dup=0,missing=0;const errs=[],seen=new Set();
      for(let i=1;i<rows.length;i++){
        const r=rows[i]; const dateStr=map.date!=null?r[map.date]:null; const priceIndex=map.close!=null?map.close:map.adjClose; const closeStr=priceIndex!=null?r[priceIndex]:null; const volStr=map.volume!=null?r[map.volume]:null;
        if(closeStr==null||String(closeStr).trim()===''){invalid++;missing++;errs.push(`Row ${i+1}: no price.`);continue;}
        const close=Number(String(closeStr).replace(/[$,€£\s]/g,''));if(!Number.isFinite(close)||close<=0){invalid++;errs.push(`Row ${i+1}: invalid price "${closeStr}".`);continue;}
        let t=null;if(dateStr!=null&&String(dateStr).trim()!==''){const d=new Date(String(dateStr).trim());if(Number.isFinite(d.getTime()))t=d.getTime();else{invalid++;errs.push(`Row ${i+1}: invalid date "${dateStr}".`);continue;}}
        const key=t!=null?String(t):`row:${i}`;if(seen.has(key)){dup++;continue;}seen.add(key);
        const numAt=(idx)=>{if(idx==null)return null;const raw=r[idx];if(raw==null||String(raw).trim()==='')return null;const n=Number(String(raw).replace(/[$,€£\s]/g,''));return Number.isFinite(n)?n:null;};
        const volume=volStr==null||String(volStr).trim()===''?null:Number(String(volStr).replace(/[^0-9.\-]/g,''));
        series.push({date:t,open:numAt(map.open),high:numAt(map.high),low:numAt(map.low),close,volume:Number.isFinite(volume)?volume:null});
      }
      series.sort((a,b)=>(a.date??0)-(b.date??0));
      if(series.length<2)return {ok:false,msg:'Not enough valid rows (need ≥2).',map,series,invalid,dup,missing,errs:errs.slice(0,8)};
      return {ok:true,map,series,invalid,dup,missing,errs:errs.slice(0,8)};
    };
    mark('CsvParser');
  }

  if(typeof LoanEngine!=='undefined' && LoanEngine){
    LoanEngine.npv=(flows,rate)=>Core.npv(flows,rate);
    LoanEngine.irr=(flows,_guess=.1)=>Core.irr(flows);
    mark('LoanEngine.npv/irr');
  }

  if(typeof BondEngine!=='undefined' && BondEngine){
    BondEngine.modifiedDuration=(macDur,ytm_,freq=1)=>Core.modifiedDuration(macDur,ytm_,freq);
    BondEngine.priceSensitivity=(face,couponAnnual,freq,nYears,baseYtm,dy)=>{
      const p0=Core.bondPrice(face,couponAnnual,baseYtm,nYears,freq),p1=Core.bondPrice(face,couponAnnual,baseYtm+dy,nYears,freq);
      const mac=Core.macaulayDuration(face,couponAnnual,freq,nYears,baseYtm),mod=Core.modifiedDuration(mac,baseYtm,freq),conv=Core.bondConvexity(face,couponAnnual,freq,nYears,baseYtm);
      return {p0,p1,chg:p0?((p1-p0)/p0):null,approx:mod==null||conv==null?null:-mod*dy+0.5*conv*dy*dy};
    };
    BondEngine.dv01=(face,couponAnnual,freq,nYears,ytm_)=>Core.dv01(face,couponAnnual,ytm_,nYears,freq);
    mark('BondEngine.modifiedDuration/priceSensitivity/dv01');
  }

  if(typeof CapmWacc!=='undefined' && CapmWacc){
    CapmWacc.capm=(rf,beta_,erp)=>Core.capm(rf,beta_,erp);
    CapmWacc.wacc=(e,v,re,d,rd,tax)=>{
      if(![e,v,re,d,rd,tax].every(Number.isFinite)||v<=0||e<0||d<0||tax<0||tax>1)return null;
      const out=(e/v)*re+(d/v)*rd*(1-tax); return Number.isFinite(out)?out:null;
    };
    mark('CapmWacc');
  }

  if(typeof ValuationEngine!=='undefined' && ValuationEngine){
    ValuationEngine.dcf=(opts)=>Core.dcf(opts);
    ValuationEngine.gordonDDM=(d,g,k)=>Core.gordonDDM(d,g,k);
    ValuationEngine.multiStageDDM=(d,stages,g,k)=>Core.multiStageDDM(d,stages,g,k);
    ValuationEngine.residualIncome=(bookValue0,roe,costEquity,horizon,terminalRoe)=>{
      const r=Core.residualIncome({bookValue0,roe,costEquity,horizon,terminalRoe,payoutRatio:0,terminalGrowth:0});
      if(r.error)return {error:r.error,value:null,rows:[]};
      return {value:r.value,bookValue0,pvRI:r.pvRI,tvRI:r.continuingValue,pvTV:r.pvContinuing,rows:r.rows.map(x=>({t:x.t,income:x.netIncome,charge:x.equityCharge,ri:x.residualIncome,pvRI:x.pvRI,bv:x.endingBV}))};
    };
    ValuationEngine.comparables=(companyMultiple,peers)=>Core.comparables(companyMultiple,peers);
    mark('ValuationEngine');
  }

  if(typeof FinancialRatios!=='undefined' && FinancialRatios){
    FinancialRatios.compute=(f)=>Core.financialRatios(f||{});
    FinancialRatios.dupont=(r)=>({netMargin:r.netMargin,assetTurnover:r.assetTurnover,equityMultiplier:r.equityMultiplier,roe:r.netMargin!=null&&r.assetTurnover!=null&&r.equityMultiplier!=null?r.netMargin*r.assetTurnover*r.equityMultiplier:null});
    mark('FinancialRatios');
  }

  if(ModelCore && typeof FinancialModelEngine!=='undefined' && FinancialModelEngine){
    FinancialModelEngine.defaults=()=>{
      const currency=(typeof App!=='undefined'&&App&&App.state&&App.state.settings&&App.state.settings.currency)||'EUR';
      return ModelCore.defaults(currency);
    };
    FinancialModelEngine.fillDefaults=(m,sd)=>ModelCore.fillDefaults(m,sd||{});
    FinancialModelEngine.build=(m,sd)=>{
      const out=ModelCore.build(m,sd||{});
      if(Array.isArray(out.covenants) && typeof fmt!=='undefined')out.covenants=out.covenants.map(c=>({...c,fmt:c.format==='ratio'?fmt.x:fmt.money}));
      return out;
    };
    mark('FinancialModelEngine.build/fillDefaults/defaults');
  }

  if(typeof XIRR!=='undefined' && XIRR){
    XIRR.xnpv=(rate,cashflows,dates)=>Core.xnpv(rate,cashflows,dates);
    XIRR.xirr=(cashflows,dates,_guess=.1)=>Core.xirr(cashflows,dates);
    XIRR.xirrHTML=(cashflows,dates)=>{
      const r=Core.xirr(cashflows,dates);
      if(r==null)return '<div class="banner warn">XIRR could not be determined — the irregular cash-flow pattern may have no unique root.</div>';
      return `<div class="card"><div class="card-title">XIRR (irregular-period IRR)</div><div class="grid g2">${kpi('XIRR',fmt.pct(r,2),'annualized, irregular dates')}</div><div class="formula">Solve Σ CF_i/(1+XIRR)^((date_i−date_0)/365) = 0</div><div class="banner info">XIRR handles cash flows that arrive at irregular dates by discounting each to its actual year-fraction. It annualizes the return correctly for non-annual periods.</div></div>`;
    };
    mark('XIRR');
  }

  if(typeof ECLV2!=='undefined' && ECLV2){
    ECLV2.compute=(pd,recovery,ead)=>{
      if(![pd,recovery,ead].every(Core.isFiniteNumber)||pd<0||pd>1||recovery<0||recovery>1||ead<0)return {pd,recovery,ead,lgd:null,el:null,error:'ECL requires finite PD/recovery in [0,1] and non-negative EAD.'};
      const lgd=1-recovery;return {pd,recovery,ead,lgd,el:Math.round(pd*lgd*ead*100)/100};
    };
    ECLV2.eadDefault=(face,exposureType)=>exposureType==='bond'?(Core.isFiniteNumber(face)?face:null):(Core.isFiniteNumber(face)?face:1000000);
    mark('ECLV2');
  }

  if(typeof FINANCE!=='undefined' && FINANCE){
    if(typeof FINANCE.median==='function')FINANCE.median=(a)=>Core.median(a);
    if(typeof FINANCE.calcRecoveryPeriod==='function')FINANCE.calcRecoveryPeriod=(a)=>{const d=Core.maximumDrawdown(a);return d.recoveryPeriod;};
    if(typeof FINANCE.macd==='function')FINANCE.macd=(arr,fast=12,slow=26,signal=9)=>{const r=Core.macd(arr,fast,slow,signal);return {macd:r.macd,signal:r.signal,hist:r.hist};};
    if(typeof FINANCE.rsiArr==='function')FINANCE.rsiArr=(arr,p=14)=>Core.rsi(arr,p);
    if(typeof FINANCE.modifiedDuration==='function')FINANCE.modifiedDuration=(face,couponRate,ytm,years,freq=2)=>{const mac=FINANCE.macaulayDuration(face,couponRate,ytm,years,freq);return Core.modifiedDuration(mac,ytm,freq);};
    mark('FINANCE compatibility layer');
  }

  if(typeof App!=='undefined' && App && App.meta){
    App.meta.financialCertificationVersion=Core.VERSION;
    if(ModelCore)App.meta.financialModelEngineVersion=ModelCore.VERSION;
    App.meta.bondEngineVersion='1.1.0';
    App.meta.dcfEngineVersion='1.1.0';
    App.meta.riskEngineVersion='1.1.0';
  }

  globalThis.__FINANCIAL_CERTIFICATION__=Object.freeze(installReport);
})();