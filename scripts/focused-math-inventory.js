'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const target=path.resolve(process.argv[2]||path.join(root,'index.html'));
const text=fs.readFileSync(target,'utf8');
const lines=text.split(/\r?\n/);
const groups={
  analytics:[
    'const SimilarityEngine','const DataQualityEngine','const ScoringEngine','const AssessmentEngine','const PeerSimilarity',
    'function betaAlphaAligned','function rollingSharpe','const BacktestEngine','const PortfolioOptimizers',
    'function factorExposure','function performanceAttribution','const RiskContribution','function segmentForecastRender','function sotpRender','mulberry',
    'const TerminalCrossCheck','const ValuationUncertainty'
  ],
  workspace:[
    'function wsDividendAmounts','function wsCalculateFromLedger','function wsFxRateMeta','function wsFxConvert','function wsMarketValue',
    'function wsPositionBaseValue','function wsCashSummary','function wsReconcile','function wsValidateTransaction','function wsUnrealized',
    'function wsTWR','function wsMWR','function wsAnnualized','function wsCaptureRatios','function computeBenchmark','function wsPerfRisk','function wsPeriodReturns'
  ],
  portfolio:[
    'const PortfolioPolicy','const PortfolioLimits','const RiskContribution','function factorExposure','function performanceAttribution',
    'function minimumVariance','function maximumSharpe','function riskParity','function equalWeight','trackingError','informationRatio','capture'
  ]
};
function slug(s){return s.replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'').toLowerCase();}
function capture(marker){
  const hits=[];
  for(let i=0;i<lines.length;i++)if(lines[i].includes(marker)){hits.push(i);if(hits.length>=4)break;}
  return hits.map(i=>({line:i+1,from:Math.max(0,i-12),to:Math.min(lines.length,i+65)}));
}
for(const [group,markers] of Object.entries(groups)){
  let out=`# Focused Math Inventory — ${group}\n\nGenerated from ${path.basename(target)}. Engineering evidence only; not a certification claim.\n\n`;
  for(const marker of markers){
    const hits=capture(marker);
    out+=`## ${marker} — ${hits.length} hit(s)\n\n`;
    if(!hits.length){out+='Not located.\n\n';continue;}
    for(const h of hits){out+=`### line ${h.line}\n\n\`\`\`js\n`;for(let i=h.from;i<h.to;i++)out+=`${String(i+1).padStart(5,' ')} | ${lines[i]}\n`;out+='```\n\n';}
  }
  const file=path.join(root,'docs',`FOCUSED_MATH_${group.toUpperCase()}.md`);
  fs.writeFileSync(file,out);
  console.log(`${group}: ${file}`);
}
