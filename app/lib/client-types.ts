import type {License} from './licensing';
import type {GymState} from './domain';
import type {Role} from './access';
export type Packet={platformOwnerAccess?:boolean;support?:{id:string;reason:string;expiresAt:string;readOnly:true};serverNow?:number;admin?:boolean;license?:(License&{writable:boolean;state:string;maintenance:boolean})|null;state:GymState;revision:number;user:{id:string;name:string};owner:string;legacyOwner?:string;role:Role};
