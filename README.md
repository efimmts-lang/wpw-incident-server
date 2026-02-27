# 🏭 WPW — מערכת ניהול תקלות תעשייתית

## Full-Stack: API Server + Telegram Bot + Web App

---

## 🏗️ ארכיטקטורה

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Web App    │────▶│  Express API  │◀────│ Telegram Bot│
│  (React)    │     │  (Node.js)   │     │  (HE/EN/RU) │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────▼───────┐
                    │   SQLite DB   │
                    │  (wpw.db)    │
                    └──────────────┘
```

## 📦 מה בפנים

| קובץ | תיאור |
|------|-------|
| `src/server.js` | Express API — כל ה-endpoints |
| `src/database.js` | SQLite — סכמה + 37 מכונות + 10 משתמשים |
| `src/start.js` | הפעלה משולבת (שרת + בוט) |
| `bot/telegram.js` | בוט טלגרם — 3 שפות, פתיחת תקלות, ACK, התראות |
| `public/` | קבצי Frontend (React app) |

---

## 🚀 התקנה — 5 דקות

### 1. דרישות מקדימות
```bash
# צריך Node.js 18+
node --version  # v18.x.x ומעלה

# אם אין — התקנה:
# Windows: https://nodejs.org
# Linux: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash && sudo apt install nodejs
```

### 2. הורדה והתקנה
```bash
# העתק את התיקיה wpw-server למחשב
cd wpw-server

# התקנת חבילות
npm install
```

### 3. הגדרת Telegram Bot
```bash
# 1. פתח Telegram ושלח הודעה ל: @BotFather
# 2. שלח: /newbot
# 3. בחר שם: WPW Incidents
# 4. בחר username: wpw_incidents_bot (או שם אחר)
# 5. תקבל TOKEN — העתק אותו

# 4. צור קובץ .env:
cp .env.example .env

# 5. ערוך את .env — שים את ה-TOKEN:
# TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 4. הפעלה
```bash
# הפעלה משולבת (שרת + בוט):
node src/start.js

# או בנפרד:
node src/server.js   # רק API
node bot/telegram.js  # רק בוט
```

### 5. ✅ בדיקה
```bash
# בדוק שהשרת עובד:
curl http://localhost:3000/api/health

# בדוק בטלגרם:
# שלח /start לבוט
```

---

## 🤖 פקודות הבוט

| פקודה | תיאור |
|-------|--------|
| `/start` | תפריט ראשי |
| `/login שם PIN` | התחברות (דוגמה: `/login אלי 2222`) |
| `/new` | פתיחת תקלה חדשה (מודרך שלב-שלב) |
| `/active` | רשימת תקלות פתוחות |
| `/status` | סטטיסטיקות מערכת |
| `/inc INC-XXXX` | פרטי תקלה ספציפית |
| `/ack INC-XXXX` | אישור קבלת תקלה (ACK) |
| `/lang` | שינוי שפה (🇮🇱/🇬🇧/🇷🇺) |
| `/mystatus` | מי אני |
| `/chatid` | קבלת Chat ID (לצורך הגדרות) |
| `/help` | עזרה |

---

## 👥 משתמשי ברירת מחדל

| שם | תפקיד | PIN | הרשאות |
|----|--------|-----|---------|
| מפעיל | operator | 1111 | פתיחת תקלות |
| אלי | maintenance | 2222 | ACK, טיפול, סיום |
| סלאח | maintenance | 2222 | ACK, טיפול, סיום |
| סיימון | maintenance | 2222 | ACK, טיפול, סיום |
| אמיל | maintenance | 2222 | ACK, טיפול, סיום |
| גבי | maintenance | 2222 | ACK, טיפול, סיום |
| יפים | maintenance | 2222 | ACK, טיפול, סיום |
| מנהל | director | 3333 | גישה מלאה + דוחות |
| בעלים | owner | 4444 | דוחות + KPI |
| Efim | admin | 0000 | הכל |

---

## 🔔 התראות אוטומטיות

הבוט שולח הודעות אוטומטית:

1. **תקלה חדשה** → כל טכנאי אחזקה (עם כפתור ACK)
2. **מכונה מושבתת / קריטי** → גם מנהלים + בעלים
3. **חריגת SLA** → כולם (כל 30 שניות בודק)
4. **ACK / טיפול / סגירה** → קבוצת הודעות (אם מוגדרת)

---

## 📡 API Endpoints

### Auth
- `POST /api/login` — `{ name, pin }` → `{ user }`

### Machines
- `GET /api/machines` — כל המכונות
- `GET /api/machines?dept=T` — לפי מחלקה
- `PUT /api/machines/:id/rate` — עדכון מחיר שעה

### Incidents
- `GET /api/incidents?status=active` — תקלות פתוחות
- `GET /api/incidents?status=closed` — סגורות
- `GET /api/incidents?dept=T` — לפי מחלקה
- `POST /api/incidents` — פתיחת תקלה חדשה
- `GET /api/incidents/:id` — פרטי תקלה
- `POST /api/incidents/:id/ack` — ACK
- `POST /api/incidents/:id/start` — התחלת טיפול
- `POST /api/incidents/:id/wait` — המתנה
- `POST /api/incidents/:id/resume` — חזרה לטיפול
- `POST /api/incidents/:id/resolve` — סיום טיפול
- `POST /api/incidents/:id/close` — סגירה
- `POST /api/incidents/:id/reopen` — פתיחה מחדש
- `POST /api/incidents/:id/cancel` — ביטול
- `POST /api/incidents/:id/priority` — שינוי עדיפות
- `POST /api/incidents/:id/reassign` — שינוי שיוך

### Other
- `GET /api/stats` — סטטיסטיקות
- `GET /api/export/excel` — הורדת דוח Excel
- `GET /api/health` — בדיקת בריאות

---

## 🏭 37 מכונות — 4 מחלקות

| מחלקה | קוד | כמות | מכונות |
|--------|-----|------|--------|
| חריטה | T | 6 | MAZAK, HANWHA STL 38, HANWHA 26H, FELLER FTC20, OKUMA LB9, STAR |
| כרסום | M | 9 | VICTOR, KITAMURA, SHARNOA, SERVO, CONLOG, SHARNOAX5, HAAS VF5-1/2, HAAS VF3 |
| הלחמה | B | 6 | ניקוי חול ×2, אינדוקציה ×2, תנור ואקום, תנור רציף |
| השחזה | S | 16 | JONES SHIPMAN ×3, CHEVALIER ×2, HONING SUNNEN, LAPPING ×4, BDN, OVERBECK, KONDO, OKAMOTO, AGATHON, EWAG |

---

## 🔧 טיפים

### הגדרת קבוצת התראות
1. צור קבוצה בטלגרם
2. הוסף את הבוט לקבוצה
3. שלח `/chatid` בקבוצה
4. העתק את ה-ID (מספר שלילי) ל-`NOTIFY_GROUP_ID` ב-.env

### הפעלה כ-service (Linux)
```bash
# צור service file:
sudo nano /etc/systemd/system/wpw.service

# תוכן:
[Unit]
Description=WPW Incident Management
After=network.target

[Service]
WorkingDirectory=/path/to/wpw-server
ExecStart=/usr/bin/node src/start.js
Restart=always
User=youruser

[Install]
WantedBy=multi-user.target

# הפעלה:
sudo systemctl enable wpw
sudo systemctl start wpw
```

### גיבוי
```bash
# גיבוי יומי של הדטאבייס:
cp db/wpw.db db/backup_$(date +%Y%m%d).db
```
