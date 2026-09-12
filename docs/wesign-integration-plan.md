# תוכנית לחיבור מלא ל-WeSign API

מסמך זה מתאר תוכנית עבודה לחיבור פרויקט exam-simulator
ל-WeSign API גרסה 4.0.0.

המקורות למסמך זה: `WeSign-API_V4.pdf`
(הודעת שינויים רשמית לגרסה 4.0.0)
וקובץ ה-Release Notes הכללי של WeSign.

---

## 0. מצב קיים בפרויקט

נכון לרגע כתיבת מסמך זה, הפרויקט הוא שלד Next.js בסיסי:

- קיים route בודד: `app/api/login/route.js`,
  שמדמה login מקומי (ולא מול WeSign).
- אין עדיין תשתית שיחה החוצה
  (fetch client, ניהול secrets, ניהול טוקנים).
- אין קובץ `.env` בפרויקט.

המשמעות: מדובר בחיבור מאפס (greenfield),
לא בהתאמה של אינטגרציה קיימת.

---

## 1. מטרת החיבור

יש להגדיר תחילה **מה בדיוק exam-simulator צריך מ-WeSign**,
כי זה קובע אילו endpoints רלוונטיים בפועל.

התרחיש הסביר ביותר לפרויקט "סימולטור בחינות":

- שליחת מסמך (למשל: הצהרת נבחן, תעודת הצלחה,
  הסכם/ויתור) לחתימה דיגיטלית של המשתמש
  לאחר סיום מבחן.
- מעקב אחרי סטטוס החתימה
  (נחתם / נדחה / ממתין).
- הורדת המסמך החתום ואחסונו מול רשומת המשתמש.

**שאלה פתוחה למשתמש** (ראו סעיף 8) —
יש לאשר את התרחיש בפועל לפני שממשיכים לשלב הביצוע.

---

## 2. עקרונות ארכיטקטורה

### 2.1 שכבת Proxy בצד שרת

Next.js Route Handlers (בתוך `app/api/wesign/*`)
ישמשו כשכבת ביניים בין הדפדפן לבין WeSign.

**לעולם לא** לקרוא ל-WeSign ישירות מהדפדפן —
כי זה יחשוף credentials וטוקנים ל-client.

מבנה מוצע:

```
lib/wesign/
  client.ts        // fetch wrapper + base URL + headers
  auth.ts          // login, refresh, token storage
  types.ts         // טיפוסי DTO לפי מפרט 4.0.0
  errors.ts        // מיפוי ResultCode -> הודעה למשתמש
app/api/wesign/
  login/route.ts
  documents/route.ts
  documents/[id]/route.ts
  distribution/route.ts
  webhook/route.ts   // callback מ-WeSign
```

### 2.2 בסיס הכתובת

לפי המסמך: `https://<host>/v3/*`.

קידומת הנתיב **לא** משתנה בגרסה 4.0.0 —
אין `/v4/`. יש לשמור על `/v3/` בקוד.

כתובת ה-host המדויקת (production / sandbox)
צריכה להתקבל מ-WeSign ולהישמר כמשתנה סביבה:

```
WESIGN_API_BASE_URL=
WESIGN_USERNAME=
WESIGN_PASSWORD=
```

