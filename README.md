# KaamSetu – Online Worker & Home Repair Booking Platform

**ટૅગલાઇન:** ઘરકામ માટે વિશ્વસનીય કામદાર, સરળ બુકિંગ સાથે.

KaamSetu એ એક Home Repair Worker Booking Platform છે. ગ્રાહક વેબસાઇટ પરથી
બુકિંગ કરે છે, નજીકનું **નાકું** (Naka) ઉપલબ્ધ કામદારો સોંપે છે, અને ગ્રાહક
પોતાની બુકિંગની સ્થિતિ (Status) ટ્રેક કરે છે. પ્રથમ લક્ષ્ય **ઉધના, સુરત** છે
અને ભવિષ્યમાં અલગ શહેરો/નાકા ઉમેરી શકાય એ રીતે બનાવાયું છે.

> 📖 **English overview below.** નીચે વિગતવાર સેટઅપ/વપરાશ માર્ગદર્શન ગુજરાતીમાં છે (Section 1 થી આગળ).

---

## 🚀 KaamSetu — Project Overview

KaamSetu is a full-stack digital ecosystem designed to connect customers with
local skilled workers (Plumbers, Painters, Electricians, etc.) through managed
Naka Admins and Super Admin controls.

### 🛠️ Tech Stack & Architecture

**Frontend**
- **Framework:** React.js (built with Vite)
- **Mobile Support:** Capacitor.js (`frontend/capacitor.config.json`) for cross-platform app deployment
- **Internationalization:** i18n support for English (`en`), Gujarati (`gu`), and Hindi (`hi`)
- **Code Quality & Styling:** ESLint, Bootstrap 5 (`bootstrap` + `bootstrap-icons`) with a custom `index.css`

**Backend**
- **Runtime:** Node.js
- **Framework:** Express.js (RESTful API architecture)
- **Testing:** Jest framework (`backend/jest.config.js`) with 58/58 automated tests passing

**Database & Cloud**
- **Database:** MongoDB Atlas (Cloud NoSQL DB)
- **ORM/ODM:** Mongoose Object Modeling
- **Configuration:** ReplicaSet integration & automated seed workflows (`npm run seed:dev-admins`)

### 🔑 Key Features & Role Workflows

1. **Super Admin Dashboard:**
   - Global management across multiple local Naka locations (e.g., Udhna, Dindoli).
   - System-wide monitoring and admin provisioning.

2. **Naka Admin Dashboard:**
   - Area-specific booking requests management.
   - Real-time worker allocation and job status tracking.

3. **Customer Dashboard:**
   - Multi-category service booking (Plumber, Painter, Electrician).
   - **Live Worker Assignment Banner:** Instant notification showing assigned worker details.
   - **Direct Contact:** Integrated `tel:` Call Worker button for seamless communication.

### 👨‍💻 Author & Project Status

- **Creator:** Harshal Rajput (Full-Stack Developer)
- **Project Progress:** 85% Completed

---

## 1. મુખ્ય હેતુ

- Naka પર કામની રાહ જોતા કામદારો અને કામદાર શોધતા ગ્રાહકો વચ્ચે જોડાણ.
- ગ્રાહક બુકિંગ કરે → નાકા એડમિન યોગ્ય કામદારો સોંપે → સ્થિતિ અપડેટ થાય.
- એક જ વેબસાઇટમાં **ચાર રોલ**: Super Admin, Naka Admin, **Worker**, Customer.
  - **Worker** પાસે પોતાનું login + ડેશબોર્ડ છે: સોંપાયેલું કામ સ્વીકારવું/નકારવું,
    કામ શરૂ/પૂર્ણ કરવું, હાજર ન થઈ શકે તો કારણ સાથે જાણ કરવી, ઉપલબ્ધતા અને
    કૌશલ્ય સંપાદિત કરવાં, અને પોતાના મૂલ્યાંકન જોવા. Worker login **Naka Admin**
    અથવા **Super Admin** બનાવે છે (Worker Management → 🔑 Worker Login).
