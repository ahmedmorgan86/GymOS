import type {License} from './licensing';
import type {GymState} from './domain';
import type {Role} from './access';
export type Packet={salesBranches?:string[];collectionBranches?:string[];bookingBranches?:string[];attendanceBranches?:string[];serverNow?:number;admin?:boolean;license?:(License&{writable:boolean;state:string;maintenance:boolean})|null;state:GymState;revision:number;user:{id:string;name:string};owner:string;legacyOwner?:string;role:Role};
