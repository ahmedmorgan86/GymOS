import MemberApp from '../member/member-app';
import {memberPreview} from '../lib/member-preview';
export const metadata={title:'GYMEG — معاينة تطبيق العضو',robots:{index:false,follow:false}};
export default function MemberPreview(){return <MemberApp previewData={memberPreview()}/>;}
