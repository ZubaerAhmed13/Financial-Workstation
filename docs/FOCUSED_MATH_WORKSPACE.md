# Focused Math Inventory — workspace

Generated from index.html. Engineering evidence only; not a certification claim.

## function wsDividendAmounts — 1 hit(s)

### line 9607

```js
 9595 |   const t=tx.timestamp||0;
 9596 |   const seq=typeof tx.id==="string"&&tx.id.startsWith("TX-")? tx.id : ("0"+String(tx.id||t));
 9597 |   return String(tx.date||"")+"|"+String(t).padStart(16,"0")+"|"+seq;
 9598 | }
 9599 | function wsSortTransactions(txs){
 9600 |   return (txs||[]).slice().sort((a,b)=>{
 9601 |     const ka=wsTxSortKey(a), kb=wsTxSortKey(b);
 9602 |     return ka<kb?-1:ka>kb?1:0;
 9603 |   });
 9604 | }
 9605 | 
 9606 | /* ---- Dividend: explicit gross/withholding/net (P1 #35-37) ---- */
 9607 | function wsDividendAmounts(tx){
 9608 |   // Method A: sharesHeld * dividendPerShare. Method B: grossDividend (direct).
 9609 |   let gross=null;
 9610 |   if(tx.grossDividend!=null) gross=tx.grossDividend;
 9611 |   else if(tx.sharesHeld!=null&&tx.dividendPerShare!=null) gross=tx.sharesHeld*tx.dividendPerShare;
 9612 |   else if(tx.quantity!=null&&tx.price!=null&&tx.price>1) gross=tx.quantity*tx.price; // legacy fallback, labelled
 9613 |   else if(tx.quantity!=null&&tx.price!=null) gross=tx.quantity*tx.price;
 9614 |   const withholding= tx.withholdingTax!=null? tx.withholdingTax : (tx.tax||0);
 9615 |   const net= gross!=null? gross-withholding : (tx.amount!=null? tx.amount : 0);
 9616 |   return {gross:gross!=null?gross:net, withholding:withholding||0, net};
 9617 | }
 9618 | 
 9619 | /* ---- Independent position calculation engine (P0 #16) ----
 9620 |    Returns a fresh {positions, cash} WITHOUT writing to ws. It is the
 9621 |    single source of truth from the transaction ledger. Callers may
 9622 |    persist its output, but reconciliation compares it against what is
 9623 |    stored rather than overwriting the target first. */
 9624 | function wsCalculateFromLedger(ws, opts){
 9625 |   opts=opts||{};
 9626 |   const base=wsBaseCurrency();
 9627 |   const positions={};
 9628 |   const cash={};
 9629 |   // seed cash from existing account balances only if preserving (for reconciliation seed)
 9630 |   (ws.cashAccounts||{}).forEach&&0;
 9631 |   const txs=wsSortTransactions(ws.transactions||[]);
 9632 |   txs.forEach(tx=>{
 9633 |     const key=tx.security||tx.ticker||null;
 9634 |     const cur=tx.currency||base;
 9635 |     const t=(tx.type||"BUY").toUpperCase();
 9636 |     if(cash[cur]==null) cash[cur]=0;
 9637 |     if(t==="BUY"){
 9638 |       const q=tx.quantity, p=tx.price;
 9639 |       if(!q||q<=0||p==null||p<=0) return;
 9640 |       if(!positions[key]) positions[key]={security:key,ticker:tx.ticker||key,quantity:0,avgCost:0,costBasis:0,realizedPnl:0,divIncome:0,divNet:0,fees:0,currency:cur,costBasisCurrency:cur,fxBasis:(tx.rateAtTrade!=null?tx.rateAtTrade:1)};
 9641 |       const pos=positions[key];
 9642 |       const cost=q*p;
 9643 |       const newQty=pos.quantity+q;
 9644 |       pos.avgCost= newQty>0? (pos.costBasis+cost)/newQty : 0;
 9645 |       pos.costBasis+=cost;
 9646 |       pos.quantity=newQty;
 9647 |       pos.fees+=(tx.fees||0);
 9648 |       // fxBasis = weighted average acquisition FX for cost basis
 9649 |       const fxB=tx.rateAtTrade!=null?tx.rateAtTrade:1;
 9650 |       const prevCost=pos.costBasis-cost;
 9651 |       pos.fxBasis= prevCost+cost>0? ((prevCost*pos.fxBasis)+(cost*fxB))/(prevCost+cost) : fxB;
 9652 |       cash[cur]-=(cost+(tx.fees||0)+(tx.tax||0));
 9653 |     } else if(t==="SELL"){
 9654 |       const q=tx.quantity, p=tx.price;
 9655 |       if(!q||q<=0||p==null||p<=0) return;
 9656 |       if(!positions[key]||positions[key].quantity<=0) return; // reject sell of nothing
 9657 |       const pos=positions[key];
 9658 |       const sellable=Math.min(pos.quantity,q);
 9659 |       const proceeds=q*p; // only cash the actually-sold quantity
 9660 |       const proceedsActual=sellable*p;
 9661 |       const costPortion= pos.quantity>0? pos.costBasis*(sellable/pos.quantity):0;
 9662 |       const sellFx= tx.rateAtTrade!=null? tx.rateAtTrade: pos.fxBasis;
 9663 |       pos.realizedPnl+= proceedsActual-costPortion-(tx.fees||0)-(tx.tax||0);
 9664 |       pos.costBasis-=costPortion;
 9665 |       pos.quantity-=sellable;
 9666 |       pos.fees+=(tx.fees||0);
 9667 |       cash[cur]+=(proceedsActual-(tx.fees||0)-(tx.tax||0));
 9668 |     } else if(t==="DIVIDEND"){
 9669 |       const da=wsDividendAmounts(tx);
 9670 |       if(!positions[key]) positions[key]={security:key,ticker:tx.ticker||key,quantity:0,avgCost:0,costBasis:0,realizedPnl:0,divIncome:0,divNet:0,fees:0,currency:cur,costBasisCurrency:cur,fxBasis:1};
 9671 |       const pos=positions[key];
```

## function wsCalculateFromLedger — 1 hit(s)

### line 9624

```js
 9612 |   else if(tx.quantity!=null&&tx.price!=null&&tx.price>1) gross=tx.quantity*tx.price; // legacy fallback, labelled
 9613 |   else if(tx.quantity!=null&&tx.price!=null) gross=tx.quantity*tx.price;
 9614 |   const withholding= tx.withholdingTax!=null? tx.withholdingTax : (tx.tax||0);
 9615 |   const net= gross!=null? gross-withholding : (tx.amount!=null? tx.amount : 0);
 9616 |   return {gross:gross!=null?gross:net, withholding:withholding||0, net};
 9617 | }
 9618 | 
 9619 | /* ---- Independent position calculation engine (P0 #16) ----
 9620 |    Returns a fresh {positions, cash} WITHOUT writing to ws. It is the
 9621 |    single source of truth from the transaction ledger. Callers may
 9622 |    persist its output, but reconciliation compares it against what is
 9623 |    stored rather than overwriting the target first. */
 9624 | function wsCalculateFromLedger(ws, opts){
 9625 |   opts=opts||{};
 9626 |   const base=wsBaseCurrency();
 9627 |   const positions={};
 9628 |   const cash={};
 9629 |   // seed cash from existing account balances only if preserving (for reconciliation seed)
 9630 |   (ws.cashAccounts||{}).forEach&&0;
 9631 |   const txs=wsSortTransactions(ws.transactions||[]);
 9632 |   txs.forEach(tx=>{
 9633 |     const key=tx.security||tx.ticker||null;
 9634 |     const cur=tx.currency||base;
 9635 |     const t=(tx.type||"BUY").toUpperCase();
 9636 |     if(cash[cur]==null) cash[cur]=0;
 9637 |     if(t==="BUY"){
 9638 |       const q=tx.quantity, p=tx.price;
 9639 |       if(!q||q<=0||p==null||p<=0) return;
 9640 |       if(!positions[key]) positions[key]={security:key,ticker:tx.ticker||key,quantity:0,avgCost:0,costBasis:0,realizedPnl:0,divIncome:0,divNet:0,fees:0,currency:cur,costBasisCurrency:cur,fxBasis:(tx.rateAtTrade!=null?tx.rateAtTrade:1)};
 9641 |       const pos=positions[key];
 9642 |       const cost=q*p;
 9643 |       const newQty=pos.quantity+q;
 9644 |       pos.avgCost= newQty>0? (pos.costBasis+cost)/newQty : 0;
 9645 |       pos.costBasis+=cost;
 9646 |       pos.quantity=newQty;
 9647 |       pos.fees+=(tx.fees||0);
 9648 |       // fxBasis = weighted average acquisition FX for cost basis
 9649 |       const fxB=tx.rateAtTrade!=null?tx.rateAtTrade:1;
 9650 |       const prevCost=pos.costBasis-cost;
 9651 |       pos.fxBasis= prevCost+cost>0? ((prevCost*pos.fxBasis)+(cost*fxB))/(prevCost+cost) : fxB;
 9652 |       cash[cur]-=(cost+(tx.fees||0)+(tx.tax||0));
 9653 |     } else if(t==="SELL"){
 9654 |       const q=tx.quantity, p=tx.price;
 9655 |       if(!q||q<=0||p==null||p<=0) return;
 9656 |       if(!positions[key]||positions[key].quantity<=0) return; // reject sell of nothing
 9657 |       const pos=positions[key];
 9658 |       const sellable=Math.min(pos.quantity,q);
 9659 |       const proceeds=q*p; // only cash the actually-sold quantity
 9660 |       const proceedsActual=sellable*p;
 9661 |       const costPortion= pos.quantity>0? pos.costBasis*(sellable/pos.quantity):0;
 9662 |       const sellFx= tx.rateAtTrade!=null? tx.rateAtTrade: pos.fxBasis;
 9663 |       pos.realizedPnl+= proceedsActual-costPortion-(tx.fees||0)-(tx.tax||0);
 9664 |       pos.costBasis-=costPortion;
 9665 |       pos.quantity-=sellable;
 9666 |       pos.fees+=(tx.fees||0);
 9667 |       cash[cur]+=(proceedsActual-(tx.fees||0)-(tx.tax||0));
 9668 |     } else if(t==="DIVIDEND"){
 9669 |       const da=wsDividendAmounts(tx);
 9670 |       if(!positions[key]) positions[key]={security:key,ticker:tx.ticker||key,quantity:0,avgCost:0,costBasis:0,realizedPnl:0,divIncome:0,divNet:0,fees:0,currency:cur,costBasisCurrency:cur,fxBasis:1};
 9671 |       const pos=positions[key];
 9672 |       pos.divIncome+= da.gross||0;   // gross investment income
 9673 |       pos.divNet+= da.net||0;        // net received
 9674 |       cash[cur]+=(da.net||0);
 9675 |     } else if(t==="FEE"||t==="TAX"){
 9676 |       if(positions[key]) positions[key].fees+=(tx.amount||0);
 9677 |       cash[cur]-=(tx.amount||0);
 9678 |     } else if(t==="DEPOSIT"){
 9679 |       cash[cur]+=(tx.amount||0);
 9680 |     } else if(t==="WITHDRAWAL"){
 9681 |       cash[cur]-=(tx.amount||0);
 9682 |     } else if(t==="SPLIT"){
 9683 |       if(positions[key]){ const ratio=tx.price||2; positions[key].quantity*=ratio; positions[key].avgCost=positions[key].avgCost/ratio; }
 9684 |     }
 9685 |   });
 9686 |   return {positions,cash};
 9687 | }
 9688 | 
```

## function wsFxRateMeta — 1 hit(s)

### line 9704

