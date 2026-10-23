import type {MetadataRoute} from 'next';
import {indexingAllowed,siteOrigin} from './lib/seo.ts';
export default function robots():MetadataRoute.Robots{return indexingAllowed()?{rules:{userAgent:'*',allow:'/',disallow:['/$','/api/','/auth/','/clubs','/platform','/member','/sign-in','/sign-out','/forgot-password','/reset-password']},sitemap:siteOrigin()+'/sitemap.xml'}:{rules:{userAgent:'*',disallow:'/'}};}