- **કામદાર મૂલ્યાંકન (Review)**: ગ્રાહક પૂર્ણ થયેલા કામને 1–5 સ્ટાર + ટિપ્પણી આપે
  (એક બુકિંગ માટે એક જ મૂલ્યાંકન).
- **ફરિયાદ (Complaint)**: ગ્રાહક ફરિયાદ નોંધાવે, નાકા એડમિન સંભાળે, જરૂર પડે તો
  **સુપર એડમિનને escalate** થાય.
- **કામદાર હાજરી અને કાર્યવાહી**: આગમન/ગેરહાજરી નોંધ, ચેતવણી/સ્થગિત/બ્લોક.
- **ન્યાયી કામદાર સોંપણી**: કૌશલ્ય + ઉપલબ્ધતા + ઓછું કામભાર + FIFO પ્રમાણે સૂચન.
- **ઓડિટ લોગ**: ફક્ત સુપર એડમિન મહત્વની એડમિન ક્રિયાઓનો ટ્રેલ જોઈ શકે.

## 2. ટેક્નોલોજી

| ભાગ | ટેક્નોલોજી |
|-----|------------|
| Frontend | React + Vite, React Router, Bootstrap 5, Axios, i18next |
| Backend | Node.js + Express (REST API) |
| Database | MongoDB + Mongoose |
| Security | bcryptjs, JWT, Helmet, express-rate-limit, CORS, express-validator |
| Android | Capacitor (WebView wrapper; એ જ Backend API વાપરે) |

## 3. ફોલ્ડર Structure

```
KaamSetu/
  frontend/
    src/
      components/     layouts/      pages/
      services/       context/      hooks/
      locales/gu|hi|en/             utils/
      App.jsx  main.jsx  i18n.js  index.css
    public/  capacitor.config.json  package.json
  backend/
    src/
      config/  models/  routes/  controllers/
      middleware/  services/  validators/  utils/
      app.js  server.js
    scripts/  tests/  package.json
  package.json        # મોનોરેપો સુવિધા scripts
  README.md
  .gitignore
```

## 4. જરૂરી Software

