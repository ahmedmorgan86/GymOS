import {publicMetadata} from '../lib/seo';
import PublicSite from '../public-site';
export const metadata=publicMetadata();
export default function About(){return <PublicSite en={false}/>;}