Secrets לא נשמרים בקוד, רק ב-`.env.local`
(ולא ב-git) ובמשתני סביבה של הפריסה (Vercel וכו').

---

## 3. אימות (Authentication)

### 3.1 Login

`POST /v3/Users/login`

מחזיר `token`, `refreshToken`, `authToken`.

יש לשמור את שלושתם — לא רק את ה-token הראשי.

### 3.2 החלפת סיסמה

`POST /v3/Users/change`

**שינוי קריטי בגרסה 4.0.0**:
קריאה זו כיום מחזירה 200 עם גוף תשובה חדש
(היה ריק בעבר), והטוקן הישן **נפסל מיד**.

יש לעדכן את לוגיקת ה-client כך שאחרי `change`
היא שומרת את שלושת הטוקנים החדשים מהתשובה,
ולא ממשיכה להשתמש בטוקן שהיה בזיכרון לפני הקריאה.

### 3.3 ניהול טוקנים בצד שרת

מכיוון ש-exam-simulator הוא שרת Next.js —
מומלץ session אחד לכלל האפליקציה מול WeSign
(service account), ולא token per-user,
אלא אם WeSign דורש זהות per-end-user.

**שאלה פתוחה למשתמש**:
האם כל תלמיד/נבחן מקבל חשבון WeSign נפרד,
או שיש חשבון שירות אחד ששולח מסמכים בשם המערכת?
זה משפיע מהותית על מבנה ה-auth.

---

## 4. Endpoints מרכזיים לשימוש

| Endpoint | שימוש בפרויקט |
|---|---|
| `POST /v3/Users/login` | התחברות לחשבון השירות |
| `GET /v3/Configuration` | קריאת `maxTemplatesPerProcess` בזמן ריצה, לא לקודד 10 |
| `GET /v3/Templates` | רשימת תבניות מסמכים (הצהרה, תעודה וכו') |
| `POST /v3/DocumentCollections` | יצירת מסמך לחתימה מתבנית |
| `POST /v3/Distribution` / `POST /v3/Distribution/signers` | שליחת המסמך לחותם (SMS / Email / WhatsApp) |
| `GET /v3/DocumentCollections/info/{id}` | בדיקת סטטוס חתימה |
| `GET /v3/Distribution/{id}` | מעקב אחרי הפצה ספציפית |
| `GET /v3/Reports/UsageData` | דוחות שימוש, לניטור מכסות |

כל שאר ה-endpoints (אנשי קשר, קבוצות, ניהול משתמשים)
רלוונטיים רק אם יידרש ניהול נמענים דינמי.

---

## 5. נקודות קריטיות מהודעת השינויים לגרסה 4.0.0

חובה להטמיע את הסעיפים הבאים כבר בפיתוח הראשוני,
כי הם ההתנהגות הנוכחית של ה-API (לא תוספת עתידית):

1. **`companySigner1Details`** — השדות `certPassword`
   ו-`signer1Configuration` הוסרו. אסור לבנות עליהם תלות.

2. **`PUT /v3/Users`** — יש לשלוח תמיד `userConfiguration`
   מלא כולל `dateFormat` (1–4). קריאה קודמת ל-`GET /v3/Users`
   נדרשת לפני עדכון, כדי לא לאפס הגדרות קיימות.

3. **`POST /v3/Users/change`** — טיפול בטוקנים החדשים
   (ראו סעיף 3.2 לעיל).

4. **מגבלת תבניות** — לקרוא את `maxTemplatesPerProcess`
   מ-`GET /v3/Configuration`, לא לקודד 10 בקוד.

5. **`sendingMethod`** — אם משתמשים בשדה הזה בבקשת
   `Distribution`, יש לוודא בקוד שהוא תואם לנתוני הנמען
   (1=SMS, 2=Email, 4=WhatsApp) לפני השליחה,
   כדי להימנע מ-400.

6. **`GET /v3/Reports/FrequencyReports`** — קוד הסטטוס השתנה
   מ-204 ל-200 עם מערך ריק. אין להסתעף על 204.

7. **`timeSent` בחותם** — כעת זמן השליחה הראשונה,
   ויכול להיות `null`. הקוד חייב לטפל ב-null.

8. **מדיניות סיסמאות** — מקסימום 128 תווים (חדש),
   מינימום לפי הגדרת החברה, ספרה אחת ותו מיוחד חובה.

9. **`PUT /v3/Contacts/deletebatch`** — אין לשלוח רשימת
   ids ריקה.

10. **DTOs** — ה-deserializer בצד שרת **חייב** לסבול שדות
    לא מוכרים (unknown properties = allow, not fail),
    כי גרסה 4.0.0 הוסיפה שדות לתשובות קיימות.
    זו נקודה קריטית ל-TypeScript types:
    להגדיר טיפוסים "פתוחים" ולא סכמות נוקשות שנכשלות
    על שדה חדש.

11. **קבצים גדולים** — תגובת 413 (Request Entity Too Large)
    עם `ResultCode 163` יש לטפל בה כמו 400.
    יש לפנות ל-WeSign (סעיף 7 במסמך המקור)
    כדי לקבל את מגבלת הגודל בפועל, ולא לקודד מספר בניחוש.

12. **`nextRenewalDate`** — מחרוזת בפורמט `dd-MM-yyyy`,
    לא אובייקט תאריך. אין לפרסר כ-Date עם timezone.

---

## 6. טיפול בשגיאות

יש לבנות מיפוי מרכזי (`lib/wesign/errors.ts`) בין
`ResultCode` להודעה ידידותית בעברית, כולל הקודים החדשים:

| קוד | משמעות |
|---|---|
| 154 | תמונה חורגת ממגבלת רזולוציה |
| 161 | חתימה בכרטיס חכם מחייבת אפליקציית דסקטופ |
| 162 | חתימה בכרטיס חכם אינה כלולה בתוכנית |
| 163 | קובץ חורג מהגודל המותר |
| 165 | המסמך אינו זמין יותר לחתימה |
| 166 | שליחת קוד OTP נכשלה |

כל שגיאת 400/413 מה-API צריכה להגיע ל-UI
כהודעה ברורה, לא כ-stack trace גולמי.

---

## 7. Webhook / Call back

לפי ה-Release Notes (V3.2.2): callback לא חוזר יותר
בסטטוס "שמירה", אלא רק בסטטוס "סיום".

אם exam-simulator ירצה עדכון בזמן אמת על השלמת חתימה,
יש להקים endpoint ייעודי:

```
POST /app/api/wesign/webhook
```

שיאמת את מקור הבקשה (חתימה/סוד משותף אם WeSign תומך בכך),
ויעדכן את סטטוס הרשומה במסד הנתונים הפנימי.

**שאלה פתוחה**: יש לוודא מול WeSign
כיצד מוגדר ה-callback URL בפועל (ברמת חברה? ברמת בקשה?)
ואם יש מנגנון חתימה/אימות לבקשת ה-webhook.

---

## 8. שאלות פתוחות למשתמש (יש להשיב לפני מימוש)

Please answer in English, or in Hebrew — either is fine:

1. What is the exact business flow —
   which document needs to be signed, by whom, and when
   in the exam flow?
   מה בדיוק תהליך העסקי — איזה מסמך נחתם,
   על ידי מי, ובאיזה שלב בתהליך הבחינה?

2. Do we have WeSign sandbox/test credentials yet?
   האם כבר יש בידינו פרטי גישה (username/password/host)
   לסביבת בדיקות של WeSign?

3. Is signing per-student (each exam-taker signs directly),
   or does the system send on behalf of a single service account?
   האם החתימה היא פר-נבחן, או שהמערכת שולחת
   בשם חשבון שירות אחד?

4. Do we need real-time status updates (webhook),
   or is polling `GET /v3/DocumentCollections/info/{id}` enough?
   האם נדרש עדכון בזמן אמת (webhook),
   או שמספיק polling על סטטוס המסמך?

---

## 9. שלבי ביצוע מוצעים

1. קבלת credentials לסביבת בדיקות ותשובות לסעיף 8.
2. בניית `lib/wesign/client.ts` + `auth.ts` (login, refresh).
3. בניית טיפוסים (`types.ts`) לפי מפרט ה-OpenAPI של 4.0.0
   (יש להוריד אותו מ-Swagger, לא להסתמך רק על המסמך).
4. מימוש יצירת מסמך + שליחה לחתימה (Happy path בלבד).
5. מימוש טיפול בשגיאות ומצבי קצה (סעיפים 5–6 לעיל).
6. מימוש מעקב סטטוס (polling או webhook, לפי החלטה בסעיף 8).
7. בדיקות מול סביבת test, כולל תרחישי כשל (400/413/401).
8. מעבר לסביבת production.

---

## 10. אנשי קשר לתמיכה (מהמסמך המקור)

- שאלות כלליות על השינויים: `pro-support@comda.co.il`
- שימוש ב-`certPassword` / `signer1Configuration`,
  או דיווח על אי-התאמה למפרט: `products@comsigntrust.com`
- מפרט OpenAPI מלא: `https://wse.comsigntrust.com/api/swagger/index.html`
