import type {GymState} from './domain';
import type {Role} from './access';
export type Packet={state:GymState;revision:number;user:{id:string;name:string};owner:string;role:Role};
