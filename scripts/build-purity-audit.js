'use strict';
const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');
const p=path.join(root,'scripts/build.js'),b=fs.readFileSync(p,'utf8');
const checks=[
 ['build reads separate canonical UI source',b.includes("src/ui/workstation.html")],
 ['build declares zero financial patches',b.includes('financialPatchCount:0')&&b.includes('financialPatches:[]')],
 ['legacy patch variables removed',!/legacy(?:Debt|Cov|Portfolio|Risk|Ecl|Merton|Scenario|Disp|Conf|Period|Benchmark|Segment|Sotp|Svg|MixColor)/i.test(b)],
 ['replaceAll financial mutation machinery removed',!b.includes('html.replaceAll(')],
 ['regex financial mutation machinery removed',!b.includes('legacyRiskBlock')&&!b.includes('valuationMarginRepairs')&&!b.includes('durationPatches')],
 ['only assembly replace remains',(b.match(/html\.replace\(/g)||[]).length===1&&b.includes('html.replace(anchor,block+anchor)')],
 ['canonical source is not root generated artifact',!b.includes("fs.readFileSync(indexPath")&&!b.includes("path.join(root,'index.html');\nconst dist")],
 ['surface retirement core embedded',b.includes("src/finance/surface-retirement-core.js")],
 ['routing manifest embedded',b.includes("src/runtime/production-routing-manifest.js")],
 ['calculation registry embedded',b.includes("src/finance/calculation-registry.js")],
 ['final retirement installer embedded',b.includes("src/runtime/install-surface-retirement.js")]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
const result={checks:checks.length,failed,FINANCIAL_PATCH_COUNT:failed?null:0,status:failed?'FAIL':'PASS'};console.log(JSON.stringify(result,null,2));if(failed)process.exit(1);