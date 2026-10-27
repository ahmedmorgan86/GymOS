from pathlib import Path
import json
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
import arabic_reshaper
from bidi.algorithm import get_display
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs/manuals'
PDF=OUT/'output/pdf'
PDF.mkdir(parents=True,exist_ok=True)
for name,file in [('Cairo','cairo-2.ttf'),('CairoBold','cairo-4.ttf')]:
 pdfmetrics.registerFont(TTFont(name,str(ROOT/'public/fonts'/file)))
W,H=A4
INK=HexColor('#202338');MUTED=HexColor('#596176');ACCENT=HexColor('#7653dc')
reshaper=arabic_reshaper.ArabicReshaper(configuration={'use_unshaped_instead_of_isolated':True})
def ar(s):return get_display(reshaper.reshape(s))
def wrap(s,width,font,size,rtl=False):
 result=[];line=''
 for word in s.split():
  test=(line+' '+word).strip()
  if pdfmetrics.stringWidth(ar(test) if rtl else test,font,size)>width and line:result.append(line);line=word
  else:line=test
 if line:result.append(line)
 return result
def paragraph(c,s,y,rtl,size=11.7,leading=20):
 c.setFont('Cairo',size);c.setFillColor(INK)
 for line in wrap(s,W-(124 if rtl else 94),'Cairo',size,rtl):
  if y<58:raise ValueError('Overflow: '+s[:50])
  if rtl:c.drawRightString(W-46,y,ar(line))
  else:c.drawString(46,y,line)
  y-=leading
 return y
def header(c,role,page):
 c.setFillColor(ACCENT);c.rect(0,H-12,W,12,fill=1,stroke=0)
 c.setFillColor(MUTED);c.setFont('CairoBold',9);c.drawString(38,H-39,'PUSHTORQ / OPERATIONS HANDBOOK')
 c.setFont('Cairo',8);c.drawRightString(W-38,H-39,ar(role))
 c.setStrokeColor(HexColor('#dedfea'));c.line(38,37,W-38,37)
 c.drawString(38,23,'© Ahmed Morgan 2026 | 25 Oct 2026 | Windows 1.1.9');c.drawRightString(W-38,23,str(page))
def manual(name,role_ar,role_en,topics,audience):
 target=PDF/name;c=canvas.Canvas(str(target),pagesize=A4)
 c.setTitle('PUSHTORQ | '+role_en+' | Arabic & English');c.setAuthor('Ahmed Morgan')
 c.setFillColor(HexColor('#17182b'));c.rect(0,0,W,H,fill=1,stroke=0)
 c.setFillColor(ACCENT);c.circle(W-18,H-80,175,fill=1,stroke=0)
 c.setFillColor(white);c.setFont('CairoBold',40);c.drawString(44,H-125,'PUSHTORQ')
 c.setFont('CairoBold',25);c.drawRightString(W-44,H-215,ar(role_ar));c.setFont('CairoBold',23);c.drawString(44,H-270,role_en)
 c.setFont('Cairo',14);c.drawRightString(W-44,H-330,ar('دليل الاستخدام بالعربية والإنجليزية'));c.drawString(44,H-367,'Arabic & English operating guide')
 c.setFillColor(HexColor('#ddd7f5'));c.setFont('Cairo',11)
 for i,line in enumerate(wrap(audience,W-88,'Cairo',11,True)):c.drawRightString(W-44,300-i*22,ar(line))
 c.setFont('Cairo',10);c.drawString(44,140,'Web source / Windows 1.1.9 - 25 October 2026');c.drawString(44,113,'https://pushtorq.vercel.app/');c.drawString(44,86,'© Ahmed Morgan 2026');c.showPage()
 chunks=(len(topics)+14)//15;first=2+chunks
 for chunk in range(chunks):
  header(c,role_ar,2+chunk);c.setFillColor(INK);c.setFont('CairoBold',23);c.drawRightString(W-40,H-85,ar('المحتويات'));c.drawString(40,H-120,'Contents');y=H-165
  for n,t in list(enumerate(topics))[chunk*15:(chunk+1)*15]:
   c.setFont('CairoBold',11);c.drawRightString(W-42,y,ar(t[0]));c.setFont('Cairo',9);c.drawString(42,y-17,f'{n+1:02d}. {t[1]}');c.drawRightString(W-42,y-17,str(first+n));y-=40
  c.showPage()
 for n,t in enumerate(topics):
  header(c,role_ar,first+n);c.bookmarkPage('t'+str(n));c.addOutlineEntry(t[1],'t'+str(n),0)
  c.setFillColor(ACCENT);c.setFont('CairoBold',11);c.drawString(40,H-75,f'{n+1:02d} / {len(topics):02d}')
  c.setFillColor(INK);c.setFont('CairoBold',19);c.drawRightString(W-42,H-106,ar(t[0]));c.setFont('CairoBold',15);c.drawString(42,H-140,t[1]);y=H-180
  for i,pair in enumerate(t[2]):
   c.setFillColor(HexColor('#f1edfb'));c.roundRect(37,y-4,20,20,5,fill=1,stroke=0);c.setFillColor(ACCENT);c.setFont('CairoBold',10);c.drawCentredString(47,y+2,str(i+1))
   y=paragraph(c,pair[0],y,True);y-=5;y=paragraph(c,pair[1],y,False,10.3,18);y-=22
  c.showPage()
 c.save();return {'file':str(target),'pages':1+chunks+len(topics),'topics':len(topics)}
def read_topics(name):
 topics=[]
 for line in (Path(__file__).parent/name).read_text(encoding='utf-8').splitlines():
  if line.startswith('## '):
   a,e=line[3:].split('|',1);topics.append([a,e,[]])
  elif line.strip():
   a,e=line.split('|',1);topics[-1][2].append([a,e])
 return topics
content=[
 dict(file='GymOS_Platform_Owner_AR_EN.pdf',ar='صاحب التطبيق والمنصة',en='Platform Owner',audience='دليل داخلي لإدارة التراخيص والتفعيل وتسليم العملاء. لا يدرج في حزمة النادي.',topics=read_topics('owner.txt')),
 dict(file='GymOS_Club_Manager_AR_EN.pdf',ar='مدير ومالك النادي',en='Club Manager',audience='دليل التشغيل والإعداد والأعضاء والحضور والتدريب والمتجر والصوت والموسيقى والنسخ.',topics=read_topics('manager.txt')),
 dict(file='GymOS_Employees_AR_EN.pdf',ar='الموظفون ومستخدمو النظام',en='Employees',audience='دليل فريق العمل، يفرق بين الاستقبال للقراءة والأدمن المخول ويشرح المهام والتصعيد.',topics=read_topics('employees.txt'))]
result=[]
for d in content:result.append(manual(d['file'],d['ar'],d['en'],d['topics'],d['audience']))
(OUT/'manuals-manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
