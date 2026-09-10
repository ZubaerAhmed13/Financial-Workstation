'use strict';
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const target=path.resolve(process.argv[2]||path.join(root,'src/ui/workstation.html'));
const writeArg=process.argv.find(x=>x.startsWith('--write='));
const out=path.resolve(writeArg?writeArg.slice(8):path.join(root,'docs/CALCULATION_SURFACE_CLASSIFICATION.md'));
const Registry=require('../src/finance/calculation-registry.js');
const Manifest=require('../src/runtime/production-routing-manifest.js');
let text=fs.readFileSync(target,'utf8');
const START='/* FINANCIAL_CERTIFICATION_RUNTIME_START */',END='/* FINANCIAL_CERTIFICATION_RUNTIME_END */';
const si=text.indexOf(START),ei=text.indexOf(END);if(si>=0&&ei>si)text=text.slice(0,si)+text.slice(ei+END.length);
const lines=text.split(/\r?\n/);
const calcName=/(?:calc|compute|score|run|risk|return|value|price|yield|duration|irr|npv|var|beta|alpha|sharpe|sortino|drawdown|recovery|corr|covar|vol|forecast|margin|debt|cash|ledger|portfolio|scenario|stress|credit|merton|altman|ratio|wacc|capm|dcf|ddm|sotp|bootstrap|monte|backtest|walk|reconcil|validat|exposure|attribution|performance|annual|tracking|information|capture|weight|constraint|prob|ecl|dividend|fx|market|moat|terminal|robust|assessment|quality|signal|factor|benchmark|financial|balance|interest|liquid)/i;
const ownerStack=[];const found=[];const seen=new Set();
const add=(name,line,owner,kind)=>{if(!name)return;const knownOwner=owner&&Registry.knownCalculationOwners.includes(owner);if(!knownOwner&&!calcName.test(name)&&!/^ws[A-Z]/.test(name))return;const surface=owner?`${owner}.${name}`:name,key=`${surface}@${line}`;if(seen.has(key))return;seen.add(key);found.push({surface,name,owner:owner||null,line,kind});};
for(let i=0;i<lines.length;i++){
  const s=lines[i];const start=s.match(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*\(\s*\(\s*\)\s*=>\s*\{/);if(start)ownerStack.push(start[1]);
  const owner=ownerStack.length?ownerStack[ownerStack.length-1]:null;let m;
  const f=/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g;while((m=f.exec(s)))add(m[1],i+1,owner,'function');
  const af=/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g;while((m=af.exec(s))){if(start&&m[1]===start[1])continue;add(m[1],i+1,owner,'arrow');}
  const of=/\b([A-Za-z_$][\w$]*)\s*:\s*function\s*\(/g;while((m=of.exec(s)))add(m[1],i+1,owner,'object-method');
  if(/^\s*\}\)\(\);?\s*$/.test(s)&&ownerStack.length)ownerStack.pop();
}
found.sort((a,b)=>a.line-b.line||a.surface.localeCompare(b.surface));for(const x of found)Object.assign(x,Registry.classify(x.surface,x.name));
const counts={};for(const s of Registry.STATUSES)counts[s]=found.filter(x=>x.status===s).length;const migration=counts.REQUIRES_MIGRATION||0;
const coreNames=new Set(Registry.cores.map(c=>c.name)),badRoutes=Manifest.routes.filter(r=>!coreNames.has(r.core)),routeDuplicates=Manifest.routes.map(r=>r.surface).filter((x,i,a)=>a.indexOf(x)!==i),classified=found.length-migration;
let md='# Full Calculation-Surface Classification\n\nThis report is generated mechanically from the canonical UI source with the generated certification runtime removed before scanning. It is a release gate, not a manually curated assertion.\n\n';
md+=`- Canonical source: \`${path.relative(root,target)}\`\n- Registry: \`CalculationRegistry v${Registry.VERSION}\`\n- Routing manifest: \`ProductionRoutingManifest v${Manifest.VERSION}\`\n- Discovered calculation candidates: **${found.length}**\n- Classified without migration: **${classified}/${found.length}**\n- **REQUIRES_MIGRATION = ${migration}**\n- Invalid routing-core references: **${badRoutes.length}**\n- Duplicate routing surfaces: **${routeDuplicates.length}**\n- **ALL_LIVE_FINANCIAL_HELPERS_CERTIFIED = ${migration===0&&badRoutes.length===0&&routeDuplicates.length===0?'TRUE':'FALSE'}**\n\n`;
md+='## Status counts\n\n| Status | Count |\n|---|---:|\n';for(const s of Registry.STATUSES)md+=`| ${s} | ${counts[s]} |\n`;
md+='\n## Surface inventory\n\n| Line | Surface | Source kind | Classification | Certified owner / implementation | Proof |\n|---:|---|---|---|---|---|\n';for(const x of found){const impl=x.owner&&x.implementation?`${x.owner} → ${x.implementation}`:(x.implementation||x.owner||'—');md+=`| ${x.line} | \`${x.surface}\` | ${x.kind} | **${x.status}** | ${String(impl).replace(/\|/g,'\\|')} | ${String(x.proof||'').replace(/\|/g,'\\|')} |\n`;}
const unresolved=found.filter(x=>x.status==='REQUIRES_MIGRATION');if(unresolved.length){md+='\n## Required migrations\n\n';for(const x of unresolved)md+=`- \`${x.surface}\` at canonical-source line ${x.line}\n`;}
if(badRoutes.length){md+='\n## Invalid manifest routes\n\n';for(const r of badRoutes)md+=`- \`${r.surface}\` refers to unknown core \`${r.core}\`\n`;}
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,md);
const result={source:path.relative(root,target),discovered:found.length,classified,counts,REQUIRES_MIGRATION:migration,badRoutes:badRoutes.length,duplicateRoutes:routeDuplicates.length,ALL_LIVE_FINANCIAL_HELPERS_CERTIFIED:migration===0&&badRoutes.length===0&&routeDuplicates.length===0,out:path.relative(root,out),migrationSurfaces:unresolved.map(x=>`${x.surface}@${x.line}`)};
console.log(JSON.stringify(result,null,2));if(migration||badRoutes.length||routeDuplicates.length)process.exit(1);