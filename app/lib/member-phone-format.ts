export function latinDigits(value:string){return value.replace(/[٠-٩۰-۹]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.includes(c)?'٠١٢٣٤٥٦٧٨٩'.indexOf(c):'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));}
export function normalizeMemberPhone(value:unknown){
 if(typeof value!=='string'||value.length>50)return null;
 let phone=latinDigits(value).replace(/[\s().-]/g,'').replace(/^00/,'+');
 if(/^01[0125][0-9]{8}$/.test(phone))phone='+20'+phone.slice(1);
 else if(/^201[0125][0-9]{8}$/.test(phone))phone='+'+phone;
 return /^\+[1-9][0-9]{7,14}$/.test(phone)?phone:null;
}
export function normalizeMemberPin(value:unknown){if(typeof value!=='string'||value.length>20)return null;const pin=latinDigits(value.trim());return /^[0-9]{6}$/.test(pin)?pin:null;}
