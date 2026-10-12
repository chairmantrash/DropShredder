export type NativeCall=(method:string,params:Record<string,unknown>)=>Promise<any>;
export function nativeControl(call:NativeCall,selector:string,operation:'visible'|'scroll'|'point'|string):Promise<any>;
