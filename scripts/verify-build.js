'use strict';
const fs=require('node:fs');
const path=require('node:path');
const file=path.resolve(__dirname,'../dist/index.html');
const html=fs.readFileSync(file,'utf8');
const checks=[
  ['generated HTML exists',fs.existsSync(file)],
  ['single-file artifact remains substantial',Buffer.byteLength(html)>900000],
  ['certification runtime start marker',html.includes('FINANCIAL_CERTIFICATION_RUNTIME_START')],
  ['certification runtime end marker',html.includes('FINANCIAL_CERTIFICATION_RUNTIME_END')],
  ['FinanceCore embedded',html.includes('root.FinanceCore = api')],
  ['runtime installer embedded',html.includes('__FINANCIAL_CERTIFICATION__')],
  ['bond UI passes frequency',html.includes('BondEngine.modifiedDuration(mac,ytm,freq)')],
  ['legacy bond UI omission absent',!html.includes('BondEngine.modifiedDuration(mac,ytm);')],
  ['recovery UI uses observations',html.includes('rec+" obs"')],
  ['DOMContentLoaded init preserved',html.includes('window.addEventListener("DOMContentLoaded",init);')],
  ['Cloudflare challenge payload removed',!html.includes('/cdn-cgi/challenge-platform/')],
  ['no localhost runtime reference',!/(?:src|href)=["']https?:\/\/(?:localhost|127\.0\.0\.1)/i.test(html)],
  ['core workstation navigation preserved',html.includes('AppInit.go')],
  ['DCF module preserved',html.includes('ValuationEngine')],
  ['bond module preserved',html.includes('BondEngine')],
  ['CSV import preserved',html.includes('CsvParser')]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
const starts=(html.match(/FINANCIAL_CERTIFICATION_RUNTIME_START/g)||[]).length;
const ends=(html.match(/FINANCIAL_CERTIFICATION_RUNTIME_END/g)||[]).length;
if(starts!==1||ends!==1){console.error(`FAIL runtime marker multiplicity start=${starts} end=${ends}`);failed++;}
if(failed){console.error(`Build verification failed: ${failed} check(s).`);process.exit(1);}console.log(`Build verification passed: ${checks.length+1} checks.`);
