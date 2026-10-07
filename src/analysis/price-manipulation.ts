export interface PriceObservation { at:string; price:number; referencePrice?:number; }
export interface PriceManipulationFinding { id:string; severity:'weak'|'moderate'|'strong'; title:string; explanation:string; observedValue:string; }

function valid(x:number|undefined):x is number{return typeof x==='number'&&Number.isFinite(x)&&x>0;}

export function analyzePriceHistory(input:PriceObservation[]):PriceManipulationFinding[]{
  const rows=input.filter(x=>valid(x.price)&&Number.isFinite(Date.parse(x.at))).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).slice(-60);
  if(rows.length<2)return [];
  const out:PriceManipulationFinding[]=[];
  for(let i=1;i<rows.length;i++){
    const prev=rows[i-1]!,cur=rows[i]!;
    const priceRise=cur.price>prev.price*1.03;
    const referenceIntroduced=!valid(prev.referencePrice)&&valid(cur.referencePrice)&&cur.referencePrice>cur.price;
    if(priceRise&&referenceIntroduced){
      out.push({
        id:'PRICE_RISE_FRAMED_AS_DISCOUNT',severity:'strong',
        title:'The price went up when the "discount" appeared',
        explanation:'The higher crossed-out price appeared at the same time the real price increased.',
        observedValue:`Price ${prev.price.toFixed(2)} → ${cur.price.toFixed(2)}; new reference ${cur.referencePrice!.toFixed(2)}`,
      });
      break;
    }
  }
  const withReference=rows.filter(x=>valid(x.referencePrice)&&x.referencePrice>x.price);
  if(rows.length>=5&&withReference.length/rows.length>=.8){
    out.push({
      id:'PERSISTENT_SALE_STATE',severity:'moderate',
      title:'This thing is almost always "on sale"',
      explanation:'The crossed-out price keeps showing up across repeated checks.',
      observedValue:`${withReference.length}/${rows.length} checks showed a discount`,
    });
  }
  return out;
}
