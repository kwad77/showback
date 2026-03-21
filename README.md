# Showback — Employee Technology Cost Analyzer

> **Know exactly what every employee's technology stack costs — by role, by department, and by person.**

Most organizations have no clear answer to "what does it cost to equip a software engineer vs. a sales rep?" Showback gives you that answer. It tracks every software license, hardware item, and subscription across your workforce and rolls it up into a single annual number per person — broken down in a way that makes sense to finance, IT, and department heads alike.

---

## Try it right now — no setup needed

The tool ships with a full sample dataset: 53 employees across 7 departments, with realistic software stacks and some eye-opening outliers (a $24,000/yr Bloomberg Terminal, anyone?).

**To explore the demo:**

1. Make sure you have [Node.js](https://nodejs.org) installed (any recent version)
2. Open a terminal in this folder and run:
   ```
   cd frontend
   npm install
   npm run dev
   ```
3. Open your browser to **http://localhost:5173**
4. The dashboard loads automatically in demo mode — no backend needed

That's it. Everything else in this document is about understanding what you're looking at and how to connect your own data.

---

## What you're looking at

### The Dashboard

When you first open Showback you land on the **TCO Overview** — a single-page view of your organization's total technology spend.

**The four numbers at the top** give you the headline:

| Card | What it means |
|---|---|
| Total Annual TCO | Everything your organization spends on employee technology in a year |
| Avg Cost / Employee | What it costs to equip one person, on average |
| Birthright Total | The portion of that spend that goes to everyone equally (email, security, VPN, etc.) |
| Outlier Adjustments | The portion that goes to individuals with non-standard needs — a useful red flag |

**The charts below** break that total down three ways:

- **By Category** (pie chart) — how your spend splits across Software, Hardware, Network, and Mobile
- **By Persona** (bar chart) — what each role-type costs in total. Click any bar to open a detailed breakdown of that persona.
- **By Department** (horizontal bars) — which departments drive the most spend. Click any bar to filter the employee table below to just that department.

**The employee table** at the bottom lists every person with their individual cost breakdown. Click any row to expand it and see exactly which licenses and tools make up their number.

---

### Three concepts that explain every number

Every cost in this tool fits into one of three buckets. Understanding these makes every chart immediately readable.

**Birthright** — tools everyone gets on day one. Email, single sign-on, endpoint security, VPN. These costs are identical for every employee and form the cost floor. If birthright is a large percentage of your total spend, you have high fixed overhead regardless of headcount mix.

**Persona** — role-based tools. A "Software Engineer" gets GitHub, an IDE, and a cloud sandbox. A "Sales Rep" gets Salesforce, a sales intelligence tool, and a dialer. Personas let you say "everyone in this role gets this stack" without managing it person by person. The gap between personas shows the real cost difference between hiring a developer vs. a salesperson.

**Outliers** — individual exceptions. The analyst who needs a Bloomberg Terminal. The designer who needs Figma when their persona only includes Adobe. These are tracked separately so they don't distort the persona averages — and so you can audit them when budgets get tight.

```
What any employee costs per year =
    Birthright  (everyone pays this)
  + Persona     (your role's standard stack)
  + Outliers    (your individual add-ons)
```

---

### Clicking around: what to try first

**Click a persona bar** → A panel slides in from the right showing:
- Every tool that makes up that persona's cost, with vendor and annual price
- All employees assigned to that persona and what each one costs
- An outlier callout if any employees in that persona have individual add-ons — with the reason and cost visible when you expand the row

**Click a department bar** → The employee table below filters to just that department. A pill appears at the top of the table showing the active filter — click the × to clear it.

**Click any employee row** → The row expands to show a line-item breakdown: which birthright tools they have, which persona tools, and any individual outlier items with the reason they were added.

> **Look for this in the demo:** Click on the Finance Analyst bar in the Personas chart. Notice the outlier rate. Then click on Daniel Goldstein in the employee list inside the panel. His Bloomberg Terminal add-on alone costs more than all his other tools combined — that's exactly the kind of thing this tool is designed to surface.

---

## Getting your own data in

Once you've seen the demo, here's how to replace the sample data with your own.

### What you need to prepare

You need two spreadsheets. Both can be CSV or Excel files.

**Spreadsheet 1: Your technology catalog**

A list of every software, hardware, or subscription item your company pays for. One row per item.

| Column name | Required? | Example |
|---|---|---|
| asset_name | Yes | Microsoft 365 E3 |
| category | Yes | SW (or: HW, Network, Mobile) |
| cost | Yes | 36 |
| frequency | Yes | Monthly (or: Annual, One-time) |
| vendor | No | Microsoft |
| description | No | Standard productivity suite |

> Your column names don't have to match exactly — when you upload the file, the tool will ask you to match your columns to the right fields.

**Spreadsheet 2: Your employee roster**

A list of employees. One row per person.

| Column name | Required? | Example |
|---|---|---|
| name | Yes | Alex Rivera |
| email | No | alex.rivera@company.com |
| department | No | Engineering |
| location | No | New York |
| persona | No | Software Engineer |

> The `persona` column should match the persona names you set up in the tool. If you haven't set up personas yet, leave this column blank and assign personas in the interface after importing.

### Uploading your data

1. Start both the backend and frontend (see **Setup** section below)
2. Click **File Uploader** in the left sidebar
3. Upload your technology catalog first — map your column names when prompted
4. Then upload your employee roster
5. Go back to the **Dashboard** to see your live numbers

### Setting up the tool before importing (recommended order)

If you're starting fresh, do this in order:

1. **Birthright** → Add the tools every employee gets (email, SSO, endpoint security). Toggle any item off temporarily without deleting it.
2. **Personas** → Create profiles for each role type. Give each one a name, then attach the relevant tools from your catalog.
3. **Employees** → Import your roster, then assign each person to a persona. Or include the persona column in your spreadsheet to do it automatically on import.
4. **Dashboard** → Your numbers are live.

---

## Setup (for IT / technical teams)

### Requirements

- Python 3.11 or newer
- Node.js 18 or newer

### Starting the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at **http://localhost:8000**. Visit **/docs** for the full interactive API reference.

On first start, the database is created automatically — no migration scripts, no configuration needed. The default database is a local SQLite file (`showback.db`).

### Starting the frontend

```bash
cd frontend
npm install
npm run dev
```

The UI runs at **http://localhost:5173** and automatically proxies API calls to the backend.

### Demo mode

If the frontend can't reach the backend, it automatically switches to demo mode using the built-in sample dataset. The amber banner at the top of the dashboard tells you which mode you're in. You can also click **Load Demo Data** at any time to load the sample dataset over a live connection.

---

## Connecting your systems (for developers)

### Pull data directly from ServiceNow or other ITAM tools

The tool has an extension point for pulling data automatically instead of uploading spreadsheets. A stub for ServiceNow is already included. To connect it:

1. Open `backend/app/services/data_connector.py`
2. Fill in the `ServiceNowConnector` class — it needs to call the ServiceNow `alm_hardware` table for cost objects and `sys_user` for employees
3. Wire it into the upload router

Any source that can return a list of cost items and a list of people can be connected the same way.

### Using a different database

The tool uses SQLite by default. To switch to PostgreSQL, MySQL, or anything else, change one line in `backend/app/db.py`:

```python
DATABASE_URL = "postgresql://user:password@host/dbname"
```

No other changes needed.

### Adding cost categories

The current categories are Hardware, Software, Network, and Mobile. To add more, edit the `Category` enum in `backend/app/models/database.py` and add the new value's aliases in `backend/app/services/csv_connector.py`.

---

## Running the tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

99% code coverage across 154 tests. Tests use an in-memory database so nothing is written to disk.

---

## Common questions

**How do one-time purchases affect the annual total?**
They're included in full in the year they're recorded. A $1,200 laptop shows as $1,200 in annual cost. If you want to track amortized cost instead, divide the one-time cost by the expected lifespan and enter it as an annual amount.

**What if an employee belongs to more than one role?**
Personas are one-per-employee in the current model. If someone straddles two roles, add a custom persona for that combination or use outlier adjustments to capture the additional tools.

**Can I re-import an employee roster without creating duplicates?**
Yes — employees are deduplicated by email address on import. Rows with an email that already exists in the system are skipped.

**What's the difference between deactivating a birthright item and deleting it?**
Deactivating removes it from the cost calculation without losing the record. Useful for tools you're in the process of offboarding — you can reactivate them if the offboarding falls through.
