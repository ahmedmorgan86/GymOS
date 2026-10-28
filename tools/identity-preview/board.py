from pathlib import Path
import html
B=Path('public/brand');D=Path('docs/identity');D.mkdir(parents=True,exist_ok=True)
def esc(t):return html.escape(str(t))
def rect(x,y,w,h,fill='#1B1729',rx=16,stroke='#FFFFFF14'):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}"/>'
def text(x,y,t,size=18,fill='#F5F3FF',weight=500,anchor='start',arabic=False):return f'<text x="{x}" y="{y}" font-family="{ "Cairo" if arabic else "Montserrat"},DejaVu Sans,sans-serif" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">{esc(t)}</text>'
def embed(file,x,y,w,h):
 s=(B/file).read_text();return s.replace('<svg ',f'<svg x="{x}" y="{y}" width="{w}" height="{h}" ',1)
def button(x,y,w,label,primary=False):return rect(x,y,w,39,'url(#button)' if primary else '#241E35',9,'#A855F744' if primary else '#FFFFFF14')+text(x+w/2,y+25,label,12,'#FFF',700,'middle',True)
def dashboard(title='الإدارة الشاملة للأعضاء والحضور',w=1200,h=780):
 a=[rect(0,0,w,h,'#12101C',20,'#A855F740'),rect(978,0,222,h,'#171320',20,'#FFFFFF10'),embed('logo-dark.svg',1000,26,180,56),text(1178,119,'مساحة النادي',11,'#A79AB9',anchor='end',arabic=True)]
 for i,l in enumerate(['الرئيسية','الأعضاء والحضور','الاشتراكات','المدفوعات','التقارير','الإعدادات']):
  y=145+i*54
  if i==1:a.append(rect(996,y,186,43,'url(#button)',10,'none'))
  a.append(text(1164,y+27,l,13,'#FFF' if i==1 else '#B2A9C5',600,'end',True))
 a.extend([text(1090,h-29,'YOUR GYM. ONE SYSTEM.',9,'#A855F7',650,'middle'),text(940,53,title,22,'#F5F3FF',800,'end',True),text(940,83,'معاينة الهوية الجديدة • بيانات توضيحية',11,'#B2A9C5',500,'end',True)])
 for i,(l,v) in enumerate([('إجمالي الأعضاء','6'),('الموجودون الآن','2'),('اشتراكات سارية','6'),('مديونيات للمتابعة','3')]):
  x=25+i*235;a.extend([rect(x,108,220,83),rect(x+166,124,38,38,'#7C3AED20',10,'none'),text(x+185,150,'↗',24,'#A855F7',700,'middle'),text(x+148,135,l,11,'#B2A9C5',500,'end',True),text(x+148,171,v,27,'#F5F3FF',750,'end')])
 a.extend([rect(25,211,925,91),rect(430,228,500,43,'#241E35',10,'#A855F755'),text(910,255,'ابحث بالاسم أو الهاتف أو الباركود…',12,'#B2A9C5',500,'end',True),button(257,228,153,'إضافة عضو جديد',True),button(144,228,95,'تحديث'),button(43,228,84,'الفلاتر')])
 a.extend([rect(25,322,925,390),rect(739,334,193,41,'#7C3AED24',10,'none'),text(916,361,'جميع الأعضاء  ٦',13,'#E9D5FF',700,'end',True),text(716,361,'الموجودون الآن  ٢',12,'#B2A9C5',500,'end',True)])
 view='shop' if 'المخزون' in title else 'training' if 'التدريب' in title else 'reports' if 'التقارير' in title else 'members'
 labels={'shop':['المنتج','الكود','الحالة','السعر','المخزون'],'training':['البرنامج','الكود','الحالة','البداية','التمارين'],'reports':['التقرير','الكود','الحالة','التاريخ','السجلات'],'members':['العضو','الباركود','حالة الاشتراك','الانتهاء','المتبقي']}[view]
 cols=list(zip([917,684,521,363,209],labels))
 for x,l in cols:a.append(text(x,407,l,10,'#9C8FAC',500,'end',True))
 names={'members':['عمر أحمد حسن','يوسف محمد علي','نور أحمد محمود','سارة علي حسن','كريم حسن أحمد'],'shop':['بروتين مصل اللبن','كرياتين مونوهيدرات','شيكر رياضي','حزام تدريب','فيتامينات متعددة'],'training':['قوة شاملة','دفع وسحب','لياقة وظيفية','تمارين الأرجل','استشفاء وحركة'],'reports':['التحصيل اليومي','العضويات والتجديدات','سجل الحضور','المتجر والمخزون','حركة المدفوعات']}[view]
 for i,name in enumerate(names):
  y=430+i*51;a.extend([f'<path d="M44 {y-8}H931" stroke="#FFFFFF0B"/>',rect(890,y,33,33,'#7C3AED20',10,'none'),text(907,y+22,name[0],15,'#D8B4FE',700,'middle',True),text(874,y+22,name,12,'#F5F3FF',600,'end',True),text(684,y+22,'PT00000'+str(i+1),11,'#B2A9C5',500,'end'),rect(413,y+3,108,27,'#22C55E12',7,'none'),text(466,y+22,('اشتراك ساري' if view=='members' else 'متاح' if view=='shop' else 'نشط' if view=='training' else 'جاهز'),10,'#22C55E',600,'middle',True),text(363,y+22,'2026-11-26',11,'#B2A9C5',500,'end'),text(207,y+22,('400 ج.م.' if i%2==0 else '0 ج.م.') if view=='members' else str(8+i*2),11,'#F5F3FF',500,'end'),button(45,y,105,'عرض التفاصيل')])
 a.append(text(942,751,'واجهة عربية RTL · نفس الوظائف والبيانات · بلا نشر حتى اعتمادك',10,'#9B8BAE',500,'end',True))
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 780">'+defs()+''.join(a)+'</svg>'
def defs():return '<defs><linearGradient id="button"><stop stop-color="#7C3AED"/><stop offset="1" stop-color="#A855F7"/></linearGradient><radialGradient id="ambient"><stop stop-color="#7C3AED" stop-opacity=".25"/><stop offset="1" stop-color="#12101C" stop-opacity="0"/></radialGradient></defs>'
def login():
 a=[rect(0,0,370,650,'#171320',24,'#A855F744'),'<ellipse cx="185" cy="30" rx="205" ry="230" fill="url(#ambient)"/>',embed('symbol.svg',139,46,92,92),text(81,179,'PUSH',32,'#F5F3FF',850)+text(181,179,'TORQ',32,'#A855F7',850),text(185,204,'GYM MANAGEMENT SYSTEM',9,'#B2A9C5',500,'middle'),text(185,232,'YOUR GYM. ONE SYSTEM.',10,'#A855F7',600,'middle'),text(185,291,'تسجيل الدخول',23,'#F5F3FF',800,'middle',True),text(185,321,'أهلاً بعودتك. ناديك تحت سيطرتك.',11,'#B2A9C5',500,'middle',True)]
 for i,l in enumerate(['البريد الإلكتروني','كلمة المرور']):
  y=349+i*80;a.extend([text(335,y,l,11,'#C4B7D5',600,'end',True),rect(35,y+13,300,45,'#241E35',10,'#FFFFFF16'),text(53,y+42,'you@example.com' if i==0 else '••••••••••',12,'#9587A6')])
 a.extend([button(35,520,300,'تسجيل الدخول',True),text(185,589,'نسيت كلمة المرور؟',11,'#B2A9C5',500,'middle',True),text(185,627,'GymEG · YOUR GYM. ONE SYSTEM.',8,'#796C8E',600,'middle')]);return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 370 650">'+defs()+''.join(a)+'</svg>'
