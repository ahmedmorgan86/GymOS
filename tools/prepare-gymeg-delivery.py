"""Package the audited working tree without modifying sources or including secrets."""
from pathlib import Path
import subprocess,zipfile,hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT.parent/'GymEG_Delivery_2026-10-29'
OUT.mkdir(exist_ok=True)
allowed={'app','components','hooks','lib','public','scripts','tests','tools','docs','db','supabase','windows','android','android-management','android-support','mobile-android','certs','.github'}
blocked={'node_modules','.git','.next','bin','obj','build','__pycache__','release','outputs','work','vendor','store-staging'}
secret_ext={'.jks','.keystore','.pfx','.p12','.key','.sqlite','.sqlite3','.db'}
secret_patterns=[rb'-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----',rb'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})',rb'(?:sb_secret_|sbp_)[A-Za-z0-9_-]{20,}',rb'postgres(?:ql)?://[^\s/:]+:[^\s@]+@']
names=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=ROOT).decode().split('\0')
files=[]
for name in sorted(set(names)):
 if not name:continue
 p=Path(name)
 if p.parts[0] not in allowed and len(p.parts)>1:continue
 if any(part in blocked or part.startswith('release-') or 'PRIVATE' in part.upper() for part in p.parts[:-1]):continue
 if p.suffix.lower() in secret_ext or (p.name.startswith('.env') and p.name!='.env.example'):continue
 if p.name.endswith('.tsbuildinfo') or p.name in {'source-files.json'}:continue
 full=ROOT/p
 if not full.is_file():continue
 data=full.read_bytes()
 # Check source text only; binary artifacts are separately signed/hashed.
 if p.suffix.lower() in {'.ts','.tsx','.js','.mjs','.py','.json','.md','.txt','.sql','.yaml','.yml','.ps1','.env'} and not any(part in {'tests','tools'} for part in p.parts):
  if any(re.search(pattern,data) for pattern in secret_patterns):raise RuntimeError('Potential secret in '+name)
 files.append((name,full,data))
source=OUT/'GymEG_Source_2026-10-29.zip'
with zipfile.ZipFile(source,'w',zipfile.ZIP_DEFLATED) as z:
 for name,full,data in files:z.writestr('GymEG/'+name,data)
manifest={'sourceFiles':len(files),'files':[],'productionDeployed':False,'physicalDeviceAcceptanceComplete':False}
manuals=ROOT.parent/'GymEG_Manuals_2026-10-29'/'output/pdf'
apps=[(p.name,p) for p in (ROOT/'public/downloads').glob('*.apk') if p.name.startswith('GymEG-')]
win=ROOT.parent/'GymEG_Windows_1.1.14_LogoFix'/'GymOS.exe'
if win.exists():apps.append(('GymEG-Windows-x64-1.1.14.exe',win))
for owner in [False,True]:
 path=OUT/('GymEG_Owner_Complete_2026-10-29.zip' if owner else 'GymEG_Club_Package_2026-10-29.zip')
 with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
  for name,p in apps:z.write(p,('Apps/Windows/' if name.endswith('.exe') else 'Apps/Android/Legacy/' if 'Legacy' in name else 'Apps/Android/Current/')+name)
  for p in manuals.glob('*.pdf'):
   if not owner and any(v in p.name for v in ['Platform_Owner','Competitive_Review','Updates_And_Search']):continue
   z.write(p,'Guides/'+p.name)
  z.writestr('READ_FIRST_AR.txt','GymEG: هذه نسخة محلية مرشحة. لم تنشر تغييرات الويب. اختبار الهاتف والأجهزة والمزودين مطلوب قبل قبول التشغيل. Windows غير موقع Authenticode. الحزم الأقدم Legacy للتحديث فوق المعرفات الأقدم فقط. راجع دليل التحديث قبل إزالة أي نسخة. لا تتضمن هذه الحزمة كلمات مرور أو مفاتيح خاصة.')
  if owner:
   z.write(source,'Source/'+source.name)
   for p in (ROOT/'docs/audit/2026-10-29').rglob('*'):
    if p.is_file():z.write(p,'Audit/'+p.relative_to(ROOT/'docs/audit/2026-10-29').as_posix())
 for p in [path]:manifest['files'].append({'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.file_digest(p.open('rb'),'sha256').hexdigest()})
manifest['files'].append({'file':source.name,'bytes':source.stat().st_size,'sha256':hashlib.file_digest(source.open('rb'),'sha256').hexdigest()})
(OUT/'SHA256SUMS.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps(manifest,indent=2))
