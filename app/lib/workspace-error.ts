/** Translate only known uniqueness conflicts to actionable workspace errors. */
export function workspaceUniqueError(error:unknown):'cardUsed'|'duplicateVisit'|'duplicateRecord'|null{
 if(!error||typeof error!=='object'||!('code' in error)||(error as {code?:unknown}).code!=='23505')return null;
 const value=error as {constraint?:unknown;message?:unknown};
 const constraint=typeof value.constraint==='string'?value.constraint:'';
 const message=typeof value.message==='string'?value.message:'';
 if(['membership_cards_pkey','membership_cards_one_active'].includes(constraint)||/barcode (already used|ownership conflict)/i.test(message))return 'cardUsed';
 if(constraint==='gym_visit_one_open')return 'duplicateVisit';
 return 'duplicateRecord';
}
