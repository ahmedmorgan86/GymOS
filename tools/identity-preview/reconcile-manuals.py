from pathlib import Path
import re
for p in Path('docs/manuals').glob('*.txt'):
 s=p.read_text(encoding='utf-8')
 s=re.sub(r'\n## هوية GYMEG وروابط الموبايل\|GYMEG identity and mobile links\n.*?(?=\n## |\Z)','',s,flags=re.S)
 s=re.sub(r'مرجع المصدر هو دمج طلب التعديلات رقم 41.*?\n','مرجع هذا التحديث هو فرع GYMEG وطلب التعديلات 50 بتاريخ 28 أكتوبر 2026. راجع تقرير التسليم لمعرفة حالة الدمج والنشر النهائية.|This update is based on the GYMEG branch and pull request 50 dated 28 October 2026. See the delivery report for final merge/deployment status.\n',s)
 s=re.sub(r'نجح محليًا 187 اختبارًا.*?\n','نجح محليًا 235 اختبار وحدة وكل مجموعات التكامل الاثنتي عشرة؛ تجاوزت 7 اختبارات اتصال قاعدة بيانات اختيارية. نجح بناء الويب وWindows وفحص توقيع APK.|235 local unit tests and all 12 integration suites passed; 7 optional connected-database tests were skipped. Web/Windows builds and APK signature verification passed.\n',s)
 p.write_text(s,encoding='utf-8')
p=Path('app/public-site.tsx');s=p.read_text().replace('يتثبت بجانب التطبيق القديم؛ سجّل بنفس الحساب.','أزل PUSHTORQ القديم بعد مزامنة العمل المعلق ثم ثبت GYMEG وسجل بنفس الحساب.').replace('installs alongside the old app','requires uninstalling PUSHTORQ after syncing pending work');p.write_text(s,encoding='utf-8')
