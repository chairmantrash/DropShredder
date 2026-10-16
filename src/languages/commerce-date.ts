import {normalizeCommerceCharacters} from './commerce-text';
// Gregorian month names only. Never reinterpret Hijri/Bengali calendar dates as Gregorian.
const months=[
 ['january','janvier','enero','janeiro','يناير','जनवरी','জানুয়ারি','一月'],
 ['february','février','febrero','fevereiro','فبراير','फ़रवरी','फरवरी','ফেব্রুয়ারি','二月'],
 ['march','mars','marzo','março','مارس','मार्च','মার্চ','三月'],
 ['april','avril','abril','أبريل','إبريل','अप्रैल','এপ্রিল','四月'],
 ['may','mai','mayo','maio','مايو','मई','মে','五月'],
 ['june','juin','junio','junho','يونيو','जून','জুন','六月'],
 ['july','juillet','julio','julho','يوليو','जुलाई','জুলাই','七月'],
 ['august','août','agosto','أغسطس','अगस्त','আগস্ট','八月'],
 ['september','septembre','septiembre','setembro','سبتمبر','सितंबर','সেপ্টেম্বর','九月'],
 ['october','octobre','octubre','outubro','أكتوبر','ऑक्टोबर','अक्टूबर','অক্টোবর','十月'],
 ['november','novembre','noviembre','novembro','نوفمبر','नवंबर','নভেম্বর','十一月'],
 ['december','décembre','diciembre','dezembro','ديسمبر','दिसंबर','ডিসেম্বর','十二月'],
];
export function reviewDateMillis(value:string|undefined):number {
 if(!value||value.length>300)return NaN;
 const text=normalizeCommerceCharacters(value).toLowerCase();
 const valid=(year:number,month:number,day:number)=>{
  if(year<1900||year>2100||day<1||day>31)return NaN;
  const stamp=Date.UTC(year,month,day),d=new Date(stamp);
  return d.getUTCFullYear()===year&&d.getUTCMonth()===month&&d.getUTCDate()===day?stamp:NaN;
 };
 const chinese=/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/.exec(text);
 if(chinese)return valid(Number(chinese[1]),Number(chinese[2])-1,Number(chinese[3]));
 for(let month=0;month<months.length;month++)for(const name of months[month]!){
  const at=text.indexOf(name);if(at<0)continue;
  if(/[\p{L}\p{M}]/u.test(text[at-1]??'')||/[\p{L}\p{M}]/u.test(text[at+name.length]??''))continue;
  const before=text.slice(Math.max(0,at-12),at),after=text.slice(at+name.length,at+name.length+28);
  const day=/\b(\d{1,2})\s*$/.exec(before)?.[1]??/^\s+(\d{1,2})\b/.exec(after)?.[1];
  const year=/\b(19\d{2}|20\d{2}|2100)\b/.exec(after)?.[1];
  if(day&&year)return valid(Number(year),month,Number(day));
 }
 // Retain the existing unambiguous ISO/English date support, not numeric D/M/Y guesses.
 if(/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(text))return Date.parse(text);
 if(/\b(?:jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i.test(text))return Date.parse(text);
 return NaN;
}
