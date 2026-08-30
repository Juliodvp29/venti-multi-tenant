<div align="center">

<br />

# 🛍️ Venti Shop — Multi-Tenant SaaS eCommerce Platform

**A modern, high-performance, full-featured eCommerce management platform built for merchants who need power, flexibility, and real-time control without complexity.**

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

</div>

---

## 📖 Table of Contents

1. [What is Venti Shop?](#-what-is-venti-shop)
2. [Key Features & Highlights](#-key-features--highlights)
3. [Technology Stack](#-technology-stack)
4. [Architecture Overview](#️-architecture-overview)
5. [Project Structure](#-project-structure)
6. [Feature Modules](#-feature-modules)
7. [Core System Layer](#️-core-system-layer)
8. [Shared Components & Utilities](#-shared-components--utilities)
9. [Database Design](#️-database-design)
10. [Security & Multi-Tenancy](#-security--multi-tenancy)
11. [AI Assistant Integration](#-ai-assistant-integration)
12. [Visual Storefront Engine & Live Preview](#-visual-storefront-engine--live-preview)
13. [Performance Optimizations & Refactors](#-performance-optimizations--refactors)
14. [Getting Started](#-getting-started)
15. [Configuration](#️-configuration)
16. [Roadmap](#-roadmap)

---

## 🎯 What is Venti Shop?

**Venti Shop** is a SaaS (Software as a Service) eCommerce platform designed on a robust **multi-tenant architecture**. A single deployed instance serves multiple independent stores simultaneously — each with isolated data, custom branding, team members, products, commission rules, and customer bases.

Every merchant gets a complete store management system backed by enterprise-grade infrastructure. A store owner creates their tenant, configures their branding with live visual previews, manages inventory, tracks commissions, processes orders, and recovers abandoned carts — all from a responsive dashboard with full Dark/Light theme support. Simultaneously, each store runs a lightning-fast public-facing **storefront** customized to their exact brand identity.

The platform is engineered using modern Angular (v22) Standalone APIs, Angular Signals for fine-grained reactivity, Tailwind CSS 4, a fully managed Supabase backend (PostgreSQL + Auth + Storage + Edge Functions), and an embedded AI assistant powered by Google Gemini.

---

## ✨ Key Features & Highlights

### For Store Owners & Managers

- 📊 **Real-time Dashboard** — Live sales metrics, revenue trends with ApexCharts, recent order activity, and low-stock alerts.
- 🛒 **Product Catalog Management** — Full CRUD for products, variants (size/color/options), hierarchical categories, image galleries, and SKU tracking.
- 💰 **Commissions Engine (`/commissions`)** — Calculate, filter, track, and export commission rules and settlement statuses across payment gateways and subscription tiers.
- 📦 **Order Management** — Full order lifecycle from pending to delivered, status audit history, internal staff notes, and shipping tracking.
- 👥 **Customer CRM** — Customer profiles, address books, order histories, total spent aggregations, and marketing consents.
- 🎟️ **Coupons & Promotions** — Percentage, fixed-amount, and free-shipping discount codes with product/category targeting and usage caps.
- ⭐ **Review Moderation** — Moderate (approve/reject) customer product reviews with verified purchase indicators.
- 📉 **Abandoned Cart Recovery** — Identify and recover incomplete checkout sessions to boost sales conversion.
- 🎨 **Visual Storefront Customizer & Presets** — Drag-and-drop section builder, design presets, custom theme styling, and synchronized real-time live preview.
- 🖼️ **Centralized Media Manager** — Integrated image library modal for browsing, uploading, and managing assets directly with Supabase Storage.
- 📊 **Reports & Analytics** — Detailed sales performance, date-range filtering, and instant Excel (`.xlsx`) data exports.
- 👤 **Team Members & Invitations** — Invite team members via email with role-based access control (RBAC).
- 💳 **Subscription & Billing** — Plan management with feature quotas and billing history.
- 🌓 **Adaptive Dark & Light Themes** — First-class dark and light mode UI designed for maximum readability.

### For the Platform (System-wide)

- 🏢 **Multi-Tenancy** — Strict tenant isolation via PostgreSQL Row Level Security (RLS).
- 🔐 **Role-Based Access Control (RBAC)** — Granular roles: `Owner`, `Admin`, `Editor`, `Viewer`, and `Delivery`.
- 🌐 **Subdomain & Path Routing** — Dynamic tenant resolution supporting custom domains, subdomains (`store.domain.com`), and query parameter fallbacks (`?s=store-name`).
- 🤖 **AI Assistant (Gemini)** — Conversational assistant with tool-calling capabilities to query real-time store metrics.
- 📩 **Edge Functions Emailing** — Automated transactional and team invitation emails.
- 📝 **Inventory Audit Trail** — Chronological logs of every stock adjustment.
- 🗄️ **Full Data Snapshots** — Orders capture complete JSON snapshots of customer and product states at purchase time.

---

## 🛠 Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Angular | 22.x | Standalone component architecture & Signals |
| **Language** | TypeScript | 6.x | Strict static typing, decorators, and modern ESM |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS, dynamic theming, and Dark Mode |
| **Backend as a Service** | Supabase | 2.x | PostgreSQL DB, Auth (GoTrue), Storage, Edge Functions |
| **Database** | PostgreSQL | 15+ | Relational multi-tenant schema with strict RLS |
| **AI / LLM** | Google Gemini | `gemini-3-flash` | Conversational assistant with function/tool calling |
| **Charts** | ApexCharts + ng-apexcharts | 5.x / 2.x | Real-time interactive sales and performance charts |
| **Markdown Rendering** | marked + DOMPurify | 17.x / 3.x | Sanitized markdown formatting for AI and notes |
| **Data Export** | xlsx | 0.18.x | High-speed Excel (.xlsx) reports generation |
| **Package Manager** | npm / bun | 11.x / 1.3.x | Fast dependency management |
| **Build System** | Angular CLI / `@angular/build` | 22.x | Vite-powered build and development server |
| **Testing** | Vitest | 4.x | Fast unit and integration tests |

---

## 🏛️ Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  VENTI SHOP PLATFORM                                   │
│                                                                                        │
│  ┌───────────────────────────────┐           ┌──────────────────────────────────────┐  │
│  │   Merchant Admin Panel        │           │   Public Storefront & Live Preview   │  │
│  │   (Authenticated / Dark&Light)│           │   (/store?s={subdomain} or /preview) │  │
│  │                               │           │                                      │  │
│  │  /dashboard    /orders        │           │  /store (home)    /store/cart        │  │
│  │  /products     /commissions   │ ◄───────► │  /store/productos /store/checkout    │  │
│  │  /customers    /coupons       │  Preview  │  /store/p/:slug   /store/my-orders   │  │
│  │  /reports      /members       │   Sync    │                                      │  │
│  │  /settings     /inventory-log │           │                                      │  │
│  └───────────────┬───────────────┘           └──────────────────┬───────────────────┘  │
│                  │                                              │                      │
│                  └───────────────────────┬──────────────────────┘                      │
│                                          │                                             │
│                                ┌─────────▼──────────┐                                  │
│                                │   Angular 22 SPA   │                                  │
│                                │   Signal State     │                                  │
│                                │   Core Services    │                                  │
│                                └─────────┬──────────┘                                  │
│                                          │                                             │
│                  ┌───────────────────────┼───────────────────────┐                     │
│                  │                       │                       │                     │
│          ┌───────▼────────┐      ┌───────▼────────┐      ┌───────▼────────┐            │
│          │  Supabase DB   │      │ Supabase Auth, │      │  Google Gemini │            │
│          │ PostgreSQL RLS │      │ Storage & Fns  │      │ AI Tool-Calling│            │
│          └────────────────┘      └────────────────┘      └────────────────┘            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
src/
└── app/
    ├── app.routes.ts          # Root routing configuration with lazy loading & guards
    ├── app.config.ts          # Angular application bootstrap providers
    │
    ├── core/                  # Shared system infrastructure (eagerly accessible)
    │   ├── enums/             # TypeScript enumerations (Roles, Statuses, Plans)
    │   ├── guards/            # Auth, guest, store, role, and redirect guards
    │   ├── interceptors/      # Token injection, error handling, and loader interceptors
    │   ├── layouts/           # Shell components (MainLayout with sidebar, header, etc.)
    │   ├── models/            # Domain models and interfaces (16 domain definitions)
    │   ├── services/          # 31 business logic & data access services
    │   └── types/             # Utility types and Supabase database type definitions
    │
    ├── features/              # Lazy-loaded feature modules
    │   ├── abandoned-carts/   # Incomplete session analysis & recovery
    │   ├── auth/              # Sign in, registration, forgot-password flows
    │   ├── commissions/       # Commission tracking, rules, and payout reports [NEW]
    │   ├── coupons/           # Promotional codes and discount engine
    │   ├── customers/         # Customer CRM & address management
    │   ├── dashboard/         # Real-time metrics, KPI cards, and ApexCharts
    │   ├── inventory-history/ # Historical stock adjustments audit trail
    │   ├── landing/           # Public SaaS marketing and presentation page
    │   ├── members/           # Store team members and invitation manager
    │   ├── orders/            # Order processing, status transitions, and shipping
    │   ├── products-catalog/  # Products, categories, variants, and stock management
    │   ├── reports/           # Financial analytics and Excel export suite
    │   ├── reviews/           # Product review moderation pipeline
    │   ├── settings/          # Store settings, branding, design presets, and theme customizer
    │   ├── store/             # Customer-facing shopping storefront
    │   ├── store-selection/   # Multi-store switcher and invite acceptance
    │   └── subscription/      # Subscription plans, quotas, and billing
    │
    └── shared/                # Universal UI components, directives, and pipes
        ├── components/        # Reusable presentation widgets (11 UI modules)
        │   ├── ai-assistant/         # Embedded AI chat assistant
        │   ├── customer-auth-modal/  # Storefront customer login/register modal
        │   ├── date-picker/          # Accessible date selector
        │   ├── date-range-picker/    # Period selector for analytics
        │   ├── dropdown/             # Stylized accessible select replacement
        │   ├── dynamic-table/        # Data table with sorting, pagination, and actions
        │   ├── media-manager-modal/  # Supabase Storage media library modal [NEW]
        │   ├── not-found/            # 404 error page
        │   ├── order-status-badge/   # Visual status badge indicator
        │   ├── toast/                # Global toast notification queue
        │   └── usage-progress/       # Visual quota consumption bar
        ├── directives/        # Utility directives (e.g., `hasRole`)
        └── pipes/             # Data formatting pipes (e.g., `markdown`)
```

---

## 🧩 Feature Modules

### 💰 Commissions Management (`/commissions`) *New*
A comprehensive commission tracking and rule management module:
- **Rule Engine**: Define gateway-specific and plan-specific commission rates (`commission_rules`).
- **Commission Ledger**: Real-time listing of commissions generated from completed orders and transactions (`commissions`).
- **Status & Settlements**: Manage settlement states (`pending`, `paid`) with instant monthly calculations.
- **Advanced Filtering & Search**: Filter by status, payment gateway (Stripe, PayPal, Cash on Delivery, etc.), transaction IDs, and date intervals.
- **Reporting & Export**: Instant export of commission records to Excel (`.xlsx`).
- **Settings Integration**: Configure default and override commission rules within `/settings`.

### 🎨 Visual Storefront Customizer & Themes (`/settings` & `/preview`)
- **Theme & Branding Editor**: Configure color palettes (primary, secondary, accent, surface), typography, button border-radii, and shadow styles.
- **Design Presets**: Switch instantly between pre-curated design themes with one click.
- **Live Preview (`/preview`)**: Real-time preview synchronized across frames via `PreviewSyncService`, allowing merchants to see visual storefront changes before publishing.
- **Section Builder**: Reorder, activate, and customize storefront sections (Hero, Featured Products, Categories, Testimonials, FAQ).

### 📦 Products & Catalog (`/products`)
- **Rich Product CRUD**: SKU, barcode, cost price, sale price, compare-at price, inventory limits, and SEO metadata.
- **Variants Management**: Multi-attribute variants (Size, Color, Material) with independent pricing and stock.
- **Category Hierarchy**: Recursive parent/child category tree with SEO slugs and category banners.
- **Image Gallery**: Integrated with the `MediaManagerModal` for fast uploads and reordering.

### 📋 Orders & Fulfillment (`/orders`)
- **Order Lifecycle**: Full pipeline (`pending`, `processing`, `paid`, `shipped`, `delivered`, `cancelled`, `refunded`).
- **Historical Snapshots**: Products and customer addresses are snapshotted in JSONB to maintain immutable order records.
- **Status Log**: Audit trail documenting every status change with timestamps and responsible team member.

### 📉 Abandoned Carts (`/abandoned-carts`)
- Real-time tracking of abandoned shopper carts with cart value calculations, time elapsed, and customer contact details for recovery outreach.

### 🤖 AI Store Assistant
- Embedded floating assistant powered by **Google Gemini** capable of tool-calling into the database to check revenue, low inventory, customer segments, and order statuses.

---

## ⚙️ Core System Layer

### Route Guards & Access Control

| Guard | Description |
| :--- | :--- |
| `authGuard` | Protects private merchant routes; verifies active session and loads store context |
| `guestGuard` | Prevents logged-in users from accessing authentication screens |
| `storeGuard` | Resolves tenant metadata for the public storefront via subdomain or query param |
| `roleGuard` | Verifies the user holds required permissions for the route |
| `adminGuard` | Restricts access to `Owner` and `Admin` roles |
| `editorGuard` | Allows `Owner`, `Admin`, and `Editor` roles |
| `viewerGuard` | Permits read-only views (`Owner`, `Admin`, `Editor`, `Viewer`) |
| `deliveryRedirectGuard` | Redirects users with `Delivery` role straight to the Orders view |

### Core Services (31 Services)

| Service | Responsibility |
| :--- | :--- |
| `TenantService` | Central store state, branding, member invitations, and layout settings |
| `AuthService` | Supabase GoTrue authentication, JWT refresh, and session management |
| `CommissionsService` | **[NEW]** Commission calculations, rules, status updates, and Excel exports |
| `PreviewSyncService` | **[NEW]** Real-time reactive bridge between theme customizer and live preview |
| `GeographyService` | **[NEW]** Standardized country, state, and geographic data for shipping/taxes |
| `LoggerService` | **[NEW]** Centralized logging utility with environment-aware debug levels |
| `ProductsService` | Products, variants, inventory counts, and category links |
| `OrdersService` | Order queries, status transitions, and notes management |
| `CustomersService` | Customer CRM, addresses, and purchase history |
| `CategoriesService` | Hierarchical category management and navigation trees |
| `DiscountsService` | Coupon codes validation, usage tracking, and criteria evaluation |
| `ReviewsService` | Review moderation pipeline (approval, rejection, ratings) |
| `AnalyticsService` | KPI calculations, revenue aggregations, and chart data formatting |
| `InventoryService` | Stock adjustments and inventory history tracking |
| `CartService` | Storefront persistent shopping cart state |
| `AbandonedCartService` | Inactive checkout session identification and metrics |
| `PaymentsService` | Payment records, transactions, and refund handling |
| `ShippingService` | Shipping zones, methods, and weight/price rates |
| `SubscriptionService` | Plan tiers, usage limit enforcement, and billing |
| `StorageService` | Supabase Storage bucket uploads, asset deletion, and URL generation |
| `FileProcessorService` | Image compression, validation, and metadata extraction |
| `SeoService` | Dynamic metadata, OpenGraph tags, and document title management |
| `StructuredDataService` | JSON-LD schema generation (Product, Store, Breadcrumbs) |
| `PermissionsService` | Granular role-based capability verification |
| `EmailService` | Transactional email logs and delivery monitoring |
| `ToastService` | Reactive notifications queue (Success, Error, Warning, Info) |
| `LoaderService` | Global asynchronous operation progress state |
| `CustomerAuthService` | Dedicated storefront customer authentication |
| `AiAssistantService` | Gemini AI chat agent with live database function calling |
| `Supabase` | Supabase client singleton wrapper |

---

## 🧱 Shared Components & Utilities

| Component | Description |
| :--- | :--- |
| `app-media-manager-modal` | **[NEW]** Media gallery modal for browsing, uploading, and selecting assets with Supabase Storage |
| `app-dynamic-table` | Reusable data table with sortable columns, responsive layout, search bar, pagination, and action slots |
| `app-dropdown` | Accessible custom select menu with support for icons, search, and typed selection |
| `app-date-picker` / `app-date-range-picker` | Custom-styled single-date and range calendar pickers |
| `app-toast` | Animated notification banner stack |
| `app-order-status-badge` | Visual pill tag color-coded by order status |
| `app-usage-progress` | Visual meter displaying subscription resource quotas |
| `app-customer-auth-modal` | Storefront popup for seamless customer login and registration |
| `app-ai-assistant` | Floating AI assistant drawer with rich markdown responses |
| `app-not-found` | Styled 404 error page |

---

## 🗄️ Database Design

The database schema is powered by PostgreSQL on Supabase, featuring **30+ tables**, **Row Level Security (RLS)**, and comprehensive relational integrity.

### Core Entity Groups

- **Tenants & Members**: `tenants`, `tenant_members`, `tenant_settings`, `subscription_history`.
- **Catalog**: `products`, `categories`, `product_categories`, `product_variants`, `product_images`, `product_tags`, `product_tag_associations`.
- **Orders & Customers**: `customers`, `customer_addresses`, `orders`, `order_items`, `order_status_history`, `payments`, `refunds`.
- **Commissions** *(New)*: `commissions`, `commission_rules` (tracks rates by plan/gateway and transaction amounts).
- **Discounts & Reviews**: `discount_codes`, `discount_usage`, `product_reviews`.
- **Analytics & Logs**: `analytics_events`, `daily_sales_summary`, `product_performance`, `inventory_history`, `audit_logs`, `email_logs`.
- **Settings & Media**: `media_library`, `shipping_zones`, `shipping_rates`, `tax_rates`, `email_templates`, `webhook_endpoints`, `webhook_deliveries`.

---

## 🚀 Performance Optimizations & Refactors

Recent platform updates incorporated significant architectural and performance improvements:

1. **Angular Signals Reactivity**:
   - Replaced heavy RxJS event buses with lightweight `signal()`, `computed()`, and `effect()` primitives.
   - Elimination of unnecessary change detection cycles across deeply nested components.
2. **OnPush Change Detection**:
   - Standardized `ChangeDetectionStrategy.OnPush` across all feature and shared components for instantaneous UI updates.
3. **Optimized Route Resolution & Auth Initialization**:
   - Guard pipelines utilize `auth.ensureInitialized()` to prevent race conditions during page reloads and redirect handoffs.
4. **Granular Lazy Loading**:
   - Every major route and child modal is split into independent asynchronous chunks via `loadComponent` and `loadChildren`.
5. **Tailwind CSS 4 Engine**:
   - Upgraded to the modern Tailwind CSS 4 engine for faster compilation times, smaller CSS bundle sizes, and native CSS variable theming.
6. **Dark / Light Mode Contrast**:
   - Refactored semantic color tokens across the entire admin dashboard and storefront for seamless switching between light and dark themes.

---

## 💻 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or later (or **Bun** `1.3.x+`)
- **npm**: `v10.x` or `v11.x`
- **Supabase Account**: With an active PostgreSQL project and Auth enabled

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Juliodvp29/venti-multi-tenant.git
   cd venti-multi-tenant
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment files:
   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   cp src/environments/environment.example.ts src/environments/environment.development.ts
   ```

   Fill in your credentials:
   ```ts
   export const environment = {
     production: false,
     supabase: {
       url: 'https://your-project.supabase.co',
       anonKey: 'your-anon-key',
       storageBucket: 'products',
     },
     gemini: {
       apiKey: 'your-gemini-api-key',
     },
     appUrl: 'http://localhost:4200',
     domain: 'localhost:4200',
   };
   ```

4. **Start the Development Server:**
   ```bash
   npm start
   ```
   Open `http://localhost:4200` in your browser.

---

## 🛠️ Build & Test Commands

```bash
# Start development server
npm start

# Run unit tests with Vitest
npm run test

# Build for production
npm run build

# Run build in watch mode
npm run watch

# Format code with Prettier
npx prettier --write "src/**/*.ts" "src/**/*.html"
```

---

## 🗺️ Roadmap

Discover upcoming features, scheduled phases, and future integrations in our dedicated roadmap document:

👉 **[View ROADMAP.md](ROADMAP.md)**

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ for Modern Digital Commerce**

</div>
