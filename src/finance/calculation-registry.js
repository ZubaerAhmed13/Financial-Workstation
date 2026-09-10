(function(root,factory){
  let manifest=null;if(typeof module==='object'&&module.exports)manifest=require('../runtime/production-routing-manifest.js');else manifest=root.ProductionRoutingManifest;
  const api=factory(manifest);if(typeof module==='object'&&module.exports)module.exports=api;root.CalculationRegistry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(manifest){
'use strict';
const VERSION='1.0.0';
const STATUSES=Object.freeze(['CERTIFIED_ROUTE','CERTIFIED_CORE_DELEGATION','CERTIFIED_COMPOSITION','PRESENTATION_ONLY','RETIRED_SHADOWED','RETIRED_UNREACHABLE','REQUIRES_MIGRATION']);
const cores=Object.freeze([
  {name:'FinanceCore',version:'1.1.0',path:'src/finance/engine.js'},
  {name:'FinancialModelCore',version:'1.0.0',path:'src/finance/model-engine.js'},
  {name:'LegacyCalculationCore',version:'1.0.0',path:'src/finance/legacy-hardening.js'},
  {name:'RiskCreditCore',version:'1.0.0',path:'src/finance/risk-credit-core.js'},
  {name:'WorkstationCalculationCore',version:'1.0.0',path:'src/finance/workstation-core.js'},
  {name:'WorkstationLedgerCore',version:'1.0.0',path:'src/finance/workstation-ledger-core.js'},
  {name:'SimulationBacktestCore',version:'1.0.0',path:'src/finance/simulation-backtest-core.js'},
  {name:'SurfaceRetirementCore',version:'1.0.0',path:'src/finance/surface-retirement-core.js'}
]);
const routeMap=manifest&&manifest.bySurface?manifest.bySurface:{};
const compositionSurfaces=Object.freeze({
  'computeMoatScore':{owner:'WorkstationCalculationCore',implementation:'moatScore',proof:'source-invariant + WC regression; display-only local preview'},
  'CreditWaterfall.compute':{owner:'RiskCreditCore',implementation:'certified-output classification',proof:'consumes certified financial ratios/Merton outputs and only assigns labels'},
  'ReconciliationDiag.html':{owner:'SurfaceRetirementCore',implementation:'reconciliationDiagnostics',proof:'presentation of routed diagnostics'},
  'AssessmentEngine.overall':{owner:'WorkstationCalculationCore',implementation:'certified score composition',proof:'combines routed DataQualityEngine/financial metrics under fixed thresholds'},
  'TerminalCrossCheck.compute':{owner:'FinanceCore',implementation:'certified valuation composition',proof:'compares certified DCF terminal outputs with explicit inputs'},
  'ValuationUncertainty.compute':{owner:'FinanceCore',implementation:'certified DCF composition',proof:'uses corrected EBITDA-margin shocks and zero-safe dispersion denominator in canonical source'},
  'ForecastAccuracy.compute':{owner:'FinanceCore',implementation:'mean error composition',proof:'finite forecast/actual percentage-error summary'},
  'computeBenchmark':{owner:'WorkstationCalculationCore',implementation:'captureRatios/performanceRisk inputs',proof:'benchmark series composition; no independent valuation/risk formula'},
  'wsReconcile':{owner:'WorkstationLedgerCore',implementation:'calculateLedger comparison',proof:'diagnostic comparison against certified ledger output'},
  'wsValidateTransaction':{owner:'WorkstationLedgerCore',implementation:'ledger input policy',proof:'validation-only boundary; transaction arithmetic remains in calculateLedger'},
  'wsFxRateMeta':{owner:'WorkstationLedgerCore',implementation:'FX metadata lookup',proof:'lookup only; conversion routed separately'},
  'bondFactorHTML':{owner:'WorkstationCalculationCore',implementation:'presentation heuristic',proof:'display-only illustrative factor labels, not portfolio valuation/risk result'}
});
const presentationName=/^(?:html|.*HTML|.*Html|render.*|.*Render|wire.*|init.*|setup.*|show.*|open.*|close.*|save.*|load.*|download.*|export.*|import.*|toggle.*|populate.*|refresh.*|draw.*|chart.*|plot.*|table.*|modal.*|view.*|format.*|fmt.*|pill|kpi|frow|toast)$/;
const knownCalculationOwners=Object.freeze(Array.from(new Set(Object.keys(routeMap).filter(x=>x.includes('.')).map(x=>x.split('.')[0]).concat([
  'ScenarioEngine','Correlation','MonteCarlo','BootstrapMC','WalkForward','DateAlign','RollingRisk','PortfolioConstraints','ModelRiskEngine','ValuationDispersion','RobustnessV3','ThesisConsistency','ThesisConsistencyV3','CreditWaterfall','ReconciliationDiag','AssessmentEngine','TerminalCrossCheck','ValuationUncertainty','DataQualityV2','AccountingQuality','PortfolioPolicy','PortfolioLimits'
]))));
function classify(surface,name){
  const route=routeMap[surface];
  if(route){
    if(route.mode==='direct-delegation')return {status:'CERTIFIED_CORE_DELEGATION',owner:route.core,implementation:route.implementation,proof:'production-routing-manifest'};
    return {status:'RETIRED_SHADOWED',owner:route.core,implementation:route.implementation,proof:`runtime replaced by ${route.installer}`};
  }
  if(compositionSurfaces[surface])return Object.assign({status:'CERTIFIED_COMPOSITION'},compositionSurfaces[surface]);
  if(compositionSurfaces[name])return Object.assign({status:'CERTIFIED_COMPOSITION'},compositionSurfaces[name]);
  if(presentationName.test(name))return {status:'PRESENTATION_ONLY',owner:null,implementation:null,proof:'presentation-name classification; candidate scanner separately captures nested calculation helpers'};
  return {status:'REQUIRES_MIGRATION',owner:null,implementation:null,proof:'no certified route/core/composition classification'};
}
return Object.freeze({VERSION,STATUSES,cores,compositionSurfaces,presentationName,knownCalculationOwners,routeMap,classify});
});