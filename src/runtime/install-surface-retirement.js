(function(){
  'use strict';
  const F=typeof SurfaceRetirementCore!=='undefined'?SurfaceRetirementCore:null;
  if(!F){console.error('Financial certification runtime: SurfaceRetirementCore missing');return;}
  const installed=[];const mark=x=>installed.push(x);

  if(typeof ScenarioEngine!=='undefined'&&ScenarioEngine){ScenarioEngine.run=(base,scenarios,price,netDebt,shares)=>F.scenarioRun(base,scenarios,price,netDebt,shares);mark('ScenarioEngine.run');}
  if(typeof Correlation!=='undefined'&&Correlation){Correlation.matrix=series=>F.correlationMatrix(series);mark('Correlation.matrix');}
  if(typeof DateAlign!=='undefined'&&DateAlign){DateAlign.align=(a,b)=>F.alignPriceSeries(a,b);DateAlign.betaAlphaAligned=(a,b,rf=0)=>F.betaAlphaAligned(a,b,rf);mark('DateAlign.align/betaAlphaAligned');}
  if(typeof RollingRisk!=='undefined'&&RollingRisk){RollingRisk.rollingVol=(r,w,a)=>F.rollingVol(r,w,a);RollingRisk.rollingBeta=(a,b,w)=>F.rollingBeta(a,b,w);RollingRisk.rollingSharpe=(r,w,rf=0)=>F.rollingSharpe(r,w,rf);RollingRisk.rollingDrawdown=c=>F.rollingDrawdown(c);mark('RollingRisk');}
  if(typeof BootstrapMC!=='undefined'&&BootstrapMC){BootstrapMC.run=cfg=>{cfg=cfg||{};const years=Object.prototype.hasOwnProperty.call(cfg,'horizonYears')?cfg.horizonYears:1,ppy=Object.prototype.hasOwnProperty.call(cfg,'stepsPerYear')?cfg.stepsPerYear:252;return F.historicalBootstrap({returns:cfg.returns,initial:cfg.initial,simulations:cfg.simulations,seed:cfg.seed,periods:Number.isFinite(years)&&Number.isFinite(ppy)?Math.max(1,Math.round(years*ppy)):NaN,target:cfg.target});};mark('BootstrapMC.run');}
  if(typeof WalkForward!=='undefined'&&WalkForward){WalkForward.run=cfg=>F.walkForwardRun(cfg);mark('WalkForward.run');}
  if(typeof creditRatios==='function'){creditRatios=sd=>F.creditRatios(sd);mark('creditRatios');}
  if(typeof PortfolioConstraints!=='undefined'&&PortfolioConstraints){PortfolioConstraints.check=(port,constraints)=>F.portfolioConstraintCheck(port,constraints);mark('PortfolioConstraints.check');}

  if(typeof ThesisConsistency!=='undefined'&&ThesisConsistency){ThesisConsistency.check=()=>{const s=typeof App!=='undefined'&&App?App.state:null;if(!s)return null;const val=s.results&&s.results.stock&&s.results.stock.valuation?s.results.stock.valuation.perShare:null;return F.thesisConsistency(s.thesis,s.stockData,val);};mark('ThesisConsistency.check');}
  if(typeof ThesisConsistencyV3!=='undefined'&&ThesisConsistencyV3){
    ThesisConsistencyV3.monitor=()=>{const a=typeof Model!=='undefined'&&Model&&typeof Model.assumptions==='function'?Model.assumptions():{};const r=typeof App!=='undefined'&&App&&App.state&&App.state.results?App.state.results.stock:null;return F.thesisMonitor(a,r&&r.financials,r&&r.defaultPD);};
    ThesisConsistencyV3.integrity=()=>F.thesisIntegrity(ThesisConsistencyV3.monitor().rows);
    mark('ThesisConsistencyV3.monitor/integrity');
  }
  if(typeof ValuationDispersion!=='undefined'&&ValuationDispersion){ValuationDispersion.compute=sd=>{const mx=typeof ValuationMatrixV2!=='undefined'?ValuationMatrixV2.build(sd):null;return F.valuationDispersion(mx&&Array.isArray(mx.methods)?mx.methods.map(m=>m&&m.value):[]);};mark('ValuationDispersion.compute');}
  if(typeof RobustnessV3!=='undefined'&&RobustnessV3){RobustnessV3.compute=sd=>{if(!sd||sd.price==null)return {score:50,reasons:['No price — robustness cannot be assessed.']};const a=typeof Model!=='undefined'&&Model&&typeof Model.assumptions==='function'?Model.assumptions():null;if(!a)return null;const base={revenue0:a.revenue!=null?a.revenue:sd.revenue,tax:a.tax,capexPct:a.capexPct,wcPct:a.wcPct,dandaPct:a.dandaPct,wacc:a.wacc,terminalGrowth:a.terminalGrowth,terminalMethod:'growth',exitMultiple:a.exitMultiple,netDebt:a.netDebt,shares:a.shares,horizon:a.horizon,growth:a.revenueGrowth,ebitdaMargin:a.ebitdaMargin};const tests=[{...base,wacc:a.wacc+.01},{...base,wacc:a.wacc-.01},{...base,growth:a.revenueGrowth+.05},{...base,growth:a.revenueGrowth-.05},{...base,ebitdaMargin:a.ebitdaMargin-.03},{...base,ebitdaMargin:a.ebitdaMargin+.03},{...base,terminalGrowth:a.terminalGrowth+.01},{...base,terminalGrowth:a.terminalGrowth-.01}];return F.valuationRobustness(base,tests);};mark('RobustnessV3.compute');}
  if(typeof ModelRiskEngine!=='undefined'&&ModelRiskEngine){ModelRiskEngine.compute=(sd,pr)=>{const dq=typeof DataQualityV2!=='undefined'&&DataQualityV2&&typeof DataQualityV2.compute==='function'?DataQualityV2.compute():null;const disp=typeof ValuationDispersion!=='undefined'?ValuationDispersion.compute(sd):null;const hist=typeof App!=='undefined'&&App&&App.state&&App.state.history&&Array.isArray(App.state.history.prices)?App.state.history.prices.length:null;return F.modelRiskScore({dataQuality:dq&&dq.overall,terminalShare:pr&&pr.dcf&&pr.dcf.terminalShare,dispersionLabel:disp&&disp.label,peerCount:sd&&Array.isArray(sd.peers)?sd.peers.length:null,historyLength:hist,mertonAvailable:!!(pr&&pr.pd!=null),hasMarketCap:!!(sd&&sd.marketCap),wacc:sd&&sd.wacc,terminalGrowth:sd&&sd.terminalGrowth,robustnessScore:pr&&pr.robustness&&pr.robustness.score});};mark('ModelRiskEngine.compute');}
  if(typeof ReconciliationDiag!=='undefined'&&ReconciliationDiag){ReconciliationDiag.compute=fm=>F.reconciliationDiagnostics(fm&&fm.result?fm.result:fm);mark('ReconciliationDiag.compute');}

  if(typeof App!=='undefined'&&App&&App.meta)App.meta.surfaceRetirementCoreVersion=F.VERSION;
  const prior=globalThis.__FINANCIAL_CERTIFICATION__||{},priorInstalled=Array.isArray(prior.installed)?prior.installed:[];
  globalThis.__FINANCIAL_CERTIFICATION__=Object.freeze(Object.assign({},prior,{surfaceRetirementVersion:F.VERSION,installed:priorInstalled.concat(installed),surfaceRetirementInstalled:Object.freeze(installed.slice())}));
})();