(function(){
  'use strict';
  const W=typeof WorkstationCalculationCore!=='undefined'?WorkstationCalculationCore:null;
  const L=typeof WorkstationLedgerCore!=='undefined'?WorkstationLedgerCore:null;
  if(!W){console.error('Financial certification runtime: WorkstationCalculationCore missing');return;}
  const installed=[];
  const mark=name=>installed.push(name);

  if(typeof SimilarityEngine!=='undefined'&&SimilarityEngine){
    SimilarityEngine.standardize=cases=>W.standardizeCases(cases,SimilarityEngine.FEATURES);
    SimilarityEngine.simScore=(query,candidate,stats,weights)=>W.similarityScore(query,candidate,stats,weights,SimilarityEngine.FEATURES);
    SimilarityEngine.normalizeWeights=weights=>W.normalizeWeightObject(weights);
    SimilarityEngine.match=(query,cases,weights,mode,k)=>{
      const useWeights=weights||SimilarityEngine.defaultWeights;
      const limit=Number.isInteger(k)&&k>0?k:10;
      const pool=mode==='strict'?(cases||[]).filter(c=>c&&query&&c.type===query.type):(cases||[]);
      const stats=W.standardizeCases(pool,SimilarityEngine.FEATURES);
      const scored=pool.map(c=>({case:c,sim:W.similarityScore(query,c,stats,useWeights,SimilarityEngine.FEATURES)})).sort((a,b)=>b.sim-a.sim);
      return {matches:scored.slice(0,limit),total:pool.length,stats,weights:useWeights};
    };
    SimilarityEngine.matchReference=(query,refCases,weights,k)=>{
      const useWeights=weights||SimilarityEngine.defaultWeights,limit=Number.isInteger(k)&&k>0?k:3,pool=refCases||[];
      const stats=W.standardizeCases(pool,SimilarityEngine.FEATURES);
      return pool.map(c=>({case:c,sim:W.similarityScore(query,c,stats,useWeights,SimilarityEngine.FEATURES)})).sort((a,b)=>b.sim-a.sim).slice(0,limit);
    };
    mark('SimilarityEngine');
  }
  if(typeof DataQualityEngine!=='undefined'&&DataQualityEngine){DataQualityEngine.score=ctx=>W.dataQualityScore(ctx);mark('DataQualityEngine.score');}
  if(typeof ScoringEngine!=='undefined'&&ScoringEngine){ScoringEngine.score=(metrics,weights)=>W.preferenceScore(metrics,weights||ScoringEngine.DEFAULT_W||W.DEFAULT_PREFERENCE_WEIGHTS);mark('ScoringEngine.score');}
  if(typeof PeerSimilarity!=='undefined'&&PeerSimilarity){PeerSimilarity.score=peers=>W.peerDataCoverage(peers);mark('PeerSimilarity.score');}

  if(typeof factorExposure==='function'){factorExposure=items=>W.factorExposure(items);mark('factorExposure');}
  if(typeof performanceAttribution==='function'){performanceAttribution=(items,benchmarkRet)=>W.performanceAttribution(items,benchmarkRet);mark('performanceAttribution');}
  if(typeof RiskContribution!=='undefined'&&RiskContribution){RiskContribution.compute=(port,corr)=>W.riskContribution(port,corr);mark('RiskContribution.compute');}
  if(typeof PortfolioOptimizers!=='undefined'&&PortfolioOptimizers){
    PortfolioOptimizers.equalWeight=items=>W.equalWeight(items);
    PortfolioOptimizers.minimumVariance=(items,corr)=>W.minimumVariance(items,corr);
    PortfolioOptimizers.maximumSharpe=(items,corr,rf)=>W.maximumSharpe(items,corr,rf==null?0:rf);
    PortfolioOptimizers.riskParity=(items,corr)=>W.riskParity(items,corr);
    mark('PortfolioOptimizers');
  }

  if(L){
    if(typeof wsDividendAmounts==='function'){wsDividendAmounts=tx=>L.dividendAmounts(tx);mark('wsDividendAmounts');}
    if(typeof wsCalculateFromLedger==='function'){
      wsCalculateFromLedger=(ws,_opts)=>L.calculateLedger(ws&&Array.isArray(ws.transactions)?ws.transactions:[],typeof wsBaseCurrency==='function'?wsBaseCurrency():'EUR');
      mark('wsCalculateFromLedger');
    }
    if(typeof wsFxConvert==='function'){
      wsFxConvert=(amount,currency)=>{const meta=typeof wsFxRateMeta==='function'?wsFxRateMeta(currency):null;return meta?L.positionBaseValue({quantity:amount},1,meta.rate):null;};
      mark('wsFxConvert');
    }
    if(typeof wsPositionBaseValue==='function'){
      wsPositionBaseValue=security=>{const ws=typeof wsPortfolio==='function'?wsPortfolio():null,p=ws&&ws.holdings?ws.holdings[security]:null;if(!p)return null;const pg=typeof wsGetPrice==='function'?wsGetPrice(security,ws):null;if(!pg)return null;const fx=typeof wsFxRate==='function'?wsFxRate(p.currency||(typeof wsBaseCurrency==='function'?wsBaseCurrency():'EUR')):null;return L.positionBaseValue(p,pg.price,fx);};
      mark('wsPositionBaseValue');
    }
    if(typeof wsMarketValue==='function'){
      wsMarketValue=()=>{const ws=typeof wsPortfolio==='function'?wsPortfolio():null,pos=ws&&ws.holdings?ws.holdings:{};const entries=Object.keys(pos).map(k=>{const p=pos[k],pg=typeof wsGetPrice==='function'?wsGetPrice(k,ws):null,meta=typeof wsFxRateMeta==='function'?wsFxRateMeta(p.currency||(typeof wsBaseCurrency==='function'?wsBaseCurrency():'EUR')):null;return {position:p,price:pg?pg.price:null,fxRate:meta?meta.rate:null};});return L.marketValueSummary(entries);};
      mark('wsMarketValue');
    }
    if(typeof wsCashSummary==='function'){
      wsCashSummary=()=>{const ws=typeof wsPortfolio==='function'?wsPortfolio():null;if(!ws)return null;const mv=typeof wsMarketValue==='function'?wsMarketValue():null;return L.cashSummary(ws.cashAccounts||{},ws.fxRates||{},typeof wsBaseCurrency==='function'?wsBaseCurrency():'EUR',mv&&Number.isFinite(mv.mv)?mv.mv:0);};
      mark('wsCashSummary');
    }
    if(typeof wsUnrealized==='function'){
      wsUnrealized=(security,price)=>{const ws=typeof wsPortfolio==='function'?wsPortfolio():null,p=ws&&ws.holdings?ws.holdings[security]:null;const r=L.positionUnrealized(p,price);return r?r.unrealizedPnl:null;};
      mark('wsUnrealized');
    }
  }

  if(typeof wsTWR==='function'){wsTWR=snapshots=>W.timeWeightedReturnFromSnapshots(snapshots);mark('wsTWR');}
  if(typeof wsMWR==='function'){wsMWR=snapshots=>W.moneyWeightedReturnFromSnapshots(snapshots);mark('wsMWR');}
  if(typeof wsAnnualized==='function'){wsAnnualized=(twr,days)=>W.annualizeReturn(twr,days);mark('wsAnnualized');}
  if(typeof wsCaptureRatios==='function'){wsCaptureRatios=(p,b,a)=>{const r=W.captureRatios(p,b,a);return r?{upside:r.upside,downside:r.downside,beta:r.beta,te:r.te,ir:r.ir,alpha:r.alpha,periods:r.n}:null;};mark('wsCaptureRatios');}
  if(typeof wsPerfRisk==='function'){wsPerfRisk=(returns,annualFactor)=>W.performanceRisk(returns,annualFactor,.02);mark('wsPerfRisk');}
  if(typeof wsPeriodReturns==='function'){wsPeriodReturns=snapshots=>W.periodReturnsFromSnapshots(snapshots);mark('wsPeriodReturns');}

  if(typeof App!=='undefined'&&App&&App.meta){
    App.meta.workstationCalculationCoreVersion=W.VERSION;
    if(L)App.meta.workstationLedgerCoreVersion=L.VERSION;
  }
  const prior=globalThis.__FINANCIAL_CERTIFICATION__||{};
  const priorInstalled=Array.isArray(prior.installed)?prior.installed:[];
  globalThis.__FINANCIAL_CERTIFICATION__=Object.freeze(Object.assign({},prior,{
    workstationVersion:W.VERSION,
    workstationLedgerVersion:L?L.VERSION:null,
    installed:priorInstalled.concat(installed),
    workstationInstalled:Object.freeze(installed.slice())
  }));
})();
