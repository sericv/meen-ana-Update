# من أنا؟ — Admin Dashboard

لوحة إدارة محلية لإضافة وتعديل بطاقات وتصنيفات اللعبة.

---

## الخطوة 1 — نشر قواعد Firestore

```bash
firebase deploy --only firestore:rules
```

أو من Firebase Console → Firestore → Rules — انسخ محتوى `firestore.rules`.

---

## الخطوة 2 — تشغيل سكريبت النقل (Migration)

يرفع جميع البطاقات والتصنيفات الموجودة محلياً إلى Firestore.

### المتطلبات

```bash
# من مجلد المشروع الرئيسي
npm install firebase-admin   # إن لم يكن مثبتاً
```

### تشغيل جرب (بدون كتابة)

```bash
node admin/migrate.js --dry-run
```

### تشغيل فعلي

```bash
node admin/migrate.js
```

### خيارات إضافية

```bash
# تحديد ملف Service Account يدوياً
node admin/migrate.js --service-account ./service-account.json

# إعادة كتابة البطاقات الموجودة
node admin/migrate.js --force
```

### الحصول على Service Account

1. Firebase Console → Project Settings → Service Accounts
2. "Generate new private key" → احفظ الملف
3. مرّر المسار لـ `--service-account ./your-file.json`
   أو ضعه في `.env.local` كـ `FIREBASE_SERVICE_ACCOUNT_JSON`

---

## الخطوة 3 — تشغيل لوحة الإدارة

```bash
cd admin
npx serve .
# أو
python -m http.server 8080
```

ثم افتح: **http://localhost:3000** (أو المنفذ الظاهر)

> **ملاحظة:** لا تعمل عبر `file://` — استخدم localhost دائماً.

---

## الميزات

| الميزة | التفاصيل |
|--------|---------|
| **البطاقات** | إضافة، تعديل، حذف، بحث، تصفية بالتصنيف والحالة |
| **التصنيفات** | إضافة، تعديل، حذف، اختيار إيموجي |
| **الصور** | رفع وتحويل تلقائي لـ Base64 |
| **الإجابات** | قائمة متعددة قابلة للتعديل |
| **التفعيل** | إخفاء بطاقات دون حذفها |
| **المزامنة** | البطاقات الجديدة تظهر في اللعبة فوراً |

---

## كيف تعمل البطاقات في اللعبة؟

```
Firestore cards  ──┐
                   ├──► mergeAndPickTwo() ──► match start
Static JSON cards ──┘
```

- **الأولوية**: نسخة Firestore تتغلب على النسخة الثابتة لنفس الـ ID
- **البطاقات الجديدة**: تُضاف تلقائياً للعب بعد حفظها من اللوحة
- **الفول باك**: إذا فشل Firestore، تعمل البطاقات الثابتة كالمعتاد

---

## UID المشرف

```
GjIev1orTnNtoHh9UPnBr9UF9Yd2
```

مُضمّن في `firestore.rules` — فقط هذا الحساب يستطيع إنشاء/تعديل/حذف البطاقات والتصنيفات.
