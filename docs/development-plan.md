# תוכנית עבודה מפורטת
# Shipment Tracking App — Development Plan

> מסמך זה מפרק את מסמך התכנון המקורי (אפליקציית מעקב משלוחים, כלים חינמיים בלבד)
> ל-Epics ול-Issues מסודרים לפי סדר ותלויות, כדי שיהיה אפשר להעביר אותו ישירות ל-GitHub Issues / Jira.
>
> This document breaks the original spec down into ordered Epics and Issues, with dependencies,
> so it can be moved directly into GitHub Issues / Jira.

---

## 0. החלטת סטאק שממתינה להכרעה
## 0. Open Stack Decision

הריפו הקיים (`exam-simulator`) הוא כרגע אפליקציית **Next.js** (web) עם עמוד התחברות בסיסי.
המסמך המקורי מתאר סטאק שונה:
**React Native + Expo** (מובייל) מול **FastAPI** (backend) ו-**Supabase**.

The current repo is a **Next.js** web app.
The original spec describes **React Native + Expo** (mobile) with a **FastAPI** backend.

**החלטה שצריך לקבל לפני Milestone 1:**
- אופציה A: להמשיך כאתר Next.js, ולממש את כל הפיצ'רים (Auth, Email Sync, Tracking) בתוך Next.js (API Routes) + Supabase.
- אופציה B: לפתוח פרויקט Expo נפרד (מובייל), ו-Next.js יישאר רק כ-Landing/Admin.
- אופציה C: FastAPI כ-backend נפרד, Next.js/Expo כ-frontend בלבד.

עד להחלטה סופית — הפיצ'רים ייבנו בצורה שתומכת גם ב-A וגם ב-C
(לוגיקת ה-parsing וה-tracking תיכתב כ-service layer מבודד, לא תלוי-framework).

---

## 1. עקרונות מנחים
## 1. Guiding Principles

1. 100% כלים חינמיים / Free Tiers (Supabase, Render Free, Upstash Redis, Groq, Expo, UptimeRobot, Sentry Free).
2. Parsing היברידי — Rule-Based קודם, LLM (Groq) כ-Fallback בלבד.
3. אבטחה: הצפנת access/refresh tokens במנוחה, RLS על כל טבלה שמכילה נתוני משתמש.
4. Observability: Sentry + UptimeRobot + Dead Letter Queue לכל תהליך async.
5. כל Epic מפורק ל-Issues שאפשר לסגור בנפרד ולבדוק בנפרד (independently testable).

---

## 2. Milestones ו-Epics (סדר ותלויות)
## 2. Milestones and Epics (order & dependencies)

```
M0 Foundations
 └─ M1 Auth & Supabase
     └─ M2 Email Connection (OAuth)
         └─ M3 Order Parsing Pipeline
             └─ M4 Tracking Enrichment
                 └─ M5 Notifications
                     └─ M6 Mobile/Web UI
                         └─ M7 Monitoring & Hardening
```

כל Milestone תלוי בקודם לו. אפשר להתחיל UI סטטי (mock data) מקביל ל-M2–M4, אבל אינטגרציה אמיתית מחכה לתלויות.

---

### M0 — Foundations
**מטרה:** תשתית פרויקט, לפני קוד פיצ'רים.

