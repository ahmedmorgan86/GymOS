from pathlib import Path
import json
for p in Path('app').rglob('*.ts'):
 s=p.read_text(encoding='utf-8');n=s.replace('downloads/pushtorq-members-android.json','downloads/gymeg-members-android.json').replace('downloads/pushtorq-management-android.json','downloads/gymeg-management-android.json')
 if p.name=='seo.ts':n=n.replace('https://pushtorq.vercel.app','https://gymeg.vercel.app').replace("publicContentUpdated='2026-10-27'","publicContentUpdated='2026-10-28'").replace('pushtorq-share-20261027.png','gymeg-share-20261028.png')
 if s!=n:p.write_text(n,encoding='utf-8')
p=Path('tests/pushtorq-android.test.mjs');s=p.read_text().replace('Independent PUSHTORQ','GYMEG').replace("downloads/pushtorq-","downloads/gymeg-").replace("dex.includes('pushtorq.vercel.app')","dex.includes('gymeg.vercel.app')");p.write_text(s,encoding='utf-8')
p=Path('docs/identity/android-signing-certificates.json');pins=json.loads(p.read_text())
for role in ['members','management']:
 m=json.loads(Path(f'public/downloads/gymeg-{role}-android.json').read_text());pins['gymeg-'+role]={'file':'public'+m['url'],'certificateSha256':m['certificateSha256'],'apkSha256':m['sha256']}
p.write_text(json.dumps(pins,indent=2)+'\n')
