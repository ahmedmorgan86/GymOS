import {randomInt} from 'node:crypto';
export {latinDigits,normalizeMemberPhone,normalizeMemberPin} from './member-phone-format.ts';
export const newMemberPin=()=>String(randomInt(1_000_000)).padStart(6,'0');
