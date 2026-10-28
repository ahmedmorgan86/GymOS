"""Original GYMEG vector artwork. Wordmarks contain outlines, never remote fonts.

Run with fonttools installed; uses the repository's OFL Montserrat font.
Raster outputs are generated separately by build-gymeg-assets.mjs.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'brand'
OUT.mkdir(parents=True, exist_ok=True)
font = instantiateVariableFont(TTFont(ROOT/'public/fonts/montserrat-variable.ttf'), {'wght': 850}, inplace=False)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
units = font['head'].unitsPerEm
gradient = '<defs><linearGradient id="purple" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#A855F7"/><stop offset="1" stop-color="#7C3AED"/></linearGradient></defs>'

def letters(text, x, baseline, size, color, tracking=0):
    scale = size/units
    output=[]
    for char in text:
        name=cmap[ord(char)]
        pen=SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        output.append(f'<path d="{pen.getCommands()}" transform="translate({x:.3f} {baseline}) scale({scale:.6f} {-scale:.6f})" fill="{color}"/>')
        x += glyphs[name].width*scale+tracking
    return ''.join(output), x

def symbol(color='url(#purple)'):
    # Open hexagonal G plus a separate, legible dumbbell. No bitmap tracing.
    return f'<path d="M245 79 132 14 20 79V209L132 274 244 209V155H145V196H201L132 236 57 192V101L132 57 207 101Z" fill="{color}"/><g fill="{color}"><rect x="78" y="123" width="15" height="50" rx="4"/><rect x="98" y="108" width="21" height="80" rx="5"/><rect x="127" y="137" width="83" height="22" rx="4"/><rect x="218" y="108" width="21" height="80" rx="5"/><rect x="244" y="123" width="15" height="50" rx="4"/></g>'

def svg(body, box, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" role="img" aria-label="{title}"><title>{title}</title>{gradient}{body}</svg>'

for variant,ink,accent in [('dark','#F5F3FF','url(#purple)'),('light','#12101C','url(#purple)'),('mono','#FFFFFF','#FFFFFF'),('print','#12101C','#12101C')]:
    body='<g transform="translate(5 3) scale(.66)">'+symbol(accent)+'</g>'
    first,end=letters('GYM',205,113,132,ink,1)
    second,end=letters('EG',end,113,132,accent,1)
    descriptor,_=letters('GYM MANAGEMENT SYSTEM',209,150,18,ink,4.0)
    tagline,_=letters('YOUR GYM. ONE SYSTEM.',209,181,18,accent,2.0)
    (OUT/f'logo-{variant}.svg').write_text(svg(body+first+second+descriptor+tagline,'0 0 785 195', 'GYMEG — YOUR GYM. ONE SYSTEM.'),encoding='utf-8')
    (OUT/('symbol.svg' if variant=='dark' else f'symbol-{variant}.svg')).write_text(svg(symbol(accent),'0 0 280 288','GYMEG'),encoding='utf-8')
tile='<rect x="1" y="1" width="510" height="510" rx="110" fill="#12101C" stroke="#A855F7" stroke-opacity=".35" stroke-width="2"/><g transform="translate(71 65) scale(1.32)">'+symbol()+'</g>'
(OUT/'app-icon.svg').write_text(svg(tile,'0 0 512 512','GYMEG'),encoding='utf-8')
print('GYMEG: 9 original vector assets generated with outlined wordmarks.')
