from pathlib import Path
root=Path('app')
changed=[]
for p in root.rglob('*'):
 if p.suffix not in ('.ts','.tsx','.css'): continue
 s=p.read_text(encoding='utf-8');n=s.replace('PUSHTORQ','GYMEG').replace('POWER YOUR GYM','YOUR GYM. ONE SYSTEM.')
 # Presentation wordmarks only; keep all identifiers and persistence keys intact.
 if p.suffix=='.tsx':
  n=n.replace('<span>PUSH</span>','<span>GYM</span>').replace('>TORQ</span>','>EG</span>').replace('>PUSH<','>GYM<').replace('>TORQ<','>EG<')
 if p.name=='announcements.tsx':n=n.replace('GYMEG = جيم أو إس','GYMEG = جيم إيجي')
 n=n.replace('?v=20261027','?v=20261028-gymeg')
 if n!=s:p.write_text(n,encoding='utf-8');changed.append(str(p))
print('Updated presentation branding in',len(changed),'application files; database and persistence identifiers preserved.')
