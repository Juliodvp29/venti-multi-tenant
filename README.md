<div align="center">

<br />

# ðŸ›ï¸ Venti Shop â€” Multi-Tenant SaaS eCommerce Platform

**A modern, full-featured eCommerce management platform built for merchants who need power without complexity.**

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

</div>

---

## ðŸ“– Table of Contents

1. [What is Venti Shop?](#-what-is-venti-shop)
2. [Key Features](#-key-features)
3. [Technology Stack](#-technology-stack)
4. [Architecture Overview](#ï¸-architecture-overview)
5. [Project Structure](#-project-structure)
6. [Feature Modules](#-feature-modules)
7. [Core System Layer](#ï¸-core-system-layer)
8. [Shared Components & Utilities](#-shared-components--utilities)
9. [Database Design](#ï¸-database-design)
10. [Security & Multi-Tenancy](#-security--multi-tenancy)
11. [AI Assistant Integration](#-ai-assistant-integration)
12. [Storefront Engine](#-storefront-engine)
13. [Getting Started](#-getting-started)
14. [Configuration](#ï¸-configuration)
15. [Roadmap](#-roadmap)


---

## ðŸŽ¯ What is Venti Shop?

**Venti Shop** is a SaaS (Software as a Service) eCommerce platform designed on a **multi-tenant architecture**. This means that a single deployed instance can serve multiple independent stores simultaneously â€” each with its own isolated data, custom branding, team members, products, and customers.

Think of it as giving every merchant their own complete store management system, backed by the same powerful infrastructure. A store owner registers, creates their store (tenant), invites their team, and starts managing products, orders, and customers â€” all from a clean, modern dashboard. Simultaneously, their store is live as a public-facing **storefront** that customers can browse and shop from.

The platform is built with scalability and developer experience in mind, using the latest Angular 21 APIs, a fully managed Supabase backend (PostgreSQL + Auth + Storage), and an embedded AI assistant powered by Google Gemini.

---

## âœ¨ Key Features

### For Store Owners & Managers
- ðŸ“Š **Real-time Dashboard** â€” Live sales metrics, revenue charts, order activity, and inventory alerts at a glance
- ðŸ›’ **Product Catalog Management** â€” Full CRUD for products, variants (size/color), categories (with hierarchy), images, and SKU tracking
- ðŸ“¦ **Order Management** â€” Full order lifecycle from pending to delivered, with status history, internal notes, and tracking
- ðŸ‘¥ **Customer Management** â€” Customer profiles, address books, order history, and marketing consent
- ðŸŽŸï¸ **Coupons & Discounts** â€” Percentage, fixed-amount, and free-shipping coupon codes with usage limits and validity periods
- â­ **Review Moderation** â€” Approve, reject, and manage customer product reviews
- ðŸ“‰ **Abandoned Cart Recovery** â€” Track and recover sessions where customers left without completing checkout
- ðŸ“Š **Reports** â€” Sales reports and analytics with chart exports
- ðŸ‘¤ **Team Members** â€” Invite team members by email with role-based access control
- ðŸ’³ **Subscription Management** â€” Plan management with billing history

### For the Platform (System-wide)
- ðŸ¢ **Multi-Tenancy** â€” Strict data isolation per store via Row Level Security (RLS)
- ðŸ” **Role-Based Access Control** â€” Owner, Admin, Editor, Viewer, and Delivery Driver roles
- ðŸŒ **Subdomain-based Storefront Routing** â€” Each store gets its own public storefront
- ðŸ¤– **AI Assistant (Gemini)** â€” Conversational assistant with tool-calling to query real store data
- ðŸŽ¨ **Per-Tenant Branding** â€” Custom logo, favicon, colors, fonts, and storefront layout
- ðŸ“© **Email Invitation System** â€” Supabase Edge Functions to send branded invitation emails
- ðŸ—ƒï¸ **File Storage** â€” Image uploads for products and branding via Supabase Storage
- ðŸ“‹ **Audit Logs** â€” Comprehensive trail of all important actions
- ðŸ”” **Webhook Support** â€” Event-driven integrations with external services
- ðŸ“ **Inventory History** â€” Track all stock changes over time

---

## ðŸ›  Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | Angular | 21.x | Component-based SPA with standalone components |
| **Language** | TypeScript | 5.9 | Static typing, interfaces, decorators |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS, responsive design |
| **Backend as a Service** | Supabase | 2.x | PostgreSQL database, Auth, Storage, Edge Functions |
| **Database** | PostgreSQL | 15+ | Relational DB via Supabase with RLS |
| **AI / LLM** | Google Gemini | gemini-3-flash | Conversational AI assistant with function calling |
| **Charts** | ApexCharts + ng-apexcharts | 5.x / 2.x | Interactive sales & analytics charts |
| **Markdown Rendering** | marked + DOMPurify | 17.x / 3.x | Safe AI response rendering |
| **Spreadsheet Export** | xlsx | 0.18.x | Export data to Excel/CSV |
| **Package Manager** | bun | 1.3.10 | Dependency management |
| **Build Tool** | Angular CLI / @angular/build | 21.x | Bundling, optimization, dev server |
| **Testing** | Vitest | 4.x | Fast unit testing |
| **Code Style** | Prettier | â€” | Consistent code formatting |


---

## ðŸ›ï¸ Architecture Overview

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                        VENTI SHOP PLATFORM                          â”‚
â”‚                                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”           â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚   Admin Panel   â”‚           â”‚      Public Storefront           â”‚ â”‚
â”‚  â”‚  (Authenticated)â”‚           â”‚  (/store?s={subdomain} or        â”‚ â”‚
â”‚  â”‚                 â”‚           â”‚   subdomain.venti.com)           â”‚ â”‚
â”‚  â”‚  /dashboard     â”‚           â”‚                                  â”‚ â”‚
â”‚  â”‚  /products      â”‚           â”‚  /store (home)                   â”‚ â”‚
â”‚  â”‚  /orders        â”‚           â”‚  /store/productos                â”‚ â”‚
â”‚  â”‚  /customers     â”‚           â”‚  /store/product/:slug            â”‚ â”‚
â”‚  â”‚  /coupons       â”‚           â”‚  /store/cart                     â”‚ â”‚
â”‚  â”‚  /reports       â”‚           â”‚  /store/checkout                 â”‚ â”‚
â”‚  â”‚  /members       â”‚           â”‚  /store/my-orders                â”‚ â”‚
â”‚  â”‚  /settings      â”‚           â”‚                                  â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜           â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚           â”‚                                   â”‚                     â”‚
â”‚           â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                     â”‚
â”‚                            â”‚                                        â”‚
â”‚                  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                             â”‚
â”‚                  â”‚   Angular SPA       â”‚                             â”‚
â”‚                  â”‚   Core Services     â”‚                             â”‚
â”‚                  â”‚   Signal State      â”‚                             â”‚
â”‚                  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                             â”‚
â”‚                            â”‚                                        â”‚
â”‚           â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                 â”‚
â”‚           â”‚                â”‚                      â”‚                 â”‚
â”‚   â”Œâ”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”‚
â”‚   â”‚  Supabase    â”‚ â”‚ Supabase     â”‚ â”‚   Google Gemini AI   â”‚       â”‚
â”‚   â”‚  PostgreSQL  â”‚ â”‚  Auth +      â”‚ â”‚  (Function Calling)  â”‚       â”‚
â”‚   â”‚  (RLS)       â”‚ â”‚  Storage     â”‚ â”‚                      â”‚       â”‚
â”‚   â”‚              â”‚ â”‚  + Edge Fns  â”‚ â”‚                      â”‚       â”‚
â”‚   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Multi-Tenancy Strategy

The platform uses a **shared-schema, shared-database** multi-tenancy model, which means:

- All tenants' data lives in the same PostgreSQL database and tables
- Every table that holds tenant-specific data has a `tenant_id` UUID foreign key
- **Row Level Security (RLS)** policies on every table guarantee that queries automatically filter to only the requesting user's tenant
- A set of PostgreSQL helper functions (`user_tenant_ids()`, `is_tenant_owner()`, `is_superadmin()`) allow the RLS policies to be clean and consistent

This design keeps infrastructure costs low, simplifies deployments, and still provides strong data isolation.

---

## ðŸ“ Project Structure

```
src/
â””â”€â”€ app/
    â”œâ”€â”€ app.routes.ts          # Root route definitions with lazy loading
    â”œâ”€â”€ app.config.ts          # Application bootstrap configuration
    â”‚
    â”œâ”€â”€ core/                  # Application-wide infrastructure
    â”‚   â”œâ”€â”€ guards/            # Route access control
    â”‚   â”œâ”€â”€ interceptors/      # HTTP request/response pipeline
    â”‚   â”œâ”€â”€ layouts/           # Shell layout components
    â”‚   â”œâ”€â”€ models/            # TypeScript interfaces (data contracts)
    â”‚   â”œâ”€â”€ services/          # Business logic & data access (26 services)
    â”‚   â”œâ”€â”€ enums/             # Shared application enumerations
    â”‚   â””â”€â”€ types/             # Utility type definitions
    â”‚
    â”œâ”€â”€ features/              # Feature modules (each is a lazy-loaded route)
    â”‚   â”œâ”€â”€ auth/              # Login, registration, password reset
    â”‚   â”œâ”€â”€ dashboard/         # Overview metrics and quick actions
    â”‚   â”œâ”€â”€ products-catalog/  # Product & category management
    â”‚   â”œâ”€â”€ orders/            # Order list and detail views
    â”‚   â”œâ”€â”€ customers/         # Customer CRM
    â”‚   â”œâ”€â”€ coupons/           # Discount code management
    â”‚   â”œâ”€â”€ reviews/           # Product review moderation
    â”‚   â”œâ”€â”€ members/           # Team member & invitation management
    â”‚   â”œâ”€â”€ settings/          # Store configuration & branding
    â”‚   â”œâ”€â”€ subscription/      # Plan & billing management
    â”‚   â”œâ”€â”€ reports/           # Analytics and reports view
    â”‚   â”œâ”€â”€ inventory-history/ # Stock change log
    â”‚   â”œâ”€â”€ abandoned-carts/   # Abandoned session recovery
    â”‚   â”œâ”€â”€ store/             # Public-facing storefront
    â”‚   â”œâ”€â”€ store-selection/   # Store picker & invitation acceptance
    â”‚   â””â”€â”€ landing/           # Public landing page
    â”‚
    â””â”€â”€ shared/                # Reusable building blocks
        â”œâ”€â”€ components/        # Presentational components
        â”‚   â”œâ”€â”€ ai-assistant/         # Floating AI chatbot widget
        â”‚   â”œâ”€â”€ customer-auth-modal/  # Storefront login/register modal
        â”‚   â”œâ”€â”€ date-picker/          # Calendar date selector
        â”‚   â”œâ”€â”€ date-range-picker/    # Date range selector
        â”‚   â”œâ”€â”€ dropdown/             # Reusable accessible dropdown
        â”‚   â”œâ”€â”€ dynamic-table/        # Configurable data table
        â”‚   â”œâ”€â”€ not-found/            # 404 page
        â”‚   â”œâ”€â”€ order-status-badge/   # Visual order status indicator
        â”‚   â”œâ”€â”€ toast/                # Toast notification system
        â”‚   â””â”€â”€ usage-progress/       # Subscription usage bar
        â”œâ”€â”€ directives/        # Custom Angular directives
        â””â”€â”€ pipes/             # Data transformation pipes
```

---

## ðŸ§© Feature Modules

Each feature module is **lazy-loaded** â€” it is only downloaded by the browser when the user navigates to that route. This keeps the initial bundle small and app startup fast.

### ðŸ  Landing
The public marketing page, accessible without authentication. Introduces the platform and encourages registration.

### ðŸ” Authentication (`/auth`)
Handles the complete authentication flow: login, registration, and password recovery. Protected by the `guestGuard` so authenticated users are automatically redirected to the dashboard. Uses Supabase GoTrue auth under the hood.

### ðŸª Store Selection (`/select-store`)
After login, if a user belongs to multiple stores, they land here to choose which store context to work in. The selected store is persisted in `localStorage` for seamless future logins. Also hosts the **Accept Invite** page, where new members click their invitation link and join a store.

### ðŸ“Š Dashboard (`/dashboard`)
The central command center. Shows:
- Revenue summary and trend charts (ApexCharts)
- Recent orders feed
- Inventory alerts (low stock warnings)
- Quick navigation shortcuts
- Sales performance indicators

Access is limited to Owner, Admin, and Viewer roles. Delivery drivers are automatically redirected to the Orders module.

### ðŸ“¦ Products Catalog (`/products`)
Full product management interface supporting:
- **Products**: name, description, price, compare-at price, cost price, SKU, weight, dimensions, status (`draft`, `active`, `archived`, `out_of_stock`), featured flag, SEO metadata
- **Categories**: hierarchical parent-child category structure with images and SEO fields
- **Variants**: product variants (e.g., "Red / Large") with individual pricing and inventory
- **Images**: multiple image uploads per product with primary image selection
- **Tags**: flexible tagging system
- Real-time stock level display and low-stock indicators

### ðŸ“‹ Orders (`/orders`)
Complete order management:
- Filterable and sortable order list with status, date, and customer search
- Order detail view with full customer info, line items, pricing breakdown
- **Status History** â€” every status change is logged with who changed it and when
- Internal notes for staff communication
- Payment and shipping tracking info
- Customer notification suppression control

### ðŸ‘¥ Customers (`/customers`)
CRM-style customer management:
- Customer list with search and spend sorting
- Customer profile: personal info, order history, total spent
- Address management (shipping and billing addresses)
- Guest vs. authenticated customer distinction

### ðŸŽŸï¸ Coupons (`/coupons`)
Promotion engine:
- **Percentage discounts** â€” "20% off"
- **Fixed-amount discounts** â€” "$10 off"
- **Free shipping** codes
- Usage limits (total and per-customer)
- Product and category applicability targeting
- Validity period (start/end dates)
- Usage tracking dashboard

### â­ Reviews (`/reviews`)
Product review moderation queue:
- List of all reviews with status (`pending`, `approved`, `rejected`)
- Rating display (1â€“5 stars)
- Approve/reject actions
- Verified purchase badge
- Review detail with customer info and associated order

### ðŸ‘¤ Members (`/members`)
Team management for the Admin and Owner roles:
- Current member list with roles
- **Invite by email**: enter an address, assign a role, send. A Supabase Edge Function fires an invitation email with a secure token link.
- Pending invitations list
- Role update and member removal
- RBAC roles: `owner`, `admin`, `editor`, `viewer`, `delivery`

### âš™ï¸ Settings (`/settings`)
Multi-section store configuration:
- **Business Info**: store name, contact email, phone
- **Branding**: logo, favicon upload, primary/secondary/accent colors, font family, layout style
- **Address**: business physical address
- **Storefront**: drag-and-configure storefront layout sections (hero banner, product grids, etc.)
- **Tax Rates**: VAT/sales tax configuration by country and state
- **Shipping Zones & Rates**: zone definitions and flat/weight/price-based shipping rates

### ðŸ’³ Subscription (`/subscription`)
Billing and plan management:
- Current plan display (Free, Basic, Professional, Enterprise)
- Plan comparison and upgrade options
- Billing history

### ðŸ“Š Reports (`/reports`)
Analytics interface:
- Sales reports with date range filtering
- Revenue and order count charts (ApexCharts)
- Export to Excel (xlsx)

### ðŸ“‰ Inventory History (`/inventory-history`)
Chronological log of all stock changes, helping store managers understand why inventory levels changed over time.

### ðŸ›’ Abandoned Carts (`/abandoned-carts`)
Recovery tool showing sessions where shoppers added items to their cart but never completed checkout â€” a critical conversion optimization feature.

### ðŸŒ Store (Public Storefront â€” `/store`)
The customer-facing shopping experience, served under the same Angular SPA but behind a `storeGuard` that resolves the correct tenant from the subdomain or `?s=` query parameter:
- **Home page**: configurable sections (hero banner, product grids)
- **Products page**: browseable product listing with category filtering
- **Product detail**: full product info, gallery, variants, add to cart
- **Cart**: persistent cart with quantity management and coupon code application
- **Checkout**: multi-step checkout with customer auth or guest flow
- **Customer Auth Modal**: sign in/register without leaving the storefront
- **My Orders**: post-purchase order tracking for authenticated customers
- **Order Confirmation**: success page after payment

---

## âš™ï¸ Core System Layer

The `core/` directory holds the infrastructure that every feature depends on. It is eagerly loaded and available across the entire application.

### Guards

| Guard | Purpose |
|---|---|
| `authGuard` | Prevents unauthenticated users from accessing the admin panel |
| `guestGuard` | Prevents authenticated users from accessing auth pages (login/register) |
| `storeGuard` | Resolves the tenant for the public storefront via subdomain/query param |
| `roleGuard` | Verifies the user has one of the required roles for the route |
| `adminGuard` | Shorthand guard requiring `owner` or `admin` role |
| `editorGuard` | Shorthand guard requiring `owner`, `admin`, or `editor` role |
| `viewerGuard` | Allows `owner`, `admin`, `editor`, and `viewer` roles |
| `deliveryRedirectGuard` | Redirects `delivery` role users from dashboard to orders |

### Services (26 total)

| Service | Responsibility |
|---|---|
| `TenantService` | Central tenant state management â€” loading, switching, settings, branding, members, invitations |
| `AuthService` | Authentication state (login, logout, registration, session management via Supabase Auth) |
| `AiAssistantService` | AI chatbot with Gemini function-calling to query live store data |
| `ProductsService` | Product CRUD, image management, variant handling, category assignment |
| `OrdersService` | Order queries, status updates, status history, filtering |
| `CustomersService` | Customer profiles, address management, spend tracking |
| `CategoriesService` | Category tree management with parent-child hierarchy |
| `DiscountsService` | Coupon code creation, validation, usage tracking |
| `ReviewsService` | Review moderation (approve/reject), rating queries |
| `AnalyticsService` | Dashboard KPIs, revenue charts, sales summaries |
| `InventoryService` | Stock adjustment and inventory history log |
| `CartService` | Shopping cart state (localStorage-persisted) |
| `AbandonedCartService` | Detecting and listing incomplete cart sessions |
| `PaymentsService` | Payment records and refund management |
| `ShippingService` | Shipping zones and rate configuration |
| `SubscriptionService` | Plan info and billing history |
| `StorageService` | Supabase Storage file upload/delete for images |
| `FileProcessorService` | File validation and preparation before upload |
| `SeoService` | Dynamic `<title>` and `<meta>` tag management |
| `StructuredDataService` | JSON-LD schema injection for SEO |
| `PermissionsService` | Role-level permission check utilities |
| `EmailService` | Email log queries |
| `ToastService` | Application-wide notification system |
| `LoaderService` | Global loading indicator state |
| `CustomerAuthService` | Storefront-specific customer authentication |
| `Supabase` | Singleton Supabase client wrapper |

### Routing Strategy

The application uses **lazy-loaded standalone components and route modules** throughout. The root route redirects to `/dashboard` if authenticated or `/home` if not, using Angular's new functional redirect with DI injection:

```ts
{
  path: '',
  redirectTo: () => inject(AuthService).isAuthenticated() ? 'dashboard' : 'home',
}
```

All authenticated admin routes are wrapped in a `MainLayoutComponent` shell (sidebar navigation + header), while the storefront runs outside this shell for a clean shopping experience.

### Interceptors

HTTP interceptors handle cross-cutting concerns like:
- Auth token injection
- Global error handling
- Loading state management

---

## ðŸ§± Shared Components & Utilities

These components are designed to be generic and reusable across any feature module.

| Component | Description |
|---|---|
| `app-dropdown` | Accessible, style-consistent dropdown replacing native `<select>`. Emits typed `DropdownOption` values. |
| `app-dynamic-table` | Configurable data table with sortable columns, pagination, and action slots â€” used in orders, customers, products, and more |
| `app-date-picker` | Single-date calendar picker with custom styling |
| `app-date-range-picker` | Two-date range picker for report filtering |
| `app-toast` | Animated toast notification queue (success, error, warning, info) |
| `app-order-status-badge` | Color-coded pill badge that visually represents an order's current status |
| `app-usage-progress` | Horizontal progress bar showing plan limit consumption |
| `app-customer-auth-modal` | Slide-in modal for storefront login/register without page navigation |
| `app-ai-assistant` | Floating chatbot widget available throughout the admin panel |
| `app-not-found` | User-friendly 404 page with navigation link |

---

## ðŸ—„ï¸ Database Design

The database schema, defined in `main.sql`, is a fully normalized PostgreSQL schema with **30+ tables**, **9 custom ENUM types**, **comprehensive indexing**, and **Row Level Security on every table**.

### Entity Groups

#### ðŸ¢ Tenant & Membership
| Table | Description |
|---|---|
| `tenants` | Core store entity. Holds business info, branding (colors, logo), subscription plan, and JSONB settings for storefront layout |
| `tenant_members` | Links users to tenants with a role assignment. Supports multi-store membership. |
| `subscription_history` | Complete history of all plan changes and billing events per tenant |

#### ðŸ“¦ Product Catalog
| Table | Description |
|---|---|
| `products` | Core product: name, slug, pricing (sale vs. compare-at vs. cost), inventory, weight, SEO, status lifecycle |
| `categories` | Hierarchical categories via self-referencing `parent_id`. Includes SEO fields. |
| `product_categories` | Many-to-many join between products and categories |
| `product_variants` | Variant records (e.g., "Blue / XL") with individual SKU, price, and stock |
| `product_images` | Multiple images per product with primary/secondary designation and alt text |
| `product_tags` | Flexible tagging, unique per tenant |
| `product_tag_associations` | Many-to-many join between products and tags |

#### ðŸ›’ Orders & Payments
| Table | Description |
|---|---|
| `customers` | Buyer profiles, supporting both authenticated users and guests. Tracks `total_orders` and `total_spent`. |
| `customer_addresses` | Saved addresses per customer (shipping/billing defaults) |
| `orders` | Full order record with **address and product snapshots** â€” data is copied at order time so historical accuracy is preserved even if the customer or product changes later |
| `order_items` | Line items with quantity, pricing, discount, and a `product_snapshot` JSONB for full fidelity |
| `order_status_history` | Every status transition is recorded with timestamp, actor, and optional note |
| `payments` | Payment transaction records linked to payment gateway responses |
| `refunds` | Refund records with authorization tracking |

#### ðŸŽŸï¸ Discounts
| Table | Description |
|---|---|
| `discount_codes` | Configurable coupon codes. Supports percentage, fixed, and free-shipping types with product/category targeting |
| `discount_usage` | Audit log of every time a coupon was applied, by whom, and how much was discounted |

#### â­ Reviews
| Table | Description |
|---|---|
| `product_reviews` | Customer reviews with 1-5 star rating, moderation status, and verified-purchase flag |

#### ðŸ“Š Analytics
| Table | Description |
|---|---|
| `analytics_events` | Raw event stream: page views, product views, add-to-cart events with session context |
| `daily_sales_summary` | Pre-aggregated daily sales figures for fast dashboard queries without scanning raw orders |
| `product_performance` | Aggregated views, cart adds, purchases, and revenue per product per period |

#### ðŸ—ƒï¸ Media & Integrations
| Table | Description |
|---|---|
| `media_library` | Centralized file store with folder organization, tag arrays, and usage tracking |
| `email_templates` | Per-tenant customizable transactional email templates with HTML/text bodies and variable documentation |
| `email_logs` | History of all sent emails with delivery status |
| `webhook_endpoints` | Configurable outbound webhook URLs with HMAC secret signing |
| `webhook_deliveries` | Delivery attempt logs with retry logic |
| `audit_logs` | Comprehensive audit trail: who did what, to which resource, when â€” with before/after values |

#### ðŸšš Shipping & Tax
| Table | Description |
|---|---|
| `shipping_zones` | Geographic zones defined by countries, states, or postal codes |
| `shipping_rates` | Rates per zone â€” flat, weight-based, or order-value-based |
| `tax_rates` | VAT/sales tax rates per country/state |

#### âš™ï¸ Settings
| Table | Description |
|---|---|
| `tenant_settings` | Key-value store for arbitrary tenant settings (typed JSONB values) |

### Custom ENUM Types

| Enum | Values |
|---|---|
| `subscription_plan` | `free`, `basic`, `professional`, `enterprise` |
| `subscription_status` | `active`, `cancelled`, `suspended`, `expired`, `trial` |
| `tenant_status` | `active`, `suspended`, `pending`, `cancelled` |
| `order_status` | `pending`, `processing`, `paid`, `shipped`, `delivered`, `cancelled`, `refunded` |
| `payment_status` | `pending`, `completed`, `failed`, `refunded`, `partially_refunded` |
| `payment_method` | `credit_card`, `debit_card`, `paypal`, `stripe`, `bank_transfer`, `cash_on_delivery` |
| `product_status` | `draft`, `active`, `archived`, `out_of_stock` |
| `discount_type` | `percentage`, `fixed_amount`, `free_shipping` |
| `audit_action` | `create`, `update`, `delete`, `login`, `logout`, `payment`, `refund`, `status_change` |

### Indexing Strategy

The schema is heavily indexed for common query patterns:
- **Composite indexes** on `(tenant_id, status, created_at DESC)` for the most frequent filtered-and-sorted queries (orders, products)
- **GIN indexes** on JSONB and array columns (`product_variants.options`, `discount_codes.applies_to_products`)
- **Full-text search (GIN)** on `products.name` and `products.description` using `tsvector`
- **Partial indexes** for common filtered queries (`WHERE is_active = true`, `WHERE deleted_at IS NOT NULL`)

---

## ðŸ” Security & Multi-Tenancy

### Row Level Security (RLS)

**Every table has RLS enabled** and enforces data isolation through PostgreSQL security policies. The policies cover:

- `SELECT`, `INSERT`, `UPDATE`, `DELETE` are each explicitly controlled
- **Superadmins** have a separate bypass role via `is_superadmin()` function
- **Public access** policies are granted only where needed (e.g., active products and tenants for the storefront public views)

Key RLS helper functions:

```sql
-- Returns all tenant IDs the current user belongs to
user_tenant_ids() â†’ UUID[]

-- Checks if the current user owns a specific tenant
is_tenant_owner(check_tenant_id UUID) â†’ BOOLEAN

-- Checks if the current user is a platform superadmin
is_superadmin() â†’ BOOLEAN

-- Returns the current user's role within a specific tenant
user_tenant_role(check_tenant_id UUID) â†’ TEXT
```

### Role-Based Access Control (RBAC)

The Angular application enforces route-level RBAC via guards, and service-level checks via `PermissionsService`. Roles in descending privilege:

| Role | Capabilities |
|---|---|
| `owner` | Full control, can delete store, manage billing |
| `admin` | Manage members, settings, all content |
| `editor` | Manage products, orders, coupons, customers |
| `viewer` | Read-only access to dashboard and reports |
| `delivery` | Redirected directly to orders view |

### Authentication & Invitation Flow

1. User registers or logs in via Supabase Auth (JWT-based sessions)
2. On login, `AuthService` reads the session from Supabase
3. `TenantService` loads all stores the user belongs to
4. If a user follows an invitation link, the `AcceptInviteComponent` validates the token, creates the `tenant_members` record, and activates the membership
5. Invitation emails are sent via a **Supabase Edge Function** (`send-invitation-email`) that receives the invitation data via POST and sends a branded email

### Soft Deletion

Tenants, products, and other key entities implement **soft deletion** using a `deleted_at` timestamp column. Deleted records are excluded from all queries but preserved for audit and data recovery purposes.

---

## ðŸ¤– AI Assistant Integration

One of the platform's standout features is an embedded AI assistant powered by **Google Gemini (`gemini-3-flash-preview`)** with **function calling** â€” the model doesn't just generate text, it can invoke tools that query the real store database.

### Architecture

The `AiAssistantService` sets up a Gemini model with a set of declared tools. When a user sends a message:

1. The message is sent to Gemini along with the conversation history
2. Gemini may decide to call one or more tools before answering
3. The Angular service intercepts the tool calls, executes the appropriate Supabase queries, and sends the results back to Gemini
4. Gemini generates a final natural-language response based on the actual data

This loop can repeat (multi-turn tool calling) until Gemini has all the information it needs.

### Available Tools

| Tool | What it does |
|---|---|
| `get_sales_stats` | Total revenue for a date range (optionally by category) |
| `get_orders` | Recent orders filtered by status, customer name, or date |
| `get_order_details` | Full details of a specific order by order number |
| `get_products` | Product list with stock/price info, supports low-stock filter |
| `get_sales_metrics` | Aggregated metrics for periods: today, yesterday, this week, this month |
| `get_inventory_alerts` | Products at or below their low-stock threshold |
| `get_product_performance` | Top sellers by units and revenue |
| `analyze_customer_segment` | Query customers by segment (VIP, Loyal, New, etc.) |
| `get_active_promotions` | List of currently active discount codes |
| `get_recent_audit_logs` | Recent important changes on the platform |
| `get_app_guide` | Answers "how do I..." questions using a built-in knowledge base |
| `navigate_to` | Actually navigates the user's browser to a section of the app |

### Persistence

Chat history is saved in `localStorage` with a 24-hour expiration â€” so conversations persist across page reloads but are automatically reset the next day.

---

## ðŸŒ Storefront Engine

The public storefront is served as part of the same Angular SPA but is entirely separate from the admin panel in terms of routing, guards, and components.

### Tenant Resolution

The `storeGuard` resolves which tenant's storefront to show using this priority:

1. **Subdomain detection**: In production, `{tenant-subdomain}.venti.com` is detected from `window.location.hostname`
2. **Query parameter fallback**: In local development (`localhost`), the subdomain is passed as `?s={subdomain}`

`TenantService.resolveTenantBySubdomain()` fetches the matching tenant from the `tenants` table and sets it in global state.

### Dynamic Storefront Layout

Each tenant can configure their storefront layout via the Settings panel. The layout is stored as a JSONB object within the `tenants.settings` column under the key `storefront_layout`. The structure supports:

- **Sections**: Hero banners, product grids, featured collections (each with an `isActive` flag)
- **Navigation**: Configurable nav links

The `TenantService.storefrontLayout` computed signal provides a strongly-typed `StorefrontLayout` object with sensible defaults if no layout has been configured yet.

### Customer Authentication

Storefront customers can create accounts and log in without leaving the shopping experience, via the `customer-auth-modal` shared component. This is separate from the merchant/staff authentication flow â€” storefront customers are regular `auth.users` entries in Supabase but are associated with customer records in the `customers` table.

---

## âš™ï¸ Configuration

### Supabase Storage Buckets

Create a public storage bucket named `products` (or match the name in your environment config) for product images and branding assets.

### Supabase Edge Functions

For the invitation email system, deploy the `send-invitation-email` Edge Function to your Supabase project. The function expects a POST body with:

```json
{
  "to_email": "invitee@example.com",
  "store_name": "My Store",
  "invited_by_email": "admin@mystore.com",
  "role": "editor",
  "invite_link": "https://yourapp.com/accept-invite?token=...",
  "user_exists": false,
  "tenant_id": "uuid"
}
```

### Path Aliases

The project uses TypeScript path aliases configured in `tsconfig.json` for clean imports:

| Alias | Resolves to |
|---|---|
| `@core/*` | `src/app/core/*` |
| `@features/*` | `src/app/features/*` |
| `@shared/*` | `src/app/shared/*` |
| `@env/*` | `src/environments/*` |

---

## 🗺️ Roadmap

Puedes ver el plan detallado de desarrollo, las próximas funcionalidades y las fases del proyecto en nuestro archivo dedicado:

👉 **[Ver ROADMAP.md](ROADMAP.md)**

---

## ï¿½ðŸ“ ## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with â¤ï¸**

</div>