board=[rect(0,0,1600,1160,'#0D0A14',0,'none'),'<ellipse cx="310" cy="50" rx="700" ry="350" fill="url(#ambient)"/>',embed('logo-dark.svg',45,32,700,183),text(1545,81,'الهوية المقترحة قبل النشر',26,'#F5F3FF',800,'end',True),text(1545,119,'تصميم موحد للإدارة، الحضور، الاشتراكات والتقارير',15,'#B2A9C5',500,'end',True),text(1545,158,'معاينة محلية • لا بيانات عملاء • لا رفع أو نشر',12,'#A855F7',600,'end',True)]
board.append(login().replace('<svg ', '<svg x="35" y="246" width="370" height="650" ',1));board.append(dashboard().replace('<svg ', '<svg x="430" y="246" width="1130" height="735" ',1));board.append(text(1553,224,'الأعضاء والحضور — ترتيب يومي واضح',14,'#B2A9C5',600,'end',True));board.append(text(220,224,'تسجيل الدخول',14,'#B2A9C5',600,'middle',True))
colors=['#7C3AED','#A855F7','#12101C','#F5F3FF','#22C55E','#EF4444','#F97316']
for i,c in enumerate(colors):
 x=36+i*221;board.extend([rect(x,1000,200,56,c,10,'#FFFFFF22'),text(x+100,1083,c,13,'#D8CFE5',600,'middle')])
board.append(text(800,1132,'اللون الأساسي للهوية موف • الأخضر والأحمر والبرتقالي للحالات والتنبيهات فقط',14,'#B2A9C5',500,'middle',True))
(D/'GymEG-design-board.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1160">'+defs()+''.join(board)+'</svg>')
(B/'dashboard-preview.svg').write_text(dashboard());(B/'login-preview.svg').write_text(login())
# Public marketing images are explicitly labelled as design previews in the UI.
for key,title in [('overview','الإدارة الشاملة للأعضاء والحضور'),('shop','المتجر وإدارة المخزون'),('training','التدريب ومتابعة البرامج'),('reports','التقارير والتحصيل')]:
 (B/(key+'-preview.svg')).write_text(dashboard(title))

mobile=[rect(0,0,390,844,'#12101C',26,'#A855F740'),embed('logo-dark.svg',30,24,250,66),text(360,142,'أهلاً، عمر',25,'#F5F3FF',800,'end',True),text(360,176,'قوتك تبدأ من التزامك.',13,'#B2A9C5',500,'end',True),rect(24,204,342,196,'#241635',20,'#A855F740'),text(340,244,'اشتراكك ساري',17,'#22C55E',700,'end',True),text(340,290,'الباقة الشهرية',22,'#F5F3FF',800,'end',True),text(340,332,'٣٠ يومًا متبقيًا',14,'#D8B4FE',600,'end',True),button(45,350,300,'عرض كارت العضوية',True)]
for i,t in enumerate(['برنامجي التدريبي','الحصص والحجوزات','المدفوعات والمستحقات']):mobile.extend([rect(24,430+i*90,342,72),text(340,474+i*90,t,15,'#F5F3FF',700,'end',True),text(48,474+i*90,'←',19,'#A855F7')])
mobile.extend([text(195,768,'الرئيسية    الكارت    التدريب    حسابي',12,'#B2A9C5',500,'middle',True),text(195,815,'معاينة الهوية · بيانات توضيحية',11,'#A855F7',500,'middle',True)])
(B/'member-preview.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 844">'+defs()+''.join(mobile)+'</svg>')