- **Node.js** 18+ (Chrome ની જેમ ને — અમે Node 22 પર ટેસ્ટ કર્યું)
- **npm** 9+
- **MongoDB** 6+ (લોકલ [MongoDB Community Server](https://www.mongodb.com/try/download/community)
  અથવા ફ્રી ક્લાઉડ [MongoDB Atlas](https://www.mongodb.com/atlas))
- (APK માટે) **JDK 17**, **Android Studio / Android SDK**

> Backend ટેસ્ટ ચલાવવા માટે લોકલ MongoDB ની જરૂર **નથી** — ટેસ્ટ `mongodb-memory-server`
> વાપરે છે.

## 5. Dependencies Install

PowerShell (પ્રોજેક્ટ રૂટમાં):

```powershell
# બંને ભાગ માટે એકસાથે
npm run install:all

# અથવા અલગ અલગ
cd backend;  npm install
cd ..\frontend; npm install
```

## 6. .env Setup (સિક્રેટ ક્યાંય Hardcode નથી)

### Backend
`backend/.env.example` ની નકલ કરીને `backend/.env` બનાવો:

```powershell
Copy-Item backend\.env.example backend\.env
```

`backend/.env` માં ખાસ ધ્યાન:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/kaamsetu
JWT_SECRET=<લાંબો રેન્ડમ સિક્રેટ>
CORS_ORIGINS=http://localhost:5173
```

રેન્ડમ JWT secret બનાવવા (PowerShell):

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

### Frontend
`frontend/.env.example` ની નકલ `frontend/.env` બનાવો. ડેવલપમેન્ટમાં
`VITE_API_URL` ખાલી રાખો (Vite proxy backend ને 5000 પર મોકલશે). પ્રોડક્શનમાં:

```env
VITE_API_URL=https://api.your-domain.com
```

> `.env` ફાઇલ ક્યારેય Git માં commit ન કરવી — `.gitignore` માં સામેલ છે.

## 7. MongoDB Setup

**વિકલ્પ A — લોકલ:**
1. MongoDB Community Server ઇન્સ્ટોલ કરો.
2. સેવા ચાલુ કરો (Windows Service તરીકે ઓટો-સ્ટાર્ટ થાય).
3. `MONGODB_URI=mongodb://127.0.0.1:27017/kaamsetu`

**વિકલ્પ B — Atlas (ક્લાઉડ, ફ્રી):**
1. Cluster બનાવો → Database User બનાવો → Network Access માં તમારું IP ઉમેરો.
2. Connection string `MONGODB_URI` માં મૂકો:
   `mongodb+srv://<user>:<pass>@cluster0.xxxx.mongodb.net/kaamsetu?retryWrites=true&w=majority`

## 8. Super Admin Bootstrap (પ્રથમ એડમિન)

પાસવર્ડ ક્યારેય કોડમાં નથી. બે રીતે:

```powershell
# રીત 1: સુરક્ષિત console prompt (સૂચવેલ)
npm run bootstrap        # અથવા: cd backend; npm run bootstrap:superadmin

# રીત 2: env var દ્વારા (ઓટોમેશન માટે) — પછી env var હટાવો
$env:BOOTSTRAP_SUPERADMIN_EMAIL="admin@kaamsetu.local"
$env:BOOTSTRAP_SUPERADMIN_PASSWORD="ChangeMe123!"
cd backend; npm run bootstrap:superadmin
Remove-Item Env:\BOOTSTRAP_SUPERADMIN_PASSWORD
```

આ સ્ક્રિપ્ટ એક જ Super Admin બનાવે છે અને પહેલેથી હોય તો ન બનાવે.

### 8.1 ડેવલપમેન્ટ: Super Admin + Naka Admin એકસાથે (dev-only)

`scripts/seedDevAdmins.js` — ફક્ત ડેવલપમેન્ટ માટે. પાસવર્ડ **ફક્ત env vars** થી,
કોડમાં ક્યાંય નથી. `NODE_ENV=production` હોય તો ચાલતું નથી. પહેલેથી હોય તો
કંઈ બદલતું નથી (idempotent) — કોઈ ડેટા delete/reset થતો નથી.

```powershell
# 0) અત્યારે કયા admin accounts છે તે read-only જુઓ
cd backend; npm run seed:dev-admins -- --check

# 1) Super Admin + Naka Admin બનાવો (PowerShell)
$env:DEV_SUPERADMIN_EMAIL="dev-super@kaamsetu.local"
$env:DEV_SUPERADMIN_PHONE="9000000001"
$env:DEV_SUPERADMIN_PASSWORD="ChooseAStrongDevPass1"
$env:DEV_NAKA_ADMIN_EMAIL="dev-naka@kaamsetu.local"
$env:DEV_NAKA_ADMIN_PHONE="9000000002"
$env:DEV_NAKA_ADMIN_PASSWORD="ChooseAStrongDevPass2"
npm run seed:dev-admins
Remove-Item Env:\DEV_SUPERADMIN_PASSWORD, Env:\DEV_NAKA_ADMIN_PASSWORD

# Login URL: http://localhost:5173/login
#   Super Admin → /admin   |   Naka Admin → /naka
```

વૈકલ્પિક vars: `DEV_SUPERADMIN_NAME`, `DEV_NAKA_ADMIN_NAME`, `DEV_NAKA_NAME`,
`DEV_NAKA_CITY`, `DEV_NAKA_AREA`. રૂટ પરથી પણ ચાલે: `npm run seed:dev-admins`
(`--check` માટે `cd backend` કરીને ચલાવો).

**સેવા શ્રેણીઓ (Services) seed કરો:**

```powershell
npm run seed     # અથવા: cd backend; npm run seed
```

## 9. Backend ચાલુ કરવી

```powershell
cd backend
npm run dev      # nodemon સાથે (http://localhost:5000)
# અથવા production જેવું: npm start
```

Health check: `http://localhost:5000/api/health`

## 10. Frontend ચાલુ કરવી

નવી PowerShell વિન્ડો:

```powershell
cd frontend
npm run dev      # http://localhost:5173
```

## 11. વેબસાઇટ Test કરવાની રીત

1. Super Admin login કરો (Section 8 નું account) → `/admin` ડેશબોર્ડ.
2. **Nakas → Add Naka** થી નાકું બનાવો (દા.ત. Udhna Main Naka, Surat).
3. **Naka Admins → Add** થી નાકા એડમિન બનાવો.
4. Public `/register` થી ગ્રાહક બનો → `/dashboard`.
5. **Book a Worker** થી બુકિંગ કરો → Booking ID મળશે.
6. Naka Admin થી લોગિન → **New Bookings** માં બુકિંગ → કામદારો સોંપો → Status અપડેટ કરો.
   - **Suggested Workers**: કૌશલ્ય/ઉપલબ્ધતા/કામભાર પ્રમાણે ક્રમબદ્ધ સૂચનો દેખાશે.
   - **Mark Arrived / No-show**: સોંપેલ દરેક કામદાર માટે આગમન નોંધો (પ્રથમ આગમન
     "Assigned" → "Accepted" કરે; નો-શો કામદારના કાઉન્ટરમાં વધે).
   - **Worker Login**: Workers યાદીમાં 🔑 બટન દબાવીને કામદાર માટે ઈમેલ + પાસવર્ડ
     બનાવો (અથવા રીસેટ કરો). કામદારનો સંપર્ક નંબર તેનો login ફોન બને છે.
7. **Worker** થી લોગિન → `/worker` ડેશબોર્ડ:
   - **My Jobs** માં નવું કામ **Accept**/**Decline** કરો; Accept કર્યા પછી
     **Start Work** → **Mark Completed**.
   - હાજર ન થઈ શકો તો **Unable to attend** દબાવીને કારણ નોંધો (બુકિંગ ફરી Pending
     થઈને નાકાને સોંપણી માટે પાછું જાય).
   - **My Profile** માં નામ, સંપર્ક, કૌશલ્ય અને ઉપલબ્ધતા; **My Reviews** માં પોતાની રેટિંગ.
8. ગ્રાહક ડેશબોર્ડ પર Status બદલાયેલો દેખાશે. જ્યારે બુકિંગ **Assigned** થાય ત્યારે
   ડેશબોર્ડ અને Booking Details પર **Live Worker Assignment Banner** દેખાશે —
   સોંપાયેલ કામદારનું નામ, ફોન અને સીધો **Call Worker** (`tel:`) બટન સાથે.
9. Booking **Completed** થાય પછી ગ્રાહક **મૂલ્યાંકન** (Rating + ટિપ્પણી) આપે.
10. ગ્રાહક **ફરિયાદ** નોંધાવે → નાકા એડમિન **ફરિયાદો** માં સંભાળે / escalate કરે.
11. Super Admin → **Reports** (નવી સ્થિતિઓ + ફરિયાદ), **Reviews**, **Audit Log** જુએ.
12. Header માં **ભાષા dropdown** (ગુજરાતી / हिन्दी / English) બદલો — આખી સાઇટ બદલાય છે.

> **Services પેજ**: સેવાઓ API પરથી લોડ થાય છે (loading / empty / error states સાથે),
> દરેક સેવા માટે યોગ્ય આઇકોન + વર્ણન, અને Booking બટન પસંદ કરેલી શ્રેણી સાથે
> સીધું booking flow માં લઈ જાય છે (ગ્રાહક માટે `/dashboard/bookings/new?service=...`,
> નવા વપરાશકર્તા માટે `/register?service=...`). ગ્રિડ મોટી સ્ક્રીન પર **4**, ટેબ્લેટ પર **2**,
> મોબાઇલ પર **1** કૉલમ.

### Booking સ્થિતિઓ (Statuses)

| સ્થિતિ | અર્થ |
|--------|------|
| `Pending` | બુકિંગ બની, કામદારો સોંપવાની રાહ |
| `Assigned` | કામદારો સોંપાયા |
| `Accepted` | કામદારે કામ સ્વીકાર્યું (અથવા આગમન નોંધાયું) |
| `In Progress` | કામ ચાલુ |
| `Completed` | કામ પૂર્ણ (હવે મૂલ્યાંકન કરી શકાય) |
| `Cancelled` | રદ |
| `Complaint` | ફરિયાદ નોંધાઈ |

દરેક સ્થિતિ ફક્ત માન્ય આગળની સ્થિતિમાં જ બદલાઈ શકે (backend માં transition
નિયમો લાગુ છે). બંને બાજુ (frontend + backend) માન્યતા ચકાસાય છે.

- **Worker-driven**: Worker પોતાની જ કામની સ્થિતિ `Assigned → Accepted → In Progress → Completed`
  સુધી બદલી શકે. Decline/Unable-to-attend કરવાથી કામદાર બુકિંગમાંથી હટે, free થાય,
  અને બીજા કોઈ કામદાર ન હોય તો બુકિંગ ફરી `Pending` થાય (નાકાને re-assign માટે).
- "Arrived"/"Started"/"On the Way" જેવી અલગ સ્થિતિઓ **ઉમેરી નથી** — તકરાર ટાળવા
  map કરવામાં આવે છે: **Started → In Progress**, **On the Way → Accepted**, અને
  નાકા એડમિનનું **Mark Arrived** `Assigned → Accepted` કરે છે.

### ફરિયાદ સ્થિતિઓ (Complaint Statuses)

`Open` → `In Review` → `Resolved` / `Rejected`, અથવા `Escalated` (સુપર એડમિન).
Escalated ફરિયાદ નાકા એડમિન બદલી શકે નહીં.

## 12. Testing

```powershell
npm test          # અથવા: cd backend; npm test
npm run smoke     # અસલી server.js + db.js ને in-memory MongoDB સાથે HTTP થી ચકાસે
npm run lint      # frontend ESLint
npm run build     # frontend production build
```

**Backend ટેસ્ટ (58 કેસ પાસ, 6 suites):** registration, login, ખોટો પાસવર્ડ,
protected routes, role authorization, booking creation, customer ownership,
worker assignment, naka admin data isolation, status transitions, invalid inputs,
naka admin creation, account deactivation, reports, engagement ટેસ્ટ —
reviews (duplicate/early/foreign/naka-admin નિયંત્રણો), complaints (flagging,
escalation, naka-admin escalation lockout), audit logs (super-admin only),
worker warn/block/stats, blocked worker assign નિયંત્રણ, super-admin assignment,
suggested-workers ranking, arrival Assigned→Accepted, no-show counter — અને
**worker role suite**: worker login creation, worker admin-endpoint lockout,
job scoping, accept→progress→complete lifecycle, decline → Pending, absence reporting,
own availability edit (સેન્કશન નહીં), અને reviews નું own-scope.

ટેસ્ટ in-memory MongoDB વાપરે છે — **પ્રોડક્શન ડેટા સુરક્ષિત રહે છે.**

## 13. Common Errors

| સમસ્યા | ઉકેલ |
|--------|------|
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB ચાલુ નથી. સેવા શરૂ કરો અથવા Atlas URI વાપરો. |
| `Missing required environment variable: JWT_SECRET` | `backend/.env` માં JWT_SECRET સેટ કરો. |
| CORS error | `CORS_ORIGINS` માં frontend URL ઉમેરો. |
| `413 Payload Too Large` (photo) | ફોટો 5 MB થી નાનો રાખો. |
| Login "Invalid credentials" | Email/ફોન અને પાસવર્ડ ચકાસો. |
| APK માં network fail | `VITE_API_URL` HTTPS પ્રોડક્શન URL હોવો જોઈએ. |

## 14. Production Deployment

- **Backend:** Render / Railway / Fly.io / VPS પર deploy કરો. `NODE_ENV=production`,
  મજબૂત `JWT_SECRET`, Atlas `MONGODB_URI`, યોગ્ય `CORS_ORIGINS` સેટ કરો. HTTPS ફરજિયાત.
- **Frontend:** `npm run build` → `dist/` ને Netlify / Vercel / અન્ય static host પર મૂકો.
  `VITE_API_URL` બેકએન્ડ URL પર સેટ કરો.
- Production માં `autoIndex` બંધ છે; જરૂર પડે તો indexes મેન્યુઅલી બનાવો.

## 15. Android APK (Capacitor)

> ⚠️ **પ્રામાણિક સૂચના:** આ પ્રોજેક્ટમાં Android build tools (JDK/Android SDK) ન હોવાથી
> **APK બિલ્ડ કરીને ટેસ્ટ કરવામાં આવ્યું નથી.** નીચેની પ્રક્રિયા તૈયાર છે; APK ખરેખર
> બિલ્ડ થાય ત્યારે જ "તૈયાર છે" કહેવું.

**પૂર્વ-જરૂરિયાત:** JDK 17, Android Studio (Android SDK + Platform Tools).

```powershell
cd frontend

# 1. પ્રોડક્શન API URL સેટ કરો (localhost નહીં!)
#    frontend/.env માં: VITE_API_URL=https://api.your-domain.com

# 2. Web build
npm run build

# 3. પ્રથમ વખત Android પ્લેટફોર્મ ઉમેરો
npx cap add android

# 4. Web asset + plugins સિંક કરો
npx cap sync android

# 5. Android Studio ખોલો
npx cap open android
```

Android Studio માં: **Build → Build Bundle(s)/APK(s) → Build APK(s)**.
APK મળશે: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

**Release (Share માટે) APK:**

```powershell
cd frontend\android
# 1. Keystore બનાવો (એક જ વાર; પાસવર્ડ સુરક્ષિત રાખો)
& "$env:JAVA_HOME\bin\keytool" -genkeypair -v -keystore kaamsetu-release.keystore `
  -alias kaamsetu -keyalg RSA -keysize 2048 -validity 10000

# 2. android/key.properties બનાવો (આ ફાઇલ Git માં ન મૂકો)
#    storePassword=...\n    keyPassword=...\n    keyAlias=kaamsetu\n    storeFile=../kaamsetu-release.keystore

# 3. Release APK
.\gradlew.bat assembleRelease
# આઉટપુટ: android/app/build/outputs/apk/release/app-release.apk
```

## 16. WhatsApp દ્વારા APK Share કરવી

1. ઉપર મુજબ **Release APK** બનાવો.
2. APK ને સુરક્ષિત રીતે host કરો — ફ્રી વિકલ્પ: **GitHub Releases** (public),
   અથવા **Google Drive** (મર્યાદિત શેરિંગ). WhatsApp પરીથી મોકલેલી APK ને
   WhatsApp કેટલીક વાર બ્લોક કરે છે, તેથી **download link** શેર કરવો વધુ સારો.
3. Receiver: link ખોલો → **"Install unknown apps"** permission આપો → Install.
4. Android warning: "Install blocked" આવે તો Settings → Security → Install unknown apps
   માંથી browser/file manager ને allow કરો.
5. **નોંધ:** Website hosting અને APK hosting અલગ જરૂરિયાત છે. Website (frontend) static
   host પર, Backend API અલગ server પર, અને APK ફક્ત download link તરીકે host થાય.

> કોઈ APK ખરેખર બિલ્ડ અને ટેસ્ટ ન થાય ત્યાં સુધી કોઈ fake download link ન બનાવો.

## 17. API ઝલક

```
POST   /api/auth/register            GET  /api/auth/me        PATCH /api/auth/me
POST   /api/auth/login               POST /api/auth/change-password
POST   /api/auth/forgot-password     POST /api/auth/reset-password

GET    /api/bookings                 POST /api/bookings
GET    /api/bookings/my-bookings     # ગ્રાહકની પોતાની બુકિંગ (assignedWorker સાથે)
GET    /api/bookings/:id             POST /api/bookings/:id/assign-workers
                                     PATCH/api/bookings/:id/status
                                     GET  /api/bookings/:id/suggested-workers
                                     POST /api/bookings/:id/arrivals

GET/POST/PATCH/DELETE /api/workers  (+ /api/workers/:id/attendance,
                                     GET /api/workers/:id/stats,
                                     POST /api/workers/:id/sanction,
                                     POST /api/workers/:id/account  # worker login બનાવો/રીસેટ કરો)

# Worker (self) — ફક્ત role: worker
GET    /api/worker/me                PATCH /api/worker/me
GET    /api/worker/stats             GET   /api/worker/jobs
GET    /api/worker/jobs/:id          POST  /api/worker/jobs/:id/respond   # {decision: accept|decline}
POST   /api/worker/jobs/:id/status   # {status: Accepted|In Progress|Completed}
POST   /api/worker/jobs/:id/absence  # {reason}
GET    /api/worker/reviews
GET/POST/PATCH        /api/nakas    (+ POST /api/nakas/:id/admins)
GET/POST/PATCH        /api/users    (+ /:id/active, /:id/reset-password)
GET/POST/PATCH        /api/services
GET    /api/reports/dashboard        GET /api/reports/bookings

GET    /api/reviews                  GET  /api/reviews/summary
POST   /api/reviews                  GET  /api/reviews/booking/:bookingId
PATCH  /api/reviews/:id/visibility

GET    /api/complaints               POST /api/complaints
GET    /api/complaints/:id           PATCH /api/complaints/:id
                                     POST /api/complaints/:id/escalate

GET    /api/audit-logs               (ફક્ત સુપર એડમિન)
POST   /api/uploads
```

## 18. Security પદ્ધતિ

- પાસવર્ડ **bcryptjs** થી hash; plain-text ક્યાંય નહીં.
- **JWT** authentication; દરેક protected request પર backend authorization.
- **Role-based access**: customer માત્ર પોતાનો ડેટા, naka admin માત્ર પોતાનું નાકું,
  **worker માત્ર પોતાને સોંપાયેલું કામ/પ્રોફાઇલ** (`/api/worker/*` સંપૂર્ણ સ્કોપ્ડ;
  `/api/users`, `/api/audit-logs`, અને બીજા admin endpoints worker માટે બ્લોક),
  super admin બધું.
- Worker login બનાવવા/રીસેટ કરવા ફક્ત Naka Admin (પોતાના નાકા માટે) અથવા Super Admin.
- **Helmet**, **rate limiting**, કડક **CORS**, **input validation**.
- Public registration થી admin role બની શકે **નહીં**.
- સિક્રેટ ફક્ત `.env` માં; `.env` Git માં નહીં.

## 19. ભાષાઓ

ગુજરાતી (default), हिन्दी, English. Translation ફાઇલો:
`frontend/src/locales/{gu,hi,en}/translation.js`.
પસંદ કરેલી ભાષા `localStorage` માં સચવાય. હેડર/ડેશબોર્ડમાં **compact ભાષા dropdown**
(🌐 + વર્તમાન ભાષા + chevron) છે — keyboard (Esc થી બંધ, દરેક વિકલ્પ `role="option"`)
અને મોબાઇલ માટે અનુકૂળ. ગ્રાહકે લખેલું Problem Description
મૂળ ભાષામાં જ દેખાય (auto-translate થતું નથી).

## 20. Password Reset મર્યાદા

MVP માં Email/SMS સેવા નથી, તેથી `forgot-password` સુરક્ષિત single-use token
બનાવે છે. ડેવલપમેન્ટમાં token response માં દેખાય છે; **પ્રોડક્શનમાં** તેને
Email/SMS provider (દા.ત. Brevo, MSG91) દ્વારા મોકલવું પડશે. Super Admin
**Reset Password** દ્વારા પણ વપરાશકર્તાનો પાસવર્ડ સેટ કરી શકે છે.

---

### વિકાસકર્તા ટૂંકમાં

```powershell
npm run install:all
Copy-Item backend\.env.example backend\.env   # પછી JWT_SECRET સેટ કરો
npm run seed
npm run bootstrap                              # Super Admin બનાવો
npm run dev:backend                            # ટર્મિનલ 1
npm run dev:frontend                           # ટર્મિનલ 2
```

**© KaamSetu** — ઉધના, સુરત, ગુજરાત.

> **Created by Harshal Rajput | Full Stack Developer**
