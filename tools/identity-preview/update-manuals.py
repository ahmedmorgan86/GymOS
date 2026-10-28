from pathlib import Path
p=Path('tools/identity-preview/render.mjs');s=p.read_text().replace('PUSHTORQ','GYMEG').replace('PUSH<span','GYM<span').replace('>TORQ<','>EG<').replace('POWER YOUR GYM','YOUR GYM. ONE SYSTEM.');p.write_text(s,encoding='utf-8')
for p in Path('docs/manuals').glob('*.txt'):
 s=p.read_text(encoding='utf-8');n=s.replace('PUSHTORQ','GYMEG').replace('https://pushtorq.vercel.app','https://gymeg.vercel.app').replace('Windows 1.1.12','Windows 1.1.13')
 if n!=s:p.write_text(n,encoding='utf-8')
for f in ['build_manuals.py','build_release_current.py']:
 p=Path('docs/manuals')/f;s=p.read_text().replace('PUSHTORQ','GYMEG').replace('pushtorq.vercel.app','gymeg.vercel.app').replace('Windows 1.1.12','Windows 1.1.13').replace('27 Oct 2026','28 Oct 2026').replace('27 October 2026','28 October 2026').replace('27 أكتوبر 2026','28 أكتوبر 2026').replace('2026-10-27','2026-10-28');p.write_text(s,encoding='utf-8')