```js
 9692 |   const calc=wsCalculateFromLedger(ws);
 9693 |   ws.holdings=calc.positions;
 9694 |   const accounts={};
 9695 |   Object.keys(calc.cash).forEach(c=>{ accounts[c]={currency:c,balance:calc.cash[c]}; });
 9696 |   if(!accounts[wsBaseCurrency()]) accounts[wsBaseCurrency()]={currency:wsBaseCurrency(),balance:0};
 9697 |   ws.cashAccounts=accounts;
 9698 |   ws.transactionsCount=(ws.transactions||[]).length;
 9699 |   return calc;
 9700 | }
 9701 | 
 9702 | 
 9703 | /* ---- FX with provenance (P0 #8) ---- */
 9704 | function wsFxRateMeta(currency){
 9705 |   const ws=wsPortfolio();
 9706 |   if(!currency||currency===wsBaseCurrency()) return {rate:1,currencyPair:(wsBaseCurrency()+"→"+wsBaseCurrency()),asOf:null,source:"BASE",rateType:"identity",provenance:"Base currency identity rate"};
 9707 |   const fxs=ws.fxRates||{};
 9708 |   const entry=fxs[currency];
 9709 |   if(entry==null) return null;
 9710 |   // Backward-compatible: a bare number is treated as a manual rate (no provenance).
 9711 |   let rate, meta;
 9712 |   if(typeof entry==="number"||typeof entry==="string"){ rate=Number(entry); meta={}; }
 9713 |   else if(typeof entry==="object"){ rate=entry.rate; meta=entry; }
 9714 |   else return null;
 9715 |   if(rate==null||!isFinite(rate)||rate<=0) return null;
 9716 |   return {rate,currencyPair:(currency+"→"+wsBaseCurrency()),asOf:meta.asOf||null,source:meta.source||"USER PROVIDED (manual)",rateType:meta.rateType||"manual",provenance:"FX rate source: "+(meta.source||"USER PROVIDED (manual)")};
 9717 | }
 9718 | 
 9719 | function wsFxRate(currency){ const m=wsFxRateMeta(currency); return m? m.rate : null; }
 9720 | function wsFxConvert(amount,currency){ const m=wsFxRateMeta(currency); if(!m)return null; return amount*m.rate; }
 9721 | 
 9722 | /* ---- Multi-currency market value + P&L decomposition (P0 #5-7, #12) ---- */
 9723 | function wsMarketValue(){
 9724 |   const ws=wsPortfolio(); const pos=ws.holdings||{};
 9725 |   let baseMV=0, baseCost=0, baseUnrealized=0, localUnrealized=0, fxUnrealized=0, missingFx=0;
 9726 |   Object.keys(pos).forEach(k=>{
 9727 |     const p=pos[k]; const cur=p.currency||wsBaseCurrency();
 9728 |     const pg=wsGetPrice(k, ws);
 9729 |     if(!pg) return; // price MISSING
 9730 |     const price=pg.price;
 9731 |     const fxM=wsFxRateMeta(cur);
 9732 |     if(!fxM){ missingFx++; return; }
 9733 |     const fx=fxM.rate;
 9734 |     const localMV=p.quantity*price;
 9735 |     const baseMVi=localMV*fx;
 9736 |     const baseCosti=p.costBasis*(p.fxBasis!=null?p.fxBasis:1);
 9737 |     const localUni=localMV-p.costBasis;
 9738 |     const fxUni=p.costBasis*((fx-(p.fxBasis!=null?p.fxBasis:1)));
 9739 |     baseMV+=baseMVi; baseCost+=baseCosti; baseUnrealized+=(baseMVi-baseCosti);
 9740 |     localUnrealized+=localUni; fxUnrealized+=fxUni;
 9741 |   });
 9742 |   return {mv:baseMV,cost:baseCost,unreal:baseUnrealized,localUnrealized,fxUnrealized,missingFx,priceCount:Object.keys(pos).length};
 9743 | }
 9744 | 
 9745 | 
 9746 | /* ---- Base-currency position value / weight (P2 #38-39, #12) ---- */
 9747 | function wsPositionBaseValue(k){
 9748 |   const ws=wsPortfolio(); const p=ws.holdings&&ws.holdings[k]; if(!p)return null;
 9749 |   const cur=p.currency||wsBaseCurrency();
 9750 |   const pg=wsGetPrice(k, ws); if(!pg)return null;
 9751 |   const fx=wsFxRate(cur); if(fx==null)return null;
 9752 |   return p.quantity*pg.price*fx;
 9753 | }
 9754 | 
 9755 | function wsWeight(k,portfolioMV){
 9756 |   const base=wsPositionBaseValue(k); if(base==null)return null;
 9757 |   const mv=(portfolioMV!=null?portfolioMV:wsMarketValue().mv);
 9758 |   return mv>0? base/mv : 0;
 9759 | }
 9760 | 
 9761 | /* ---- Multi-currency cash consolidation (P0 #9-11) ---- */
 9762 | function wsCashSummary(){
 9763 |   const ws=wsPortfolio(); const base=wsBaseCurrency();
 9764 |   const localCash={}; let baseCash=0, missingFxCurrencies=[];
 9765 |   Object.keys(ws.cashAccounts||{}).forEach(c=>{
 9766 |     const bal=ws.cashAccounts[c].balance||0; localCash[c]=bal;
 9767 |     if(c===base){ baseCash+=bal; }
 9768 |     else { const fx=wsFxRate(c); if(fx==null){ missingFxCurrencies.push(c); } else { baseCash+=bal*fx; } }
```

## function wsFxConvert — 1 hit(s)

### line 9720

```js
 9708 |   const entry=fxs[currency];
 9709 |   if(entry==null) return null;
 9710 |   // Backward-compatible: a bare number is treated as a manual rate (no provenance).
 9711 |   let rate, meta;
 9712 |   if(typeof entry==="number"||typeof entry==="string"){ rate=Number(entry); meta={}; }
 9713 |   else if(typeof entry==="object"){ rate=entry.rate; meta=entry; }
 9714 |   else return null;
 9715 |   if(rate==null||!isFinite(rate)||rate<=0) return null;
 9716 |   return {rate,currencyPair:(currency+"→"+wsBaseCurrency()),asOf:meta.asOf||null,source:meta.source||"USER PROVIDED (manual)",rateType:meta.rateType||"manual",provenance:"FX rate source: "+(meta.source||"USER PROVIDED (manual)")};
 9717 | }
 9718 | 
 9719 | function wsFxRate(currency){ const m=wsFxRateMeta(currency); return m? m.rate : null; }
 9720 | function wsFxConvert(amount,currency){ const m=wsFxRateMeta(currency); if(!m)return null; return amount*m.rate; }
 9721 | 
 9722 | /* ---- Multi-currency market value + P&L decomposition (P0 #5-7, #12) ---- */
 9723 | function wsMarketValue(){
 9724 |   const ws=wsPortfolio(); const pos=ws.holdings||{};
 9725 |   let baseMV=0, baseCost=0, baseUnrealized=0, localUnrealized=0, fxUnrealized=0, missingFx=0;
 9726 |   Object.keys(pos).forEach(k=>{
 9727 |     const p=pos[k]; const cur=p.currency||wsBaseCurrency();
 9728 |     const pg=wsGetPrice(k, ws);
 9729 |     if(!pg) return; // price MISSING
 9730 |     const price=pg.price;
 9731 |     const fxM=wsFxRateMeta(cur);
 9732 |     if(!fxM){ missingFx++; return; }
 9733 |     const fx=fxM.rate;
 9734 |     const localMV=p.quantity*price;
 9735 |     const baseMVi=localMV*fx;
 9736 |     const baseCosti=p.costBasis*(p.fxBasis!=null?p.fxBasis:1);
 9737 |     const localUni=localMV-p.costBasis;
 9738 |     const fxUni=p.costBasis*((fx-(p.fxBasis!=null?p.fxBasis:1)));
 9739 |     baseMV+=baseMVi; baseCost+=baseCosti; baseUnrealized+=(baseMVi-baseCosti);
 9740 |     localUnrealized+=localUni; fxUnrealized+=fxUni;
 9741 |   });
 9742 |   return {mv:baseMV,cost:baseCost,unreal:baseUnrealized,localUnrealized,fxUnrealized,missingFx,priceCount:Object.keys(pos).length};
 9743 | }
 9744 | 
 9745 | 
 9746 | /* ---- Base-currency position value / weight (P2 #38-39, #12) ---- */
 9747 | function wsPositionBaseValue(k){
 9748 |   const ws=wsPortfolio(); const p=ws.holdings&&ws.holdings[k]; if(!p)return null;
 9749 |   const cur=p.currency||wsBaseCurrency();
 9750 |   const pg=wsGetPrice(k, ws); if(!pg)return null;
 9751 |   const fx=wsFxRate(cur); if(fx==null)return null;
 9752 |   return p.quantity*pg.price*fx;
 9753 | }
 9754 | 
 9755 | function wsWeight(k,portfolioMV){
 9756 |   const base=wsPositionBaseValue(k); if(base==null)return null;
 9757 |   const mv=(portfolioMV!=null?portfolioMV:wsMarketValue().mv);
 9758 |   return mv>0? base/mv : 0;
 9759 | }
 9760 | 
 9761 | /* ---- Multi-currency cash consolidation (P0 #9-11) ---- */
 9762 | function wsCashSummary(){
 9763 |   const ws=wsPortfolio(); const base=wsBaseCurrency();
 9764 |   const localCash={}; let baseCash=0, missingFxCurrencies=[];
 9765 |   Object.keys(ws.cashAccounts||{}).forEach(c=>{
 9766 |     const bal=ws.cashAccounts[c].balance||0; localCash[c]=bal;
 9767 |     if(c===base){ baseCash+=bal; }
 9768 |     else { const fx=wsFxRate(c); if(fx==null){ missingFxCurrencies.push(c); } else { baseCash+=bal*fx; } }
 9769 |   });
 9770 |   const mv=wsMarketValue();
 9771 |   return {cash:baseCash, localCash, missingFxCurrencies, invested:mv.mv, total:baseCash+mv.mv};
 9772 | }
 9773 | 
 9774 | /* ---- Rebalancing in base currency (P0 #12) ---- */
 9775 | function wsRebalance(){
 9776 |   const ws=wsPortfolio(); const mv=wsMarketValue();
 9777 |   const items=Object.keys(ws.holdings||{}).map(k=>{
 9778 |     const baseVal=wsPositionBaseValue(k); if(baseVal==null)return null;
 9779 |     const cur= mv.mv>0? baseVal/mv.mv:0;
 9780 |     const tw=ws.targetWeights&&ws.targetWeights[k]? ws.targetWeights[k]:null;
 9781 |     return {security:k,ticker:(ws.holdings[k]||{}).ticker,cur,val:baseVal,target:tw?tw.target:null,min:tw?tw.min:null,max:tw?tw.max:null,
 9782 |       drift: tw&&tw.target!=null? cur-tw.target:null,
 9783 |       status: tw&&tw.target!=null? (cur>(tw.max??1)?"OVERWEIGHT":cur<(tw.min??0)?"UNDERWEIGHT":"IN RANGE"):"—",
 9784 |       suggestedChange: tw&&tw.target!=null? (tw.target-cur)*mv.mv:null};
```

## function wsMarketValue — 1 hit(s)

### line 9723

```js
 9711 |   let rate, meta;
 9712 |   if(typeof entry==="number"||typeof entry==="string"){ rate=Number(entry); meta={}; }
 9713 |   else if(typeof entry==="object"){ rate=entry.rate; meta=entry; }
 9714 |   else return null;
 9715 |   if(rate==null||!isFinite(rate)||rate<=0) return null;
 9716 |   return {rate,currencyPair:(currency+"→"+wsBaseCurrency()),asOf:meta.asOf||null,source:meta.source||"USER PROVIDED (manual)",rateType:meta.rateType||"manual",provenance:"FX rate source: "+(meta.source||"USER PROVIDED (manual)")};
 9717 | }
 9718 | 
 9719 | function wsFxRate(currency){ const m=wsFxRateMeta(currency); return m? m.rate : null; }
 9720 | function wsFxConvert(amount,currency){ const m=wsFxRateMeta(currency); if(!m)return null; return amount*m.rate; }
 9721 | 
 9722 | /* ---- Multi-currency market value + P&L decomposition (P0 #5-7, #12) ---- */
 9723 | function wsMarketValue(){
 9724 |   const ws=wsPortfolio(); const pos=ws.holdings||{};
 9725 |   let baseMV=0, baseCost=0, baseUnrealized=0, localUnrealized=0, fxUnrealized=0, missingFx=0;
 9726 |   Object.keys(pos).forEach(k=>{
 9727 |     const p=pos[k]; const cur=p.currency||wsBaseCurrency();
 9728 |     const pg=wsGetPrice(k, ws);
 9729 |     if(!pg) return; // price MISSING
 9730 |     const price=pg.price;
 9731 |     const fxM=wsFxRateMeta(cur);
 9732 |     if(!fxM){ missingFx++; return; }
 9733 |     const fx=fxM.rate;
 9734 |     const localMV=p.quantity*price;
 9735 |     const baseMVi=localMV*fx;
 9736 |     const baseCosti=p.costBasis*(p.fxBasis!=null?p.fxBasis:1);
 9737 |     const localUni=localMV-p.costBasis;
 9738 |     const fxUni=p.costBasis*((fx-(p.fxBasis!=null?p.fxBasis:1)));
 9739 |     baseMV+=baseMVi; baseCost+=baseCosti; baseUnrealized+=(baseMVi-baseCosti);
 9740 |     localUnrealized+=localUni; fxUnrealized+=fxUni;
 9741 |   });
 9742 |   return {mv:baseMV,cost:baseCost,unreal:baseUnrealized,localUnrealized,fxUnrealized,missingFx,priceCount:Object.keys(pos).length};
 9743 | }
 9744 | 
 9745 | 
 9746 | /* ---- Base-currency position value / weight (P2 #38-39, #12) ---- */
 9747 | function wsPositionBaseValue(k){
 9748 |   const ws=wsPortfolio(); const p=ws.holdings&&ws.holdings[k]; if(!p)return null;
 9749 |   const cur=p.currency||wsBaseCurrency();
 9750 |   const pg=wsGetPrice(k, ws); if(!pg)return null;
 9751 |   const fx=wsFxRate(cur); if(fx==null)return null;
 9752 |   return p.quantity*pg.price*fx;
 9753 | }
 9754 | 
 9755 | function wsWeight(k,portfolioMV){
 9756 |   const base=wsPositionBaseValue(k); if(base==null)return null;
 9757 |   const mv=(portfolioMV!=null?portfolioMV:wsMarketValue().mv);
 9758 |   return mv>0? base/mv : 0;
 9759 | }
 9760 | 
 9761 | /* ---- Multi-currency cash consolidation (P0 #9-11) ---- */
 9762 | function wsCashSummary(){
 9763 |   const ws=wsPortfolio(); const base=wsBaseCurrency();
 9764 |   const localCash={}; let baseCash=0, missingFxCurrencies=[];
 9765 |   Object.keys(ws.cashAccounts||{}).forEach(c=>{
 9766 |     const bal=ws.cashAccounts[c].balance||0; localCash[c]=bal;
 9767 |     if(c===base){ baseCash+=bal; }
 9768 |     else { const fx=wsFxRate(c); if(fx==null){ missingFxCurrencies.push(c); } else { baseCash+=bal*fx; } }
 9769 |   });
 9770 |   const mv=wsMarketValue();
 9771 |   return {cash:baseCash, localCash, missingFxCurrencies, invested:mv.mv, total:baseCash+mv.mv};
 9772 | }
 9773 | 
 9774 | /* ---- Rebalancing in base currency (P0 #12) ---- */
 9775 | function wsRebalance(){
 9776 |   const ws=wsPortfolio(); const mv=wsMarketValue();
 9777 |   const items=Object.keys(ws.holdings||{}).map(k=>{
 9778 |     const baseVal=wsPositionBaseValue(k); if(baseVal==null)return null;
 9779 |     const cur= mv.mv>0? baseVal/mv.mv:0;
 9780 |     const tw=ws.targetWeights&&ws.targetWeights[k]? ws.targetWeights[k]:null;
 9781 |     return {security:k,ticker:(ws.holdings[k]||{}).ticker,cur,val:baseVal,target:tw?tw.target:null,min:tw?tw.min:null,max:tw?tw.max:null,
 9782 |       drift: tw&&tw.target!=null? cur-tw.target:null,
 9783 |       status: tw&&tw.target!=null? (cur>(tw.max??1)?"OVERWEIGHT":cur<(tw.min??0)?"UNDERWEIGHT":"IN RANGE"):"—",
 9784 |       suggestedChange: tw&&tw.target!=null? (tw.target-cur)*mv.mv:null};
 9785 |   }).filter(Boolean);
 9786 |   const proposals=items.filter(i=>i.target!=null&&i.drift!=null&&Math.abs(i.drift)>0.01);
 9787 |   ws.rebalanceProposals=proposals;
```

