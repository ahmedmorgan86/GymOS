from pathlib import Path
p=Path('app/mobile-install-guide.tsx');s=p.read_text().replace('downloads/pushtorq-','downloads/gymeg-')
s=s.replace('هذا تطبيق مستقل بمعرّف وتوقيع جديدين، يتثبت بجانب GYM OS ولا يحدّث التطبيق القديم تلقائيًا. بيانات النادي لم تُنقل إلى قاعدة أخرى.','توقيع GYMEG جديد. إذا كان PUSHTORQ مثبتًا، زامن أي عمل غير محفوظ ثم أزله قبل تثبيت هذه النسخة. سجّل بحسابك الحالي لاستعادة بيانات النادي من الخادم.')
s=s.replace('This is an independent app with a new package and signing certificate. It installs alongside GYM OS, not as an in-place update. Club records remain in the existing system.','GYMEG uses a new signing certificate. If PUSHTORQ is installed, sync pending work and uninstall it before installing this release. Sign in with your existing account to access server records.')
p.write_text(s,encoding='utf-8')
# Retain WebView trust logic, credential stores, database paths and app IDs.
for p in Path('windows').glob('*'):
 if p.suffix not in ['.cs','.xaml','.csproj','.json']:continue
 s=p.read_text(encoding='utf-8-sig');n=s.replace('PUSHTORQ','GYMEG').replace('pushtorq.vercel.app','gymeg.vercel.app').replace('<Version>1.1.12</Version>','<Version>1.1.13</Version>')
 if n!=s:p.write_text(n,encoding='utf-8')
