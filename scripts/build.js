'use strict';
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const sourcePath=path.join(root,'src/ui/workstation.html');
const distDir=path.join(root,'dist'),distPath=path.join(distDir,'index.html'),rootPath=path.join(root,'index.html');
const modulePaths=[
  'src/finance/engine.js','src/finance/model-engine.js','src/finance/legacy-hardening.js','src/finance/risk-credit-core.js',
  'src/finance/workstation-core.js','src/finance/workstation-ledger-core.js','src/finance/simulation-backtest-core.js','src/finance/surface-retirement-core.js',
  'src/runtime/production-routing-manifest.js','src/finance/calculation-registry.js',
  'src/runtime/install.js','src/runtime/install-workstation.js','src/runtime/install-surface-retirement.js'
];
const START='/* FINANCIAL_CERTIFICATION_RUNTIME_START */',END='/* FINANCIAL_CERTIFICATION_RUNTIME_END */';
const anchor='window.addEventListener("DOMContentLoaded",init);';
let html=fs.readFileSync(sourcePath,'utf8');
let strippedRuntimeBlocks=0;
const si=html.indexOf(START),ei=html.indexOf(END);
if(si>=0||ei>=0){if(si<0||ei<si)throw new Error('Build refused: malformed generated-runtime markers in canonical UI source.');html=html.slice(0,si)+html.slice(ei+END.length);strippedRuntimeBlocks=1;}
if(!html.includes(anchor))throw new Error('Build refused: canonical UI DOMContentLoaded anchor not found.');
for(const p of modulePaths)if(!fs.existsSync(path.join(root,p)))throw new Error(`Build refused: required module missing: ${p}`);
const modules=modulePaths.map(p=>fs.readFileSync(path.join(root,p),'utf8').trim()).join('\n');
const block=`${START}\n${modules}\n${END}\n`;
html=html.replace(anchor,block+anchor);
if((html.match(new RegExp(escapeRegExp(START),'g'))||[]).length!==1||(html.match(new RegExp(escapeRegExp(END),'g'))||[]).length!==1)throw new Error('Build refused: generated runtime block is not unique.');
fs.mkdirSync(distDir,{recursive:true});fs.writeFileSync(distPath,html);if(process.argv.includes('--write-root'))fs.writeFileSync(rootPath,html);
const result={output:path.relative(root,distPath),source:path.relative(root,sourcePath),bytes:Buffer.byteLength(html),modules:modulePaths.length,strippedRuntimeBlocks,financialPatchCount:0,financialPatches:[],assemblyMutations:['strip generated runtime block if present','inject versioned certification modules before DOMContentLoaded init'],rootUpdated:process.argv.includes('--write-root')};
console.log(JSON.stringify(result,null,2));
function escapeRegExp(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
