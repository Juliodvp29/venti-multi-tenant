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
- ❓ **Help & Support Center Drawer** — Supabase-inspired interactive help drawer with live store setup health checks, troubleshooting guides, and a support ticket creator with file attachments.
- 🔔 **Realtime Notifications Center** — Interactive header notification drawer with live Supabase Realtime updates for incoming orders, low stock, customer reviews, commissions, and team activity.
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
| **Backend as a Service** | Supabase | 2.x | PostgreSQL DB, Auth (GoTrue), Storage, Edge Functions, Realtime |
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
│          │ PostgreSQL RLS │      │ Realtime & Fns │      │ AI Tool-Calling│            │
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
    │   ├── models/            # Domain models and interfaces (17 domain definitions)
    │   ├── services/          # 32 business logic & data access services
    │   └── types/             # Utility types and Supabase database type definitions
    │
    ├── features/              # Lazy-loaded feature modules
    │   ├── abandoned-carts/   # Incomplete session analysis & recovery
    │   ├── auth/              # Sign in, registration, forgot-password flows
    │   ├── commissions/       # Commission tracking, rules, and payout reports
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
        ├── components/        # Reusable presentation widgets (12 UI modules)
        │   ├── ai-assistant/            # Embedded AI chat assistant
        │   ├── customer-auth-modal/     # Storefront customer login/register modal
        │   ├── date-picker/             # Accessible date selector
        │   ├── date-range-picker/       # Period selector for analytics
        │   ├── dropdown/                # Stylized accessible select replacement
        │   ├── dynamic-table/           # Data table with sorting, pagination, and actions
        │   ├── media-manager-modal/     # Supabase Storage media library modal
        │   ├── notifications-dropdown/  # Realtime notification center popup [NEW]
        │   ├── not-found/               # 404 error page
        │   ├── order-status-badge/      # Visual status badge indicator
        │   ├── toast/                   # Global toast notification queue
        │   └── usage-progress/          # Visual meter displaying subscription resource quotas
        ├── directives/        # Utility directives (e.g., `hasRole`)
        └── pipes/             # Data formatting pipes (e.g., `markdown`)
