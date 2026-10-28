from pathlib import Path
for name in ['branding.test.mjs','pushtorq-brand.test.mjs','report-branding.test.mjs','seo.test.mjs']:
 p=Path('tests')/name
 if not p.exists():continue
 s=p.read_text().replace('PUSHTORQ','GYMEG').replace('pushtorq-share-20261027','gymeg-share-20261028').replace('v=20261027','v=20261028-gymeg');p.write_text(s,encoding='utf-8')
p=Path('scripts/build-gymeg-assets.mjs');s=p.read_text().replace("sharp(icon).resize(512,512).png().toFile('public/icons/maskable-512.png')","sharp(icon).resize(512,512).flatten({background:'#12101C'}).png().toFile('public/icons/maskable-512.png')");p.write_text(s)
p=Path('tools/identity-preview/social-share.py');s=p.read_text().replace('pushtorq.vercel.app','gymeg.vercel.app').replace('POWER YOUR GYM','YOUR GYM. ONE SYSTEM.').replace('قوة الإدارة في إيدك','جيمك كله في نظام واحد');p.write_text(s,encoding='utf-8')
