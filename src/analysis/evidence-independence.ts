/** One best signal per connected observation lineage, including transitive overlaps. */
export function selectIndependent<T>(items:T[],keys:(item:T)=>string[],rank:(item:T)=>number):T[] {
  const bounded=items.slice(0,512),parents=bounded.map((_,i)=>i),seen=new Map<string,number>();
  const root=(index:number):number=>{
    while(parents[index]!==index){parents[index]=parents[parents[index]!]!;index=parents[index]!;}
    return index;
  };
  bounded.forEach((item,index)=>{
    for(const key of keys(item).filter(Boolean).slice(0,24)){
      const previous=seen.get(key);
      if(previous===undefined) seen.set(key,index);
      else parents[root(index)]=root(previous);
    }
  });
  const groups=new Map<number,T>();
  bounded.forEach((item,index)=>{
    const key=root(index),current=groups.get(key);
    if(current===undefined || rank(item)>rank(current)) groups.set(key,item);
  });
  return [...groups.values()];
}
