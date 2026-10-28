import Image from 'next/image';
import type {GymState} from './lib/domain';
import {validBrandLogo} from './lib/branding';
import {themes} from './lib/themes';
import type {CSSProperties} from 'react';
export default function ReportHeader({settings,title,ar}:{settings:GymState['settings'];title:string;ar:boolean}){const accent=settings.design?.accent??themes.find(theme=>theme.id===settings.theme)?.accent??themes[0].accent;return <header className="print-brand-header" dir={ar?'rtl':'ltr'} style={{'--report-accent':/^#[a-f0-9]{6}$/i.test(accent)?accent:'#7C3AED'} as CSSProperties}><span className="print-brand-logo"><Image src={validBrandLogo(settings.logo)?settings.logo:'/icons/icon-192.png?v=20261028-gymeg'} alt={settings.name} width={80} height={80} unoptimized loading="eager"/></span><div><small>GYMEG · {ar?'إدارة النادي':'CLUB MANAGEMENT'}</small><h2>{settings.name}</h2><p>{title}</p></div></header>;}
