'use strict';
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const target=path.resolve(process.argv[2]||path.join(root,'index.html'));
const outArg=process.argv.find(a=>a.startsWith('--write='));
const outPath=path.resolve(outArg?outArg.slice('--write='.length):path.join(root,'docs/LEGACY_CALCULATION_INVENTORY.md'));
const text=fs.readFileSync(target,'utf8');
const lines=text.split(/\r?\n/);

const targets=[
  'simScore','score','whatWouldChange','run','monitor','betaAlphaAligned','rollingSharpe',
  'mcBootstrapRender','walkForwardRender','backtestRender','computeMoatScore','factorExposure',
  'performanceAttribution','creditRatios','segmentForecastRender','sotpRender','mulberry',
  'check','compute','minimumVariance','maximumSharpe','wsDividendAmounts','wsCalculateFromLedger',
  'wsFxRateMeta','wsFxConvert','wsMarketValue','wsPositionBaseValue','wsCashSummary','wsReconcile',
  'wsValidateTransaction','wsUnrealized','wsTWR','wsMWR','computeBenchmark','wsPerfRisk','periodReturnsArray'
];

function ownerAt(idx){
  for(let i=idx;i>=Math.max(0,idx-260);i--){
    const s=lines[i];
    let m=s.match(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*\(\(\)\s*=>/);
    if(m)return m[1];
    m=s.match(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*\{/);
    if(m)return m[1];
  }
  return 'top-level/unknown';
}

const occurrences=[];
for(const name of targets){
  for(let i=0;i<lines.length;i++){
    const s=lines[i];
    if(s.includes(`function ${name}(`)||s.includes(`${name}:function(`)||s.includes(`${name} = (`)||s.includes(`${name}=(`)){
      occurrences.push({name,line:i+1,owner:ownerAt(i),from:Math.max(0,i-8),to:Math.min(lines.length,i+28)});
    }
  }
}

let md='# Legacy Calculation Inventory\n\n';
md+='Generated mechanically from the production source to support the final modularization pass. This is an engineering inventory, not a certification claim.\n\n';
md+=`- Source: \`${path.basename(target)}\`\n- Target names: **${targets.length}**\n- Located occurrences: **${occurrences.length}**\n\n`;
for(const o of occurrences){
  md+=`## ${o.name} — line ${o.line} — owner \`${o.owner}\`\n\n\`\`\`js\n`;
  for(let i=o.from;i<o.to;i++)md+=`${String(i+1).padStart(5,' ')} | ${lines[i]}\n`;
  md+='```\n\n';
}
fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,md);
console.log(JSON.stringify({target:path.basename(target),targets:targets.length,occurrences:occurrences.length,out:path.relative(root,outPath)},null,2));
