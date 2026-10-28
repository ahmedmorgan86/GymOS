from pathlib import Path
import re
B=Path('public/brand')
logo=re.sub(r'<text[\s\S]*?</text>','',(B/'logo-dark.svg').read_text()).replace('<svg ', '<svg x="66" y="118" width="1000" height="261" ',1)
s='''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><radialGradient id="glow"><stop stop-color="#7C3AED" stop-opacity=".42"/><stop offset="1" stop-color="#7C3AED" stop-opacity="0"/></radialGradient><linearGradient id="line"><stop stop-color="#7C3AED"/><stop offset="1" stop-color="#A855F7" stop-opacity=".2"/></linearGradient></defs>
<rect width="1200" height="630" fill="#12101C"/><ellipse cx="1080" cy="30" rx="620" ry="560" fill="url(#glow)"/>
<path d="M940 -80L1200 100V440L1000 300Z" fill="none" stroke="#A855F7" stroke-opacity=".10" stroke-width="1"/><path d="M1010 -80L1260 95V460L1070 320Z" fill="none" stroke="#A855F7" stroke-opacity=".12" stroke-width="1"/>
<rect x="72" y="64" width="276" height="37" rx="18" fill="#7C3AED22" stroke="#A855F744"/>
<text x="210" y="88" text-anchor="middle" font-family="Inter,DejaVu Sans" font-size="13" font-weight="600" letter-spacing="1.4" fill="#D8C6F7">GYM MANAGEMENT SYSTEM</text>
'''+logo+'''
<text x="1118" y="411" text-anchor="end" font-family="Cairo,DejaVu Sans" font-size="49" font-weight="800" fill="#F5F3FF">جيمك كله في نظام واحد</text>
<text x="1118" y="465" text-anchor="end" font-family="Cairo,DejaVu Sans" font-size="25" font-weight="600" fill="#BDB0D3">أعضاء · اشتراكات · حضور · مدفوعات</text>
<rect x="72" y="513" width="1046" height="1" fill="url(#line)"/>
<text x="72" y="571" font-family="Montserrat,DejaVu Sans" font-size="27" font-weight="700" fill="#F5F3FF">gymeg.vercel.app</text>
<text x="1118" y="568" text-anchor="end" font-family="Montserrat,DejaVu Sans" font-size="17" font-weight="700" letter-spacing="3" fill="#A855F7">YOUR GYM. ONE SYSTEM.</text>
</svg>'''
(B/'social-share.svg').write_text(s)
