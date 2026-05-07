# 🚀 InvenIQ — Intelligent Inventory Optimization Platform

> Full-stack **MERN** application with rule-based analytics, real-time stock tracking, demand forecasting, ABC classification, and EOQ-based reorder suggestions. **No external AI API required.**

![Stack](https://img.shields.io/badge/Stack-MERN-blue)
![DB](https://img.shields.io/badge/Database-MongoDB%20Atlas-green)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## ✨ Features

| Module | What it does |
|---|---|
| 🔐 Auth | JWT login with 4 role types |
| 📦 Products | Full CRUD, 6 categories, SKU management |
| 📊 Inventory | Real-time stock levels, all transaction types |
| ⚠️ Alerts | Live Critical / High / Medium stock alerts |
| 🏭 Suppliers | Supplier cards with performance metrics |
| 🛒 Purchase Orders | PO lifecycle: Draft → Sent → Completed |
| 📈 Analytics | Demand forecast (moving average), ABC analysis, EOQ reorder suggestions, Inventory health score |
| 📉 Dashboard | KPI cards, line charts, pie chart, recent transactions |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Recharts, Axios, Lucide Icons |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (cloud) |
| ODM | Mongoose |
| Auth | JWT + bcryptjs |
| Analytics | Pure rule-based (EOQ, moving average, ABC) — no AI API |

---

## 📁 Project Structure

```
inventory-platform/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── StockLevel.js
│   │   ├── InventoryTransaction.js
│   │   ├── Supplier.js
│   │   └── PurchaseOrder.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── inventory.js
│   │   ├── suppliers.js
│   │   ├── purchaseOrders.js
│   │   ├── dashboard.js
│   │   └── analytics.js       ← EOQ / ABC / Forecast (no API key)
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── seedData.js
│   └── .env                   ← you fill in your Atlas URI here
├── frontend/
│   ├── public/index.html
│   └── src/
│       ├── components/layout/ (Sidebar, Header, Layout)
│       ├── context/AuthContext.js
│       ├── pages/
│       │   ├── LoginPage.js
│       │   ├── Dashboard.js
│       │   ├── ProductsPage.js
│       │   ├── InventoryPage.js
│       │   ├── SuppliersPage.js
│       │   ├── PurchaseOrdersPage.js
│       │   ├── AnalyticsPage.js
│       │   └── AlertsPage.js
│       ├── utils/api.js
│       ├── App.js
│       └── index.css
├── .gitignore
└── README.md
```

---

## ✅ Prerequisites

Install these before you start:

1. **Node.js v18+** → https://nodejs.org
2. **Git** → https://git-scm.com
3. **MongoDB Atlas account** → https://cloud.mongodb.com (free tier is enough)

---

## ☁️ Step 1 — Set up MongoDB Atlas

1. Go to https://cloud.mongodb.com → Sign up / Log in
2. Click **"Build a Database"** → Choose **M0 Free** → Pick any region → Click **Create**
3. **Database Access** → Add New Database User
   - Username: `inveniquser`
   - Password: choose a strong password and **note it down**
   - Role: **Read and write to any database** → **Add User**
4. **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`) → Confirm
5. **Database** → Connect → **Drivers** → Copy the connection string. It looks like:
   ```
   mongodb+srv://inveniquser:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password.

---

## 🖥️ Step 2 — Configure Backend

```bash
cd inventory-platform/backend
```

Open `backend/.env` and paste your Atlas connection string:

```env
PORT=5000
MONGO_URI=mongodb+srv://inveniquser:YOUR_PASSWORD@cluster0.abcde.mongodb.net/inveniq?retryWrites=true&w=majority
JWT_SECRET=inveniq_super_secret_jwt_key_2024_change_in_prod
JWT_EXPIRE=7d
NODE_ENV=development
```

> ⚠️ Replace `YOUR_PASSWORD` and the cluster hostname with your actual values.

---

## 📦 Step 3 — Install & Seed

```bash
# Install backend dependencies
cd backend
npm install

# Seed MongoDB Atlas with demo data
npm run seed
```

You should see:
```
✅ Connected to MongoDB Atlas
✅ Users created
✅ Suppliers created
✅ Products created
✅ Stock levels created
✅ Transactions created
✅ Sample PO created
```

---

## ▶️ Step 4 — Run the App

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm start
# → Opens http://localhost:3000
```

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@inveniq.com | admin123 |
| **Inventory Manager** | manager@inveniq.com | manager123 |
| **Procurement Officer** | procurement@inveniq.com | proc123 |
| **Warehouse Operator** | operator@inveniq.com | op123 |

The login page has quick-fill buttons for all 4 accounts.

---

## 🐙 Step 5 — Push to GitHub

```bash
# Go to project root
cd inventory-platform

# Initialise git
git init

# Stage all files (.env is excluded by .gitignore — safe)
git add .

# First commit
git commit -m "🚀 Initial commit — InvenIQ MERN Inventory Platform"

# Create a new repo at https://github.com/new
# Name it: inventory-platform
# Leave README unchecked

# Connect and push (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/inventory-platform.git
git branch -M main
git push -u origin main
```

### Daily workflow
```bash
git add .
git commit -m "feat: describe your change"
git push
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/products | List products |
| POST | /api/products | Create product |
| GET | /api/inventory/transactions | Transaction history |
| POST | /api/inventory/transactions | Record transaction |
| GET | /api/inventory/alerts | Low stock alerts |
| GET | /api/inventory/stock-levels | All stock levels |
| GET | /api/suppliers | List suppliers |
| POST | /api/suppliers | Add supplier |
| GET | /api/purchase-orders | List POs |
| POST | /api/purchase-orders | Create PO |
| PUT | /api/purchase-orders/:id/status | Update PO status |
| GET | /api/dashboard/kpis | Dashboard KPIs |
| GET | /api/dashboard/category-stats | Category breakdown |
| GET | /api/dashboard/transaction-trend | 7-day trend |
| **GET** | **/api/analytics/abc-analysis** | ABC classification |
| **GET** | **/api/analytics/reorder-suggestions** | EOQ reorder suggestions |
| **POST** | **/api/analytics/forecast/:id** | Moving-average demand forecast |
| **GET** | **/api/analytics/health-score** | Inventory health score |

---

## 📊 Analytics Engine (No External API)

All analytics are computed server-side using standard inventory formulas:

- **Demand Forecast** — 30-day moving average of `Sales Issue` transactions projected forward with 5–7% growth per period
- **EOQ Reorder Suggestions** — `max(EOQ, shortage + safety_stock)` for items at or below reorder point
- **ABC Analysis** — Sort by stock value descending; A = top 70%, B = next 20%, C = remaining 10%
- **Health Score** — Weighted average: Low=100, Medium=60, High=25, Critical=0 across all SKUs

---

## 🗂 Roles & Permissions

| Role | Access |
|---|---|
| admin | Full access |
| inventory_manager | Products, inventory, analytics |
| procurement_officer | POs, suppliers |
| warehouse_operator | Record transactions |
| viewer | Read-only dashboard |

---

*Built with ❤️ using MERN Stack + MongoDB Atlas*