| # | Issue | תיאור | תלות |
|---|-------|-------|------|
| 0.1 | החלטת סטאק (ר' סעיף 0) | לקבוע Next.js-only / Expo+FastAPI / היברידי | — |
| 0.2 | הקמת חשבונות כלים חינמיים | Supabase, Render, Upstash, Groq, Sentry, UptimeRobot, Expo | 0.1 |
| 0.3 | מבנה Monorepo | תיקיות `apps/web` (או `apps/mobile`), `apps/backend` (אם FastAPI נפרד), `packages/shared` | 0.1 |
| 0.4 | CI בסיסי | lint + typecheck + test על כל push | 0.3 |
| 0.5 | Secrets management | `.env.example`, טעינת secrets מ-Render/Vercel/Expo, בלי secrets ב-git | 0.3 |

---

### M1 — Auth & Supabase
**מטרה:** התחברות משתמשים + טבלת `profiles` + RLS.

| # | Issue | תיאור | תלות |
|---|-------|-------|------|
| 1.1 | פרויקט Supabase + מיגרציות | טבלת `profiles`, `updated_at` trigger | 0.2 |
| 1.2 | RLS policies ל-`profiles` | משתמש רואה/עורך רק את הרשומה שלו | 1.1 |
| 1.3 | Supabase Auth (email + Google OAuth) | חיבור client SDK | 1.1 |
| 1.4 | חיבור עמוד ההתחברות הקיים ל-Supabase Auth | להחליף/לחבר את `app` הקיים | 1.3 |
| 1.5 | Session handling + protected routes | Middleware / guard | 1.4 |

**Acceptance:** משתמש נרשם, מתחבר, מקבל session תקף, ורואה רק את הנתונים שלו.

---

### M2 — Email Connection (OAuth)
**מטרה:** חיבור Gmail/Outlook, אחסון tokens מוצפנים.

| # | Issue | תיאור | תלות |
|---|-------|-------|------|
| 2.1 | טבלת `email_connections` + RLS | provider, encrypted tokens, expiry | M1 |
| 2.2 | הצפנת tokens (at rest) | AES-256 / Supabase Vault | 2.1 |
| 2.3 | Gmail OAuth flow | consent screen, scopes מינימליים (`gmail.readonly`) | 2.2 |
| 2.4 | Outlook OAuth flow (Microsoft Graph) | אותו דפוס כמו Gmail | 2.2 |
| 2.5 | Refresh token rotation | job שמחדש tokens לפני שפג תוקפם | 2.3, 2.4 |
| 2.6 | UI לניהול חיבורים | חיבור/ניתוק חשבון מייל | 2.3, 2.4 |

**Acceptance:** משתמש מחבר Gmail/Outlook, ה-tokens מוצפנים ב-DB, וניתן לנתק בכל רגע.

---

### M3 — Order Parsing Pipeline
**מטרה:** משיכת מיילים חדשים וחילוץ הזמנות.

| # | Issue | תיאור | תלות |
|---|-------|-------|------|
| 3.1 | Incremental email sync | Gmail `historyId` / Graph delta query, cron או Pub/Sub | M2 |
| 3.2 | תור עיבוד (Upstash Redis) | Queue + Dead Letter Queue | 0.2 |
| 3.3 | Rule-Based Parser | regex/heuristics לפי ספקים נפוצים (Amazon, AliExpress, ישראפוסט וכו') | 3.1, 3.2 |
| 3.4 | Groq LLM Fallback | JSON-mode extraction כשה-Rule-Based נכשל | 3.3 |
| 3.5 | טבלת `orders` + RLS | שמירת הזמנה + מספר מעקב אם קיים | 3.3 |
| 3.6 | Retry + DLQ handling | הודעות שנכשלו פעמיים → DLQ + Sentry alert | 3.2 |

**Acceptance:** מייל הזמנה חדש → שורת `orders` נוצרת תוך דקות, עם fallback ל-LLM כשצריך.

---

### M4 — Tracking Enrichment
**מטרה:** מעקב אחרי חבילות עם מספרי מעקב.

| # | Issue | תיאור | תלות |
|---|-------|-------|------|
| 4.1 | אינטגרציית WhereParcel API | רישום tracking number, קבלת סטטוס | M3 |
| 4.2 | אינטגרציית package.place (fallback/השלמה) | לספקים שלא מכוסים ב-WhereParcel | 4.1 |
| 4.3 | Webhook receiver לעדכוני סטטוס | endpoint מאובטח (חתימת webhook) | 4.1 |
| 4.4 | טבלת `shipments` + `shipment_events` | היסטוריית סטטוסים | 4.1 |
| 4.5 | Polling fallback | אם webhook לא הגיע — cron בדיקה תקופתית | 4.3 |

**Acceptance:** הזמנה עם tracking number מקבלת עדכוני סטטוס אוטומטית, גם דרך webhook וגם דרך polling.

---

### M5 — Notifications
**מטרה:** התראות Push על שינויי סטטוס.

| # | Issue | תיאור | תלות |
|---|-------|-------|------|
| 5.1 | רישום Expo Push Token למכשיר | (רלוונטי אם יש אפליקציית מובייל) | M1, 0.1 |
| 5.2 | טריגר התראה על שינוי סטטוס ב-`shipment_events` | Supabase trigger/edge function | M4 |
| 5.3 | העדפות התראה למשתמש | on/off, סוגי סטטוס | 5.1 |
| 5.4 | Web Push fallback (אם נשארים ב-Next.js) | Notification API / Service Worker | 0.1 |

**Acceptance:** שינוי סטטוס משלוח שולח התראה תוך דקות, בהתאם להעדפות המשתמש.

---

### M6 — Mobile/Web UI
**מטרה:** ממשק משתמש מלא מעל הנתונים האמיתיים (לא mock).

| # | Issue | תיאור | תלות |
|---|-------|-------|------|
| 6.1 | מסך רשימת משלוחים | סינון/מיון לפי סטטוס | M4 |
| 6.2 | מסך פרטי משלוח | timeline של `shipment_events` | 6.1 |
| 6.3 | מסך חיבור מיילים | UI מעל M2 | M2 |
| 6.4 | מסך הגדרות התראות | UI מעל M5 | M5 |
| 6.5 | Empty/Error/Loading states | לכל מסך | 6.1–6.4 |

---

### M7 — Monitoring & Hardening
**מטרה:** לוודא שהמערכת שורדת spin-down, quotas, וכשלים.

| # | Issue | תיאור | תלות |
|---|-------|-------|------|
| 7.1 | Sentry integration (backend + frontend) | error tracking | כל M-ים הקודמים |
| 7.2 | UptimeRobot keepalive | פינג כל 5 דק' ל-Render Free | 0.2 |
| 7.3 | Dashboard בריאות מערכת | DLQ size, sync lag, token expiry קרוב | 3.6, 2.5 |
| 7.4 | בדיקות עומס בסיסיות מול quotas חינמיים | Gmail API, Groq, WhereParcel (1,000/חודש), Upstash (500K/חודש) | כל M-ים |
| 7.5 | תיעוד Runbook | מה עושים כשמשהו נופל (DLQ מלא, quota חורג, DB pause) | 7.1–7.3 |

---

## 3. סיכום סדר עבודה מומלץ
## 3. Recommended Execution Order

1. **M0** — להכריע על הסטאק (סעיף 0) — זה חוסם הכל.
2. **M1** — Auth, כי הכל תלוי במשתמש מזוהה.
3. **M2 → M3 → M4** — הליבה העסקית (מייל → הזמנה → מעקב), ברצף כי כל שלב תלוי בקודם.
4. **M5, M6** יכולים להתקדם במקביל אחרי שיש נתונים אמיתיים מ-M4 (אפשר להתחיל M6 מוקדם יותר עם mock data).
5. **M7** רץ לאורך כל הפרויקט אבל מקבל תשומת לב מלאה בסוף כל Milestone.

---

## 4. הצעד הבא
## 4. Next Step

לפני שממשיכים לכתיבת קוד — יש להכריע בסעיף 0 (Stack Decision), ואז לפתוח Issues בפועל ב-GitHub לפי הטבלאות למעלה.

Before writing any feature code, Section 0 (Stack Decision) needs to be resolved,
and then the tables above should be turned into actual GitHub Issues.