## function wsPositionBaseValue — 1 hit(s)

### line 9747

```js
 9735 |     const baseMVi=localMV*fx;
 9736 |     const baseCosti=p.costBasis*(p.fxBasis!=null?p.fxBasis:1);
 9737 |     const localUni=localMV-p.costBasis;
 9738 |     const fxUni=p.costBasis*((fx-(p.fxBasis!=null?p.fxBasis:1)));
 9739 |     baseMV+=baseMVi; baseCost+=baseCosti; baseUnrealized+=(baseMVi-baseCosti);
 9740 |     localUnrealized+=localUni; fxUnrealized+=fxUni;
 9741 |   });
 9742 |   return {mv:baseMV,cost:baseCost,unreal:baseUnrealized,localUnrealized,fxUnrealized,missingFx,priceCount:Object.keys(pos).length};
 9743 | }
 9744 | 
 9745 | 
 9746 | /* ---- Base-currency position value / weight (P2 #38-39, #12) ---- */
 9747 | function wsPositionBaseValue(k){
 9748 |   const ws=wsPortfolio(); const p=ws.holdings&&ws.holdings[k]; if(!p)return null;
 9749 |   const cur=p.currency||wsBaseCurrency();
 9750 |   const pg=wsGetPrice(k, ws); if(!pg)return null;
 9751 |   const fx=wsFxRate(cur); if(fx==null)return null;
 9752 |   return p.quantity*pg.price*fx;
 9753 | }
 9754 | 
 9755 | function wsWeight(k,portfolioMV){
 9756 |   const base=wsPositionBaseValue(k); if(base==null)return null;
 9757 |   const mv=(portfolioMV!=null?portfolioMV:wsMarketValue().mv);
 9758 |   return mv>0? base/mv : 0;
 9759 | }
 9760 | 
 9761 | /* ---- Multi-currency cash consolidation (P0 #9-11) ---- */
 9762 | function wsCashSummary(){
 9763 |   const ws=wsPortfolio(); const base=wsBaseCurrency();
 9764 |   const localCash={}; let baseCash=0, missingFxCurrencies=[];
 9765 |   Object.keys(ws.cashAccounts||{}).forEach(c=>{
 9766 |     const bal=ws.cashAccounts[c].balance||0; localCash[c]=bal;
 9767 |     if(c===base){ baseCash+=bal; }
 9768 |     else { const fx=wsFxRate(c); if(fx==null){ missingFxCurrencies.push(c); } else { baseCash+=bal*fx; } }
 9769 |   });
 9770 |   const mv=wsMarketValue();
 9771 |   return {cash:baseCash, localCash, missingFxCurrencies, invested:mv.mv, total:baseCash+mv.mv};
 9772 | }
 9773 | 
 9774 | /* ---- Rebalancing in base currency (P0 #12) ---- */
 9775 | function wsRebalance(){
 9776 |   const ws=wsPortfolio(); const mv=wsMarketValue();
 9777 |   const items=Object.keys(ws.holdings||{}).map(k=>{
 9778 |     const baseVal=wsPositionBaseValue(k); if(baseVal==null)return null;
 9779 |     const cur= mv.mv>0? baseVal/mv.mv:0;
 9780 |     const tw=ws.targetWeights&&ws.targetWeights[k]? ws.targetWeights[k]:null;
 9781 |     return {security:k,ticker:(ws.holdings[k]||{}).ticker,cur,val:baseVal,target:tw?tw.target:null,min:tw?tw.min:null,max:tw?tw.max:null,
 9782 |       drift: tw&&tw.target!=null? cur-tw.target:null,
 9783 |       status: tw&&tw.target!=null? (cur>(tw.max??1)?"OVERWEIGHT":cur<(tw.min??0)?"UNDERWEIGHT":"IN RANGE"):"—",
 9784 |       suggestedChange: tw&&tw.target!=null? (tw.target-cur)*mv.mv:null};
 9785 |   }).filter(Boolean);
 9786 |   const proposals=items.filter(i=>i.target!=null&&i.drift!=null&&Math.abs(i.drift)>0.01);
 9787 |   ws.rebalanceProposals=proposals;
 9788 |   return {items,proposals,mv};
 9789 | }
 9790 | 
 9791 | 
 9792 | /* ---- Rebalancing in base currency (P0 #12) ---- */
 9793 | 
 9794 | /* ---- Independent reconciliation (P0 #16-18) ---- */
 9795 | function wsReconcile(){
 9796 |   const ws=wsPortfolio();
 9797 |   const calc=wsCalculateFromLedger(ws);
 9798 |   const derived=calc.positions;
 9799 |   const held=ws.holdings||{};
 9800 |   const issues=[];
 9801 |   Object.keys(derived).forEach(k=>{
 9802 |     const d=derived[k], h=held[k];
 9803 |     if(!h){ issues.push({sev:"warning",text:"Position "+k+" exists in ledger but not in stored holdings."}); return; }
 9804 |     if(Math.abs(h.quantity-d.quantity)>ReconciliationConfig.quantityTolerance) issues.push({sev:"warning",text:"Qty mismatch "+k+": holdings "+h.quantity+" vs ledger "+d.quantity});
 9805 |     if(Math.abs((h.costBasis||0)-(d.costBasis||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Cost basis mismatch "+k});
 9806 |     if(Math.abs((h.realizedPnl||0)-(d.realizedPnl||0))>ReconciliationConfig.pnlTolerance) issues.push({sev:"warning",text:"Realized P&L mismatch "+k});
 9807 |     if(Math.abs((h.divIncome||0)-(d.divIncome||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Dividend mismatch "+k});
 9808 |     if(Math.abs((h.fees||0)-(d.fees||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Fees mismatch "+k});
 9809 |   });
 9810 |   Object.keys(held).forEach(k=>{ if(!derived[k]&&held[k].quantity>0) issues.push({sev:"warning",text:"Holding "+k+" has no ledger transactions"}); });
 9811 |   Object.keys(calc.cash).forEach(c=>{
```

## function wsCashSummary — 1 hit(s)

### line 9762

```js
 9750 |   const pg=wsGetPrice(k, ws); if(!pg)return null;
 9751 |   const fx=wsFxRate(cur); if(fx==null)return null;
 9752 |   return p.quantity*pg.price*fx;
 9753 | }
 9754 | 
 9755 | function wsWeight(k,portfolioMV){
 9756 |   const base=wsPositionBaseValue(k); if(base==null)return null;
 9757 |   const mv=(portfolioMV!=null?portfolioMV:wsMarketValue().mv);
 9758 |   return mv>0? base/mv : 0;
 9759 | }
 9760 | 
 9761 | /* ---- Multi-currency cash consolidation (P0 #9-11) ---- */
 9762 | function wsCashSummary(){
 9763 |   const ws=wsPortfolio(); const base=wsBaseCurrency();
 9764 |   const localCash={}; let baseCash=0, missingFxCurrencies=[];
 9765 |   Object.keys(ws.cashAccounts||{}).forEach(c=>{
 9766 |     const bal=ws.cashAccounts[c].balance||0; localCash[c]=bal;
 9767 |     if(c===base){ baseCash+=bal; }
 9768 |     else { const fx=wsFxRate(c); if(fx==null){ missingFxCurrencies.push(c); } else { baseCash+=bal*fx; } }
 9769 |   });
 9770 |   const mv=wsMarketValue();
 9771 |   return {cash:baseCash, localCash, missingFxCurrencies, invested:mv.mv, total:baseCash+mv.mv};
 9772 | }
 9773 | 
 9774 | /* ---- Rebalancing in base currency (P0 #12) ---- */
 9775 | function wsRebalance(){
 9776 |   const ws=wsPortfolio(); const mv=wsMarketValue();
 9777 |   const items=Object.keys(ws.holdings||{}).map(k=>{
 9778 |     const baseVal=wsPositionBaseValue(k); if(baseVal==null)return null;
 9779 |     const cur= mv.mv>0? baseVal/mv.mv:0;
 9780 |     const tw=ws.targetWeights&&ws.targetWeights[k]? ws.targetWeights[k]:null;
 9781 |     return {security:k,ticker:(ws.holdings[k]||{}).ticker,cur,val:baseVal,target:tw?tw.target:null,min:tw?tw.min:null,max:tw?tw.max:null,
 9782 |       drift: tw&&tw.target!=null? cur-tw.target:null,
 9783 |       status: tw&&tw.target!=null? (cur>(tw.max??1)?"OVERWEIGHT":cur<(tw.min??0)?"UNDERWEIGHT":"IN RANGE"):"—",
 9784 |       suggestedChange: tw&&tw.target!=null? (tw.target-cur)*mv.mv:null};
 9785 |   }).filter(Boolean);
 9786 |   const proposals=items.filter(i=>i.target!=null&&i.drift!=null&&Math.abs(i.drift)>0.01);
 9787 |   ws.rebalanceProposals=proposals;
 9788 |   return {items,proposals,mv};
 9789 | }
 9790 | 
 9791 | 
 9792 | /* ---- Rebalancing in base currency (P0 #12) ---- */
 9793 | 
 9794 | /* ---- Independent reconciliation (P0 #16-18) ---- */
 9795 | function wsReconcile(){
 9796 |   const ws=wsPortfolio();
 9797 |   const calc=wsCalculateFromLedger(ws);
 9798 |   const derived=calc.positions;
 9799 |   const held=ws.holdings||{};
 9800 |   const issues=[];
 9801 |   Object.keys(derived).forEach(k=>{
 9802 |     const d=derived[k], h=held[k];
 9803 |     if(!h){ issues.push({sev:"warning",text:"Position "+k+" exists in ledger but not in stored holdings."}); return; }
 9804 |     if(Math.abs(h.quantity-d.quantity)>ReconciliationConfig.quantityTolerance) issues.push({sev:"warning",text:"Qty mismatch "+k+": holdings "+h.quantity+" vs ledger "+d.quantity});
 9805 |     if(Math.abs((h.costBasis||0)-(d.costBasis||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Cost basis mismatch "+k});
 9806 |     if(Math.abs((h.realizedPnl||0)-(d.realizedPnl||0))>ReconciliationConfig.pnlTolerance) issues.push({sev:"warning",text:"Realized P&L mismatch "+k});
 9807 |     if(Math.abs((h.divIncome||0)-(d.divIncome||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Dividend mismatch "+k});
 9808 |     if(Math.abs((h.fees||0)-(d.fees||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Fees mismatch "+k});
 9809 |   });
 9810 |   Object.keys(held).forEach(k=>{ if(!derived[k]&&held[k].quantity>0) issues.push({sev:"warning",text:"Holding "+k+" has no ledger transactions"}); });
 9811 |   Object.keys(calc.cash).forEach(c=>{
 9812 |     const stored=(ws.cashAccounts&&ws.cashAccounts[c]&&ws.cashAccounts[c].balance)||0;
 9813 |     if(Math.abs(stored-calc.cash[c])>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Cash mismatch ("+c+"): stored "+stored+" vs ledger "+calc.cash[c]});
 9814 |   });
 9815 |   ws.portfolioRecon={ok:issues.length===0,issues,derivedCount:Object.keys(derived).length,txCount:(ws.transactions||[]).length,tolerances:ReconciliationConfig};
 9816 |   return ws.portfolioRecon;
 9817 | }
 9818 | 
 9819 | const ReconciliationConfig={ quantityTolerance:1e-6, currencyTolerance:0.01, pnlTolerance:0.01, fxTolerance:1e-6,
 9820 |   _reason:function(){ return "quantityTolerance: share-count floating error; currencyTolerance: ±0.01 rounding on cash/P&L; pnlTolerance: ±0.01 on realized/unrealized; fxTolerance: rate rounding."; } };
 9821 | 
 9822 | /* ---- Transaction validation (P0 #14, #13) ---- */
 9823 | function wsValidateTransaction(tx){
 9824 |   const errors=[];
 9825 |   if(!tx) return {ok:false,errors:["Transaction is empty."]};
 9826 |   if(!tx.date||isNaN(new Date(tx.date).getTime())) errors.push("Trade date must be a valid date.");
```