```

---

## 🧩 Feature Modules

### 🔔 Realtime Notification Center *(Header Drawer)*
- **Live Supabase Realtime Stream**: Automatically listens for `INSERT` operations on the `notifications` table per tenant.
- **Dynamic Badge Counter**: Displays count of unread notifications with animation cues.
- **Interactive Popup**: Tabs for *Todas* and *No leídas*, individual and bulk *Marcar como leída*, removal of items, and direct navigation links (e.g., click a new order notification to open `/orders/:id`).
- **Granular Categories**: Differentiated icons and styles for Orders, Low Stock, Reviews, Commissions, Team joins, and Abandoned Carts.

### 💰 Commissions Management (`/commissions`)
- **Rule Engine**: Define gateway-specific and plan-specific commission rates (`commission_rules`).
- **Commission Ledger**: Real-time listing of commissions generated from completed orders and transactions (`commissions`).
- **Status & Settlements**: Manage settlement states (`pending`, `paid`) with instant monthly calculations.
- **Advanced Filtering & Search**: Filter by status, payment gateway, transaction IDs, and date intervals.
- **Reporting & Export**: Instant export of commission records to Excel (`.xlsx`).

### 🎨 Visual Storefront Customizer & Themes (`/settings` & `/preview`)
- **Theme & Branding Editor**: Configure color palettes, typography, button border-radii, and shadow styles.
- **Design Presets**: Switch instantly between pre-curated design themes with one click.
- **Live Preview (`/preview`)**: Real-time preview synchronized across frames via `PreviewSyncService`.
- **Section Builder**: Reorder, activate, and customize storefront sections.

### 📦 Products & Catalog (`/products`)
- **Rich Product CRUD**: SKU, barcode, cost price, sale price, compare-at price, inventory limits, and SEO metadata.
- **Variants Management**: Multi-attribute variants with independent pricing and stock.
- **Category Hierarchy**: Recursive parent/child category tree with SEO slugs.
- **Media Integration**: Direct integration with the `MediaManagerModal`.

### 📋 Orders & Fulfillment (`/orders`)
- **Order Lifecycle**: Full pipeline (`pending`, `processing`, `paid`, `shipped`, `delivered`, `cancelled`, `refunded`).
- **Historical Snapshots**: Products and customer addresses snapshotted in JSONB for immutable records.
- **Status History Audit**: Chronological log of all transitions.

---

## ⚙️ Core System Layer

### Core Services (33 Services)

| Service | Responsibility |
| :--- | :--- |
| `TenantService` | Central store state, branding, member invitations, and layout settings |
| `AuthService` | Supabase GoTrue authentication, JWT refresh, and session management |
| `SupportService` | **[NEW]** Store setup health diagnostics, troubleshooting knowledgebase & ticket creation |
| `NotificationsService` | Real-time tenant notifications, unread count signals, read status & deletion |
| `CommissionsService` | Commission calculations, rules, status updates, and Excel exports |
| `PreviewSyncService` | Real-time reactive bridge between theme customizer and live preview |
| `GeographyService` | Standardized country, state, and geographic data for shipping/taxes |
| `LoggerService` | Centralized logging utility with environment-aware debug levels |
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
| `app-help-drawer` | **[NEW]** Help & Support interactive drawer with store health check and ticket submission |
| `app-notifications-dropdown` | Live Realtime notification center popup with badge counter and action handlers |
| `app-media-manager-modal` | Media gallery modal for browsing, uploading, and selecting assets with Supabase Storage |
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
- **Notifications & Support**: `notifications`, `support_tickets` (tracks user assistance requests, categories, severities, and attachments).
- **Catalog**: `products`, `categories`, `product_categories`, `product_variants`, `product_images`, `product_tags`, `product_tag_associations`.
- **Orders & Customers**: `customers`, `customer_addresses`, `orders`, `order_items`, `order_status_history`, `payments`, `refunds`.
- **Commissions**: `commissions`, `commission_rules`.
- **Discounts & Reviews**: `discount_codes`, `discount_usage`, `product_reviews`.
- **Analytics & Logs**: `analytics_events`, `daily_sales_summary`, `product_performance`, `inventory_history`, `audit_logs`, `email_logs`.
- **Settings & Media**: `media_library`, `shipping_zones`, `shipping_rates`, `tax_rates`, `email_templates`, `webhook_endpoints`, `webhook_deliveries`.

---

## 🚀 Performance Optimizations & Refactors

1. **Angular Signals Reactivity**:
   - Replaced heavy RxJS event buses with lightweight `signal()`, `computed()`, and `effect()` primitives.
2. **OnPush Change Detection**:
   - Standardized `ChangeDetectionStrategy.OnPush` across all feature and shared components.
3. **Optimized Route Resolution & Auth Initialization**:
   - Guard pipelines utilize `auth.ensureInitialized()` to prevent race conditions during page reloads.
4. **Granular Lazy Loading**:
   - Every major route and child modal is split into independent asynchronous chunks via `loadComponent` and `loadChildren`.
5. **Tailwind CSS 4 Engine**:
   - Upgraded to modern Tailwind CSS 4 engine for faster compilation times and smaller CSS bundle sizes.
6. **Dark / Light Mode Contrast**:
   - Semantic color tokens across the entire admin dashboard and storefront for seamless theme switching.

---

## 💻 Getting Started

```bash
# Clone the repository
git clone https://github.com/Juliodvp29/venti-multi-tenant.git
cd venti-multi-tenant

# Install dependencies
npm install

# Start development server
npm start

# Run unit tests
npm run test

# Build for production
npm run build
```

---

## 🗺️ Roadmap

Discover upcoming features and roadmap phases:

👉 **[View ROADMAP.md](ROADMAP.md)**

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ for Modern Digital Commerce**

</div>
