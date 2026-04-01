# MANAA — Complete Product & Business Document

**Version:** 2.0  
**Date:** February 2026  
**Confidentiality:** Internal / Investor-Ready  
**Prepared by:** Manaa Product Team  

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Mission](#2-product-vision--mission)
3. [Market Opportunity](#3-market-opportunity)
4. [Target Audience](#4-target-audience)
5. [Platform Architecture](#5-platform-architecture)
6. [Feature Deep Dive — User-Facing](#6-feature-deep-dive--user-facing)
   - 6.1 Authentication & Onboarding
   - 6.2 Dashboard & Financial Overview
   - 6.3 Business Management
   - 6.4 Account (Book) Management
   - 6.5 Transaction Management
   - 6.6 Professional Invoicing
   - 6.7 Financial Reports & Health Grade
   - 6.8 Nigeria Tax Compliance (NTA 2025)
   - 6.9 CRM — Customer Relationship Management
   - 6.10 Inventory & Stock Management
   - 6.11 Bank Sync (Mono.co Integration)
   - 6.12 Settings & Profile Management
   - 6.13 Push Notifications
   - 6.14 Guided Tour & Onboarding
7. [Feature Deep Dive — Admin Panel](#7-feature-deep-dive--admin-panel)
   - 7.1 Admin Dashboard
   - 7.2 User Management
   - 7.3 Business Oversight
   - 7.4 Finance Section
   - 7.5 Email Management
   - 7.6 Subscription Management
   - 7.7 Admin Settings
8. [Subscription & Pricing Model](#8-subscription--pricing-model)
9. [Future Plans (Hidden Features)](#9-future-plans-hidden-features)
   - 9.1 Wallet & Virtual Accounts (DVA)
   - 9.2 Debt Tracker
   - 9.3 Online Store / Storefront
   - 9.4 AI-Powered Insights
   - 9.5 Multi-Currency Support
   - 9.6 Team Collaboration & Roles
   - 9.7 Payroll Module
   - 9.8 Loan & Credit Scoring
10. [Revenue Possibilities](#10-revenue-possibilities)
11. [Use Cases](#11-use-cases)
12. [Competitive Analysis](#12-competitive-analysis)
13. [Marketing Strategy](#13-marketing-strategy)
14. [Endorsement & Collaboration Opportunities](#14-endorsement--collaboration-opportunities)
15. [Go-To-Market Roadmap](#15-go-to-market-roadmap)
16. [Technical Specifications](#16-technical-specifications)
17. [Appendix](#17-appendix)

---

# 1. EXECUTIVE SUMMARY

**Manaa** is a mobile-first, all-in-one bookkeeping and business management platform purpose-built for African entrepreneurs, small business owners, freelancers, and traders. Available as a Progressive Web App (PWA), Manaa empowers users to track cash flow, send professional invoices, manage customer relationships, monitor inventory, and ensure tax compliance — all from their smartphone.

### The Problem
Over 40 million MSMEs in Nigeria alone operate without formal bookkeeping systems. Most rely on notebooks, Excel sheets, or memory. Existing solutions (QuickBooks, Xero, Wave) are designed for Western markets and fail to account for:
- Cash-dominant economies
- POS terminal tracking
- Mobile money platforms (OPay, PalmPay)
- Nigerian banking infrastructure
- VAT at 7.5% with zero-rated essential goods
- The Nigeria Tax Act 2025 compliance requirements

### The Solution
Manaa addresses these gaps with a localized, mobile-first platform that speaks the language of African business. Features include:
- **Real-time cash flow tracking** with categorized income and expenses
- **Professional invoicing** with WhatsApp sharing and PDF export
- **CRM and sales pipeline** inspired by HubSpot
- **Inventory management** with stock tracking and escrow
- **Automated bank sync** via Mono.co
- **Tax compliance** aligned with the Nigeria Tax Act 2025
- **Financial health grading** (A-F) for business performance assessment

### Key Metrics (Platform Statistics)
| Metric | Value |
|--------|-------|
| Businesses Registered | 500+ |
| Transactions Tracked | 50,000+ |
| Invoices Sent | 10,000+ |
| Platform Uptime | 99.9% |

---

# 2. PRODUCT VISION & MISSION

### Vision
To become Africa's most trusted financial companion for small businesses — making professional-grade bookkeeping accessible to every entrepreneur, from market traders in Lagos to freelancers in Nairobi.

### Mission
Empower African entrepreneurs with intuitive, affordable, and locally-relevant financial tools that help them track, understand, and grow their businesses.

### Core Values
1. **Simplicity First** — Complex finance made simple
2. **Africa-Native** — Built for African markets, not adapted from Western tools
3. **Mobile-First** — Designed for the phone-first continent
4. **Empowerment** — Give business owners the data they need to make better decisions
5. **Trust** — Secure, reliable, and transparent

---

# 3. MARKET OPPORTUNITY

### Africa's MSME Landscape

| Country | MSMEs | Contribution to GDP |
|---------|-------|---------------------|
| Nigeria | 41.5M | 48% |
| Kenya | 7.4M | 40% |
| Ghana | 2.8M | 70% |
| South Africa | 2.6M | 34% |
| Tanzania | 3.2M | 27% |

### Total Addressable Market (TAM)
- **Africa**: ~50 million MSMEs
- **Nigeria alone**: 41.5 million MSMEs (SMEDAN 2023)
- **Projected SME fintech market**: $150B by 2030 (McKinsey)

### Serviceable Addressable Market (SAM)
- MSMEs with smartphones and internet access: ~25 million in Nigeria
- Early adopters comfortable with digital tools: ~5 million

### Serviceable Obtainable Market (SOM)
- Year 1 target: 10,000 active users
- Year 3 target: 250,000 active users
- Year 5 target: 1,000,000 active users

### Market Drivers
1. **Smartphone Penetration**: 170M+ subscribers in Nigeria, 60%+ on smartphones
2. **Cash-to-Digital Shift**: Mobile money transactions grew 300% (2020-2024)
3. **Regulatory Push**: Nigeria Tax Act 2025 requires better record-keeping
4. **Youth Entrepreneurship**: 60% of Africa's population is under 25
5. **Fintech Adoption**: Nigeria leads Africa in fintech investment

---

# 4. TARGET AUDIENCE

### Primary Personas

#### 1. The Market Trader — "Mama Chioma"
- **Profile**: 35-55, runs a provisions store or market stall
- **Pain Points**: Tracks everything in a notebook, doesn't know monthly profit, can't generate reports for loans
- **Value Prop**: Simple cash in/out tracking, instant financial summaries, printable reports for bank loan applications

#### 2. The Side-Hustler / Freelancer — "Emeka"
- **Profile**: 22-35, provides services (design, consulting, photography)
- **Pain Points**: Chases payments via WhatsApp, no professional invoicing, mixes personal and business expenses
- **Value Prop**: Professional invoices, separate business books, client management via CRM

#### 3. The Small Shop Owner — "Aisha"
- **Profile**: 28-45, operates a fashion boutique, salon, or restaurant
- **Pain Points**: Doesn't know which products sell best, tracks inventory mentally, gives credit with no records
- **Value Prop**: Inventory tracking, sales analytics, debt/credit tracking, POS reconciliation

#### 4. The Growing Business — "Kwame"
- **Profile**: 30-50, runs a mid-size business with 5-20 employees
- **Pain Points**: Needs CRM, multiple account tracking, tax compliance, professional reporting
- **Value Prop**: Full CRM pipeline, multi-book accounting, NTA 2025 tax reports, financial health grading

### Secondary Personas
- **Accountants & Bookkeepers**: Managing multiple clients' books
- **NGOs & Community Groups**: Tracking donations and disbursements
- **Religious Organizations**: Tithes, offerings, and project tracking

---

# 5. PLATFORM ARCHITECTURE

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| UI Framework | Tailwind CSS, shadcn/ui, Radix UI |
| Animations | Framer Motion |
| State Management | TanStack React Query |
| Routing | React Router v6 |
| Backend | Lovable Cloud (Supabase) |
| Database | PostgreSQL |
| Authentication | Email/Password, Google OAuth |
| Edge Functions | Deno (serverless) |
| Payments | Paystack (Nigeria) |
| Bank Sync | Mono.co |
| Charts | Recharts |
| PDF Generation | ExcelJS, pdfjs-dist |
| Deployment | Lovable Platform |

### Architecture Diagram

```
┌─────────────────────────────────────────────┐
│              MANAA PWA (React)              │
│  ┌─────────┐ ┌──────────┐ ┌─────────────┐  │
│  │Dashboard│ │Invoicing │ │   CRM       │  │
│  │         │ │          │ │             │  │
│  └────┬────┘ └────┬─────┘ └──────┬──────┘  │
│       │           │              │          │
│  ┌────┴────┐ ┌────┴─────┐ ┌─────┴──────┐  │
│  │Inventory│ │ Reports  │ │  Settings  │  │
│  │         │ │ & Tax    │ │            │  │
│  └─────────┘ └──────────┘ └────────────┘  │
└──────────────────┬──────────────────────────┘
                   │
          ┌────────┴─────────┐
          │  Lovable Cloud   │
          │   (Supabase)     │
          │ ┌──────────────┐ │
          │ │  PostgreSQL  │ │
          │ │  Database    │ │
          │ └──────────────┘ │
          │ ┌──────────────┐ │
          │ │Edge Functions│ │
          │ │ - Paystack   │ │
          │ │ - Mono.co    │ │
          │ │ - Notifier   │ │
          │ │ - Wallet     │ │
          │ │ - Email      │ │
          │ └──────────────┘ │
          │ ┌──────────────┐ │
          │ │ Auth + RLS   │ │
          │ └──────────────┘ │
          │ ┌──────────────┐ │
          │ │   Storage    │ │
          │ │  (Avatars,   │ │
          │ │   Logos,     │ │
          │ │  Products)   │ │
          │ └──────────────┘ │
          └──────────────────┘
```

### Security Model
- **Row Level Security (RLS)**: Every database table has RLS policies ensuring users can only access their own data
- **JWT Authentication**: Secure token-based auth via Lovable Cloud
- **Edge Function Authorization**: All serverless functions validate Bearer tokens
- **HTTPS**: All data in transit is encrypted
- **Data Isolation**: Each user's businesses, accounts, and transactions are fully isolated

---

# 6. FEATURE DEEP DIVE — USER-FACING

---

## 6.1 Authentication & Onboarding

### Overview
Manaa provides a premium, split-screen authentication experience with rotating hero images showcasing diverse African entrepreneurs.

### Features
- **Email/Password Sign Up** with email verification
- **Google OAuth** sign-in (one-tap)
- **Password Reset** via email
- **Auto-rotating hero slideshow** with 3 contextual slides:
  - "Track Every Sale, Grow Every Day" — for market traders
  - "Freelance Smarter, Not Harder" — for freelancers
  - "Run Your Shop Like a Pro" — for artisans and shop owners
- **Dark/Light mode toggle** on the auth page
- **Branded experience** with Manaa logo variants for each theme

### Use Case: New Restaurant Owner
> Fatima just opened a small restaurant in Abuja. She finds Manaa through an Instagram ad, clicks "Get Started", and creates her account in under 2 minutes. She immediately sets up her business profile and starts recording her first day's sales — all before the lunch rush.

---

## 6.2 Dashboard & Financial Overview

### Overview
The Dashboard is the command center. It provides an at-a-glance view of all financial activity across the user's businesses.

### Features
- **Financial Summary Card**: Displays Net Balance, Total Income, and Total Expenses
  - Dark card in light mode, lemon-green branded card in dark mode
- **Cash In / Cash Out Buttons**: Quick-action buttons for recording transactions
- **Quick Actions Grid** (Mobile): Shortcuts to Businesses, Reports, Invoices, and Guide
- **Quick Actions Dropdown** (Desktop): Compact menu with the same shortcuts
- **Transaction Counter**: Real-time count of total and today's transactions
- **Recent Transactions Table**: 
  - Desktop: Structured data table with sortable columns
  - Mobile: Clickable list with swipe-friendly design
- **Filters**: By type (Cash In/Out), category, and date range
- **CSV Export**: Download filtered transactions as a CSV file
- **Print Receipts**: One-click receipt printing for any transaction
- **Inline Category Editing**: Click any category label to change it via popover dropdown with auto-save
- **Edit Transactions**: Full edit dialog for description, amount, category, customer, and date

### Guided Tour (Desktop)
A first-visit guided tour with floating cards and spotlights:
1. Financial Summary — understanding your numbers
2. Cash In — recording income
3. Cash Out — recording expenses
4. Quick Actions — navigating the app
5. Transactions — managing your records

Tour is persisted via localStorage and can be re-triggered manually.

### Use Case: Daily Reconciliation
> At the end of each day, Taiwo opens Manaa, reviews the dashboard, checks that all 15 transactions are recorded, and exports a CSV for his records. He notices his expenses exceeded income this month and decides to cut transportation costs.

---

## 6.3 Business Management

### Overview
Users can create and manage multiple businesses, each with its own profile, accounts, and transaction history.

### Features
- **Multi-Business Support**: Create up to 2 businesses (Free) or unlimited (Pro)
- **Business Profile**: Name, description, TIN, address, phone, official email
- **Logo Upload**: Custom business logo with cloud storage
- **Currency**: Default NGN with support for business-level currency settings
- **Business Selector**: Quick switch between businesses from the sidebar

### Free Tier Limits
| Feature | Free | Pro |
|---------|------|-----|
| Businesses | 2 | Unlimited |
| Books per Business | 5 | Unlimited |
| CRM | ❌ | ✅ |
| Inventory | ❌ | ✅ |

### Use Case: Serial Entrepreneur
> Nkechi runs a boutique and a catering business. She creates both as separate businesses in Manaa, each with their own accounts and categories. She can switch between them with one tap and see financial health reports for each independently.

---

## 6.4 Account (Book) Management

### Overview
Within each business, users create "Books" (accounts) to track different money streams — cash, bank accounts, POS terminals, mobile money, or credit.

### Features
- **Account Types**: Cash, Bank Account, POS Terminal, Mobile Money (OPay, PalmPay, etc.), Credit
- **Initial Balance**: Set starting balance for accurate running totals
- **Balance Tracking**: Real-time running balance after each transaction
- **Nigerian Bank Directory**: Pre-loaded list of 30+ Nigerian banks
- **Account Detail Page**: Full transaction history with filtering and export
- **Multi-Select Deletion**: Bulk-delete transactions with checkbox selection
- **Import Tools**: 
  - CSV/XLSX manual import with column mapping
  - PDF bank statement parser with auto-detection of major Nigerian banks
  - Mono.co live bank sync

### Use Case: POS Business Reconciliation
> Adaeze runs 3 POS terminals across Lagos. She creates a book for each terminal, records daily collections, and uses the balance feature to reconcile her POS settlement with the bank at month-end. The system auto-categorizes POS transactions.

---

## 6.5 Transaction Management

### Overview
The core of Manaa — recording and managing every naira that enters or leaves the business.

### Features
- **Cash In / Cash Out Modal**: 
  - Auto-syncs with active business context
  - Customer name and detail fields
  - Category selection with auto-suggestion
  - Description field
  - Receipt/document attachment (image upload)
  - Date picker: Calendar popover (desktop) / native date input (mobile)
- **Transaction Sidebar** (Desktop): Slide-over panel for viewing transaction details
- **Transaction Detail Page** (Mobile): Full-screen detail view
- **Inline Category Editing**: Click category label → popover dropdown → auto-save
- **Real-time Updates**: Broadcast events for instant UI sync across tabs
- **Mono Sync Badge**: Bank icon (🏦) on auto-synced transactions
- **Auto-Categorization**: Keyword-based for Nigerian transaction types:
  - "POS" → Supplies
  - "Airtime" → Data & Airtime
  - "Stamp Duty" → Bank Charges
  - "Uber" → Transportation
  - "Transfer" → Bank Transfer Received

### Data Import Options
1. **CSV/XLSX Import**: Upload spreadsheets with column mapping wizard
2. **PDF Bank Statement Import**: Parses statements from major Nigerian banks
3. **Mono.co Live Sync**: Real-time bank transaction sync with deduplication

### Use Case: Market Day Recording
> Every market day (Wednesday and Saturday), Blessing records 30-50 transactions as they happen. She uses the Cash In button for each sale, selects the category "Sales Revenue", and adds the customer name. At day end, she prints receipts for her top 5 customers.

---

## 6.6 Professional Invoicing

### Overview
A full invoicing system organized into four sub-pages, enabling users to create, manage, and track professional invoices.

### Sub-Pages
1. **All Invoices**: Complete list with status filters (Draft, Sent, Paid, Overdue)
2. **Drafts & Overdue**: Focus view on unpaid invoices requiring attention
3. **Clients**: Customer directory showing billed vs. paid totals per client
4. **Revenue**: Financial insights including payment distribution analytics

### Features
- **Multi-Line Items**: Add multiple products/services per invoice
- **Automatic VAT Calculation**: 7.5% VAT applied automatically
- **Invoice Numbering**: Sequential, auto-generated invoice numbers
- **Customer Details**: Name, email, address stored and reusable
- **Status Management**: Draft → Sent → Paid / Overdue workflow
- **Sharing Options**:
  - WhatsApp share (deep link)
  - PDF download
  - Excel export
- **Notes Field**: Add payment terms or special instructions
- **Due Date Tracking**: Automatic overdue detection
- **PDF Template Wizard**: Customizable invoice templates

### Use Case: Freelance Designer
> Tunde designs logos for businesses. After completing a project, he opens Manaa, creates an invoice with line items ("Logo Design - ₦150,000", "Brand Guidelines - ₦50,000"), and shares it via WhatsApp. The 7.5% VAT is automatically calculated. When the client pays, Tunde marks it as paid and it reflects in his Revenue dashboard.

---

## 6.7 Financial Reports & Health Grade

### Overview
The reporting system provides deep financial insights organized into four specialized tabs: Cash Flow, Accounts, Trends, and Tax.

### Cash Flow Tab
- **Monthly income vs. expenses** bar chart
- **Category breakdown** with income/expense per category
- **Expense distribution** pie chart
- **Financial Health Grade** (A-F):
  - **Savings Ratio** (0-30 points): What percentage of income is retained
  - **Cash Runway** (0-25 points): Months of expenses covered by balance
  - **Revenue Diversity** (0-20 points): Number of income categories
  - **Expense Consistency** (0-25 points): Variance in monthly spending
- **Grade Scale**: A (85+), B (70-84), C (55-69), D (40-54), F (<40)

### Accounts Tab
- **Liquidity distribution** across all accounts
- **Account-by-account balance** breakdown

### Trends Tab
- **6-month trajectory** line chart (income, expenses)
- **Category growth analysis** over time
- **Trend indicators** for each category

### Tax Tab
- See Section 6.8 (Tax Compliance)

### Printable Reports
- **Print-optimized** layouts for all report types
- **CSV export** of filtered data from Book detail pages

### Use Case: Loan Application
> Grace needs a ₦5M loan from her bank. She opens Manaa Reports, reviews her "B" health grade, prints her 6-month cash flow report showing consistent income growth, and presents it to her loan officer. The professional report format impresses the bank and her loan is approved in 3 days instead of the usual 3 weeks.

---

## 6.8 Nigeria Tax Compliance (NTA 2025)

### Overview
Manaa is the first bookkeeping app for SMEs fully aligned with the **Nigeria Tax Act 2025** (signed June 26, 2025). This module lives under Reports → Tax.

### Features

#### Tax Reform Summary Card
Displays the four key rates at a glance:
| Tax | Rate | Notes |
|-----|------|-------|
| VAT | 7.5% | Retained — phased increase was rejected |
| Development Levy | 4% | Replaces TET, NITDA, NASENI & Police levies |
| Capital Gains Tax | 30% | Increased from 10% for companies |
| Personal Income Tax | 25% max | Exempt below ₦800K/year |

#### VAT Zero-Rated Categories
Essential goods and services exempt from VAT:
- Basic foodstuffs
- Medical & pharmaceutical supplies
- Educational materials & services
- Residential rent
- Public transportation
- Renewable energy products
- Exports (non-oil & gas)

#### Small Company Classification
- **Auto-detection**: Calculates last 12 months' revenue
- **Threshold**: ₦100M revenue, ₦250M fixed assets
- **Benefits**: CIT, CGT, and Development Levy exempt
- **Real-time status**: "SMALL" or "LARGE" classification badge

#### VAT Liability Estimator
- **Output VAT**: 7.5% of total sales for the selected month
- **Input VAT**: 7.5% of total purchases (fully recoverable under NTA 2025)
- **Net VAT Payable**: Output minus Input = amount owed to NRS
- **Refund Detection**: Shows when Input VAT exceeds Output VAT

#### NRS VAT Report (Quarterly)
- **Quarterly breakdown**: Q1-Q4 with Revenue, Expenses, VAT rates
- **Printable format**: Designed for Nigeria Revenue Service filing
- **Filing deadline note**: 21st of the month following taxable period
- **Footer notes**: Key compliance reminders

#### Development Levy Calculator
- 4% on assessable profits
- Automatically exempt for small companies
- Shows calculation breakdown

### Use Case: Tax Filing Season
> Chidi's accountant needs quarterly VAT figures for NRS filing. Instead of sorting through receipts, Chidi opens Manaa → Reports → Tax, reviews his Q3 NRS VAT Report showing ₦450,000 Output VAT minus ₦280,000 Input VAT = ₦170,000 Net Payable, and prints the report. His accountant files in 10 minutes.

---

## 6.9 CRM — Customer Relationship Management

### Overview
A HubSpot-inspired, Pro-tier CRM module built for Nigerian businesses, organizing customer engagement into five modules.

### Sub-Pages

#### 1. Leads
- **Lead capture**: Name, email, phone, company, source
- **Status tracking**: New, Contacted, Qualified, Converted, Lost
- **CSV/XLSX Import**: Template download, column mapping, responsive modal
- **Tags**: Custom tags for segmentation

#### 2. Contacts
- **Contact directory**: Full customer database
- **Company association**: Link contacts to companies
- **Notes**: Free-text notes per contact
- **Status management**: Active, Inactive

#### 3. Pipeline
- **Split-panel layout**: Left sidebar for stages, right area for deals
- **Drag-and-drop stages**: Reorder stages via vertical DnD
- **Drag-and-drop deals**: Move deals between stages via grid DnD
- **Deal Detail panel**: Slide-out with full deal information
- **Activity Timeline**: Log calls, WhatsApp messages, visits, proposals
- **Priority tagging**: Hot 🔥, Warm 🌡️, Cold ❄️
- **Lost Reasons**: Capture why deals were lost for business insights
- **Recommended Stages**: Quick-seed button with standard sales stages
- **Stage management**: Edit/delete stages from the right-side header

#### 4. Tasks
- **Task creation**: Title, description, due date
- **Deal/Contact association**: Link tasks to deals or contacts
- **Completion tracking**: Mark tasks as completed

#### 5. Insights
- **Pipeline analytics**: Deal values, conversion rates
- **Stage distribution**: Visual breakdown of deals across stages

### Use Case: Real Estate Agent
> Funmi manages 30 active property leads. She imports her contacts from an Excel sheet, creates pipeline stages ("Inquiry", "Viewing", "Negotiation", "Closed"), and drags deals through the pipeline. When a client calls, she logs it as an activity. At month-end, she reviews Insights to see her 65% conversion rate from Viewing to Negotiation.

---

## 6.10 Inventory & Stock Management

### Overview
A Pro-tier inventory management system organized into four sections, designed for product-based businesses.

### Sub-Pages

#### 1. Products
- **Product catalog**: Name, SKU, description, category, supplier
- **Dual pricing**: Unit Price (selling) vs. Cost Price (acquisition) for margin analysis
- **Stock quantity**: Current stock levels with low-stock threshold alerts
- **Image uploads**: Product photos stored in cloud storage
- **Low-stock badges**: Visual indicators when stock falls below threshold

#### 2. Sales
- **Sales recording**: Customer name, phone, quantity, payment method
- **Auto stock deduction**: Stock automatically reduced when sale is created
- **Payment status**: Paid, Unpaid, Escrow
- **Revenue tracking**: Total sales, revenue trajectory

#### 3. Unpaid
- **Outstanding debts**: Track customers who haven't paid
- **Aging analysis**: See how long debts have been outstanding
- **Collection management**: Update payment status as money comes in

#### 4. Escrow
- **Held funds**: Track money held in escrow for incomplete transactions
- **Release tracking**: Monitor when escrow funds should be released

### Use Case: Fashion Boutique Owner
> Amina stocks 200 different clothing items. She photographs each item, records the cost price (₦3,000) and selling price (₦8,500), and sets low-stock alerts at 3 units. When she sells a dress, she records the sale, the stock automatically updates, and she can see her profit margin instantly. At month-end, her Unpaid tab shows ₦125,000 in outstanding customer debts.

---

## 6.11 Bank Sync (Mono.co Integration)

### Overview
Real-time bank account synchronization through Mono.co, Nigeria's leading open banking platform.

### Features
- **Mono Connect Widget**: Secure bank linking via Mono's UI
- **Date Range Selection**: Choose which period to sync
- **Transaction Auto-Recording**: Synced transactions automatically added to the book
- **Deduplication**: Unique `mono_tx_id` prevents duplicate imports
- **Bank Badge**: 🏦 icon on synced transactions for easy identification
- **Auto-Categorization**: Keyword-based categorization of narrations
- **Manual Refresh**: Pull latest transactions on demand
- **Unlink Control**: Disconnect bank account when needed
- **Status Display**: Real-time sync status and last synced timestamp

### Supported Banks
All Nigerian banks supported by Mono.co, including:
Access Bank, GTBank, Zenith Bank, First Bank, UBA, Stanbic IBTC, Fidelity, FCMB, Wema, Sterling, Polaris, Keystone, Union Bank, and 20+ others.

### Use Case: Busy Entrepreneur
> Obi runs a logistics company and receives 50+ transfers daily. Instead of manually entering each one, he links his GTBank account via Mono. Every evening, he syncs his Manaa book and all transactions appear automatically, categorized and ready for review. He only needs to fix 2-3 categories.

---

## 6.12 Settings & Profile Management

### Overview
Comprehensive settings organized into three tabs: Profile, Business, and General.

### Profile Tab
- **Avatar upload**: Profile photo with cloud storage
- **Name, Position, Industry**: Professional profile fields
- **Password change**: Secure in-app password update
- **15 Industry options**: Technology, Finance, Healthcare, Education, Retail, Manufacturing, Real Estate, Agriculture, Media, Logistics, Food & Beverage, Fashion, Construction, Consulting, Other

### Business Tab
- **Business details editor**: Name, description, TIN, address, phone, email
- **Logo upload**: Business logo with cloud storage
- **Multi-business selector**: Switch between businesses
- **Category Management**: 
  - Create custom income/expense categories
  - Delete unused categories
  - "Seed Nigerian Categories" button: Pre-loads 25 Nigerian-specific categories

### General Tab
- **Push notification settings**: Enable/disable notifications
- **Theme preferences**: Light/Dark/System mode
- **Subscription status**: View current plan

### Use Case: New User Setup
> After signing up, Damilola goes to Settings, uploads her photo, enters her position as "Managing Director", selects "Fashion" as her industry, then switches to the Business tab and clicks "Seed Nigerian Categories" to instantly set up 25 relevant income and expense categories like "POS Collections", "Diesel & Generator", and "Import Duties & Clearing".

---

## 6.13 Push Notifications

### Overview
Web push notifications to keep users informed about important events.

### Features
- **Subscription management**: Opt-in/out from Settings
- **VAPID key configuration**: Secure push notification setup
- **Service Worker**: Background notification handling
- **Notification types**: Transaction alerts, invoice reminders, system updates

### Use Case: Payment Received
> While away from the app, Chidera receives a push notification: "₦250,000 payment received from Ola & Sons for Invoice #INV-0045". She taps the notification and lands directly on the transaction detail.

---

## 6.14 Guided Tour & Onboarding

### Overview
A floating-card guided tour that helps new users understand the platform.

### Features
- **Auto-trigger**: Shows on first desktop visit
- **5 tour stops**: Finance card, Cash In, Cash Out, Quick Actions, Transactions
- **Spotlight effect**: Highlights the target element
- **Progress tracking**: Step indicators
- **Persistence**: Completion saved to localStorage
- **Manual re-trigger**: "Guide" button in mobile quick actions

### Use Case: First-Time User
> When Emeka logs in for the first time on his laptop, a guided tour automatically appears, walking him through each section of the dashboard with clear explanations. After completing it, he feels confident enough to record his first transaction.

---

# 7. FEATURE DEEP DIVE — ADMIN PANEL

The Admin Panel is a platform-level management interface accessible only to users with the "admin" role. It provides complete oversight of the Manaa platform.

**Access**: `/admin` route (role-gated)

---

## 7.1 Admin Dashboard

### Features
- **Real-time Metrics**:
  - Monthly Recurring Revenue (MRR)
  - Total Platform Liquidity
  - Active Users count
  - Total Businesses count
- **Growth Charts**: User and revenue trends over time
- **Quick Stats**: Conversion rates, churn metrics
- **Theme Toggle**: Dark/Light mode from admin interface

### Use Case
> The Manaa team reviews the admin dashboard every Monday morning to track MRR growth, spot any unusual activity, and plan the week's priorities.

---

## 7.2 User Management

### Features
- **Global User Search**: Search across all registered users
- **Batch Processing**: Handle up to 500 user records at once
- **User Actions**:
  - Edit user details
  - Delete user accounts
  - Override Pro status (grant with 2099-12-31 expiry)
- **Safety Checks**: Prevents admins from accidentally removing their own privileges

### Use Case
> A user contacts support saying they can't access Pro features despite paying. The admin searches for the user, verifies their payment, and manually grants Pro status while the team investigates the payment webhook.

---

## 7.3 Business Oversight

### Features
- **Global business directory**: View all businesses on the platform
- **Business details**: Name, owner, creation date, transaction count
- **Moderation tools**: Ability to review and manage business accounts

### Use Case
> The compliance team reviews businesses for suspicious activity, checking transaction patterns and verifying business legitimacy.

---

## 7.4 Finance Section

A dedicated admin area for financial management with four sub-pages:

### 7.4.1 Finance Overview
- Platform-wide revenue summary
- Transaction volume trends
- Revenue by source (subscriptions, wallet fees)

### 7.4.2 Payments
- Payment transaction logs
- Failed payment investigation
- Refund management

### 7.4.3 Subscriptions
- Active subscription breakdown
- Churn analysis
- Revenue forecasting

### 7.4.4 Reports
- Platform financial reports
- Export capabilities
- Audit trails

### Use Case
> At quarter-end, the finance team uses the Admin Finance section to compile total platform revenue, identify top-revenue businesses, and prepare investor reports.

---

## 7.5 Email Management

### Features
- **Email logs**: Track all system emails (verification, password reset, notifications)
- **Delivery status**: Monitor email delivery success rates
- **Template management**: Review and update email templates

### Use Case
> Support receives a complaint that a user didn't receive their verification email. The admin checks the Email section, finds the email was blocked by the user's provider, and manually verifies the account.

---

## 7.6 Subscription Management

### Features
- **Subscription overview**: All active, expired, and cancelled subscriptions
- **Manual Pro override**: Grant Pro access with custom expiry dates
- **Payment history**: View Paystack payment references per user
- **Billing cycle tracking**: Monthly vs. annual subscriber distribution

### Use Case
> An early adopter requests a free Pro trial. The admin goes to Subscriptions, finds the user, and grants Pro status for 30 days to test conversion.

---

## 7.7 Admin Settings

### Features
- **Admin account management**: Update own profile and credentials
- **Self-Pro grant**: Admins can grant themselves Pro status
- **Platform configuration**: System-level settings

### Use Case
> A new team member is added as an admin. The existing admin grants them the admin role, and the new admin sets up their own account with Pro access.

---

# 8. SUBSCRIPTION & PRICING MODEL

### Current Pricing

| Feature | Free Tier | Pro Tier |
|---------|-----------|----------|
| **Price** | ₦0 | ₦4,500/month or ₦50,000/year |
| Businesses | 2 | Unlimited |
| Books per Business | 5 | Unlimited |
| Transactions | Unlimited | Unlimited |
| Invoicing | ✅ | ✅ |
| Reports & Tax | ✅ | ✅ |
| CSV/XLSX Export | ✅ | ✅ |
| Bank Sync (Mono) | ✅ | ✅ |
| CRM | ❌ | ✅ |
| Inventory | ❌ | ✅ |
| Debt Tracker | ❌ | ✅ |
| Store (Future) | ❌ | ✅ |
| Priority Support | ❌ | ✅ |

### Payment Infrastructure
- **Provider**: Paystack (Nigeria's leading payment processor)
- **Methods**: Card payments, bank transfers
- **Webhooks**: Automatic subscription activation on payment
- **Billing Cycle**: Monthly or Annual (2 months free on annual)

### Revenue Formula
```
Monthly Revenue = (Monthly Subscribers × ₦4,500) + (Annual Subscribers × ₦50,000 / 12)
```

### Projected Revenue (Conservative)

| Year | Users | Pro Conversion | MRR | ARR |
|------|-------|---------------|------|------|
| Year 1 | 10,000 | 5% (500) | ₦2.25M | ₦27M |
| Year 2 | 50,000 | 8% (4,000) | ₦18M | ₦216M |
| Year 3 | 250,000 | 10% (25,000) | ₦112.5M | ₦1.35B |

---

# 9. FUTURE PLANS (HIDDEN FEATURES)

These features are built or in development but currently hidden from the navigation for future activation.

---

## 9.1 Wallet & Virtual Accounts (DVA)

**Status**: Fully built, hidden from navigation

### Overview
A complete wallet system with Dedicated Virtual Accounts via Paystack (Wema Bank).

### How It Works
1. User enters their phone number
2. System creates a virtual bank account (e.g., Wema Bank)
3. Any transfer to this account auto-credits the user's Manaa wallet
4. Wallet balance can be used for in-app transactions

### Technical Implementation
- Paystack DVA API integration
- Webhook-based settlement detection
- Wallet transaction ledger with credit/debit history
- Real-time balance updates

### Revenue Potential
- Transaction fees on wallet operations
- Float income on wallet balances
- Premium wallet features (higher limits, instant transfers)

### Future Activation Plan
- Phase 1: Beta test with 100 Pro users
- Phase 2: Enable for all Pro users
- Phase 3: Open to free users with transaction limits

---

## 9.2 Debt Tracker

**Status**: Pro-tier, planned

### Overview
A dedicated module for tracking money owed to and by the business.

### Planned Features
- Debtor/Creditor directory
- Payment schedules and reminders
- Aging reports (30/60/90 days)
- WhatsApp payment reminders
- Integration with CRM contacts

---

## 9.3 Online Store / Storefront

**Status**: Planned

### Overview
A public-facing storefront where businesses can showcase and sell products directly.

### Planned Features
- Customizable store page (subdomain: storename.manaa.app)
- Product catalog from inventory
- Order management
- Payment collection via Paystack
- WhatsApp order notifications
- QR code for store link

### Revenue Potential
- Transaction commission (1-2% per sale)
- Premium store themes
- Custom domain support (add-on)

---

## 9.4 AI-Powered Insights

**Status**: Planned

### Overview
Leveraging AI to provide actionable business recommendations.

### Planned Features
- **Expense Anomaly Detection**: Flag unusual spending patterns
- **Revenue Forecasting**: Predict next month's income based on trends
- **Category Suggestions**: AI-powered transaction categorization
- **Cash Flow Warnings**: Alert when runway drops below 30 days
- **Customer Insights**: Identify top and at-risk customers
- **Natural Language Queries**: "How much did I spend on diesel last quarter?"

### Technical Approach
- Lovable AI integration (Gemini/GPT models)
- No additional API keys required
- Edge function processing for data privacy

---

## 9.5 Multi-Currency Support

**Status**: Planned

### Overview
Support for multiple African currencies beyond NGN.

### Planned Currencies
- 🇰🇪 KES (Kenyan Shilling)
- 🇬🇭 GHS (Ghanaian Cedi)
- 🇿🇦 ZAR (South African Rand)
- 🇹🇿 TZS (Tanzanian Shilling)
- 🇺🇬 UGX (Ugandan Shilling)
- 🇷🇼 RWF (Rwandan Franc)

### Revenue Potential
- Currency conversion fees
- Country-specific tax modules (premium add-on)

---

## 9.6 Team Collaboration & Roles

**Status**: Planned

### Overview
Multi-user access for businesses with role-based permissions.

### Planned Roles
- **Owner**: Full access
- **Manager**: All features except billing and deletion
- **Bookkeeper**: Transaction and report access only
- **Viewer**: Read-only access

### Revenue Potential
- Per-seat pricing: ₦2,000/month per additional user
- Enterprise tier with unlimited seats

---

## 9.7 Payroll Module

**Status**: Planned

### Overview
Basic payroll management for small businesses with employees.

### Planned Features
- Employee directory
- Salary schedules
- Tax deductions (PAYE, NHF, Pension)
- Payslip generation
- Bank transfer integration

### Revenue Potential
- Premium module: ₦5,000/month add-on
- Per-employee fee: ₦200/employee/month

---

## 9.8 Loan & Credit Scoring

**Status**: Conceptual

### Overview
Leveraging Manaa's financial data to provide business credit scoring.

### Planned Features
- Financial health-based credit score
- Partnership with microfinance institutions
- Loan application through the app
- Automated financial report generation for lenders

### Revenue Potential
- Referral commissions from lending partners
- Credit report fees
- Premium credit monitoring

---

# 10. REVENUE POSSIBILITIES

### Current Revenue Streams

| Stream | Model | Potential |
|--------|-------|----------|
| **Pro Subscriptions** | ₦4,500/mo or ₦50,000/yr | Primary revenue |
| **Annual Plans** | 2 months free incentive | Higher LTV |

### Future Revenue Streams

| Stream | Model | Potential |
|--------|-------|----------|
| **Store Commissions** | 1-2% per sale | High volume, low margin |
| **Wallet Fees** | ₦10-50 per transaction | Scale-dependent |
| **Float Income** | Interest on wallet balances | Passive income |
| **Team Seats** | ₦2,000/seat/month | Enterprise upsell |
| **Payroll Module** | ₦5,000/mo + per-employee | Premium add-on |
| **Credit Scoring** | Referral commissions | Partnership-based |
| **API Access** | Usage-based pricing | Developer platform |
| **White Label** | Custom-branded instances | High-value contracts |
| **Data Insights** | Anonymized market reports | B2B revenue |
| **Premium Templates** | Invoice/report templates | Low-effort monetization |
| **Advertising** | Targeted ads on free tier | Supplementary |
| **Financial Products** | Insurance, loans (referral) | Commission-based |

### 5-Year Revenue Projection

| Year | Users | Pro Conv. | MRR | Additional Revenue | Total ARR |
|------|-------|-----------|-----|-------------------|-----------|
| 1 | 10K | 5% | ₦2.25M | ₦0 | ₦27M |
| 2 | 50K | 8% | ₦18M | ₦5M | ₦276M |
| 3 | 250K | 10% | ₦112.5M | ₦45M | ₦1.89B |
| 4 | 500K | 12% | ₦270M | ₦120M | ₦4.68B |
| 5 | 1M | 12% | ₦540M | ₦300M | ₦10.08B |

---

# 11. USE CASES

### Use Case 1: Market Trader
**Persona**: Mama Ngozi, provisions store, Onitsha  
**Daily Routine**:
1. Opens Manaa at 7 AM
2. Records yesterday's closing balance
3. Throughout the day, records each sale via Cash In
4. Records supplier payments via Cash Out
5. At closing, checks Net Balance vs. cash in drawer
6. Weekly: Reviews Reports for top-selling categories

**Impact**: Reduced cash discrepancies from ₦15,000/week to under ₦500/week.

---

### Use Case 2: Freelance Photographer
**Persona**: Segun, wedding photographer, Lagos  
**Workflow**:
1. Creates lead in CRM when client inquires
2. Moves deal through pipeline: Inquiry → Quote → Booked → Shot → Delivered
3. Sends invoice via WhatsApp after delivery
4. Tracks expenses (equipment, transport, editing software)
5. Reviews monthly Reports for profit margin

**Impact**: Increased collection rate from 70% to 95%. Average payment time reduced from 14 days to 3 days.

---

### Use Case 3: Restaurant Chain
**Persona**: Chef Kola, 3 restaurants, Abuja  
**Setup**:
1. Creates 3 businesses (one per location)
2. Each business has books: Cash Register, Bank, POS, Mobile Money
3. Uses Inventory for ingredient tracking
4. Creates invoices for catering orders
5. CRM tracks corporate clients and repeat customers

**Impact**: Identified that Location 2 was losing money due to food waste. Cut losses by 40% in 2 months.

---

### Use Case 4: Fashion E-Commerce
**Persona**: Zainab, online fashion store, Instagram-based, Kano  
**Workflow**:
1. Adds all products to Inventory with photos and prices
2. When customer orders via Instagram DM, creates a sale
3. Tracks paid vs. unpaid orders in Inventory → Unpaid
4. Uses escrow for orders waiting for delivery confirmation
5. Monthly tax report shows exact VAT liability

**Impact**: Stopped losing track of unpaid orders (recovered ₦180,000 in first month).

---

### Use Case 5: NGO / Community Group
**Persona**: Pastor David, community church, Enugu  
**Setup**:
1. Creates business "Grace Church Finances"
2. Books: Tithes & Offerings, Building Fund, Welfare Fund
3. Records all income with member names
4. Tracks expenses: Generator fuel, pastor's allowance, building materials
5. Prints monthly financial report for church board

**Impact**: Transparency increased trust. Giving went up 25% when members could see financial reports.

---

### Use Case 6: Accountant Managing Multiple Clients
**Persona**: Accountant Bola, Lagos  
**Workflow**:
1. Creates a Manaa account for each client
2. Clients share transaction data via CSV exports
3. Uses Reports → Tax for NRS filing preparation
4. Generates printable financial health reports
5. Reviews Financial Health Grade for each client

**Impact**: Time per client reduced from 8 hours/month to 2 hours/month. Took on 15 additional clients.

---

### Use Case 7: POS Agent
**Persona**: Ibrahim, POS agent, Kaduna  
**Setup**:
1. Creates business "Ibrahim POS"
2. Books: POS Terminal 1, POS Terminal 2, Cash Float
3. Records each POS transaction with customer phone
4. Daily reconciliation against bank settlement
5. Tracks commission income

**Impact**: Identified ₦45,000 in settlement discrepancies in 3 months. Resolved with his bank.

---

### Use Case 8: Artisan / Skilled Worker
**Persona**: Tola, plumber, Ibadan  
**Workflow**:
1. Creates leads in CRM when customers call
2. Creates invoices for each job
3. Records material expenses per job
4. Reviews profit per job category
5. Shares invoices via WhatsApp

**Impact**: Discovered material costs were eating 60% of revenue. Negotiated bulk supplier discount.

---

# 12. COMPETITIVE ANALYSIS

| Feature | Manaa | QuickBooks | Wave | ProspaBooks | BizNurse |
|---------|-------|------------|------|-------------|----------|
| **Price** | Free / ₦4,500/mo | $30/mo (~₦50K) | Free | ₦5,000/mo | ₦3,000/mo |
| **Nigeria-Optimized** | ✅ Native | ❌ | ❌ | ✅ | ✅ |
| **Mobile-First** | ✅ PWA | ⚠️ App | ❌ Desktop | ✅ | ✅ |
| **NTA 2025 Tax** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **CRM** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Inventory** | ✅ Full | ⚠️ Basic | ❌ | ⚠️ Basic | ❌ |
| **Bank Sync** | ✅ Mono | ❌ Nigeria | ❌ | ⚠️ | ❌ |
| **Invoicing** | ✅ Full | ✅ | ✅ | ✅ | ⚠️ |
| **Financial Health Grade** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **WhatsApp Sharing** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Dark Mode** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Offline Support** | ⚠️ PWA | ✅ | ❌ | ⚠️ | ❌ |

### Competitive Advantages
1. **Only platform with NTA 2025 tax compliance** built-in
2. **Integrated CRM** — competitors require separate tools
3. **Full inventory management** with escrow tracking
4. **Financial Health Grade** — unique feature for business assessment
5. **Nigerian-native auto-categorization** (POS, airtime, stamp duty)
6. **Bank sync via Mono.co** — real-time Nigerian bank integration
7. **Significantly lower price** than international alternatives

---

# 13. MARKETING STRATEGY

### Brand Positioning
**"Smart Bookkeeping for Africa"** — The only financial management platform built from the ground up for African entrepreneurs.

### Marketing Channels

#### 1. Social Media Marketing
**Platforms**: Instagram, Twitter/X, TikTok, LinkedIn, Facebook

**Content Strategy**:
- **Educational Content** (40%): "5 Signs Your Business Is Leaking Money", "How to Read Your Financial Health Grade"
- **User Stories** (25%): Real Manaa users sharing their success stories
- **Product Demos** (20%): Quick feature walkthrough videos
- **Industry Insights** (15%): Nigerian tax updates, business tips

**Content Calendar**:
| Day | Platform | Content Type |
|-----|----------|-------------|
| Monday | LinkedIn | Business tip / Tax insight |
| Tuesday | Instagram | Feature spotlight (Reel) |
| Wednesday | Twitter/X | Quick tip thread |
| Thursday | TikTok | User story / Demo |
| Friday | Instagram | Weekend business challenge |
| Saturday | All | User-generated content |

#### 2. Influencer & Creator Marketing

**Tier 1: Micro-Influencers** (10K-100K followers)
- Business coaches and financial literacy creators
- Target: 20 partnerships at ₦50K-200K each
- Budget: ₦2M-4M

**Tier 2: Macro-Influencers** (100K-1M followers)
- Popular business/finance creators
- Target: 5 partnerships at ₦500K-2M each
- Budget: ₦2.5M-10M

**Suggested Creators**:
- Business finance educators on YouTube Nigeria
- Instagram business coaches
- TikTok "small business day in my life" creators
- Twitter/X business thought leaders

#### 3. Community Marketing

**Strategy**: Build communities, don't just advertise
- **WhatsApp Business Communities**: Groups for different business types
- **Manaa Business Hub**: Monthly virtual meetups
- **Business Challenges**: "30 Days of Tracking" challenge
- **Ambassador Program**: Power users become brand ambassadors

#### 4. Content Marketing (SEO & Blog)

**Blog Topics**:
- "Complete Guide to NTA 2025 for Small Businesses"
- "How to Calculate Your Business Financial Health"
- "Best Practices for Nigerian Bookkeeping"
- "Cash vs. POS vs. Mobile Money: Tracking Guide"
- "How to Send Professional Invoices via WhatsApp"

**SEO Keywords**:
- "bookkeeping app Nigeria"
- "small business accounting Nigeria"
- "invoice generator naira"
- "Nigeria tax calculator 2025"
- "POS tracking app"

#### 5. Partnerships & B2B Marketing

**Target Partners**:
- **Trade Associations**: Market traders' associations, professional guilds
- **Business Registration Bodies**: CAC, SMEDAN
- **Banks**: Partnerships with SME banking divisions
- **Telcos**: MTN Business, Airtel Business
- **Business Hubs**: Co-working spaces, incubators, accelerators

#### 6. Referral Program

**"Tell a Friend" Program**:
- Referrer: 1 free month of Pro
- Referee: 14-day extended trial of Pro
- Viral mechanic: Shareable referral link via WhatsApp
- Leaderboard: Top referrers get annual Pro for free

#### 7. Event Marketing

**Events to Sponsor/Attend**:
- Techpoint Africa conferences
- Social Media Week Lagos
- GTBank Food & Drink Festival (vendor outreach)
- MSME conferences and trade fairs
- University entrepreneurship events

### Marketing Budget (Year 1)

| Channel | Budget (₦) | Expected Users |
|---------|-----------|----------------|
| Social Media Ads | 5M | 3,000 |
| Influencer Marketing | 4M | 2,000 |
| Content/SEO | 2M | 2,000 |
| Events | 3M | 1,500 |
| Referral Program | 2M | 1,500 |
| **Total** | **16M** | **10,000** |

**CAC (Customer Acquisition Cost)**: ₦1,600 per user  
**LTV (Pro User)**: ₦54,000 (12 months at ₦4,500)  
**LTV:CAC Ratio**: 33.75x (excellent)

---

# 14. ENDORSEMENT & COLLABORATION OPPORTUNITIES

### Government & Institutional

| Organization | Collaboration Type | Value |
|-------------|-------------------|-------|
| **SMEDAN** | Official SME tool recommendation | Credibility + distribution to 41M MSMEs |
| **CAC (Corporate Affairs Commission)** | Integrate with business registration | New business owner acquisition |
| **NRS (Nigeria Revenue Service)** | Tax compliance certification | Trust + mandatory adoption potential |
| **NITDA** | Digital skills partnership | Training programs featuring Manaa |
| **Bank of Industry** | Loan application integration | Financial report-to-loan pipeline |
| **NEXIM Bank** | Export documentation | Serve export-focused SMEs |

### Financial Institutions

| Partner | Integration | Revenue Model |
|---------|------------|---------------|
| **GTBank** | SME Banking + Manaa bundle | Rev-share on accounts opened |
| **Access Bank** | "W" Initiative for women entrepreneurs | Co-branded product |
| **Kuda Bank** | Digital-first bank integration | API partnership |
| **Carbon/FairMoney** | Loan products based on Manaa data | Referral commission |
| **PiggyVest** | Business savings integration | Affiliate partnership |

### Technology Partners

| Partner | Integration | Value |
|---------|------------|-------|
| **Paystack** | Deeper payment integration | Transaction processing |
| **Flutterwave** | Multi-country expansion | Pan-African reach |
| **Mono.co** | Enhanced banking features | Data enrichment |
| **Termii/SMS providers** | Invoice reminders via SMS | Feature enhancement |
| **Zoho/Google** | Workspace integration | Enterprise appeal |

### Industry Associations

| Association | Approach | Benefit |
|-------------|----------|---------|
| **LSETF** (Lagos State) | Skills training tool | Government backing |
| **NASME** | Member benefit | 50,000+ member access |
| **ICAN** | Accountant tool certification | Professional endorsement |
| **CIPM** | HR/Payroll partnership | Module validation |
| **Nigerian Bar Association** | Legal billing integration | Niche market |

### Media & Brand Partnerships

| Partner | Collaboration | Impact |
|---------|--------------|--------|
| **Nairametrics** | Sponsored content | Business audience reach |
| **TechCabal** | Product reviews | Tech-savvy audience |
| **BusinessDay** | Financial literacy column | Authority building |
| **BellaNaija** | Entrepreneur spotlight series | Female audience reach |
| **Channels TV Business** | Segment sponsorship | Mass market awareness |

### Celebrity & Influencer Endorsements

| Category | Target | Why |
|----------|--------|-----|
| **Business Mogul** | Aliko Dangote Foundation | Ultimate credibility |
| **Tech Personality** | Jason Njoku (iROKO) | Tech + business cred |
| **Creative Economy** | Tems / Burna Boy's management | Creative entrepreneur reach |
| **Fashion** | Lisa Folawiyo | Fashion industry penetration |
| **Content Creator** | Mark Angel | Massive audience, relatable |
| **Sports** | Victor Osimhen | Youth appeal, business-minded |

### Strategic Collaboration Ideas

#### 1. "Manaa x GTBank SME Academy"
Partner with GTBank's SME Academy to provide Manaa as the official bookkeeping tool for graduates. Every SME Academy participant gets 3 months free Pro.

#### 2. "Manaa x CAC New Business Kit"
When a new business registers with CAC, they receive a Manaa welcome package: free Pro for 6 months + setup guide. This captures users at the moment of highest intent.

#### 3. "Manaa x SMEDAN Market Women's Initiative"
Partner with SMEDAN to bring Manaa to market associations. Train 1,000 market leaders who then train their peers. Provide Pidgin English support.

#### 4. "Manaa x Nigerian Universities"
Partner with university entrepreneurship centers to include Manaa in their curriculum. Students who start businesses learn on Manaa from day one.

#### 5. "Manaa x Paystack Commerce"
Deep integration where Paystack merchants automatically sync their payment data into Manaa for seamless bookkeeping.

---

# 15. GO-TO-MARKET ROADMAP

### Phase 1: Foundation (Months 1-3)
- ✅ Core product (Dashboard, Transactions, Invoicing, Reports)
- ✅ Landing pages and auth
- ✅ Paystack subscription integration
- ✅ Tax compliance module
- 🔲 Launch referral program
- 🔲 Begin social media content
- **Target**: 1,000 users

### Phase 2: Growth (Months 4-8)
- 🔲 Activate Wallet feature
- 🔲 Launch influencer campaigns
- 🔲 Partner with 3 trade associations
- 🔲 Launch WhatsApp community (5,000 members)
- 🔲 University partnership pilot (3 universities)
- 🔲 Pidgin English language option
- **Target**: 10,000 users

### Phase 3: Scale (Months 9-14)
- 🔲 Launch Online Store feature
- 🔲 Multi-currency (GHS, KES)
- 🔲 Team collaboration / multi-user
- 🔲 AI-powered insights (beta)
- 🔲 SMEDAN partnership launch
- 🔲 Banking partnerships (2 banks)
- **Target**: 50,000 users

### Phase 4: Expansion (Months 15-24)
- 🔲 Launch in Ghana and Kenya
- 🔲 Payroll module
- 🔲 Loan/Credit scoring partnerships
- 🔲 API for third-party integrations
- 🔲 Enterprise tier launch
- 🔲 Series A fundraise
- **Target**: 250,000 users

---

# 16. TECHNICAL SPECIFICATIONS

### Performance
- **Lighthouse Score**: Target 90+ (Performance, Accessibility, SEO)
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **PWA Score**: 100

### Database Schema (20+ tables)
- accounts, businesses, categories, contacts, deal_activities, deal_stages, deals, inventory_items, inventory_sales, invoice_items, invoices, linked_bank_accounts, notifications, pdf_templates, profiles, push_config, push_subscriptions, reminders, stock_movements, subscriptions, transactions, user_roles, wallet_transactions, wallets

### Edge Functions (Serverless)
1. **admin-data**: Platform-wide admin queries
2. **mono-exchange**: Mono.co token exchange
3. **mono-sync**: Bank transaction synchronization
4. **mono-webhook**: Bank event handling
5. **notifier**: Push notification dispatch
6. **paystack-initialize**: Payment checkout creation
7. **paystack-webhook**: Payment event processing
8. **send-email**: Transactional email delivery
9. **wallet**: Virtual account management

### Security
- Row Level Security (RLS) on all tables
- JWT-based authentication
- HTTPS encryption
- Serverless function authorization
- Data isolation per user
- NUBAN validation for account numbers
- Nigerian phone number validation

### Supported Browsers
- Chrome 80+
- Safari 14+
- Firefox 78+
- Edge 80+
- Samsung Internet 12+

### Supported Devices
- Desktop (responsive from 1024px)
- Tablet (768px-1023px)
- Mobile (320px-767px)

---

# 17. APPENDIX

### A. Nigerian Banks Directory
Access Bank, Citibank Nigeria, Ecobank Nigeria, Fidelity Bank, First Bank of Nigeria, FCMB, Globus Bank, GTBank, Heritage Bank, Jaiz Bank, Keystone Bank, Kuda Bank, Lotus Bank, Moniepoint MFB, OPay, PalmPay, Parallex Bank, Polaris Bank, Providus Bank, Stanbic IBTC, Standard Chartered, Sterling Bank, SunTrust Bank, TAJBank, Titan Trust Bank, Union Bank, UBA, Unity Bank, VFD MFB, Wema Bank, Zenith Bank

### B. Default Nigerian Categories

**Income Categories**: Sales Revenue, Service Income, POS Collections, Bank Transfer Received, Commission, Interest Income, Rental Income, Other Income

**Expense Categories**: Cost of Goods, Rent, Salaries & Wages, Diesel & Generator, Data & Airtime, Transportation & Logistics, Import Duties & Clearing, Utilities (PHCN/Electricity), Office Supplies, Marketing & Advertising, Bank Charges, POS Charges, Repairs & Maintenance, Insurance, Professional Fees, Taxes & Levies, Miscellaneous

### C. Account Types
Cash, Bank Account, POS Terminal, Mobile Money (OPay, PalmPay, etc.), Credit

### D. Transaction Auto-Categorization Keywords
| Keyword | Category |
|---------|----------|
| POS | Supplies |
| Airtime | Data & Airtime |
| Stamp Duty | Bank Charges |
| Uber | Transportation |
| Transfer | Bank Transfer Received |
| ATM | Cash |

### E. Financial Health Grade Formula

| Component | Weight | Scoring |
|-----------|--------|---------|
| Savings Ratio | 30 pts | ≥30%: 30, ≥15%: 22, ≥5%: 14, ≥0%: 6, <0%: 0 |
| Cash Runway | 25 pts | ≥6mo: 25, ≥3mo: 20, ≥1mo: 12, >0: 5, 0: 0 |
| Revenue Diversity | 20 pts | ≥4 cat: 20, 3: 15, 2: 10, 1: 5 |
| Expense Consistency | 25 pts | ≤15% var: 25, ≤30%: 18, ≤50%: 10, >50%: 3 |

**Grade Scale**: A (85-100), B (70-84), C (55-69), D (40-54), F (0-39)

### F. NTA 2025 Quick Reference

| Tax | Rate | Exemption |
|-----|------|-----------|
| VAT | 7.5% | Essential goods zero-rated |
| Dev. Levy | 4% | Small companies exempt |
| CGT | 30% | Gains <₦150M/yr, small companies |
| PIT | Up to 25% | Income <₦800K/yr exempt |
| CIT | 30% | Small companies exempt |

### G. Platform URLs
- **Landing Page**: https://manaa.lovable.app
- **Privacy Policy**: https://manaa.lovable.app/privacy-policy
- **App**: https://manaa.lovable.app/home

---

**Document Prepared By**: Manaa Product Team  
**Last Updated**: February 2026  
**Version**: 2.0  
**Total Pages**: ~35  

---

*© 2026 Manaa. All rights reserved. This document is confidential and intended for internal use, investor presentations, and strategic partnership discussions.*
