'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const target=path.resolve(process.argv[2]||path.resolve(__dirname,'../dist/index.html'));
const outArg=process.argv.find(a=>a.startsWith('--write='));
const outPath=outArg?path.resolve(outArg.slice('--write='.length)):null;
const text=fs.readFileSync(target,'utf8');
const lines=text.split(/\r?\n/);

const patterns=[
  ['truthy-value checks',/if\s*\(\s*!\s*[A-Za-z_$][\w$]*\s*\)/g],
  ['fallback-to-zero coercions',/(?:Number|parseFloat|parseInt)\([^\n;]*\)\s*\|\|\s*0/g],
  ['generic OR zero',/\|\|\s*0/g],
  ['toFixed usage',/\.toFixed\(/g],
  ['Math.round usage',/Math\.round\(/g],
  ['parseFloat usage',/parseFloat\(/g],
  ['parseInt usage',/parseInt\(/g],
  ['Infinity literals',/\bInfinity\b/g],
  ['NaN literals',/\bNaN\b/g]
];

const financeRe=/(FinanceCore|CalcEngine|BondEngine|ValuationEngine|FinancialRatios|FINANCE\b|FinancialModel|Portfolio|MonteCarlo|Risk|Credit|Loan|Capm|Wacc|DCF|DDM|IRR|NPV|XIRR|duration|convex|drawdown|return|volatil|beta|alpha|ratio|margin|revenue|ebit|income|cash|debt|equity|price|yield|coupon|terminal|growth|tax|capex|working.?capital|variance|covar|correl|sharpe|sortino|var\b|expected.?shortfall)/i;
const uiRe=/(document\.|querySelector|classList|innerHTML|textContent|style\.|dataset|addEventListener|appendChild|closest\(|toast\(|pill\(|kpi\(|render|HTML|modal|overlay|button|chart|label|progress|sidebar|view-|tab\b|wire\()/i;
const parserRe=/(CSV|XLSX|parse|import|mapping|header|row|cell|Date\(|timestamp|JSON)/i;
const displayRe=/(fmt\.|format|toLocale|display|label|score|percent|percentage|currency|money|precision|round|badge|width|height|progress)/i;
const sentinelRe=/(peak|trough|min|max|best|worst|bound|lo\b|hi\b|sentinel|Infinity|NaN)/i;

function contextFor(lineNo){
  const from=Math.max(0,lineNo-3),to=Math.min(lines.length,lineNo+2);
  return lines.slice(from,to).join(' ');
}
function ownerFor(lineNo){
  for(let i=lineNo-1;i>=Math.max(0,lineNo-120);i--){
    const s=lines[i];
    let m=s.match(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*\(\(\)\s*=>/);
    if(m)return m[1];
    m=s.match(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/);
    if(m)return m[1];
  }
  return 'top-level/unknown';
}
function disposition(name,line,ctx,owner){
  const joined=`${owner} ${line} ${ctx}`;
  if(name==='Infinity literals'||name==='NaN literals') return sentinelRe.test(joined)?'algorithm/parser sentinel':'numeric sentinel';
  if(name==='parseFloat usage'||name==='parseInt usage') return parserRe.test(joined)?'input/parser boundary':'explicit integer/number conversion';
  if(name==='toFixed usage'||name==='Math.round usage') return displayRe.test(joined)||uiRe.test(joined)?'presentation/UI rounding':'algorithmic rounding';
  if(name==='truthy-value checks'){
    if(uiRe.test(joined))return 'DOM/object presence guard';
    if(financeRe.test(joined))return 'calculation-sensitive presence guard';
    return 'general control-flow presence guard';
  }
  if(name==='fallback-to-zero coercions'||name==='generic OR zero'){
    if(uiRe.test(joined)&&!financeRe.test(joined))return 'UI/default-state fallback';
    if(parserRe.test(joined)&&!financeRe.test(joined))return 'parser/default fallback';
    if(financeRe.test(joined))return 'calculation-sensitive numeric fallback';
    return 'general numeric/default fallback';
  }
  return 'reviewed general construct';
}

const hits=[];
for(let i=0;i<lines.length;i++){
  const line=lines[i];
  for(const [name,re0] of patterns){
    const re=new RegExp(re0.source,re0.flags);
    let m;
    while((m=re.exec(line))){
      const ctx=contextFor(i+1); const owner=ownerFor(i+1);
      const disp=disposition(name,line,ctx,owner);
      const fingerprint=crypto.createHash('sha256').update(`${name}\n${line.trim()}\n${owner}`).digest('hex').slice(0,16);
      hits.push({pattern:name,line:i+1,column:m.index+1,match:m[0],owner,disposition:disp,fingerprint,source:line.trim()});
      if(m[0].length===0)re.lastIndex++;
    }
  }
}

const byPattern={}; const byDisposition={};
for(const h of hits){byPattern[h.pattern]=(byPattern[h.pattern]||0)+1;byDisposition[h.disposition]=(byDisposition[h.disposition]||0)+1;}
const calc=hits.filter(h=>h.disposition.includes('calculation-sensitive')||h.disposition==='algorithmic rounding');

let md='# Static Audit Contextual Findings\n\n';
md+='This file is generated from the deployable `dist/index.html`. Every regex lead from `scripts/static-audit.js` is enumerated with a source line, owner hint, stable fingerprint and contextual disposition. These are review leads, not automatic defects.\n\n';
md+=`- Target: \`${path.basename(target)}\`\n- Total pattern hits: **${hits.length}**\n- Calculation-sensitive / algorithmic-review hits: **${calc.length}**\n- Unclassified hits: **0**\n\n`;
md+='## Counts by pattern\n\n| Pattern | Count |\n|---|---:|\n';
for(const [k,v] of Object.entries(byPattern))md+=`| ${k} | ${v} |\n`;
md+='\n## Counts by contextual disposition\n\n| Disposition | Count |\n|---|---:|\n';
for(const [k,v] of Object.entries(byDisposition).sort((a,b)=>a[0].localeCompare(b[0])))md+=`| ${k} | ${v} |\n`;
md+='\n## Calculation-sensitive / algorithmic-review leads\n\n';
if(!calc.length)md+='None.\n';
for(const h of calc){
  md+=`### ${h.fingerprint} — ${h.pattern} — line ${h.line}\n\n`;
  md+=`- Owner hint: \`${h.owner}\`\n- Disposition: **${h.disposition}**\n- Match: \`${h.match.replace(/`/g,'\\`')}\`\n- Source: \`${h.source.replace(/`/g,'\\`')}\`\n\n`;
}
md+='## Complete lead inventory\n\n| Fingerprint | Pattern | Line | Owner | Disposition | Source |\n|---|---|---:|---|---|---|\n';
const esc=s=>String(s).replace(/\|/g,'\\|').replace(/`/g,'\\`');
for(const h of hits)md+=`| \`${h.fingerprint}\` | ${esc(h.pattern)} | ${h.line} | \`${esc(h.owner)}\` | ${esc(h.disposition)} | \`${esc(h.source)}\` |\n`;

if(outPath){fs.mkdirSync(path.dirname(outPath),{recursive:true});fs.writeFileSync(outPath,md);}
console.log(JSON.stringify({target:path.basename(target),totalHits:hits.length,calculationSensitiveHits:calc.length,unclassified:0,byPattern,byDisposition,report:outPath?path.relative(process.cwd(),outPath):null},null,2));
