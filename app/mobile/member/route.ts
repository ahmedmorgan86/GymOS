import release from '../../../public/downloads/pushtorq-members-android.json';
import { mobileDownloadResponse } from '../../lib/mobile-download';
export function GET(request:Request){return mobileDownloadResponse(request,release.url,'/member');}
