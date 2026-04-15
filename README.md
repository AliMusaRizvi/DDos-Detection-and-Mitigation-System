# Sentinel: Real-Time DDoS Detection & Mitigation System (https://d-dos-detectiont.vercel.app) weblink

Sentinel is an advanced, production-ready Distributed Denial-of-Service (DDoS) detection and mitigation platform. Built for university research (Final Year Project), it combines the power of **Machine Learning (Hugging Face)**, **Real-Time Data Streaming (Socket.io/Supabase)**, and a stunning **React-based Admin Dashboard** to visualize and stop malicious traffic dead in its tracks.

## 🚀 Features

* **Real-time Threat Monitoring:** Visualize traffic streams, packet rates, and protocol breakdowns via an interactive glassmorphic dashboard.
* **Machine Learning Detection:** Leverages pre-trained XGBoost and Random Forest algorithms (hosted on Hugging Face) to classify inbound traffic signatures in real-time, drastically reducing false positives.
* **Automated Mitigation Rules:** Set strict BPF (Berkeley Packet Filter) style rules to throttle, rate-limit, or drop IPs participating in Layer 4 / Layer 7 floods.
* **Role-Based Access Control (RBAC):** Supabase-powered authentication seamlessly partitions standard operational users from overarching System Administrators.
* **Comprehensive Reporting:** Automated auditing, case management, and PDF report generation of historical attacks.

## 🏗️ Architecture

- **Frontend:** React (Vite), TailwindCSS, Lucide-React, Recharts.
- **Backend Analytics:** Express.js, Socket.io.
- **Database & Auth:** Supabase (PostgreSQL), native Row Level Security (RLS) enabled.
- **ML Engine:** Python (FastAPI API on Hugging Face Spaces).

## 🛠️ Installation & Setup

**Prerequisites:** You must have [Node.js](https://nodejs.org/en) installed.

### 1. Clone the repository
```bash
git clone https://github.com/AliMusaRizvi/DDos-Detection-and-Mitigation-System.git
cd "DDos-Detection-and-Mitigation-System"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variable Configuration
Create a `.env` file in your root directory based on the `.env.example`. You will need your Supabase project keys:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup (Supabase)
Run the provided SQL initialization scripts (or let the system seed itself) to create the `attack_cases`, `attack_patterns`, `reports`, and `mitigation_rules` tables. Make sure to assign UUIDs correctly and enable RLS policies.

### 5. Start the Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173`. You can log in using your configured Supabase credentials.

## 🧪 Testing

We use **Vitest** and **React Testing Library** for component verification.

```bash
npm run test
```

## ✅ End-to-End Validation (Auth + Detection + Mitigation)

Use this checklist to validate the full website behavior.

### 1. Start All Services

```bash
# Terminal 1 (backend socket/API simulator)
npm run dev

# Terminal 2 (frontend)
npx vite
```

Open the app in browser.

### 2. Validate Sign Up + Login

1. Go to `Auth` page.
2. Switch to `Create Account` and register a new user.
3. Confirm success message appears.
4. Switch back to login and authenticate with the same credentials.
5. Confirm protected routes open after login.

Note: If Supabase Auth API is temporarily unavailable, the app falls back to local Supabase DB RPC login/sign-up paths (`ddos_local_auth_signup`, `ddos_local_auth_signin`).

### 3. Validate Role Routing

1. Login with admin account and confirm route resolves to `/admin`.
2. Open `Home` and click `Live Dashboard` / `Initialize Dashboard`.
3. Confirm flow goes through auth and lands in correct protected area.

### 4. Validate Detection Pipeline UI

1. Open `Admin -> Overview`.
2. Confirm live traffic chart updates every few seconds.
3. Confirm CPU/RAM/mitigation status values update in real-time.
4. Confirm `Recent Mitigation Actions` updates as alerts arrive.

### 5. Validate Mitigation Signals

1. Open `Admin -> Traffic`.
2. Confirm packet stream updates continuously (`ALLOW`/`DROP`).
3. Confirm protocol distribution updates from live packets.
4. During spikes, confirm mitigation indicators and alerting appear.

### 5.1 Admin Browser Tabs -> Database Tables

Each admin browser tab is wired to dedicated Supabase table(s):

1. Overview -> `ddos_attack_logs`, `ddos_alerts`, `ddos_attack_cases`, `ddos_mitigation_rules`
2. Traffic Analysis -> `ddos_attack_logs`
3. Security Alerts -> `ddos_alerts`
4. Mitigation Rules -> `ddos_mitigation_rules`
5. System Settings -> `ddos_system_settings`
6. Incident Cases -> `ddos_attack_cases`
7. Attack Patterns -> `ddos_attack_patterns`
8. Analysis Reports -> `ddos_reports` (generated using `ddos_alerts`, `ddos_attack_logs`, `ddos_attack_cases`, `ddos_mitigation_rules`)
9. User Management -> `ddos_profiles` (plus fallback visibility via `ddos_local_auth_accounts`)

### 6. Validate Supabase Tables

Run SQL checks in Supabase SQL Editor:

```sql
select count(*) from public.ddos_local_auth_accounts;
select count(*) from public.ddos_access_requests;
select count(*) from public.ddos_alerts;
select count(*) from public.ddos_attack_logs;
select count(*) from public.ddos_mitigation_rules;
```

### 7. Regression Checks

```bash
npm run build
npm run test
```

Both commands should pass before deployment.

## 📜 Objectives Completed (FYP)
1. **Literature Review:** Extensively documented ML approaches against DDoS.
2. **System Design:** Established modular Node.js/React architecture.
3. **Detection Module:** Integrated 98%+ accurate Hugging Face prediction engine.
4. **Mitigation Module:** BPF rule tracking and Auto-Response engine hooked up.
5. **Testing:** Vitest automated UI and unit component testing implemented.
6. **Documentation:** Full system architecture mapped and recorded.

---
*Developed by Ali Musa Rizvi for the advanced mitigation of volumetric and application-layer distributed attacks.*
