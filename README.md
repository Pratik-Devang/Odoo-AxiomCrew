
# ⚡ AssetFlow — Enterprise Asset Management

AssetFlow is a next-generation, high-performance enterprise asset management web application. Built using modern design patterns, it streamlines physical hardware tracking, allocations, resource bookings, maintenance operations, and audit compliance.

## 🛠️ Tech Stack & Architecture

* **Framework**: Next.js 14 (App Router)
* **Language**: TypeScript
* **Database & ORM**: PostgreSQL via Prisma ORM
* **Styling**: TailwindCSS & Vanilla CSS
* **Auth**: Secure session cookies with NextAuth.js
* **Icons & UI Assets**: Lucide React & Tailwind-curated color palettes

## 💎 Key Features

### 🔐 1. Role-Based Access Control (RBAC) & Gating
* **Role Gating**: Navigation menus (`Audits`, `Reports`, `Org Setup`, and `Lifecycle Requests`) are gated on both client and server-side based on user roles (`ADMIN`, `ASSET_MANAGER`, `DEPARTMENT_HEAD`, `EMPLOYEE`).
* **Registry Restrictions**: Only `ADMIN` and `DEPARTMENT_HEAD` users can register or modify assets.

### 🔧 2. Maintenance Management (Kanban Workflow)
* **Real-time Lifecycle**: Track assets from `PENDING` -> `APPROVED` -> `TECHNICIAN_ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED`.
* **Automated Database Side-Effects**: Approving a ticket sets the linked asset to `UNDER_MAINTENANCE` (locking it from allocation/booking). Resolving the ticket automatically sets it back to `AVAILABLE`.
* **Collapsible Layout**: Click the **Collapse** button on the Resolved column to collapse/expand it dynamically to optimize horizontal workspace.

### 📋 3. Compliance & Asset Auditing
* **Flexible Scope**: Create audit cycles by date range, scoped to specific departments or locations, and assign multiple auditors.
* **Audit Checklist & Discrepancy Tracking**: Real-time verification inputs (`Verified`, `Missing`, `Damaged`) with discrepancy counts updating instantly in a dashboard banner.
* **Lock-down on Close**: Closing the cycle transitions missing assets to `LOST` status in the database and freezes modification access.



## 🏗️ Folder Structure

```
├── app/
│   ├── (app)/                   # App Shell protected routes
│   │   ├── admin/               # Admin specific views (Lifecycle requests)
│   │   ├── allocations/         # User allocations & handovers
│   │   ├── assets/              # Asset ledger and dynamic side-drawers
│   │   ├── audits/              # Compliance audits ledger & checklist
│   │   ├── bookings/            # Room & resource calendars
│   │   ├── dashboard/           # Operational analytics
│   │   ├── maintenance/         # Collapsible Kanban board
│   │   ├── org/                 # Organization setup view
│   │   └── reports/             # Analytics and discrepancy metrics
│   ├── api/                     # Serverless API routes (gated JSON APIs)
│   ├── globals.css              # Custom design tokens & root CSS
│   └── layout.tsx               # Root Next.js layout template
├── components/                  # Shared React components (AppShell, Badges)
├── prisma/
│   ├── schema.prisma            # Core DB relational model definition
│   ├── seed.ts                  # Seed scripts for development
│   └── migrations/              # Database migration version files
```


## ⚙️ Quick Start & Setup

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and a running **PostgreSQL** instance.

### 2. Configure Environment Variables
Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/assetflow?schema=public"
NEXTAUTH_SECRET="your-nextauth-secret-here-atleast-32-chars"
```

### 3. Initialize Database
Execute migrations and seed default credentials:

```bash
# Install NPM packages
npm install

# Run migrations
npx prisma migrate dev

# Seed database with initial assets, departments, categories, and users
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3002](http://localhost:3002)** in your browser.



## 🔑 Demo Credentials
Use these accounts to test the application flows. All accounts share the password: **`Password123!`**

| User Role | Email | Features to Test |
| :--- | :--- | :--- |
| **Admin** | `admin@assetflow.local` | Full org setup, lifecycle requests review, register assets. |
| **Department Head** | `priya.shah@assetflow.local` | Register assets, transfer requests, approve department allocations. |
| **Asset Manager** | `elena.torres@assetflow.local` | Audit cycles (create/verify/close), approve maintenance tickets. |
| **Employee** | `mia.chen@assetflow.local` | Submit booking requests, raise maintenance tickets, view history. |



## 🚶‍♂️ Standard Walkthrough & User Flows

### Flow 1: Role Restrictions Check
1. Log in as **`mia.chen@assetflow.local`** (Employee).
2. Go to the **Assets** tab. Note that the **"Register Asset"** button is **hidden**.
3. Log out (bottom left menu icon) and log in as **`admin@assetflow.local`** (Admin).
4. Go to **Assets** and observe the **"Register Asset"** button is now fully active.

### Flow 2: Maintenance Request & Database State Changes
1. Log in as Employee: **`mia.chen@assetflow.local`**.
2. Go to **Maintenance** -> click **"Raise Request"** -> select a laptop -> set priority -> click **Submit**.
3. Log out and log in as Asset Manager: **`elena.torres@assetflow.local`**.
4. Go to the **Maintenance** Kanban board. Click **"Approve"** on the card.
   * *Status Verification*: Go to **Assets** -> search for the laptop. Its status will show **`UNDER_MAINTENANCE`**.
5. Back in **Maintenance**: click **"Assign Tech"** -> type a technician's name -> progress card to **"In Progress"** -> click **"Resolve"** (turns green).
   * *Status Verification*: Go to **Assets** again. The laptop's status has automatically returned to **`AVAILABLE`**.

### Flow 3: Asset Auditing
1. Log in as Asset Manager: **`elena.torres@assetflow.local`**.
2. Go to **Audits** -> click **"Create Audit Cycle"** -> choose department scope -> assign yourself as auditor -> create cycle.
3. Open the active cycle checklist -> flag items as **Missing** or **Damaged** -> write notes and save.
4. Click **"Close Audit Cycle"** once done. Linked missing assets will automatically be flagged as **`LOST`** in the system database.
```