## function wsReconcile — 1 hit(s)

### line 9795

```js
 9783 |       status: tw&&tw.target!=null? (cur>(tw.max??1)?"OVERWEIGHT":cur<(tw.min??0)?"UNDERWEIGHT":"IN RANGE"):"—",
 9784 |       suggestedChange: tw&&tw.target!=null? (tw.target-cur)*mv.mv:null};
 9785 |   }).filter(Boolean);
 9786 |   const proposals=items.filter(i=>i.target!=null&&i.drift!=null&&Math.abs(i.drift)>0.01);
 9787 |   ws.rebalanceProposals=proposals;
 9788 |   return {items,proposals,mv};
 9789 | }
 9790 | 
 9791 | 
 9792 | /* ---- Rebalancing in base currency (P0 #12) ---- */
 9793 | 
 9794 | /* ---- Independent reconciliation (P0 #16-18) ---- */
 9795 | function wsReconcile(){
 9796 |   const ws=wsPortfolio();
 9797 |   const calc=wsCalculateFromLedger(ws);
 9798 |   const derived=calc.positions;
 9799 |   const held=ws.holdings||{};
 9800 |   const issues=[];
 9801 |   Object.keys(derived).forEach(k=>{
 9802 |     const d=derived[k], h=held[k];
 9803 |     if(!h){ issues.push({sev:"warning",text:"Position "+k+" exists in ledger but not in stored holdings."}); return; }
 9804 |     if(Math.abs(h.quantity-d.quantity)>ReconciliationConfig.quantityTolerance) issues.push({sev:"warning",text:"Qty mismatch "+k+": holdings "+h.quantity+" vs ledger "+d.quantity});
 9805 |     if(Math.abs((h.costBasis||0)-(d.costBasis||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Cost basis mismatch "+k});
 9806 |     if(Math.abs((h.realizedPnl||0)-(d.realizedPnl||0))>ReconciliationConfig.pnlTolerance) issues.push({sev:"warning",text:"Realized P&L mismatch "+k});
 9807 |     if(Math.abs((h.divIncome||0)-(d.divIncome||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Dividend mismatch "+k});
 9808 |     if(Math.abs((h.fees||0)-(d.fees||0))>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Fees mismatch "+k});
 9809 |   });
 9810 |   Object.keys(held).forEach(k=>{ if(!derived[k]&&held[k].quantity>0) issues.push({sev:"warning",text:"Holding "+k+" has no ledger transactions"}); });
 9811 |   Object.keys(calc.cash).forEach(c=>{
 9812 |     const stored=(ws.cashAccounts&&ws.cashAccounts[c]&&ws.cashAccounts[c].balance)||0;
 9813 |     if(Math.abs(stored-calc.cash[c])>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Cash mismatch ("+c+"): stored "+stored+" vs ledger "+calc.cash[c]});
 9814 |   });
 9815 |   ws.portfolioRecon={ok:issues.length===0,issues,derivedCount:Object.keys(derived).length,txCount:(ws.transactions||[]).length,tolerances:ReconciliationConfig};
 9816 |   return ws.portfolioRecon;
 9817 | }
 9818 | 
 9819 | const ReconciliationConfig={ quantityTolerance:1e-6, currencyTolerance:0.01, pnlTolerance:0.01, fxTolerance:1e-6,
 9820 |   _reason:function(){ return "quantityTolerance: share-count floating error; currencyTolerance: ±0.01 rounding on cash/P&L; pnlTolerance: ±0.01 on realized/unrealized; fxTolerance: rate rounding."; } };
 9821 | 
 9822 | /* ---- Transaction validation (P0 #14, #13) ---- */
 9823 | function wsValidateTransaction(tx){
 9824 |   const errors=[];
 9825 |   if(!tx) return {ok:false,errors:["Transaction is empty."]};
 9826 |   if(!tx.date||isNaN(new Date(tx.date).getTime())) errors.push("Trade date must be a valid date.");
 9827 |   const t=(tx.type||"").toUpperCase();
 9828 |   if(!WS_TYPES.includes(t)) errors.push("Unknown transaction type: "+(tx.type||""));
 9829 |   const cur=tx.currency||wsBaseCurrency();
 9830 |   if(!VALID_CURRENCIES.includes(cur)) errors.push("Unsupported currency: "+cur);
 9831 |   if(t==="BUY"){
 9832 |     if(!(tx.quantity>0)) errors.push("BUY quantity must be greater than zero.");
 9833 |     if(!(tx.price>0)) errors.push("BUY price must be greater than zero.");
 9834 |   } else if(t==="SELL"){
 9835 |     if(!(tx.quantity>0)) errors.push("SELL quantity must be greater than zero.");
 9836 |     if(!(tx.price>0)) errors.push("SELL price must be greater than zero.");
 9837 |     const ws=wsPortfolio(); const calc=wsCalculateFromLedger(ws);
 9838 |     const avail= calc.positions[tx.security||tx.ticker]? calc.positions[tx.security||tx.ticker].quantity : 0;
 9839 |     if(tx.quantity>avail+ReconciliationConfig.quantityTolerance) errors.push("SELL quantity "+tx.quantity+" exceeds available quantity "+avail+".");
 9840 |   } else if(t==="DIVIDEND"){
 9841 |     // Method A or B required
 9842 |     const hasA=tx.sharesHeld!=null&&tx.dividendPerShare!=null;
 9843 |     const hasB=tx.grossDividend!=null;
 9844 |     if(!hasA&&!hasB && !(tx.quantity!=null&&tx.price!=null)) errors.push("Dividend requires shares + dividend per share, or a gross dividend amount.");
 9845 |   } else if(t==="DEPOSIT"||t==="WITHDRAWAL"||t==="FEE"||t==="TAX"){
 9846 |     if(!(tx.amount!=null)) errors.push(t+" requires an amount.");
 9847 |     if(t==="DEPOSIT"&&tx.amount<0) errors.push("Deposit amount must be positive.");
 9848 |     if(t==="WITHDRAWAL"&&tx.amount>0) errors.push("Withdrawal amount must be negative.");
 9849 |   }
 9850 |   return {ok:errors.length===0, errors};
 9851 | }
 9852 | 
 9853 | /* ============================================================
 9854 |    V7 — PORTFOLIO OPERATIONS LAYER
 9855 |    Transactions, Holdings, Positions, P&L, Cash, FX, Target
 9856 |    Weights, Rebalancing, Reconciliation.
 9857 |    Positions are derived from transactions (single source of truth).
 9858 |    ============================================================ */
 9859 | 
```

## function wsValidateTransaction — 1 hit(s)

### line 9823

```js
 9811 |   Object.keys(calc.cash).forEach(c=>{
 9812 |     const stored=(ws.cashAccounts&&ws.cashAccounts[c]&&ws.cashAccounts[c].balance)||0;
 9813 |     if(Math.abs(stored-calc.cash[c])>ReconciliationConfig.currencyTolerance) issues.push({sev:"warning",text:"Cash mismatch ("+c+"): stored "+stored+" vs ledger "+calc.cash[c]});
 9814 |   });
 9815 |   ws.portfolioRecon={ok:issues.length===0,issues,derivedCount:Object.keys(derived).length,txCount:(ws.transactions||[]).length,tolerances:ReconciliationConfig};
 9816 |   return ws.portfolioRecon;
 9817 | }
 9818 | 
 9819 | const ReconciliationConfig={ quantityTolerance:1e-6, currencyTolerance:0.01, pnlTolerance:0.01, fxTolerance:1e-6,
 9820 |   _reason:function(){ return "quantityTolerance: share-count floating error; currencyTolerance: ±0.01 rounding on cash/P&L; pnlTolerance: ±0.01 on realized/unrealized; fxTolerance: rate rounding."; } };
 9821 | 
 9822 | /* ---- Transaction validation (P0 #14, #13) ---- */
 9823 | function wsValidateTransaction(tx){
 9824 |   const errors=[];
 9825 |   if(!tx) return {ok:false,errors:["Transaction is empty."]};
 9826 |   if(!tx.date||isNaN(new Date(tx.date).getTime())) errors.push("Trade date must be a valid date.");
 9827 |   const t=(tx.type||"").toUpperCase();
 9828 |   if(!WS_TYPES.includes(t)) errors.push("Unknown transaction type: "+(tx.type||""));
 9829 |   const cur=tx.currency||wsBaseCurrency();
 9830 |   if(!VALID_CURRENCIES.includes(cur)) errors.push("Unsupported currency: "+cur);
 9831 |   if(t==="BUY"){
 9832 |     if(!(tx.quantity>0)) errors.push("BUY quantity must be greater than zero.");
 9833 |     if(!(tx.price>0)) errors.push("BUY price must be greater than zero.");
 9834 |   } else if(t==="SELL"){
 9835 |     if(!(tx.quantity>0)) errors.push("SELL quantity must be greater than zero.");
 9836 |     if(!(tx.price>0)) errors.push("SELL price must be greater than zero.");
 9837 |     const ws=wsPortfolio(); const calc=wsCalculateFromLedger(ws);
 9838 |     const avail= calc.positions[tx.security||tx.ticker]? calc.positions[tx.security||tx.ticker].quantity : 0;
 9839 |     if(tx.quantity>avail+ReconciliationConfig.quantityTolerance) errors.push("SELL quantity "+tx.quantity+" exceeds available quantity "+avail+".");
 9840 |   } else if(t==="DIVIDEND"){
 9841 |     // Method A or B required
 9842 |     const hasA=tx.sharesHeld!=null&&tx.dividendPerShare!=null;
 9843 |     const hasB=tx.grossDividend!=null;
 9844 |     if(!hasA&&!hasB && !(tx.quantity!=null&&tx.price!=null)) errors.push("Dividend requires shares + dividend per share, or a gross dividend amount.");
 9845 |   } else if(t==="DEPOSIT"||t==="WITHDRAWAL"||t==="FEE"||t==="TAX"){
 9846 |     if(!(tx.amount!=null)) errors.push(t+" requires an amount.");
 9847 |     if(t==="DEPOSIT"&&tx.amount<0) errors.push("Deposit amount must be positive.");
 9848 |     if(t==="WITHDRAWAL"&&tx.amount>0) errors.push("Withdrawal amount must be negative.");
 9849 |   }
 9850 |   return {ok:errors.length===0, errors};
 9851 | }
 9852 | 
 9853 | /* ============================================================
 9854 |    V7 — PORTFOLIO OPERATIONS LAYER
 9855 |    Transactions, Holdings, Positions, P&L, Cash, FX, Target
 9856 |    Weights, Rebalancing, Reconciliation.
 9857 |    Positions are derived from transactions (single source of truth).
 9858 |    ============================================================ */
 9859 | 
 9860 | /* ---- State model ---- */
 9861 | function wsDefaultState(){
 9862 |   return {
 9863 |     transactions:[],   // [{id,date,security,ticker,type,quantity,price,currency,fees,tax,reason,thesis,target,strategy}]
 9864 |     holdings:{},       // security -> aggregated position
 9865 |     cashAccounts:{default:{currency:App.state.settings.currency||"EUR",balance:0}},
 9866 |     fxRates:{},        // currency -> rate to base (portfolio currency)
 9867 |     targetWeights:{},  // security -> {target,min,max}
 9868 |     rebalanceProposals:[],
 9869 |     portfolioRecon:{}
 9870 |   };
 9871 | }
 9872 | function wsPortfolio(){
 9873 |   if(!App.state.ws) App.state.ws=wsDefaultState();
 9874 |   return App.state.ws;
 9875 | }
 9876 | function wsBaseCurrency(){ return App.state.settings.currency||"EUR"; }
 9877 | 
 9878 | /* ---- Transaction types ---- */
 9879 | const WS_TYPES=["BUY","SELL","DIVIDEND","FEE","TAX","DEPOSIT","WITHDRAWAL","SPLIT","CORPORATE ACTION"];
 9880 | 
 9881 | /* ---- Position reconciliation: holdings derived from transactions ---- */
 9882 | 
 9883 | /* ---- Market value & unrealized P&L (needs current prices) ---- */
 9884 | function wsUnrealized(security,price){
 9885 |   const p=(wsPortfolio().holdings||{})[security]; if(!p)return null;
 9886 |   return p.quantity*price-p.costBasis;
 9887 | }
```

