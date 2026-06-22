## ملاحظة سريعة قبل التنفيذ

فحصت المشروع الآن. كل الملفات اللي قلت إنها مفقودة موجودة فعلًا:
`src/components/meta/MysteryStore.tsx`, `DailyMagicCards.tsx`, `DeepFocusRoom.tsx`, `MetaHub.tsx`, `RaidBoss.tsx`, `SkillTree.tsx`, `RPGTitleBadge.tsx`, بالإضافة إلى `src/lib/metaGame.ts` و `asmrAudio.ts`. لم أهلوسن — هي مكتوبة ومتصلة من المرة السابقة.

لكن باقي الطلبات (نظام XP موحد، تطور الدينو، ثيمات حقيقية، أتمتة كاملة، إصلاح أدوات الضغط/التحويل/المقياس… إلخ) ضخم جدًا ويلمس عشرات الملفات الحية. لو نفّذته دفعة واحدة فيه خطر حقيقي إنه يكسر الموقع. الخطة أدناه تقسّمه لمراحل آمنة، كل مرحلة قابلة للنشر وحدها.

---

## المرحلة 1 — مصدر الحقيقة الموحد (الأساس)

- إنشاء `src/lib/appStore.ts`: مدير localStorage واحد لـ `global_points`, `global_xp`, `user_level`, `streak_days`, `last_visit`, `dino_xp`, `unlocked_themes`, `active_theme`.
- API: `addXP(amount, source)`, `addPoints(amount)`, `getLevel()`, `tickStreak()`, مع event bus (`app-store-updated`).
- صيغة المستويات: L1=0–100, L2=100–250, L3=250–500, L4=500–1000, ثم +500 لكل مستوى.
- جسر توافق: `PointsContext` و `metaGame.ts` يصبحان واجهة فوق `appStore` بدون كسر الاستدعاءات الحالية.

## المرحلة 2 — السلسلة (Streak) + شارة اللهب في الهيدر

- داخل `appStore.tickStreak()`: لو اليوم = آخر زيارة + 1 → +1، لو نفس اليوم → بدون تغيير، غير ذلك → reset.
- مكوّن `StreakFlame.tsx` يظهر في الهيدر (HomePage) مع عدد الأيام وعداد حتى 14.

## المرحلة 3 — الثيمات الحقيقية

- إضافة CSS variables كاملة في `src/styles/themes.css` لـ: Sakura, Galaxy, Ocean, Forest, Gold (خلفية، أزرار، كروت، نص).
- `data-theme="galaxy"` على `<html>` بدل تغيير لون بسيط.
- قفل/فتح الثيمات حسب `user_level` و إظهارها في `ThemesShop.tsx` الموجود.

## المرحلة 4 — تطور الدينو

- في `VirtualPet.tsx`: 5 مراحل (Egg → Baby → Teen → Adult → Mythic) مبنية على `dino_xp` (كل أكل = +5 XP، كل سقي/تنظيف = +2).
- تغيير الحجم والـ emoji/SVG حسب المرحلة.

## المرحلة 5 — أتمتة كاملة بدون أزرار يدوية

- **WaterTracker**: 1 كوب=1، زجاجة صغيرة=2، كبيرة=3. أي تسجيل → `addXP(5*cups)` + `addPoints(2*cups)` + Raid Boss damage (−10×cups) + إكمال تلقائي لتحدي الماء الحالي.
- **Workouts/Games/Focus**: hook موحّد `useAutoTimer(durationSec, onComplete)` يبدأ عند الدخول، يعيد التصفير عند المغادرة، يكمل التحدي تلقائيًا عند الوصول للصفر.
- **Education/Stories/Summaries**: `useEffect` عند فتح القصة → إكمال التحدي.
- **Azkar**: عداد عالمي في appStore، عند بلوغ الهدف → إكمال تلقائي.

## المرحلة 6 — الصندوق العائم (Floating Chest)

- مكوّن `FloatingChest.tsx` يستمع لـ idle/active بـ 60 ثانية نشاط مستمر في أي وحدة، يظهر بأنيميشن CSS، عند الفتح يعطي مكافأة عشوائية.

## المرحلة 7 — صفحة Stats/Journey + Share

- صفحة جديدة `/journey` (route فقط، بدون لمس routes الحالية): إجمالي الأكواب، ساعات الدراسة، التحديات، XP، Streak.
- زر Share: يولّد Canvas image (Base64) أو نص منسّق ويستخدم `navigator.share` أو نسخ للحافظة.

## المرحلة 8 — Seasons UI

- غلاف فوق `DailyComboChallenge` يعرض "Summer Season 2026 — 30 يوم" مع شريط تقدم.

## المرحلة 9 — إصلاحات الأدوات

- **FileCompressor**: Canvas re-encode للصور مع `quality` ديناميكي حتى يقترب من النسبة المختارة، عرض الحجم النهائي الحقيقي، تحذير لو <60%.
- **FormatConverter**: استخدام `mammoth` للـ docx→text، `pdfjs-dist` للـ pdf→text، حماية النص من التشوّه.
- **ImageResizer**: إجبار أسهم الزيادة/النقصان بـ CSS `appearance: auto` + fallback أزرار +/− مرئية دائمًا لـ px/in/cm.

## المرحلة 10 — صوتيات + Bottom Nav

- سلايدر `<input type="range">` لكل صوت ASMR في `DeepFocusRoom` و Pomodoro.
- في إعدادات الـ BottomNav: ترتيب items 1–6، زر "تطبيق الترتيب" يحفظ في localStorage ويُطبَّق.

---

## تفاصيل تقنية مختصرة

- Zero new deps إن أمكن، عدا `mammoth` و `pdfjs-dist` للمرحلة 9 (اختياري — أقدر أعمل تحويل أبسط بدونهم).
- لا تغيير في routes موجودة، لا حذف ميزات، لا تغيير في `client.ts`/`types.ts`/PWA service worker.

---

## سؤالي قبل ما أبدأ

الطلب أكبر من جلسة واحدة. أقترح أبدأ بـ **المراحل 1+2+3+4** الآن (الأساس + Streak + ثيمات + تطور الدينو)، وبعد ما تأكد إنها شغالة عندك أكمل الباقي. توافق؟ أو تفضّل ترتيب مختلف للأولويات؟
