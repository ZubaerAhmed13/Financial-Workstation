'use strict';
const fs=require('node:fs');
const path=require('node:path');
const file=path.resolve(__dirname,'../dist/index.html');
const html=fs.readFileSync(file,'utf8');
const safeSvgFactory='const el=(tag,attrs={})=>{ const node=document.createElementNS(NS,tag); for(const [k,v] of Object.entries(attrs)){ if(v!=null) node.setAttribute(k,String(v)); } return node; };';
const safeMixColor='function mixColor(a,b,t){ const p=hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]; const ca=p(a),cb=p(b); const lerp=(x,y,u)=>x+(y-x)*u; return "rgb("+Math.round(lerp(ca[0],cb[0],t))+","+Math.round(lerp(ca[1],cb[1],t))+","+Math.round(lerp(ca[2],cb[2],t))+")"; }';
const safeDebtRead='rate:(()=>{const v=Number($("#d_"+i+"_r").value);return Number.isFinite(v)?v/100:.05;})()';
const legacyDebtRead='rate:(Number($("#d_"+i+"_r").value)||5)/100';
const safeCov='const n=(id,fb)=>{const el=$(id);const raw=el?el.value:null;if(raw==null||String(raw).trim()==="")return fb;const v=Number(raw);return Number.isFinite(v)?v:fb;};';
const legacyCov='fm.covenants={debtEbitda:Number($("#cov_de").value)||4, ic:Number($("#cov_ic").value)||3, currentRatio:Number($("#cov_cr").value)||1, minCash:Number($("#cov_mc").value)||0};';
const checks=[
  ['generated HTML exists',fs.existsSync(file)],
  ['single-file artifact remains substantial',Buffer.byteLength(html)>900000],
  ['certification runtime start marker',html.includes('FINANCIAL_CERTIFICATION_RUNTIME_START')],
  ['certification runtime end marker',html.includes('FINANCIAL_CERTIFICATION_RUNTIME_END')],
  ['FinanceCore embedded',html.includes('root.FinanceCore = api')],
  ['FinancialModelCore embedded',html.includes('root.FinancialModelCore=api')],
  ['runtime installer embedded',html.includes('__FINANCIAL_CERTIFICATION__')],
  ['model runtime route embedded',html.includes('const out=ModelCore.build(m,sd||{})')],
  ['XIRR runtime route embedded',html.includes('XIRR.xirr=(cashflows,dates,_guess=.1)=>Core.xirr(cashflows,dates)')],
  ['ECL runtime validation embedded',html.includes('ECL requires finite PD/recovery in [0,1] and non-negative EAD.')],
  ['bond UI passes frequency',html.includes('BondEngine.modifiedDuration(mac,ytm,freq)')],
  ['legacy bond UI omission absent',!html.includes('BondEngine.modifiedDuration(mac,ytm);')],
  ['recovery UI uses observations',html.includes('rec+" obs"')],
  ['three-statement margin UI is explicitly a target',html.includes('<tr><td>EBITDA margin target %</td>')],
  ['ambiguous legacy EBITDA margin label absent',!html.includes('<tr><td>EBITDA margin %</td>')],
  ['zero-percent debt input is preserved',html.includes(safeDebtRead)],
  ['zero-destroying debt rate reader absent',!html.includes(legacyDebtRead)],
  ['zero-valued covenant inputs are preserved',html.includes(safeCov)],
  ['zero-destroying covenant reader absent',!html.includes(legacyCov)],
  ['SVG factory uses setAttribute safely',html.includes(safeSvgFactory)],
  ['legacy SVG Object.assign factory absent',!html.includes('const el=(tag,attrs)=>Object.assign(document.createElementNS(NS,tag),attrs);')],
  ['heatmap mixColor owns interpolation helper',html.includes(safeMixColor)],
  ['legacy out-of-scope mixColor interpolation absent',!html.includes('const ca=p(a),cb=p(b); return "rgb("+Math.round(lerp(ca[0],cb[0],t))')],
  ['DOMContentLoaded init preserved',html.includes('window.addEventListener("DOMContentLoaded",init);')],
  ['Cloudflare challenge payload removed',!html.includes('/cdn-cgi/challenge-platform/')],
  ['no localhost runtime reference',!/(?:src|href)=["']https?:\/\/(?:localhost|127\.0\.0\.1)/i.test(html)],
  ['core workstation navigation preserved',html.includes('AppInit.go')],
  ['DCF module preserved',html.includes('ValuationEngine')],
  ['bond module preserved',html.includes('BondEngine')],
  ['CSV import preserved',html.includes('CsvParser')],
  ['three-statement model presentation preserved',html.includes('FinancialModelEngine.incomeTableHTML')&&html.includes('FinancialModelEngine.balanceTableHTML')&&html.includes('FinancialModelEngine.cashTableHTML')],
  ['XIRR view preserved',html.includes('loanXirrRender')],
  ['ECL view wiring preserved',html.includes('Expected Credit Loss (PD × LGD × EAD)')]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
const starts=(html.match(/FINANCIAL_CERTIFICATION_RUNTIME_START/g)||[]).length;
const ends=(html.match(/FINANCIAL_CERTIFICATION_RUNTIME_END/g)||[]).length;
if(starts!==1||ends!==1){console.error(`FAIL runtime marker multiplicity start=${starts} end=${ends}`);failed++;}
if(failed){console.error(`Build verification failed: ${failed} check(s).`);process.exit(1);}console.log(`Build verification passed: ${checks.length+1} checks.`);