#!/usr/bin/env python3
"""Build independent PUSHTORQ APKs with official Android SDK tools and an external key."""
import hashlib, json, os, re, subprocess, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime, timezone
ROOT=Path(__file__).resolve().parent
REPO=ROOT.parent
def run(*args):
    try: return subprocess.check_output([str(x) for x in args],text=True,stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as error:
        print(error.output)
        raise
def build(role):
    tools=Path(os.environ['ANDROID_BUILD_TOOLS']); platform=Path(os.environ['ANDROID_PLATFORM_JAR'])
    key=Path(os.environ['PUSHTORQ_KEYSTORE']).resolve(); java=os.environ.get('JAVA','java')
    if key.is_relative_to(REPO): raise ValueError('Keep the signing key outside the repository')
    if not os.environ.get('PUSHTORQ_KEYSTORE_PASSWORD'): raise ValueError('Supply password through environment')
    source=ROOT/role;work=ROOT/'build'/role
    for p in [work,work/'generated',work/'classes',work/'dex']: p.mkdir(parents=True,exist_ok=True)
    run(tools/'aapt2','compile','--dir',source/'res','-o',work/'resources.zip')
    run(tools/'aapt2','link','-o',work/'unsigned.apk','-I',platform,'--manifest',source/'AndroidManifest.xml','--java',work/'generated',work/'resources.zip')
    sources=sorted(source.glob('src/**/*.java'))+sorted((work/'generated').rglob('*.java'))
    run(java,'-m','jdk.compiler/com.sun.tools.javac.Main','-encoding','UTF-8','-source','8','-target','8','-bootclasspath',platform,'-d',work/'classes',*sources)
    with zipfile.ZipFile(work/'classes.jar','w') as jar:
        for p in sorted((work/'classes').rglob('*.class')): jar.write(p,p.relative_to(work/'classes'))
    run(java,'-cp',tools/'lib/d8.jar','com.android.tools.r8.D8','--release','--min-api','26','--lib',platform,'--output',work/'dex',work/'classes.jar')
    with zipfile.ZipFile(work/'unsigned.apk','a',zipfile.ZIP_DEFLATED) as apk: apk.write(work/'dex/classes.dex','classes.dex')
    run(tools/'zipalign','-f','-p','4',work/'unsigned.apk',work/'aligned.apk')
    manifest=ET.parse(source/'AndroidManifest.xml').getroot();ns='{http://schemas.android.com/apk/res/android}'
    version=manifest.attrib[ns+'versionName'];code=int(manifest.attrib[ns+'versionCode'])
    name='Members' if role=='members' else 'Manager';filename=f'PUSHTORQ-{name}-Android-{version}.apk';output=REPO/'public/downloads'/filename
    run(java,'-jar',tools/'lib/apksigner.jar','sign','--ks',key,'--ks-key-alias',os.environ.get('PUSHTORQ_KEY_ALIAS','pushtorq-android-release'),'--ks-pass','env:PUSHTORQ_KEYSTORE_PASSWORD','--v4-signing-enabled','false','--out',output,work/'aligned.apk')
    verification=run(java,'-jar',tools/'lib/apksigner.jar','verify','--verbose','--print-certs',output)
    run(tools/'zipalign','-c','-p','4',output)
    certificate=re.search(r'certificate SHA-256 digest: ([a-f0-9]{64})',verification).group(1)
    tracked=[source/'AndroidManifest.xml']+sorted((source/'res').rglob('*'))+sorted((source/'src').rglob('*'))
    metadata=dict(version=version,versionCode=code,url='/downloads/'+filename,package='com.pushtorq.'+role,origin='https://pushtorq.vercel.app',home='/member' if role=='members' else '/clubs',minAndroid='8.0',sha256=hashlib.sha256(output.read_bytes()).hexdigest(),bytes=output.stat().st_size,certificateSha256=certificate,builtAt=datetime.now(timezone.utc).isoformat(),independentApplication=True,physicalDeviceTested=False,sourceHashes={str(p.relative_to(source)):hashlib.sha256(p.read_bytes()).hexdigest() for p in tracked if p.is_file()})
    (REPO/f'public/downloads/pushtorq-{role}-android.json').write_text(json.dumps(metadata,indent=2)+'\n')
    (work/'signature-verification.txt').write_text(verification)
    print(role+': signed; signature and ZIP alignment verified; '+certificate)
if __name__=='__main__':
    for role in ['members','management']: build(role)
