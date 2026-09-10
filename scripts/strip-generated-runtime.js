'use strict';
const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');
const target=path.resolve(process.argv[2]||path.join(root,'src/ui/workstation.html'));let text=fs.readFileSync(target,'utf8');
const START='/* FINANCIAL_CERTIFICATION_RUNTIME_START */',END='/* FINANCIAL_CERTIFICATION_RUNTIME_END */';
let removed=0;const si=text.indexOf(START),ei=text.indexOf(END);
if(si>=0||ei>=0){if(si<0||ei<si)throw new Error('Malformed generated runtime markers.');text=text.slice(0,si)+text.slice(ei+END.length);removed=1;fs.writeFileSync(target,text);}
console.log(JSON.stringify({target:path.relative(root,target),removed,bytes:Buffer.byteLength(text)},null,2));