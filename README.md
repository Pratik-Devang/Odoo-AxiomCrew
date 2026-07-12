
# ⚡ AssetFlow — Enterprise Asset Lifecycle Management 🏢💼

> A next-generation, high-performance asset tracking and lifecycle management platform. Built to streamline hardware tracking, room bookings, maintenance workflows, and audit compliance with automated database updates and role-based gating. 🚀


## 📌 Table of Contents
* 🛠️ [Tech Stack & Architecture](#-tech-stack--architecture)
* 💎 [Core Features](#-core-features)
* 🏗️ [Folder & Module Layout](#-folder--module-layout)
* ⚙️ [Quick Start & Local Setup](#%EF%B8%8F-quick-start--local-setup)
* 🔑 [Demo User Accounts](#-demo-user-accounts)
* 🚶‍♂️ [Interactive Testing Scenarios](#%EF%B8%8F-interactive-testing-scenarios)



## 🛠️ Tech Stack & Architecture

* ⚡ **Frontend Framework**: Next.js 14 (App Router)
* 🦕 **Language**: TypeScript
* 💾 **Database & ORM**: PostgreSQL & Prisma ORM
* 🎨 **Styling**: TailwindCSS & Custom Design Tokens
* 🔒 **Authentication**: Secure Session Cookies via NextAuth.js
* 🔮 **Icons**: Lucide React



## 💎 Core Features

### 🔒 1. Role-Based Access Control (RBAC) & Gating
* **Gated Routes**: Administrative tabs (`Audits`, `Reports`, `Org Setup`, and `Lifecycle Requests`) are secured via server-side redirect guards.
* **Feature Gating**: The `"Register Asset"` button and create asset API endpoints are strictly restricted to `ADMIN` and `DEPARTMENT_HEAD` roles.

### ⚙️ 2. Maintenance Kanban Board
* **State Machine**: Tracks issues through: `Pending` ➡️ `Approved` ➡️ `Technician Assigned` ➡️ `In Progress` ➡️ `Resolved`.
* **Auto-Transitions**: Approving a ticket automatically updates the asset status to **`UNDER_MAINTENANCE`** (locking it). Resolving the ticket immediately changes the status back to **`AVAILABLE`**.
* **Collapsible Layout**: Collapse the *Resolved* column into a vertical bar with a single click to save screen real estate.

### 📋 3. Asset Auditing & Compliance
* **Custom Scopes**: Define audit cycles by date range, scoped to specific departments or locations, and assign multiple auditors.
* **Checklist Workspace**: Change status to `Verified` (green), `Missing` (red), or `Damaged` (orange) with custom audit notes.
* **Auto-Lock on Close**: Closing the cycle transitions missing assets to `LOST` status automatically and locks modification access.



## 🏗️ Folder & Module Layout

```text
├── app/
│   ├── (app)/                   # 🔐 Protected dashboard route group
│   │   ├── admin/               # 👔 Admin lifecycle requests
│   │   ├── allocations/         # 🏷️ Handovers & equipment list
│   │   ├── assets/              # 💻 Asset ledger and side-drawers
│   │   ├── audits/              # 📋 Compliance audits checklist workspace
│   │   ├── bookings/            # 📅 Calendar resource bookings
│   │   ├── dashboard/           # 📊 Operational analytics
│   │   ├── maintenance/         # 🔧 Collapsible Kanban board
│   │   ├── org/                 # 🏢 Organization settings
│   │   └── reports/             # 📈 Discrepancy & allocation analytics
│   ├── api/                     # 🔌 Serverless JSON API routes
│   └── globals.css              # 🎨 Design tokens & styling sheet
├── components/                  # 🧩 Reusable React widgets (status chips, page headers)
├── prisma/
│   ├── schema.prisma            # 🗄️ Relational schema definitions
│   ├── seed.ts                  # 🌱 Data seeding script
│   └── migrations/              # ⏳ Versioned database migrations
```



## ⚙️ Quick Start & Local Setup

### 1️⃣ Configure Environment
Create a `.env` file in the project root folder:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/assetflow?schema=public"
NEXTAUTH_SECRET="your-nextauth-secret-here-atleast-32-chars"
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Initialize Database & Migration
Create database tables and populate the default seed data:
```bash
# Apply Prisma Migrations
npx prisma migrate dev

# Seed database (Creates categories, departments, assets, and users)
npx prisma db seed
```

### 4️⃣ Start Development Server
```bash
npm run dev
```
👉 Open **[http://localhost:3002](http://localhost:3002)** in your browser!


## 🔑 Demo User Accounts
All seed accounts use the password: **`Password123!`**

| User Badge | Role | Email Address | Permissions |
| :--- | :--- | :--- | :--- |
| 👔 **Admin** | `ADMIN` | `admin@assetflow.local` | Full org setup, lifecycle request approvals, registration. |
| 👑 **Dept Head** | `DEPARTMENT_HEAD` | `priya.shah@assetflow.local` | Register assets, transfer requests, allocation approvals. |
| 💼 **Manager** | `ASSET_MANAGER` | `elena.torres@assetflow.local` | Create/close audits, approve maintenance tickets, assign tech. |
| 👤 **Employee** | `EMPLOYEE` | `mia.chen@assetflow.local` | Submit booking requests, raise maintenance tickets, view logs. |



## 🚶‍♂️ Interactive Testing Scenarios

### 🎬 Scenario 1: Role-Gating Verification
1. Go to `/login` and log in as Employee **`mia.chen@assetflow.local`**.
2. Click **Assets** in the sidebar. Note that the **"Register Asset"** button is completely **hidden**.
3. Log out (exit icon at bottom left) and log in as Admin **`admin@assetflow.local`**.
4. Go to **Assets** and observe the **"Register Asset"** button is now **active and visible**.

### 🎬 Scenario 2: Maintenance Request Workflow
1. Log in as Employee **`mia.chen@assetflow.local`**.
2. Go to **Maintenance** ➡️ Click **"Raise Request"** ➡️ Select a laptop ➡️ Enter priority and description ➡️ Click **Submit**. The card appears in the **Pending** column.
3. Log out and log in as Asset Manager **`elena.torres@assetflow.local`**.
4. Go to the **Maintenance** Kanban board. Click **"Approve"** on the card.
   * *Verify DB Update*: Go to **Assets** and search for the laptop. Its status has automatically changed to **`UNDER_MAINTENANCE`**.
5. Back in **Maintenance**: Click **"Assign Tech"** ➡️ Type a name ➡️ Progress card to **"In Progress"** ➡️ Click **"Resolve"** (card turns green).
   * *Verify DB Update*: Go to **Assets**. The laptop's status has automatically returned to **`AVAILABLE`**.

### 🎬 Scenario 3: Creating and Verifying an Audit Cycle
1. Log in as Asset Manager **`elena.torres@assetflow.local`**.
2. Go to **Audits** ➡️ Click **"Create Audit Cycle"** ➡️ Set title, date range, select department scope, choose yourself as the auditor, and click **Create**.
3. Open the active cycle ➡️ Mark items as **Missing** or **Damaged** ➡️ Add custom notes and click **Save**.
4. Notice the **Discrepancy Banner** updates the flagged counts instantly.
5. Click **"Close Audit Cycle"** to seal the records. All missing assets will be updated to **`LOST`** status in the database.
```