## function wsUnrealized — 1 hit(s)

### line 9884

```js
 9872 | function wsPortfolio(){
 9873 |   if(!App.state.ws) App.state.ws=wsDefaultState();
 9874 |   return App.state.ws;
 9875 | }
 9876 | function wsBaseCurrency(){ return App.state.settings.currency||"EUR"; }
 9877 | 
 9878 | /* ---- Transaction types ---- */
 9879 | const WS_TYPES=["BUY","SELL","DIVIDEND","FEE","TAX","DEPOSIT","WITHDRAWAL","SPLIT","CORPORATE ACTION"];
 9880 | 
 9881 | /* ---- Position reconciliation: holdings derived from transactions ---- */
 9882 | 
 9883 | /* ---- Market value & unrealized P&L (needs current prices) ---- */
 9884 | function wsUnrealized(security,price){
 9885 |   const p=(wsPortfolio().holdings||{})[security]; if(!p)return null;
 9886 |   return p.quantity*price-p.costBasis;
 9887 | }
 9888 | 
 9889 | /* ---- Cash + invested capital ---- */
 9890 | 
 9891 | /* ---- Portfolio reconciliation: holdings vs transactions ---- */
 9892 | 
 9893 | /* ---- Target weights & rebalancing proposal ---- */
 9894 | 
 9895 | 
 9896 | /* ============================================================
 9897 |    V7 — PORTFOLIO WORKSPACE UI (holdings, transactions, rebalance)
 9898 |    ============================================================ */
 9899 | 
 9900 | function wsPortfolioRender(){
 9901 |   const ws=wsPortfolio(); const mv=wsMarketValue(); const cash=wsCashSummary();
 9902 |   // derive positions (holdings from transactions)
 9903 |   const computed=wsComputePositions();
 9904 |   const pos=computed.positions;
 9905 |   // stale-price warning (P2 #40): list positions whose Price Book price is stale/missing
 9906 |   const staleKeys=[]; const missingKeys=[];
 9907 |   Object.keys(pos).forEach(k=>{ const g=wsGetPrice(k,ws); if(!g){ missingKeys.push(k); } else if(g.freshness==="STALE"||g.freshness==="AGING"){ staleKeys.push(k); } });
 9908 |   let h=`<div class="card"><div class="card-title">Portfolio <span class="hint">positions derived from transactions</span></div>
 9909 |   ${staleKeys.length||missingKeys.length?`<div class="banner warn">${missingKeys.length?`<b>PORTFOLIO VALUE INCOMPLETE</b> — no price recorded for: ${missingKeys.join(", ")}. `:""}${staleKeys.length?`<b>PORTFOLIO VALUE PARTIALLY STALE</b> — stale prices: ${staleKeys.join(", ")}. `:""}The totals below are not fully current.</div>`:""}
 9910 |   <div class="grid g4">
 9911 |     ${kpi("Market value",mv.mv>0?fmt.money(mv.mv):"—")}
 9912 |     ${kpi("Cash",cash.cash>0?fmt.money(cash.cash):"—")}
 9913 |     ${kpi("Total",cash.total>0?fmt.money(cash.total):"—")}
 9914 |     ${kpi("Unrealized P&L",mv.unreal!=0?fmt.money(mv.unreal):"—",mv.cost>0?fmt.pct(mv.unreal/mv.cost):"")}
 9915 |   </div>
 9916 |   <div class="fields g3 mt">
 9917 |     ${AppUI.frow("Current prices (security:price, comma-sep)","","ws_prices", Object.keys(pos).map(k=>(k+":"+(ws.prices&&ws.prices[k]!=null?ws.prices[k]:0))).join(", "))}
 9918 |   </div>
 9919 |   <button class="btn btn-sm mt" id="ws_pricesApply">Apply Prices</button>
 9920 |   <div class="tablewrap mt"><table class="data"><thead><tr><th>Security</th><th>Ticker</th><th class="num">Qty</th><th class="num">Avg Cost</th><th class="num">Cost Basis</th><th class="num">Price</th><th class="num">Market Value</th><th class="num">Unrealized</th><th class="num">Realized</th><th class="num">Dividends</th><th class="num">Weight</th></tr></thead><tbody>
 9921 |   ${Object.keys(pos).map(k=>{ const p=pos[k]; const price=ws.prices&&ws.prices[k]!=null?ws.prices[k]:0; const val=p.quantity*price; const weight=mv.mv>0?val/mv.mv:0;
 9922 |     return `<tr><td>${esc(k)}</td><td>${esc(p.ticker||"—")}</td><td class="num">${fmt.num(p.quantity,0)}</td><td class="num">${fmt.money(p.avgCost)}</td><td class="num">${fmt.money(p.costBasis)}</td><td class="num">${price?fmt.money(price):"—"}</td><td class="num">${val?fmt.money(val):"—"}</td><td class="num ${val-p.costBasis>=0?'pos':'neg'}">${val?fmt.money(val-p.costBasis):"—"}</td><td class="num">${p.realizedPnl?fmt.money(p.realizedPnl):"—"}</td><td class="num">${p.divIncome?fmt.money(p.divIncome):"—"}</td><td class="num">${weight?fmt.pct(weight):"—"}</td></tr>`; }).join("")||`<tr><td colspan="11" class="small dim">No holdings yet — add transactions.</td></tr>`}
 9923 |   </tbody></table></div>
 9924 |   <div class="banner info">Holdings are derived from the transaction ledger. Add BUY/SELL/DIVIDEND etc. below, then positions, P&L and cash reconcile automatically.</div>
 9925 |   </div>`;
 9926 |   const el=$("#wsPortfolioOut"); if(el)el.innerHTML=h;
 9927 |   const pa=$("#ws_pricesApply"); if(pa)pa.addEventListener("click",()=>{ const m={}; $("#ws_prices").value.split(",").forEach(s=>{ const p=s.split(":"); if(p.length===2)m[p[0].trim()]=Number(p[1])||0; }); ws.prices=m; StorageManager.save(); wsPortfolioRender(); wsRebalanceRender(); });
 9928 |   // target weights
 9929 |   wsRebalanceRender();
 9930 | }
 9931 | 
 9932 | function wsTransactionsRender(){
 9933 |   const ws=wsPortfolio();
 9934 |   // available quantities for SELL validation display
 9935 |   let availByKey={};
 9936 |   try{ const calc=wsCalculateFromLedger(ws); Object.keys(calc.positions).forEach(k=>{ availByKey[k]=calc.positions[k].quantity; }); }catch(e){}
 9937 |   const typeOpts=WS_TYPES.map(v=>({value:v,label:v}));
 9938 |   let h=`<div class="card"><div class="card-title">Transactions</div>
 9939 |   <p class="small dim">BUY/SELL use quantity and price in the transaction currency. DIVIDEND uses explicit shares × dividend-per-share (or a gross amount) with withholding tax. DEPOSIT/WITHDRAWAL/FEE/TAX use an amount only. Invalid trades (e.g. selling more than you own) are rejected before posting. <b>Short positions are not currently supported.</b></p>
 9940 |   <div class="fields g3">
 9941 |     ${AppUI.frow("Date","","tx_date",new Date().toISOString().slice(0,10))}
 9942 |     ${AppUI.frow("Type","","tx_type","BUY",{type:"select",options:typeOpts})}
 9943 |     ${AppUI.frow("Security","","tx_sec","")}
 9944 |     ${AppUI.frow("Ticker","","tx_tick","")}
 9945 |   </div>
 9946 |   <div id="tx_extra" class="fields g3"></div>
 9947 |   <div class="fields g2 mt">
 9948 |     ${AppUI.frow("Reason / thesis","","tx_reason","",{type:"textarea"})}
