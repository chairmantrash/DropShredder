let guard:(()=>Promise<boolean>)|undefined;
export function setReportGuard(value:()=>Promise<boolean>):void{guard=value;}
export async function currentReportAllowed():Promise<boolean>{try{return Boolean(guard&&await guard());}catch{return false;}}
