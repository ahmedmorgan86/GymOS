import type {MetadataRoute} from 'next';
import {indexingAllowed,publicPaths,siteOrigin} from './lib/seo.ts';
export default function sitemap():MetadataRoute.Sitemap{if(!indexingAllowed())return[];const origin=siteOrigin();return publicPaths.map(path=>({url:origin+path,...(path!=='/demo'?{alternates:{languages:{ar:origin+'/about',en:origin+'/en/about'}}}:{})}));}
