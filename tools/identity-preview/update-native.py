from pathlib import Path
for role in ['members','management']:
 root=Path('mobile-android')/role
 for p in root.rglob('*'):
  if p.suffix not in ['.xml','.java']:continue
  s=p.read_text();s=s.replace('PUSHTORQ','GYMEG').replace('pushtorq.vercel.app','gymeg.vercel.app').replace('android:versionCode="1"','android:versionCode="2"').replace('android:versionName="1.0.0"','android:versionName="1.1.0"')
  p.write_text(s,encoding='utf-8',newline='\n')
p=Path('mobile-android/build.py');s=p.read_text().replace('independent PUSHTORQ','GYMEG').replace("filename=f'PUSHTORQ-","filename=f'GYMEG-").replace("origin='https://pushtorq.vercel.app'","origin='https://gymeg.vercel.app'").replace("public/downloads/pushtorq-","public/downloads/gymeg-")
s=s.replace("independentApplication=True,", "independentApplication=True,requiresReinstallFromPreviousBrand=True,")
p.write_text(s,encoding='utf-8')
for p in Path('public').glob('*.webmanifest'):
 s=p.read_text().replace('PUSHTORQ','GYMEG').replace('?v=20261027','?v=20261028-gymeg');p.write_text(s,encoding='utf-8')
p=Path('public/sw.js');s=p.read_text().replace('gymos-shell-v12','gymos-shell-v13').replace('PUSHTORQ','GYMEG');p.write_text(s,encoding='utf-8')