```

## function wsTWR — 1 hit(s)

### line 10229

```js
10217 |    TWR (time-weighted) removes the effect of cash-flow timing.
10218 |    MWR (money-weighted) = XIRR of the cash flows + final value.
10219 |    ============================================================ */
10220 | 
10221 | function wsPerfDefault(){
10222 |   return { snapshots:[], // {date, mv, cashFlow} cashFlow=external flow into portfolio this period
10223 |            benchmark:[], // {date, level} benchmark index level for relative return
10224 |          };
10225 | }
10226 | function wsPerf(){ return App.state.wsPerf||(App.state.wsPerf=wsPerfDefault()); }
10227 | 
10228 | /* ---- Time-Weighted Return ---- */
10229 | function wsTWR(snapshots){
10230 |   if(!snapshots||snapshots.length<2)return null;
10231 |   // For each sub-period: (EndMV - flow) / StartMV
10232 |   // TWR = product(1 + subperiod return) - 1
10233 |   let twr=1;
10234 |   for(let i=1;i<snapshots.length;i++){
10235 |     const start=snapshots[i-1].mv||0;
10236 |     const end=snapshots[i].mv||0;
10237 |     const flow=snapshots[i].cashFlow||0;
10238 |     if(start<=0)continue;
10239 |     const sub=(end-flow)/start; // return factor
10240 |     if(isFinite(sub)&&sub>0)twr*=sub;
10241 |   }
10242 |   return twr-1;
10243 | }
10244 | 
10245 | /* ---- Money-Weighted Return (XIRR of cash flows + final value) ---- */
10246 | function wsMWR(snapshots){
10247 |   if(!snapshots||snapshots.length<2)return null;
10248 |   // Build cash flow series: start MV is negative (outflow), each flow is negative (outflow), final MV is positive (inflow)
10249 |   const flows=[]; const dates=[];
10250 |   const t0=snapshots[0].date;
10251 |   flows.push(-(snapshots[0].mv||0)); dates.push(snapshots[0].date);
10252 |   for(let i=1;i<snapshots.length-1;i++){
10253 |     flows.push(-(snapshots[i].cashFlow||0)); dates.push(snapshots[i].date);
10254 |   }
10255 |   const last=snapshots[snapshots.length-1];
10256 |   flows.push((last.mv||0)); dates.push(last.date);
10257 |   const mwr=XIRR.xirr(flows,dates,0.1);
10258 |   return mwr;
10259 | }
10260 | 
10261 | /* ---- Annualized TWR ---- */
10262 | function wsAnnualized(twr,days){
10263 |   if(twr==null||!days||days<=0)return null;
10264 |   const years=days/365.25;
10265 |   return Math.pow(1+twr,1/years)-1;
10266 | }
10267 | 
10268 | /* ---- Return decomposition (price vs income) ----
10269 |    Total return over the snapshot window is split into an income component
10270 |    (dividends ÷ start market value) and a price component (the residual,
10271 |    i.e. total − income). This is a clean accounting identity:
10272 |    total return = price return + income return.
10273 |    It is a labeled approximation: dividends are assumed to accrue across the
10274 |    window rather than at specific points, and cash flows are not adjusted for
10275 |    in the price residual (see the TWR method for the flow-adjusted view). */
10276 | function wsReturnDecomposition(snapshots, holdings, prices){
10277 |   if(!snapshots||snapshots.length<2)return null;
10278 |   const start=snapshots[0], end=snapshots[snapshots.length-1];
10279 |   if(!start||!end||start.mv==null||end.mv==null||start.mv<=0)return null;
10280 |   const total=(end.mv-start.mv)/start.mv;
10281 |   let divIncome=0;
10282 |   Object.keys(holdings||{}).forEach(k=>{ const p=holdings[k]; if(p&&p.divIncome)divIncome+=p.divIncome; });
10283 |   const incomeReturn=divIncome/start.mv;
10284 |   const priceReturn=total-incomeReturn; // residual
10285 |   return {total, priceReturn, incomeReturn, divIncome, totalMV:end.mv};
10286 | }
10287 | 
10288 | /* ---- Performance center render ---- */
10289 | function wsPerformanceRender(){
10290 |   const ws=wsPortfolio(); const perf=wsPerf();
10291 |   const snaps=perf.snapshots||[];
10292 |   let h=`<div class="card"><div class="card-title">Performance</div>
10293 |   <p class="small dim"><b>TWR</b> (time-weighted) removes the effect of cash-flow timing — best for comparing to benchmarks. <b>MWR</b> (money-weighted, = XIRR) reflects the actual experience of the invested cash. They differ; do not mix them.</p>
```

## function wsMWR — 1 hit(s)

### line 10246

```js
10234 |   for(let i=1;i<snapshots.length;i++){
10235 |     const start=snapshots[i-1].mv||0;
10236 |     const end=snapshots[i].mv||0;
10237 |     const flow=snapshots[i].cashFlow||0;
10238 |     if(start<=0)continue;
10239 |     const sub=(end-flow)/start; // return factor
10240 |     if(isFinite(sub)&&sub>0)twr*=sub;
10241 |   }
10242 |   return twr-1;
10243 | }
10244 | 
10245 | /* ---- Money-Weighted Return (XIRR of cash flows + final value) ---- */
10246 | function wsMWR(snapshots){
10247 |   if(!snapshots||snapshots.length<2)return null;
10248 |   // Build cash flow series: start MV is negative (outflow), each flow is negative (outflow), final MV is positive (inflow)
10249 |   const flows=[]; const dates=[];
10250 |   const t0=snapshots[0].date;
10251 |   flows.push(-(snapshots[0].mv||0)); dates.push(snapshots[0].date);
10252 |   for(let i=1;i<snapshots.length-1;i++){
10253 |     flows.push(-(snapshots[i].cashFlow||0)); dates.push(snapshots[i].date);
10254 |   }
10255 |   const last=snapshots[snapshots.length-1];
10256 |   flows.push((last.mv||0)); dates.push(last.date);
10257 |   const mwr=XIRR.xirr(flows,dates,0.1);
10258 |   return mwr;
10259 | }
10260 | 
10261 | /* ---- Annualized TWR ---- */
10262 | function wsAnnualized(twr,days){
10263 |   if(twr==null||!days||days<=0)return null;
10264 |   const years=days/365.25;
10265 |   return Math.pow(1+twr,1/years)-1;
10266 | }
10267 | 
10268 | /* ---- Return decomposition (price vs income) ----
10269 |    Total return over the snapshot window is split into an income component
10270 |    (dividends ÷ start market value) and a price component (the residual,
10271 |    i.e. total − income). This is a clean accounting identity:
10272 |    total return = price return + income return.
10273 |    It is a labeled approximation: dividends are assumed to accrue across the
10274 |    window rather than at specific points, and cash flows are not adjusted for
10275 |    in the price residual (see the TWR method for the flow-adjusted view). */
10276 | function wsReturnDecomposition(snapshots, holdings, prices){
10277 |   if(!snapshots||snapshots.length<2)return null;
10278 |   const start=snapshots[0], end=snapshots[snapshots.length-1];
10279 |   if(!start||!end||start.mv==null||end.mv==null||start.mv<=0)return null;
10280 |   const total=(end.mv-start.mv)/start.mv;
10281 |   let divIncome=0;
10282 |   Object.keys(holdings||{}).forEach(k=>{ const p=holdings[k]; if(p&&p.divIncome)divIncome+=p.divIncome; });
10283 |   const incomeReturn=divIncome/start.mv;
10284 |   const priceReturn=total-incomeReturn; // residual
10285 |   return {total, priceReturn, incomeReturn, divIncome, totalMV:end.mv};
10286 | }
10287 | 
10288 | /* ---- Performance center render ---- */
10289 | function wsPerformanceRender(){
10290 |   const ws=wsPortfolio(); const perf=wsPerf();
10291 |   const snaps=perf.snapshots||[];
10292 |   let h=`<div class="card"><div class="card-title">Performance</div>
10293 |   <p class="small dim"><b>TWR</b> (time-weighted) removes the effect of cash-flow timing — best for comparing to benchmarks. <b>MWR</b> (money-weighted, = XIRR) reflects the actual experience of the invested cash. They differ; do not mix them.</p>
10294 |   <div class="fields g3">
10295 |     ${AppUI.frow("Market value today","","perf_mv", wsMarketValue().mv||"")}
10296 |     ${AppUI.frow("Cash flow this period","","perf_flow","0")}
10297 |   </div>
10298 |   <button class="btn btn-sm mt" id="perf_snap">Record Period Snapshot</button>
10299 |   <div class="tablewrap mt"><table class="data"><thead><tr><th>Date</th><th class="num">Market Value</th><th class="num">Cash Flow</th></tr></thead><tbody>
10300 |   ${snaps.map((s,i)=>`<tr><td>${new Date(s.date).toLocaleDateString()}</td><td class="num">${fmt.money(s.mv)}</td><td class="num">${s.cashFlow?fmt.money(s.cashFlow):"—"}</td><td><button class="btn btn-sm btn-danger" data-ps="${i}">×</button></td></tr>`).join("")||`<tr><td colspan="4" class="small dim">No performance snapshots yet. Record one at each period boundary (e.g. monthly) to compute TWR and MWR.</td></tr>`}
10301 |   </tbody></table></div>
10302 |   <div class="grid g4 mt">
10303 |     ${kpi("TWR", snaps.length>=2?fmt.pct(wsTWR(snaps)):"—","time-weighted")}
10304 |     ${kpi("MWR / XIRR", snaps.length>=2?fmt.pct(wsMWR(snaps)):"—","money-weighted")}
10305 |     ${kpi("Annualized TWR", snaps.length>=2&&(snaps[snaps.length-1].date-snaps[0].date)?fmt.pct(wsAnnualized(wsTWR(snaps),(snaps[snaps.length-1].date-snaps[0].date)/86400000)):"—","")}
10306 |     ${kpi("Periods recorded",String(snaps.length))}
10307 |   </div>
10308 |   <div class="banner info">TWR is preferred for performance comparison; MWR reflects actual dollar experience. Both require reliable period-end market values. This is computed from your recorded snapshots — not live data.</div>
10309 |   </div>`;
10310 |   const el=$("#perfOut"); if(el)el.innerHTML=h;
```

## function wsAnnualized — 1 hit(s)

### line 10262

```js
10250 |   const t0=snapshots[0].date;
10251 |   flows.push(-(snapshots[0].mv||0)); dates.push(snapshots[0].date);
10252 |   for(let i=1;i<snapshots.length-1;i++){
10253 |     flows.push(-(snapshots[i].cashFlow||0)); dates.push(snapshots[i].date);
10254 |   }
10255 |   const last=snapshots[snapshots.length-1];
10256 |   flows.push((last.mv||0)); dates.push(last.date);
10257 |   const mwr=XIRR.xirr(flows,dates,0.1);
10258 |   return mwr;
10259 | }
10260 | 
10261 | /* ---- Annualized TWR ---- */
10262 | function wsAnnualized(twr,days){
10263 |   if(twr==null||!days||days<=0)return null;
10264 |   const years=days/365.25;
10265 |   return Math.pow(1+twr,1/years)-1;
10266 | }
10267 | 
10268 | /* ---- Return decomposition (price vs income) ----
10269 |    Total return over the snapshot window is split into an income component
10270 |    (dividends ÷ start market value) and a price component (the residual,
10271 |    i.e. total − income). This is a clean accounting identity:
10272 |    total return = price return + income return.
10273 |    It is a labeled approximation: dividends are assumed to accrue across the
10274 |    window rather than at specific points, and cash flows are not adjusted for
10275 |    in the price residual (see the TWR method for the flow-adjusted view). */
10276 | function wsReturnDecomposition(snapshots, holdings, prices){
10277 |   if(!snapshots||snapshots.length<2)return null;
10278 |   const start=snapshots[0], end=snapshots[snapshots.length-1];
10279 |   if(!start||!end||start.mv==null||end.mv==null||start.mv<=0)return null;
10280 |   const total=(end.mv-start.mv)/start.mv;
10281 |   let divIncome=0;
10282 |   Object.keys(holdings||{}).forEach(k=>{ const p=holdings[k]; if(p&&p.divIncome)divIncome+=p.divIncome; });
10283 |   const incomeReturn=divIncome/start.mv;
10284 |   const priceReturn=total-incomeReturn; // residual
10285 |   return {total, priceReturn, incomeReturn, divIncome, totalMV:end.mv};
10286 | }
10287 | 
10288 | /* ---- Performance center render ---- */
10289 | function wsPerformanceRender(){
10290 |   const ws=wsPortfolio(); const perf=wsPerf();
10291 |   const snaps=perf.snapshots||[];
10292 |   let h=`<div class="card"><div class="card-title">Performance</div>
10293 |   <p class="small dim"><b>TWR</b> (time-weighted) removes the effect of cash-flow timing — best for comparing to benchmarks. <b>MWR</b> (money-weighted, = XIRR) reflects the actual experience of the invested cash. They differ; do not mix them.</p>
10294 |   <div class="fields g3">
10295 |     ${AppUI.frow("Market value today","","perf_mv", wsMarketValue().mv||"")}
10296 |     ${AppUI.frow("Cash flow this period","","perf_flow","0")}
10297 |   </div>
10298 |   <button class="btn btn-sm mt" id="perf_snap">Record Period Snapshot</button>
10299 |   <div class="tablewrap mt"><table class="data"><thead><tr><th>Date</th><th class="num">Market Value</th><th class="num">Cash Flow</th></tr></thead><tbody>
10300 |   ${snaps.map((s,i)=>`<tr><td>${new Date(s.date).toLocaleDateString()}</td><td class="num">${fmt.money(s.mv)}</td><td class="num">${s.cashFlow?fmt.money(s.cashFlow):"—"}</td><td><button class="btn btn-sm btn-danger" data-ps="${i}">×</button></td></tr>`).join("")||`<tr><td colspan="4" class="small dim">No performance snapshots yet. Record one at each period boundary (e.g. monthly) to compute TWR and MWR.</td></tr>`}
10301 |   </tbody></table></div>
10302 |   <div class="grid g4 mt">
10303 |     ${kpi("TWR", snaps.length>=2?fmt.pct(wsTWR(snaps)):"—","time-weighted")}
10304 |     ${kpi("MWR / XIRR", snaps.length>=2?fmt.pct(wsMWR(snaps)):"—","money-weighted")}
10305 |     ${kpi("Annualized TWR", snaps.length>=2&&(snaps[snaps.length-1].date-snaps[0].date)?fmt.pct(wsAnnualized(wsTWR(snaps),(snaps[snaps.length-1].date-snaps[0].date)/86400000)):"—","")}
10306 |     ${kpi("Periods recorded",String(snaps.length))}
10307 |   </div>
10308 |   <div class="banner info">TWR is preferred for performance comparison; MWR reflects actual dollar experience. Both require reliable period-end market values. This is computed from your recorded snapshots — not live data.</div>
10309 |   </div>`;
10310 |   const el=$("#perfOut"); if(el)el.innerHTML=h;
10311 |   const b=$("#perf_snap"); if(b)b.addEventListener("click",()=>{ const mv=Number($("#perf_mv").value)||wsMarketValue().mv||0; const flow=Number($("#perf_flow").value)||0;
10312 |     if(!perf.snapshots)perf.snapshots=[]; perf.snapshots.push({date:Date.now(),mv,flow,cashFlow:flow}); StorageManager.save(); AuditTrailEngine.record("Performance","Snapshot","add",null,fmt.money(mv),"Performance snapshot recorded"); wsPerformanceRender(); });
10313 |   $$("#perfOut [data-ps]").forEach(x=>x.addEventListener("click",()=>{ perf.snapshots.splice(Number(x.dataset.ps),1); StorageManager.save(); wsPerformanceRender(); }));
10314 | }
10315 | 
10316 | /* ---- Add performance tab to portfolio view ---- */
10317 | 
10318 | 
10319 | /* ============================================================
10320 |    V7 — ITEM 2: BENCHMARK CAPTURE RATIOS + ATTRIBUTION
10321 |    V7 — ITEM 3: DEDICATED NOTIFICATIONS FEED
10322 |    ============================================================ */
10323 | 
10324 | /* ---- Benchmark capture ratios (upside/downside capture) ---- */
10325 | function wsCaptureRatios(portRet, benchRet, annualFactor){
10326 |   // portRet, benchRet: arrays of aligned periodic returns
```

## function wsCaptureRatios — 1 hit(s)

### line 10325

```js
10313 |   $$("#perfOut [data-ps]").forEach(x=>x.addEventListener("click",()=>{ perf.snapshots.splice(Number(x.dataset.ps),1); StorageManager.save(); wsPerformanceRender(); }));
10314 | }
10315 | 
10316 | /* ---- Add performance tab to portfolio view ---- */
10317 | 
10318 | 
10319 | /* ============================================================
10320 |    V7 — ITEM 2: BENCHMARK CAPTURE RATIOS + ATTRIBUTION
10321 |    V7 — ITEM 3: DEDICATED NOTIFICATIONS FEED
10322 |    ============================================================ */
10323 | 
10324 | /* ---- Benchmark capture ratios (upside/downside capture) ---- */
10325 | function wsCaptureRatios(portRet, benchRet, annualFactor){
10326 |   // portRet, benchRet: arrays of aligned periodic returns
10327 |   annualFactor=annualFactor||252;
10328 |   if(!portRet||!benchRet||portRet.length<2||portRet.length!==benchRet.length)return null;
10329 |   const upsP=[]; const upsB=[]; const dnsP=[]; const dnsB=[];
10330 |   for(let i=0;i<portRet.length;i++){
10331 |     if(benchRet[i]>0){ upsP.push(portRet[i]); upsB.push(benchRet[i]); }
10332 |     else if(benchRet[i]<0){ dnsP.push(portRet[i]); dnsB.push(benchRet[i]); }
10333 |   }
10334 |   const sumUpsP=upsP.reduce((a,b)=>a+b,0), sumUpsB=upsB.reduce((a,b)=>a+b,0);
10335 |   const sumDnsP=dnsP.reduce((a,b)=>a+b,0), sumDnsB=dnsB.reduce((a,b)=>a+b,0);
10336 |   const upside= sumUpsB>0? sumUpsP/sumUpsB:null;
10337 |   const downside= sumDnsB<0? sumDnsP/sumDnsB:null;
10338 |   // beta, tracking error, information ratio, alpha
10339 |   const beta=CalcEngine.beta(portRet,benchRet);
10340 |   const te=CalcEngine.stdev(portRet.map((r,i)=>r-benchRet[i]),0);
10341 |   const ir= te>0? (CalcEngine.mean(portRet)-CalcEngine.mean(benchRet))*Math.sqrt(annualFactor)/te:null;
10342 |   const alpha=CalcEngine.alpha(portRet,benchRet,0.02/annualFactor);
10343 |   return {upside,downside,beta,te,ir,alpha,periods:portRet.length};
10344 | }
10345 | 
10346 | /* ---- Benchmark center render ---- */
10347 | function wsBenchmarkRender(){
10348 |   const perf=wsPerf();
10349 |   // benchmark series stored as {date, level}
10350 |   const bench=perf.benchmark||[];
10351 |   // portfolio periodic returns from snapshots
10352 |   const snaps=perf.snapshots||[];
10353 |   let h=`<div class="card"><div class="card-title">Benchmark Center</div>
10354 |   <p class="small dim">Configure a benchmark series (index levels). Capture ratios, alpha, beta and tracking error are computed from aligned periodic returns. Benchmark must be aligned by date, currency, frequency and total-return basis.</p>
10355 |   <div class="fields g3">
10356 |     ${AppUI.frow("Benchmark name","","bm_name",perf.benchName||"")}
10357 |     ${AppUI.frow("Benchmark series (level:date, comma)","","bm_series",(bench.map(b=>b.level+":"+new Date(b.date).toISOString().slice(0,10)).join(", "))||"")}
10358 |   </div>
10359 |   <button class="btn btn-sm mt" id="bm_apply">Apply Benchmark</button>
10360 |   <div id="bmOut" class="mt"></div></div>`;
10361 |   const el=$("#benchOut"); if(el)el.innerHTML=h;
10362 |   const b=$("#bm_apply"); if(b)b.addEventListener("click",()=>{ perf.benchName=$("#bm_name").value;
10363 |     const arr=[]; $("#bm_series").value.split(",").forEach(s=>{ const p=s.split(":"); if(p.length===2){ const d=new Date(p[1]); if(!isNaN(d))arr.push({level:Number(p[0]),date:d.getTime()}); } });
10364 |     perf.benchmark=arr.sort((a,b)=>a.date-b.date); StorageManager.save(); wsBenchmarkRender(); computeBenchmark(); });
10365 |   computeBenchmark();
10366 | }
10367 | /* ---- Benchmark validation (P2 #47) ----
10368 |    Checks alignment, frequency, currency basis, and sufficient observations.
10369 |    Returns {ok, issues}. Mismatch => "BENCHMARK COMPARISON INVALID". */
10370 | function wsBenchmarkValidate(snaps, bench, baseCurrency){
10371 |   const issues=[];
10372 |   if(!snaps||snaps.length<2) issues.push("Need at least two portfolio snapshots.");
10373 |   if(!bench||bench.length<2) issues.push("Need at least two benchmark points.");
10374 |   if(!issues.length){
10375 |     // frequency: median interval of snapshots vs benchmark (days)
10376 |     const medDays=arr=>{ if(!arr||arr.length<2)return null; const d=[]; for(let i=1;i<arr.length;i++){ const x=arr[i].date-arr[i-1].date; if(x>0)d.push(x); } if(!d.length)return null; d.sort((a,b)=>a-b); return d[Math.floor(d.length/2)]/86400000; };
10377 |     const sf=medDays(snaps), bf=medDays(bench);
10378 |     if(sf!=null&&bf!=null&&Math.abs(sf-bf)>1) issues.push("Portfolio and benchmark have different frequencies ("+sf.toFixed(1)+"d vs "+bf.toFixed(1)+"d).");
10379 |     if(snaps.length<4||bench.length<4) issues.push("Insufficient observations for reliable capture ratios (recommend ≥4).");
10380 |     // currency basis: benchmark should be in the same base currency
10381 |     if(bench._currency&&baseCurrency&&bench._currency!==baseCurrency) issues.push("Benchmark currency ("+bench._currency+") differs from base currency ("+baseCurrency+").");
10382 |   }
10383 |   return {ok:issues.length===0, issues};
10384 | }
10385 | 
10386 | function computeBenchmark(){
10387 |   const perf=wsPerf(); const snaps=perf.snapshots||[]; const bench=perf.benchmark||[];
10388 |   const out=$("#bmOut"); if(!out)return;
10389 |   if(snaps.length<2){ out.innerHTML=`<div class="banner info">Record performance snapshots (Performance tab) to compute capture ratios against the benchmark.</div>`; return; }
```

## function computeBenchmark — 1 hit(s)

### line 10386

```js
10374 |   if(!issues.length){
10375 |     // frequency: median interval of snapshots vs benchmark (days)
10376 |     const medDays=arr=>{ if(!arr||arr.length<2)return null; const d=[]; for(let i=1;i<arr.length;i++){ const x=arr[i].date-arr[i-1].date; if(x>0)d.push(x); } if(!d.length)return null; d.sort((a,b)=>a-b); return d[Math.floor(d.length/2)]/86400000; };
10377 |     const sf=medDays(snaps), bf=medDays(bench);
10378 |     if(sf!=null&&bf!=null&&Math.abs(sf-bf)>1) issues.push("Portfolio and benchmark have different frequencies ("+sf.toFixed(1)+"d vs "+bf.toFixed(1)+"d).");
10379 |     if(snaps.length<4||bench.length<4) issues.push("Insufficient observations for reliable capture ratios (recommend ≥4).");
10380 |     // currency basis: benchmark should be in the same base currency
10381 |     if(bench._currency&&baseCurrency&&bench._currency!==baseCurrency) issues.push("Benchmark currency ("+bench._currency+") differs from base currency ("+baseCurrency+").");
10382 |   }
10383 |   return {ok:issues.length===0, issues};
10384 | }
10385 | 
10386 | function computeBenchmark(){
10387 |   const perf=wsPerf(); const snaps=perf.snapshots||[]; const bench=perf.benchmark||[];
10388 |   const out=$("#bmOut"); if(!out)return;
10389 |   if(snaps.length<2){ out.innerHTML=`<div class="banner info">Record performance snapshots (Performance tab) to compute capture ratios against the benchmark.</div>`; return; }
10390 |   if(bench.length<2){ out.innerHTML=`<div class="banner warn">Benchmark not configured. Enter a benchmark index level series.</div>`; return; }
10391 |   const bv=wsBenchmarkValidate(snaps, bench, wsBaseCurrency());
10392 |   if(!bv.ok){ out.innerHTML=`<div class="banner bad"><b>BENCHMARK COMPARISON INVALID</b><div class="small">${bv.issues.map(i=>"• "+esc(i)).join("<br>")}</div></div>`; return; }
10393 |   // align by date: use snapshots' dates to derive portfolio periodic returns; benchmark returns from its levels
10394 |   // Build portfolio periodic returns from snapshot MV (TWR-style)
10395 |   const portRets=(typeof WorkstationCalculationCore!=="undefined"?WorkstationCalculationCore.periodReturnsFromSnapshots(snaps):null)||[];
10396 |   // benchmark returns: use the benchmark levels nearest each snapshot date
10397 |   const benchRets=[];
10398 |   for(let i=1;i<snaps.length;i++){ const d=snaps[i].date; const prev=nearestBench(bench,snaps[i-1].date); const cur=nearestBench(bench,d); if(prev&&cur&&prev>0)benchRets.push(cur/prev-1); }
10399 |   const n=Math.min(portRets.length,benchRets.length);
10400 |   const c=wsCaptureRatios(portRets.slice(-n),benchRets.slice(-n), wsAnnualizationFactor(snaps));
10401 |   if(!c){ out.innerHTML=`<div class="banner info">Insufficient aligned data to compute capture ratios.</div>`; return; }
10402 |   let h=`<div class="grid g4 mt">
10403 |     ${kpi("Upside capture",c.upside!=null?fmt.pct(c.upside):"—",">100% = gains more in up markets")}
10404 |     ${kpi("Downside capture",c.downside!=null?fmt.pct(c.downside):"—","<100% = loses less in down markets")}
10405 |     ${kpi("Beta",fmt.num(c.beta,2))}
10406 |     ${kpi("Tracking error",c.te!=null?fmt.pct(c.te):"—")}
10407 |     ${kpi("Information ratio",c.ir!=null?fmt.num(c.ir,2):"—")}
10408 |     ${kpi("Alpha (ann.)",c.alpha!=null?fmt.pct(c.alpha):"—")}
10409 |   </div>
10410 |   <div class="banner info">Benchmark: <b>${esc(perf.benchName||"Configured")}</b>. Aligned on ${n} common periods. Capture and beta are model estimates from your recorded snapshots and benchmark levels — not live data.</div>`;
10411 |   out.innerHTML=h;
10412 | }
10413 | function nearestBench(bench,date){
10414 |   // nearest benchmark level at or before date
10415 |   let best=null; for(const b of bench){ if(b.date<=date)best=b; else break; } return best;
10416 | }
10417 | 
10418 | /* ============================================================
10419 |    V7 — ITEM 3: DEDICATED NOTIFICATIONS FEED
10420 |    ============================================================ */
10421 | function wsNotifyDefault(){ return {items:[]}; }
10422 | function wsNotify(){ return App.state.wsNotifications||(App.state.wsNotifications=wsNotifyDefault()); }
10423 | function wsNotifyAdd(sev,category,text,sec,view,mat){
10424 |   const n=wsNotify(); if(!n.items)n.items=[];
10425 |   // dedupe
10426 |   if(n.items.some(x=>x.text===text&&x.category===category))return;
10427 |   n.items.push({sev,category,text,sec:sec||"",view:view||null,materiality:mat||sev,t:Date.now(),status:"open"});
10428 |   if(n.items.length>100)n.items=n.items.slice(-100);
10429 |   App.state.wsNotifications=n; // keep in sync
10430 | }
10431 | function wsNotificationsRender(){
10432 |   const n=wsNotify().items||[];
10433 |   const order={critical:0,warning:1,review:2,info:3};
10434 |   const sorted=n.slice().sort((a,b)=>(order[a.sev]||4)-(order[b.sev]||4));
10435 |   const el=$("#notifOut"); if(!el)return;
10436 |   let h=`<div class="card"><div class="card-title">Notifications & Alerts <span class="hint">${n.filter(x=>x.status!=="resolved").length} active</span></div>
10437 |   <p class="small dim">System, data, research, market, portfolio, risk, credit, thesis and event alerts. Each has severity, materiality, source, timestamp, related module and action.</p>
10438 |   <div class="row mb"><button class="btn btn-sm" id="notif_markAll">Mark All Resolved</button><button class="btn btn-sm btn-danger" id="notif_clear">Clear</button></div>
10439 |   ${n.length?`<div class="gridlist">${sorted.map((x,i)=>`<div class="warnchip ${x.sev==="critical"?"critical":x.sev==="warning"||x.sev==="review"?"warn":"info"}">
10440 |     <div class="spread"><b>${pill(x.sev.toUpperCase(),x.sev==="critical"?"bad":x.sev==="warning"||x.sev==="review"?"warn":"info")} ${esc(x.category)}</b><span class="small dim">${new Date(x.t).toLocaleString()} · materiality ${esc(x.materiality||x.sev)}</span></div>
10441 |     <div class="small">${esc(x.text)}${x.sec?` <span class="small dim">(${esc(x.sec)})</span>`:""}</div>
10442 |     <div class="row mt"><button class="btn btn-sm" data-notif="${i}" data-view="${x.view||""}">Open</button>${x.status==="resolved"?"":`<button class="btn btn-sm" data-notifr="${i}">Resolve</button>`}</div>
10443 |   </div>`).join("")}</div>`:`<div class="banner good">No notifications.</div>`}</div>`;
10444 |   el.innerHTML=h;
10445 |   $$("#notifOut [data-notif]").forEach(b=>b.addEventListener("click",()=>{ const v=b.dataset.view; if(v)AppInit.go(v); else AppInit.go("reviewqueue"); }));
10446 |   $$("#notifOut [data-notifr]").forEach(b=>b.addEventListener("click",()=>{ wsNotify().items[Number(b.dataset.notifr)].status="resolved"; StorageManager.save(); wsNotificationsRender(); }));
10447 |   const ma=$("#notif_markAll"); if(ma)ma.addEventListener("click",()=>{ wsNotify().items.forEach(x=>x.status="resolved"); StorageManager.save(); wsNotificationsRender(); });
10448 |   const cl=$("#notif_clear"); if(cl)cl.addEventListener("click",()=>{ if(confirm("Clear all notifications?")){ App.state.wsNotifications=wsNotifyDefault(); StorageManager.save(); wsNotificationsRender(); } });
10449 | }
10450 | 
```

## function wsPerfRisk — 1 hit(s)

### line 11880

```js
11868 |   intervals.sort((a,b)=>a-b);
11869 |   const days=intervals[Math.floor(intervals.length/2)]/86400000; // median days between snapshots
11870 |   if(days<3)return 252;      // daily
11871 |   if(days<9)return 52;       // weekly
11872 |   if(days<20)return 26;      // bi-weekly
11873 |   if(days<45)return 12;      // monthly
11874 |   if(days<80)return 4;       // quarterly
11875 |   if(days<200)return 2;      // semi-annual
11876 |   return 1;                  // annual
11877 | }
11878 | 
11879 | /* ---- Risk statistics from periodic returns ---- */
11880 | function wsPerfRisk(periodRets, annualFactor){
11881 |   // periodRets: array of returns over the sub-periods
11882 |   if(!periodRets||periodRets.length<2)return null;
11883 |   const vol=CalcEngine.annualizeVol(CalcEngine.stdev(periodRets), annualFactor||252);
11884 |   const sharpe= CalcEngine.sharpe(periodRets,0.02/annualFactor||0.02/252);
11885 |   const sortino= CalcEngine.sortino(periodRets,0.02/annualFactor||0.02/252);
11886 |   const mdd= CalcEngine.maxDrawdown(periodRets.map((_,i)=>100*(1+periodRets.slice(0,i+1).reduce((a,b)=>a*(1+b),1)))).mdd;
11887 |   // Calmar = CAGR / |max drawdown| (annualized growth approximated from cumulative product)
11888 |   const cumRet= periodRets.reduce((a,b)=>a*(1+b),1)-1;
11889 |   const years= periodRets.length/ (annualFactor||252);
11890 |   const cagr= years>0? Math.pow(1+cumRet,1/years)-1:null;
11891 |   const calmar2= mdd<0&&cagr!=null? cagr/Math.abs(mdd):null;
11892 |   // VaR / ES from period returns
11893 |   const histVaR95=RiskMetricsV2.historicalVaR(periodRets,.95);
11894 |   const histVaR99=RiskMetricsV2.historicalVaR(periodRets,.99);
11895 |   const es95=RiskMetricsV2.expectedShortfall(periodRets,.95);
11896 |   const es99=RiskMetricsV2.expectedShortfall(periodRets,.99);
11897 |   return {vol,sharpe,sortino,mdd,cagr,calmar:calmar2,histVaR95,histVaR99,es95,es99,cumRet};
11898 | }
11899 | 
11900 | /* ---- Upgrade wsPerformanceRender to the full performance center ---- */
11901 | function wsPerformanceRenderFull(){
11902 |   const ws=wsPortfolio(); const perf=wsPerf(); const snaps=perf.snapshots||[];
11903 |   const mv=wsMarketValue();
11904 |   const periodRets=wsPeriodReturns(snaps);
11905 |   const risk= wsPerfRisk(periodReturnsArray(snaps), wsAnnualizationFactor(snaps));
11906 |   // build an array of period returns from snapshot MV for risk stats
11907 |   function periodReturnsArray(snaps2){ return (typeof WorkstationCalculationCore!=="undefined"?WorkstationCalculationCore.periodReturnsFromSnapshots(snaps2):null)||[]; }
11908 |   let h=`<div class="card"><div class="card-title">Performance Center</div>
11909 |   <p class="small dim"><b>Official performance</b> = TWR (time-weighted, removes cash-flow timing) and MWR/XIRR (money-weighted, actual dollar experience) computed from validated period-end snapshots with external cash flows. <b>Snapshot performance</b> (multi-period 1D/1W/1M/YTD/1Y/3Y/5Y and risk stats) is an approximation from the available snapshots and is labelled as such — never presented as authoritative if cash flows make it unreliable. Not live data.</p>
11910 |   <div class="fields g3">
11911 |     ${AppUI.frow("Market value today","","pf_mv", mv.mv||"")}
11912 |     ${AppUI.frow("Cash flow this period","","pf_flow","0")}
11913 |   </div>
11914 |   <button class="btn btn-sm mt" id="pf_snap">Record Period Snapshot</button>
11915 |   <div class="tablewrap mt"><table class="data"><thead><tr><th>Date</th><th class="num">Market Value</th><th class="num">Cash Flow</th></tr></thead><tbody>
11916 |   ${snaps.map((s,i)=>`<tr><td>${new Date(s.date).toLocaleDateString()}</td><td class="num">${fmt.money(s.mv)}</td><td class="num">${s.cashFlow?fmt.money(s.cashFlow):"—"}</td><td><button class="btn btn-sm btn-danger" data-ps="${i}">×</button></td></tr>`).join("")||`<tr><td colspan="4" class="small dim">No snapshots yet. Record period-end market values to compute performance.</td></tr>`}
11917 |   </tbody></table></div>
11918 |   <div class="grid g4 mt">
11919 |     ${kpi("TWR", snaps.length>=2?fmt.pct(wsTWR(snaps)):"—","time-weighted")}
11920 |     ${kpi("MWR / XIRR", snaps.length>=2?fmt.pct(wsMWR(snaps)):"—","money-weighted")}
11921 |     ${kpi("CAGR", risk&&risk.cagr!=null?fmt.pct(risk.cagr):"—","annualized")}
11922 |     ${kpi("Volatility (ann.)", risk&&risk.vol!=null?fmt.pct(risk.vol):"—")}
11923 |   </div>
11924 |   <div class="grid g4 mt">
11925 |     ${kpi("Sharpe", risk&&risk.sharpe!=null?fmt.num(risk.sharpe,2):"—")}
11926 |     ${kpi("Sortino", risk&&risk.sortino!=null?fmt.num(risk.sortino,2):"—")}
11927 |     ${kpi("Max drawdown", risk&&risk.mdd!=null?fmt.pct(risk.mdd):"—")}
11928 |     ${kpi("Calmar", risk&&risk.calmar!=null?fmt.num(risk.calmar,2):"—")}
11929 |   </div>
11930 |   <div class="mt"><div class="small dim">Multi-period returns (from snapshots)</div>
11931 |   <div class="grid g4 mt">
11932 |     ${kpi("1D", periodRets&&periodRets.d1!=null?fmt.pct(periodRets.d1):"—")}
11933 |     ${kpi("1W", periodRets&&periodRets.d7!=null?fmt.pct(periodRets.d7):"—")}
11934 |     ${kpi("1M", periodRets&&periodRets.d30!=null?fmt.pct(periodRets.d30):"—")}
11935 |     ${kpi("YTD", periodRets&&periodRets.ytd!=null?fmt.pct(periodRets.ytd):"—")}
11936 |     ${kpi("1Y", periodRets&&periodRets.d365!=null?fmt.pct(periodRets.d365):"—")}
11937 |     ${kpi("3Y", periodRets&&periodRets.d3y!=null?fmt.pct(periodRets.d3y):"—")}
11938 |     ${kpi("5Y", periodRets&&periodRets.d5y!=null?fmt.pct(periodRets.d5y):"—")}
11939 |   </div></div>
11940 |   <div class="grid g4 mt">
11941 |     ${kpi("Historical VaR 95%", risk&&risk.histVaR95!=null?fmt.pct(risk.histVaR95):"—")}
11942 |     ${kpi("Historical VaR 99%", risk&&risk.histVaR99!=null?fmt.pct(risk.histVaR99):"—")}
11943 |     ${kpi("Expected Shortfall 95%", risk&&risk.es95!=null?fmt.pct(risk.es95):"—")}
11944 |     ${kpi("Expected Shortfall 99%", risk&&risk.es99!=null?fmt.pct(risk.es99):"—")}
```

## function wsPeriodReturns — 1 hit(s)

### line 11828

```js
11816 |   );
11817 | }
11818 | 
11819 | 
11820 | /* ============================================================
11821 |    V7 — UPGRADE: FULL PERFORMANCE CENTER
11822 |    Adds multi-period returns (1D/1W/1M/YTD/1Y/3Y/5Y), CAGR,
11823 |    Sharpe, Sortino, Calmar, Max Drawdown, VaR, Expected Shortfall
11824 |    on top of the existing TWR/MWR snapshots.
11825 |    ============================================================ */
11826 | 
11827 | /* ---- Multi-period returns from price snapshots (no cash flow adjustment for simplicity, labeled) ---- */
11828 | function wsPeriodReturns(snapshots){
11829 |   // snapshots: [{date, mv, cashFlow}]
11830 |   if(!snapshots||snapshots.length<2)return null;
11831 |   const now=Date.now();
11832 |   const mv=snapshots[snapshots.length-1].mv;
11833 |   if(mv==null||mv<=0)return null;
11834 |   const rets={};
11835 |   // helper: return over last N days
11836 |   function retOverDays(days){
11837 |     const cutoff=now-days*86400000;
11838 |     const before= snapshots.filter(s=>s.date<=cutoff);
11839 |     if(!before.length)return null;
11840 |     const startMV=before[before.length-1].mv;
11841 |     if(!startMV||startMV<=0)return null;
11842 |     return mv/startMV-1;
11843 |   }
11844 |   rets.d1= snapshots[snapshots.length-2]? mv/snapshots[snapshots.length-2].mv-1 : null;
11845 |   rets.d7= retOverDays(7);
11846 |   rets.d30= retOverDays(30);
11847 |   // YTD
11848 |   const y0=new Date(new Date(now).getFullYear(),0,1).getTime();
11849 |   const ytd= snapshots.filter(s=>s.date<=y0);
11850 |   const ytdMV= ytd.length? ytd[ytd.length-1].mv:null;
11851 |   rets.ytd= ytdMV&&ytdMV>0? mv/ytdMV-1:null;
11852 |   rets.d365= retOverDays(365);
11853 |   rets.d3y= retOverDays(365*3);
11854 |   rets.d5y= retOverDays(365*5);
11855 |   return rets;
11856 | }
11857 | 
11858 | /* ---- Annualization factor inferred from snapshot frequency ----
11859 |    Snapshots are user-recorded at arbitrary intervals (daily, weekly, monthly…).
11860 |    Annualizing period volatility/return with a fixed 252 would overstate
11861 |    volatility ~4.6× when snapshots are monthly. Infer the period count per year
11862 |    from the median interval between recorded snapshots. */
11863 | function wsAnnualizationFactor(snapshots){
11864 |   if(!snapshots||snapshots.length<2)return 252;
11865 |   const intervals=[];
11866 |   for(let i=1;i<snapshots.length;i++){ const d=snapshots[i].date-snapshots[i-1].date; if(d>0)intervals.push(d); }
11867 |   if(!intervals.length)return 252;
11868 |   intervals.sort((a,b)=>a-b);
11869 |   const days=intervals[Math.floor(intervals.length/2)]/86400000; // median days between snapshots
11870 |   if(days<3)return 252;      // daily
11871 |   if(days<9)return 52;       // weekly
11872 |   if(days<20)return 26;      // bi-weekly
11873 |   if(days<45)return 12;      // monthly
11874 |   if(days<80)return 4;       // quarterly
11875 |   if(days<200)return 2;      // semi-annual
11876 |   return 1;                  // annual
11877 | }
11878 | 
11879 | /* ---- Risk statistics from periodic returns ---- */
11880 | function wsPerfRisk(periodRets, annualFactor){
11881 |   // periodRets: array of returns over the sub-periods
11882 |   if(!periodRets||periodRets.length<2)return null;
11883 |   const vol=CalcEngine.annualizeVol(CalcEngine.stdev(periodRets), annualFactor||252);
11884 |   const sharpe= CalcEngine.sharpe(periodRets,0.02/annualFactor||0.02/252);
11885 |   const sortino= CalcEngine.sortino(periodRets,0.02/annualFactor||0.02/252);
11886 |   const mdd= CalcEngine.maxDrawdown(periodRets.map((_,i)=>100*(1+periodRets.slice(0,i+1).reduce((a,b)=>a*(1+b),1)))).mdd;
11887 |   // Calmar = CAGR / |max drawdown| (annualized growth approximated from cumulative product)
11888 |   const cumRet= periodRets.reduce((a,b)=>a*(1+b),1)-1;
11889 |   const years= periodRets.length/ (annualFactor||252);
11890 |   const cagr= years>0? Math.pow(1+cumRet,1/years)-1:null;
11891 |   const calmar2= mdd<0&&cagr!=null? cagr/Math.abs(mdd):null;
11892 |   // VaR / ES from period returns
```

