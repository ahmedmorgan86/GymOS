import {CommercialError} from './licensing.ts';
export function assertRequestTenant(request:Request,tenantId:string,commercial:boolean){if(commercial&&request.headers.get('x-gymos-tenant')!==tenantId)throw new CommercialError('clubChanged',409);}
