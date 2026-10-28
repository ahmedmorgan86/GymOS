import {windowsDownload} from '../../lib/windows-release';
export const runtime='nodejs';
export async function GET(){return Response.redirect(await windowsDownload(),307);}
