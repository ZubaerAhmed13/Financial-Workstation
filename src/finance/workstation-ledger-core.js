(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.WorkstationLedgerCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='1.0.0';
  const EPS=1e-12;
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const has=(o,k)=>o!=null&&Object.prototype.hasOwnProperty.call(o,k);
  const numOr=(o,k,fallback)=>has(o,k)?o[k]:fallback;
  const safeDivide=(n,d)=>finite(n)&&finite(d)&&Math.abs(d)>EPS?n/d:null;

  function dividendAmounts(tx){
    if(!tx||typeof tx!=='object')return null;
    let gross=null;
    if(finite(tx.grossDividend))gross=tx.grossDividend;
    else if(finite(tx.gross))gross=tx.gross;
    else if(finite(tx.sharesHeld)&&finite(tx.dividendPerShare))gross=tx.sharesHeld*tx.dividendPerShare;
    else if(finite(tx.quantity)&&finite(tx.price))gross=tx.quantity*tx.price;
    else if(finite(tx.amount))gross=tx.amount;
    const withholding=has(tx,'withholdingTax')?tx.withholdingTax:(has(tx,'tax')?tx.tax:0);
    if(!finite(withholding)||withholding<0)return null;
    let net=finite(tx.net)?tx.net:(gross!=null?gross-withholding:null);
    if(net==null&&finite(tx.amount))net=tx.amount;
    if(!finite(net))return null;
    if(gross==null)gross=net;
    if(!finite(gross))return null;
    return {gross,withholding,net};
  }

  function txSortKey(tx,index){
    const date=tx&&tx.date!=null?String(tx.date):'';
    const timestamp=tx&&finite(tx.timestamp)?tx.timestamp:0;
    const id=tx&&tx.id!=null?String(tx.id):String(index);
    return `${date}|${String(timestamp).padStart(16,'0')}|${id}`;
  }
  function sortTransactions(transactions){
    if(!Array.isArray(transactions))return [];
    return transactions.map((tx,index)=>({tx,index,key:txSortKey(tx,index)})).sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:a.index-b.index).map(x=>x.tx);
  }
  function validCharge(v){return v==null?0:(finite(v)&&v>=0?v:null);}
  function validFx(v){return v==null?1:(finite(v)&&v>0?v:null);}
  function emptyPosition(key,cur,fxBasis=1,ticker=null){
    return {security:key,ticker:ticker||key,quantity:0,avgCost:0,costBasis:0,realizedPnl:0,divIncome:0,divNet:0,fees:0,currency:cur,costBasisCurrency:cur,fxBasis};
  }

  function calculateLedger(transactions,baseCurrency='EUR'){
    if(!Array.isArray(transactions)||typeof baseCurrency!=='string'||!baseCurrency.trim())return null;
    const positions={},cash={},warnings=[];
    const txs=sortTransactions(transactions);
    const addCash=(cur,amount)=>{if(cash[cur]==null)cash[cur]=0;cash[cur]+=amount;};
    txs.forEach((tx,index)=>{
      if(!tx||typeof tx!=='object'){warnings.push({index,code:'LEDGER-TX-INVALID',message:'Transaction is not an object.'});return;}
      const type=String(tx.type||'BUY').toUpperCase(),cur=String(tx.currency||baseCurrency),key=tx.security||tx.ticker||null;
      if(cash[cur]==null)cash[cur]=0;
      if(type==='BUY'){
        const q=tx.quantity,p=tx.price,fees=validCharge(tx.fees),tax=validCharge(tx.tax),fx=validFx(tx.rateAtTrade);
        if(!key||!finite(q)||q<=0||!finite(p)||p<=0||fees==null||tax==null||fx==null){warnings.push({index,code:'LEDGER-BUY-INVALID',message:'Invalid BUY transaction skipped.'});return;}
        if(!positions[key])positions[key]=emptyPosition(key,cur,fx,tx.ticker);
        const pos=positions[key];
        if(pos.currency!==cur){warnings.push({index,code:'LEDGER-CURRENCY-MISMATCH',message:'Position currency mismatch; transaction skipped.'});return;}
        const cost=q*p,newQty=pos.quantity+q,prevCost=pos.costBasis;
        pos.avgCost=newQty>EPS?(prevCost+cost)/newQty:0;
        pos.costBasis=prevCost+cost;pos.quantity=newQty;pos.fees+=fees;
        pos.fxBasis=prevCost+cost>EPS?((prevCost*pos.fxBasis)+(cost*fx))/(prevCost+cost):fx;
        addCash(cur,-(cost+fees+tax));
      }else if(type==='SELL'){
        const q=tx.quantity,p=tx.price,fees=validCharge(tx.fees),tax=validCharge(tx.tax);
        if(!key||!finite(q)||q<=0||!finite(p)||p<=0||fees==null||tax==null){warnings.push({index,code:'LEDGER-SELL-INVALID',message:'Invalid SELL transaction skipped.'});return;}
        const pos=positions[key];if(!pos||pos.quantity<=EPS){warnings.push({index,code:'LEDGER-SELL-NO-POSITION',message:'SELL has no available position; skipped.'});return;}
        const sellable=Math.min(pos.quantity,q);
        if(q>pos.quantity+EPS)warnings.push({index,code:'LEDGER-OVERSELL-CAPPED',message:'SELL quantity exceeded available position and was capped.'});
        const proceeds=sellable*p,costPortion=pos.costBasis*(sellable/pos.quantity);
        pos.realizedPnl+=proceeds-costPortion-fees-tax;pos.costBasis-=costPortion;pos.quantity-=sellable;pos.fees+=fees;
        if(pos.quantity<=EPS){pos.quantity=0;pos.costBasis=0;pos.avgCost=0;}else pos.avgCost=pos.costBasis/pos.quantity;
        addCash(cur,proceeds-fees-tax);
      }else if(type==='DIVIDEND'){
        if(!key){warnings.push({index,code:'LEDGER-DIVIDEND-INVALID',message:'Dividend security is missing.'});return;}
        const da=dividendAmounts(tx);if(!da){warnings.push({index,code:'LEDGER-DIVIDEND-INVALID',message:'Invalid dividend transaction skipped.'});return;}
        if(!positions[key])positions[key]=emptyPosition(key,cur,1,tx.ticker);
        const pos=positions[key];pos.divIncome+=da.gross;pos.divNet+=da.net;addCash(cur,da.net);
      }else if(type==='FEE'||type==='TAX'){
        const amount=tx.amount;if(!finite(amount)||amount<0){warnings.push({index,code:'LEDGER-CHARGE-INVALID',message:`Invalid ${type} amount skipped.`});return;}
        if(key&&positions[key])positions[key].fees+=amount;addCash(cur,-amount);
      }else if(type==='DEPOSIT'){
        const amount=tx.amount;if(!finite(amount)||amount<0){warnings.push({index,code:'LEDGER-DEPOSIT-INVALID',message:'Invalid DEPOSIT amount skipped.'});return;}addCash(cur,amount);
      }else if(type==='WITHDRAWAL'){
        const amount=tx.amount;
        if(!finite(amount)||amount>0){warnings.push({index,code:'LEDGER-WITHDRAWAL-INVALID',message:'WITHDRAWAL amount must be zero or negative; transaction skipped.'});return;}
        addCash(cur,amount);
      }else if(type==='SPLIT'){
        const pos=key?positions[key]:null;
        const supplied=has(tx,'splitRatio')?tx.splitRatio:(has(tx,'price')?tx.price:null);
        const ratio=supplied==null?2:supplied;
        if(!pos||!finite(ratio)||ratio<=0){warnings.push({index,code:'LEDGER-SPLIT-INVALID',message:'Invalid SPLIT transaction skipped.'});return;}
        pos.quantity*=ratio;pos.avgCost=pos.quantity>EPS?pos.costBasis/pos.quantity:0;
      }else warnings.push({index,code:'LEDGER-TYPE-UNSUPPORTED',message:`Unsupported transaction type ${type}.`});
    });
    return {positions,cash,warnings,processed:txs.length};
  }

  function positionBaseValue(position,price,fxRate){
    if(!position||!finite(position.quantity)||position.quantity<0||!finite(price)||price<0||!finite(fxRate)||fxRate<=0)return null;
    const value=position.quantity*price*fxRate;return finite(value)?value:null;
  }
  function positionUnrealized(position,price){
    if(!position)return null;const qty=finite(position.quantity)?position.quantity:position.qty;
    if(!finite(qty)||qty<0||!finite(position.costBasis)||!finite(price)||price<0)return null;
    const marketValue=qty*price,unrealizedPnl=marketValue-position.costBasis;
    return {marketValue,unrealizedPnl,returnOnCost:safeDivide(unrealizedPnl,position.costBasis)};
  }

  function marketValueSummary(entries){
    if(!Array.isArray(entries))return null;
    let mv=0,cost=0,unreal=0,localUnrealized=0,fxUnrealized=0,missingFx=0,missingPrice=0;
    for(const e of entries){
      if(!e||!e.position){missingPrice++;continue;}
      const p=e.position;
      if(!finite(e.price)||e.price<0){missingPrice++;continue;}
      if(!finite(e.fxRate)||e.fxRate<=0){missingFx++;continue;}
      const fxBasis=p.fxBasis==null?1:p.fxBasis;
      if(!finite(p.quantity)||p.quantity<0||!finite(p.costBasis)||!finite(fxBasis)||fxBasis<=0)return null;
      const localMV=p.quantity*e.price,baseMV=localMV*e.fxRate,baseCost=p.costBasis*fxBasis;
      mv+=baseMV;cost+=baseCost;unreal+=baseMV-baseCost;localUnrealized+=localMV-p.costBasis;fxUnrealized+=p.costBasis*(e.fxRate-fxBasis);
    }
    return {mv,cost,unreal,localUnrealized,fxUnrealized,missingFx,missingPrice,priceCount:entries.length};
  }

  function cashSummary(cashAccounts,fxRates,baseCurrency,invested=0){
    if(!cashAccounts||typeof cashAccounts!=='object'||typeof baseCurrency!=='string'||!finite(invested))return null;
    const localCash={},missingFxCurrencies=[];let cash=0;
    for(const [cur,raw] of Object.entries(cashAccounts)){
      const bal=raw&&typeof raw==='object'?raw.balance:raw;
      if(!finite(bal))return null;localCash[cur]=bal;
      if(cur===baseCurrency)cash+=bal;
      else{
        const rawRate=fxRates&&fxRates[cur];const rate=rawRate&&typeof rawRate==='object'?rawRate.rate:rawRate;
        if(!finite(rate)||rate<=0)missingFxCurrencies.push(cur);else cash+=bal*rate;
      }
    }
    return {cash,localCash,missingFxCurrencies,invested,total:cash+invested};
  }

  return {VERSION,finite,dividendAmounts,sortTransactions,calculateLedger,positionBaseValue,positionUnrealized,marketValueSummary,cashSummary};
});
