'use strict';
const fs=require('node:fs');
const path=require('node:path');
const target=process.argv[2]||path.resolve(__dirname,'../dist/index.html');
const text=fs.readFileSync(target,'utf8');
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
const result={target:path.basename(target),patterns:{}};
for(const [name,re] of patterns) result.patterns[name]=(text.match(re)||[]).length;
result.note='Counts are audit leads, not automatic defects. Each occurrence requires domain-context review.';
console.log(JSON.stringify(result,null,2));
