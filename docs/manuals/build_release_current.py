"""Generate six bilingual manuals. Run with the project's PDF dependencies installed."""
from pathlib import Path
import os,json,ast
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(os.environ.get('GYMOS_MANUAL_OUTPUT',str(ROOT.parent/'GymOS_Delivery_2026-10-26')))
base=(Path(__file__).parent/'build_manuals.py').read_text(encoding='utf-8').split('content=[')[0]
namespace={'__file__':str(Path(__file__).parent/'build_manuals.py')}
base=base.replace('25 Oct 2026','26 Oct 2026').replace('25 October 2026','26 October 2026')
exec(base,namespace)
namespace['PDF']=OUT/'output/pdf';namespace['PDF'].mkdir(parents=True,exist_ok=True)
manual,read=namespace['manual'],namespace['read_topics']
result=[]
for name,ar,en,file in [('Platform_Owner','صاحب التطبيق والمنصة','Platform Owner','owner.txt'),('Club_Manager','مدير ومالك النادي','Club Manager','manager.txt'),('Employees','الموظفون ومستخدمو النظام','Employees','employees.txt')]:
 result.append(manual('GymOS_'+name+'_AR_EN.pdf',ar,en,read(file),'تحديث 26 أكتوبر 2026 - التشغيل والصلاحيات وحدود الاختبار.'))
for name,ar,en,file in [('Free_Trial_Activation','تفعيل التجربة المجانية','Free Trial Activation','trial119.txt'),('Updates_And_Search','التحديث والتشغيل والنشر','Release Operations & Search','updates119.txt'),('Competitive_Review','المقارنة وقبول التسليم','Comparison & Acceptance','comparison119.txt')]:
 result.append(manual('GymOS_'+name+'_AR_EN.pdf',ar,en,read(file),'دليل عربي وإنجليزي - 26 أكتوبر 2026.'))
(OUT/'manuals-manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
