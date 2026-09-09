'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const indexPath=path.join(root,'index.html');
const distDir=path.join(root,'dist');
const distPath=path.join(distDir,'index.html');
const engine=fs.readFileSync(path.join(root,'src/finance/engine.js'),'utf8').trim();
const installer=fs.readFileSync(path.join(root,'src/runtime/install.js'),'utf8').trim();
let html=fs.readFileSync(indexPath,'utf8');

const START='/* FINANCIAL_CERTIFICATION_RUNTIME_START */';
const END='/* FINANCIAL_CERTIFICATION_RUNTIME_END */';
const block=`${START}\n${engine}\n${installer}\n${END}\n`;
const existing=new RegExp(escapeRegExp(START)+'[\\s\\S]*?'+escapeRegExp(END)+'\\n?','g');
html=html.replace(existing,'');

// Remove an injected Cloudflare challenge payload found in the repository artifact.
// It is unrelated to the workstation and violates the intended offline-only runtime.
html=html.replace(/\n?<script>\(function\(\)\{function c\(\)\{var b=a\.contentDocument[\s\S]*?<\/script>(?=<\/body>)/g,'');

// Frequency is part of the modified-duration denominator. The legacy UI omitted it.
let durationPatches=0;
html=html.replace(/BondEngine\.modifiedDuration\(mac,ytm\)/g,()=>{durationPatches++;return 'BondEngine.modifiedDuration(mac,ytm,freq)';});
// Recovery is counted in observations in the current imported-price workflow, not calendar days.
html=html.replace(/rec\+"d"/g,'rec+" obs"');

const initNeedle='window.addEventListener("DOMContentLoaded",init);';
if(!html.includes(initNeedle)) throw new Error('Build refused: DOMContentLoaded init anchor not found.');
html=html.replace(initNeedle,block+initNeedle);
if(durationPatches<1 && !html.includes('BondEngine.modifiedDuration(mac,ytm,freq)')) throw new Error('Build refused: modified-duration UI call site was not patched.');

fs.mkdirSync(distDir,{recursive:true});
fs.writeFileSync(distPath,html);
if(process.argv.includes('--write-root')) fs.writeFileSync(indexPath,html);
console.log(JSON.stringify({output:path.relative(root,distPath),bytes:Buffer.byteLength(html),durationPatches,rootUpdated:process.argv.includes('--write-root')},null,2));

function escapeRegExp(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
