# Sentinel: Real-Time DDoS Detection & Mitigation System

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

## 📜 Objectives Completed (FYP)
1. **Literature Review:** Extensively documented ML approaches against DDoS.
2. **System Design:** Established modular Node.js/React architecture.
3. **Detection Module:** Integrated 98%+ accurate Hugging Face prediction engine.
4. **Mitigation Module:** BPF rule tracking and Auto-Response engine hooked up.
5. **Testing:** Vitest automated UI and unit component testing implemented.
6. **Documentation:** Full system architecture mapped and recorded.

---
*Developed by Ali Musa Rizvi for the advanced mitigation of volumetric and application-layer distributed attacks.*
