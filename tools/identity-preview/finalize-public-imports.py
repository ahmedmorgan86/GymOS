from pathlib import Path
for p in Path('app').rglob('*.tsx'):
 s=p.read_text();n=s.replace('downloads/pushtorq-members-android.json','downloads/gymeg-members-android.json').replace('downloads/pushtorq-management-android.json','downloads/gymeg-management-android.json').replace('/downloads/pushtorq-member-qr.png','/downloads/gymeg-member-qr.png').replace('/downloads/pushtorq-management-qr.png','/downloads/gymeg-management-qr.png')
 if n!=s:p.write_text(n,encoding='utf-8')
for p in [Path('.env.example'),Path('README.md')]:
 s=p.read_text();p.write_text(s.replace('PUSHTORQ','GYMEG').replace('https://pushtorq.vercel.app','https://gymeg.vercel.app'),encoding='utf-8')
p=Path('scripts/build-brand-assets.mjs');p.write_text("// Compatibility entry point; keep the current identity generator authoritative.\nimport './build-gymeg-assets.mjs';\n")
