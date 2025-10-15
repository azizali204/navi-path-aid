# نظام الخرائط البحرية العسكرية - نسخة MVP تجريبية
## Private Naval Map System - MVP Demo

---

## 📋 نظرة عامة

نظام خرائط بحرية عسكرية تفاعلي مصمم لعرض وإدارة الرموز والمواقع العسكرية البحرية. هذه نسخة MVP تجريبية للعرض والاختبار.

---

## 🚀 التشغيل السريع

### 1. تثبيت المتطلبات

```bash
npm install
```

### 2. إعداد رمز Mapbox

افتح الملف `src/components/military/MilitaryMap.tsx` وابحث عن السطر:

```typescript
const MAPBOX_ACCESS_TOKEN = 'REPLACE_WITH_YOUR_MAPBOX_TOKEN';
```

استبدل `REPLACE_WITH_YOUR_MAPBOX_TOKEN` برمز Mapbox العام الخاص بك (`pk.*`).

للحصول على رمز Mapbox:
1. انتقل إلى https://mapbox.com
2. قم بإنشاء حساب أو تسجيل الدخول
3. انتقل إلى لوحة التحكم → Tokens
4. انسخ الرمز العام (Public Token) الذي يبدأ بـ `pk.`

### 3. تشغيل التطبيق

```bash
npm run dev
```

### 4. تسجيل الدخول (نسخة تجريبية)

- **اسم المستخدم:** `user`
- **كلمة المرور:** `Aa123456`

---

## ⚠️ ملاحظات أمنية مهمة جداً

### 🔒 حماية رموز الوصول (API Tokens)

**تحذير:** هذه النسخة تجريبية فقط. في النسخ الإنتاجية:

#### 1. لا تضع الرموز السرية في الكود الأمامي (Client-Side)

```javascript
// ❌ خطأ - يمكن لأي شخص رؤية الرمز في متصفحه
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoieW91ci1zZWNyZXQta2V5...';
```

**لماذا هذا خطير؟**
- أي شخص يفتح التطبيق يمكنه رؤية الرمز في كود المصدر
- يمكن استخدام الرمز من قبل الآخرين مما يؤدي إلى:
  - استنزاف الحصة المجانية (quota)
  - تكاليف مالية غير متوقعة
  - إساءة استخدام الحساب

#### 2. الحلول الآمنة للإنتاج

**الحل أ: استخدام رموز عامة محدودة Restricted Public Tokens**

```javascript
// ✅ صحيح - استخدام رمز عام محدود فقط لطبقات الخرائط
// قم بتقييد الرمز في لوحة تحكم Mapbox:
// - السماح فقط لنطاقات (domains) محددة
// - السماح فقط بطلبات الخرائط (tiles)
// - منع العمليات الحساسة
```

**الحل ب: استخدام خادم وسيط (Proxy Server)**

```javascript
// في الخادم (Node.js مثلاً):
app.get('/api/map-tiles/:z/:x/:y', async (req, res) => {
  const { z, x, y } = req.params;
  const MAPBOX_SECRET = process.env.MAPBOX_SECRET; // مخزن بشكل آمن
  
  const response = await fetch(
    `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/${z}/${x}/${y}?access_token=${MAPBOX_SECRET}`
  );
  
  const data = await response.buffer();
  res.send(data);
});

// في الكود الأمامي:
L.tileLayer('/api/map-tiles/{z}/{x}/{y}').addTo(map);
```

**الحل ج: دوران الرموز (Token Rotation)**

قم بتوليد رموز مؤقتة من الخادم كل فترة زمنية محددة.

---

### 🔐 نقل المصادقة إلى الخادم

**المشكلة الحالية (تجريبي فقط):**

```typescript
// ❌ DEMO ONLY - المصادقة في المتصفح
const DEMO_CREDENTIALS = {
  username: "user",
  password: "Aa123456"
};

if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
  onLogin();
}
```

**هذا خطير لأن:**
- كلمة المرور مكشوفة في الكود
- يمكن لأي شخص رؤية آلية المصادقة
- لا توجد حماية ضد الهجمات المتكررة (brute force)

---

### ✅ الحل الآمن: المصادقة من الخادم

#### الخطوة 1: إنشاء API للمصادقة على الخادم

```javascript
// في الخادم (server.js)
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  // التحقق من قاعدة البيانات
  const user = await db.users.findOne({ username });
  
  if (!user) {
    return res.status(401).json({ error: 'بيانات غير صحيحة' });
  }
  
  // التحقق من كلمة المرور (مشفرة في قاعدة البيانات)
  const isValid = await bcrypt.compare(password, user.passwordHash);
  
  if (!isValid) {
    return res.status(401).json({ error: 'بيانات غير صحيحة' });
  }
  
  // توليد رمز JWT
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({ token, user: { username: user.username } });
});
```

#### الخطوة 2: استخدام الرمز في الكود الأمامي

```typescript
// في React/Frontend
const handleLogin = async (username: string, password: string) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      throw new Error('فشل تسجيل الدخول');
    }
    
    const { token } = await response.json();
    
    // تخزين الرمز بشكل آمن
    localStorage.setItem('auth_token', token);
    
    // الآن المستخدم مصادق
    onLogin();
  } catch (error) {
    showError('اسم المستخدم أو كلمة المرور غير صحيحة');
  }
};
```

#### الخطوة 3: حماية الطلبات

```typescript
// إضافة الرمز لكل طلب
const token = localStorage.getItem('auth_token');

fetch('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🛡️ قائمة فحص الأمان للإنتاج

- [ ] نقل المصادقة إلى الخادم
- [ ] استخدام HTTPS فقط
- [ ] تشفير كلمات المرور (bcrypt أو Argon2)
- [ ] استخدام JWT أو Sessions للجلسات
- [ ] إخفاء الرموز السرية في متغيرات البيئة (.env)
- [ ] تقييد رموز Mapbox حسب النطاق
- [ ] إضافة Rate Limiting لمنع الهجمات المتكررة
- [ ] تسجيل محاولات تسجيل الدخول الفاشلة
- [ ] إضافة 2FA (المصادقة الثنائية) للحسابات الحساسة
- [ ] استخدام Content Security Policy (CSP) Headers
- [ ] التحقق من صحة المدخلات على الخادم
- [ ] فحص الثغرات الأمنية بشكل دوري

---

## 📁 هيكل المشروع

```
src/
├── components/
│   ├── auth/
│   │   └── LoginScreen.tsx          # شاشة تسجيل الدخول
│   ├── military/
│   │   ├── MilitaryMap.tsx          # الخريطة الرئيسية
│   │   ├── MilitarySymbolIcons.tsx  # أيقونات الرموز العسكرية
│   │   ├── MapControls.tsx          # عناصر التحكم بالطبقات
│   │   ├── MapLegend.tsx            # مفتاح الرموز
│   │   └── SearchPanel.tsx          # لوحة البحث
│   └── ui/                          # مكونات الواجهة
├── pages/
│   └── Index.tsx                    # الصفحة الرئيسية
└── utils/
    └── navigationCalc.ts            # حسابات الملاحة

public/
└── data/
    └── markers.geojson              # بيانات الرموز العسكرية
```

---

## 🎯 الميزات

### ✅ المصادقة (تجريبي)
- شاشة تسجيل دخول عربية RTL
- مصادقة عميل تجريبية (للاختبار فقط)

### 🗺️ الخريطة التفاعلية
- خريطة Leaflet مع طبقات Mapbox
- موضوع داكن ملائم للجسر البحري
- عرض الإحداثيات الحية
- عناصر تحكم بالتكبير والمقياس

### 🎖️ الرموز العسكرية (11 نوع)
- سفن (دورية، فرقاطة، تجارية)
- غواصات
- قواعد بحرية وثكنات
- موانئ
- خطوط دفاعية
- أبراج مراقبة
- عوامات ملاحية
- مناطق محظورة
- نقاط رسو
- مهابط هليكوبتر
- حقول ألغام

### 🔧 عناصر التحكم
- تبديل الطبقات حسب النوع
- بحث بالاسم العربي
- مفتاح الرموز
- حفظ موضع العرض في LocalStorage

---

## 🚧 للتطوير المستقبلي

- [ ] إضافة مصادقة حقيقية من الخادم
- [ ] تكامل AIS لتتبع السفن الحية
- [ ] رسم المسارات والتخطيط
- [ ] بيانات الطقس البحري
- [ ] طبقات أعماق المياه
- [ ] تنبيهات المخاطر
- [ ] دعم Multi-user وصلاحيات

---

## 📝 ملاحظات المطور

**للتذكير:** هذا MVP تجريبي للعرض. قبل الإنتاج:

1. **الأمان أولاً** - نقل كل المصادقة والرموز السرية للخادم
2. **اختبار الأداء** - مع بيانات GeoJSON كبيرة، استخدم clustering
3. **الاحتياطي** - احفظ البيانات في قاعدة بيانات وليس localStorage فقط
4. **المراقبة** - أضف تسجيل الأخطاء والمراقبة
5. **الوثائق** - وثق API endpoints وهيكل البيانات

---

## 📞 الدعم

للأسئلة أو المشاكل، افتح Issue في المستودع.

---

**تم بناؤه بـ ❤️ للبحارة والحراس البحريين** ⚓🌊

*"البحر لا يغفر الأخطاء، لكن الخرائط الجيدة تمنعها"*
