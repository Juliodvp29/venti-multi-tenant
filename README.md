<div align="center">

<br />

# 🛍️ Venti Shop — Multi-Tenant SaaS eCommerce Platform

**Una plataforma SaaS de comercio electrónico multi-inquilino de alto rendimiento, moderna y completa, diseñada para comerciantes que requieren flexibilidad visual, control en tiempo real, SEO optimizado mediante Server-Side Rendering (SSR) e inteligencia artificial integrada.**

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![Angular SSR](https://img.shields.io/badge/Angular_SSR-Zoneless-FF2D55?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/guide/ssr)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS_&_Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-Tool_Calling_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Vitest](https://img.shields.io/badge/Vitest-Unit_Testing-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
[![CI/CD](https://img.shields.io/badge/GitHub_Actions-CI_Pipeline-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com)

</div>

---

## 📖 Tabla de Contenidos

1. [¿Qué es Venti Shop?](#-qué-es-venti-shop)
2. [Características Principales y Aspectos Destacados](#-características-principales-y-aspectos-destacados)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Arquitectura del Sistema & Flujos Técnicos](#️-arquitectura-del-sistema--flujos-técnicos)
   - [Diagrama de Arquitectura](#diagrama-de-arquitectura)
   - [Estrategia de Renderizado Híbrido (SSR + CSR + Event Replay)](#estrategia-de-renderizado-híbrido-ssr--csr--event-replay)
   - [Pipeline de Resolución Multi-Inquilino (Multi-Tenant Resolution)](#pipeline-de-resolución-multi-inquilino-multi-tenant-resolution)
   - [Aislamiento de Datos & Row Level Security (RLS)](#aislamiento-de-datos--row-level-security-rls)
   - [Motor de Sincronización en Vivo del Storefront (`PreviewSyncService`)](#motor-de-sincronización-en-vivo-del-storefront-previewsyncservice)
5. [Estructura del Proyecto](#-estructura-del-proyecto)
6. [Módulos del Panel Administrativo (Guía por Vistas)](#-módulos-del-panel-administrativo-guía-por-vistas)
7. [Módulos del Storefront Público & Experiencia de Compra](#-módulos-del-storefront-público--experiencia-de-compra)
8. [Herramientas del Header: Soporte, Notificaciones e IA](#-herramientas-del-header-soporte-notificaciones-e-ia)
9. [Capa Core del Sistema (Servicios, Guards e Interceptores)](#️-capa-core-del-sistema-servicios-guards-e-interceptores)
10. [Componentes Compartidos Reutilizables](#-componentes-compartidos-reutilizables)
11. [Modelo de Base de Datos y Seguridad](#️-modelo-de-base-de-datos-y-seguridad)
12. [DevOps, Pruebas y Calidad de Código](#-devops-pruebas-y-calidad-de-código)
13. [Guía de Instalación y Ejecución](#-guía-de-instalación-y-ejecución)
14. [Configuración de Servicios Externos](#️-configuración-de-servicios-externos)
15. [Roadmap](#-roadmap)
16. [Licencia](#-licencia)

---

## 🎯 ¿Qué es Venti Shop?

**Venti Shop** es una plataforma SaaS (Software as a Service) de comercio electrónico concebida desde sus cimientos bajo un modelo **multi-inquilino (multi-tenant)** de alta eficiencia. Permite a una única instancia desplegada servir a cientos de tiendas independientes de forma simultánea, garantizando estricta segregación de datos, personalización visual completa, cálculo automático de comisiones y tiendas públicas optimizadas para motores de búsqueda y redes sociales.

La plataforma opera bajo un modelo dual:

1. **Panel de Gestión para Comerciantes (B2B SaaS Admin)**: Una interfaz moderna, reactiva (Zoneless + Signals) y con soporte nativo de modos Claro/Oscuro. Permite a dueños y colaboradores gestionar catálogo, inventario con auditoría histórica, procesamiento de órdenes, carritos abandonados, liquidación de comisiones, cupones de descuento, miembros de equipo con roles granulares y un diseñador visual de tienda con simulador interactivo de dispositivos.
2. **Storefront Público de Alto Rendimiento (B2C eCommerce)**: Tiendas públicas renderizadas en el servidor (**Server-Side Rendering con Angular 22 y Express**), lo que asegura tiempos de carga instantáneos (FCP), hidratación con repetición de eventos (_Event Replay_), metaetiquetas OpenGraph/Twitter Cards dinámicas para previsualizaciones sociales y marcado estructurado Schema.org (JSON-LD) para indexación SEO superior.

---

## ✨ Características Principales y Aspectos Destacados

### 🏢 Para Comerciantes y Administradores de Tienda

- 📊 **Dashboard Ejecutivo en Tiempo Real**: Métricas financieras consolidadas (ingresos, pedidos, ticket promedio, clientes nuevos), gráficos dinámicos con ApexCharts (tendencias diarias/mensuales y distribución por categorías), listado de productos más vendidos y alertas de stock crítico.
- 🛒 **Catálogo de Productos & Matriz de Variantes**: Creación exhaustiva de productos con control de SKU, código de barras, precios comparativos, costo unitario, control de inventario por variante (talla, color, material, etc.), árbol de categorías jerárquicas y optimización SEO.
- 📜 **Auditoría y Trazabilidad de Stock (`/inventory-history`)**: Historial inmutable de cada entrada, salida, venta, devolución o ajuste manual de inventario, con motivos y referencia al pedido asociado.
- 📦 **Gestión del Ciclo de Vida de Pedidos (`/orders`)**: Pipeline de estados (_Pendiente, Procesando, Pagado, Enviado, Entregado, Cancelado, Reembolsado_), timeline cronológico de auditoría, notas internas de equipo y snapshots JSON inmutables de productos y direcciones del cliente al momento de la compra.
- 👥 **CRM de Clientes (`/customers`)**: Fichas de compradores con historial completo de pedidos, valor total gastado (LTV), libreta de direcciones múltiples y estado de consentimientos de marketing.
- 🎟️ **Motor de Cupones y Promociones (`/coupons`)**: Descuentos porcentuales, montos fijos o envío gratuito, con restricciones de compra mínima, límites de usos globales y por cliente, vigencia temporal y asignación a productos o categorías específicas.
- 🛒 **Recuperación de Carritos Abandonados (`/abandoned-carts`)**: Monitorización de sesiones de compra incompletas, cálculo de tasas de abandono, desglose de ítems y métricas de recuperación.
- 💰 **Motor de Comisiones y Liquidaciones (`/commissions`)**: Reglas de comisión por pasarela y plan de suscripción, libro mayor (_ledger_) de comisiones generadas en tiempo real y conciliación de estados (_Pendiente, Pagado_).
- ⭐ **Moderación de Reseñas de Producto (`/reviews`)**: Aprobación, rechazo y eliminación de comentarios y calificaciones, con distintivo de compra verificada.
- 👥 **Gestión de Equipo, Auditoría & Control de Acceso Granular (`/members`)**: Invitaciones por correo electrónico con tokens de seguridad, roles estrictos y una vista de actividad reciente del equipo para seguimiento enterprise.
- 📊 **Reportes Financieros y Exportación Multiformato (`/reports`)**: Análisis de ventas por periodos personalizables con exportación instantánea a `.xlsx` y PDF profesional con branding de la tienda, métricas, tablas estilizadas y paginación.
- 💳 **Suscripciones y Cuotas del Tenant (`/subscription`)**: Monitoreo visual del plan contratado, límites de almacenamiento y productos mediante barras de progreso interactivas.
- 🎨 **Suite de Personalización de Tienda (`/settings`)**:
  - **General & Ubicación**: Nombre legal, moneda de operación predeterminada y zona horaria.
  - **Dirección Física**: Ubicación física del centro de despacho para el cálculo de fletes.
  - **Branding & Identidad**: Logotipos, favicons, banners, tipografías y paletas de color con variables CSS dinámicas.
  - **Presets de Diseño**: Aplicación inmediata de identidades preconfiguradas con un solo clic.
  - **Constructor de Secciones (Storefront Builder)**: Activación, reordenamiento y configuración de bloques modulares (Hero, Productos Destacados, Categorías, Banners, Testimonios, Newsletter, FAQ).
  - **Envíos e Impuestos**: Zonas de envío geográficas (integradas con la API de departamentos y municipios de Colombia), tarifas fijas o por peso y tasas de impuestos.
  - **Pasarelas de Pago**: Activación y parametrización de métodos de pago (Tarjetas, Transferencia, Contra entrega, Wompi multi-tenant).
  - **Simulador de Tienda en Vivo (`/preview`)**: Previsualización sincronizada en tiempo real con alternador de vista Responsive (Escritorio, Tablet, Móvil).

### 🛍️ Para Compradores en el Storefront Público

- ⚡ **Carga Ultrarrápida con SSR**: Páginas principales y fichas de producto generadas en el servidor, eliminando pantallas blancas y ofreciendo una experiencia instantánea.
- 🔍 **Navegación y Catálogo Filtrable (`/store/productos`)**: Filtros en vivo por categorías, rangos de precio, ordenamiento y buscador reactivo.
- 🏷️ **Ficha de Producto Avanzada (`/store/product/:id`)**: Galería interactiva de imágenes, selector reactivo de variantes con actualización automática de precio y disponibilidad de stock, reseñas verificadas y productos relacionados.
- 🛍️ **Carrito de Compras Dual**: Drawer lateral flotante para adición rápida y vista completa de carrito (`/store/carrito`) con validación de cupones en tiempo real.
- 💳 **Checkout Optimizado (`/store/checkout`)**: Proceso fluido de finalización de compra con autocompletado geográfico (Departamentos y Municipios), selección de método de envío según la zona, cálculo dinámico de impuestos y múltiples formas de pago.
- 🎉 **Confirmación y Seguimiento (`/store/success`)**: Pantalla de éxito con código de seguimiento, detalle de los artículos y resumen descargable.
- 👤 **Portal del Cliente (`/store/account`)**: Gestión autónoma de libreta de direcciones de envío y consulta de compras.

### 🌐 A Nivel de Plataforma y Arquitectura

- 🏢 **Aislamiento Estricto Multi-Tenant**: Políticas de PostgreSQL Row Level Security (RLS) aplicadas por `tenant_id` en todas las transacciones.
- 🌐 **Enrutamiento Flexible de Tiendas**: Soporte para subdominios (`mitienda.venti.com`), dominios personalizados (`mitienda.com`) validados mediante Supabase Edge Functions y DNS, y fallback por parámetro (`?s=slug`).
- 🤖 **Asistente de IA Gemini con Function Calling**: Copiloto conversacional integrado en el panel capaz de ejecutar herramientas para consultar métricas, órdenes e inventario en tiempo real.
- 🔔 **Notificaciones Push y WebSocket en Vivo**: Canal de Supabase Realtime para recibir alertas instantáneas de nuevas compras, inventario agotado o reseñas recibidas.
- ❓ **Centro de Soporte Integrado (Help Drawer)**: Diagnóstico automatizado de salud de la tienda y sistema de tickets con subida de adjuntos a Supabase Storage.
- 🚀 **Arquitectura 100% Zoneless**: Eliminación de `zone.js` en favor del planificador nativo de Angular y Signals para un rendimiento óptimo de memoria y CPU.

---

## 🛠 Stack Tecnológico

| Capa                         | Tecnología / Paquete               | Versión     | Propósito en la Plataforma                                                        |
| :--------------------------- | :--------------------------------- | :---------- | :-------------------------------------------------------------------------------- |
| **Frontend Framework**       | Angular Standalone                 | 22.x        | Componentes independientes, Signals, `@if`/`@for`, nuevas APIs de Control Flow    |
| **Server-Side Rendering**    | `@angular/ssr` + Express           | 22.x / 5.x  | Servidor Node.js para renderizado SSR en rutas públicas y motor de hidratación    |
| **Lenguaje de Programación** | TypeScript                         | 6.x         | Tipado estricto, interfaces de dominio y verificación estática avanzada           |
| **Diseño y Estilos**         | Tailwind CSS + PostCSS             | 4.x         | Motor CSS moderno basado en utilidades, temas dinámicos y modo oscuro             |
| **Backend as a Service**     | Supabase (`@supabase/supabase-js`) | 2.x         | Base de datos PostgreSQL, Auth (GoTrue), Storage de archivos y canales Realtime   |
| **Edge Compute**             | Supabase Edge Functions (Deno)     | -           | Verificación DNS/HTTPS de dominios personalizados y lógica serverless             |
| **Inteligencia Artificial**  | `@google/generative-ai` (Gemini)   | 0.24.x      | Agente de IA con capacidades de invocación de herramientas (Function Calling)     |
| **Visualización de Datos**   | ApexCharts + `ng-apexcharts`       | 5.x / 2.x   | Gráficas interactivas de ventas, ingresos y distribución de categorías            |
| **Formateo Markdown & XSS**  | `marked` + `dompurify`             | 17.x / 3.x  | Renderizado y sanitización estricta de respuestas del asistente de IA y notas     |
| **Exportación de Datos**     | `xlsx` (SheetJS), `jspdf`, `jspdf-autotable` | 0.18.x / 4.x / 5.x | Generación y descarga de informes en Excel, CSV y PDF con tablas, branding y paginación |
| **Testing Unitario**         | Vitest + JSDOM                     | 4.x / 27.x  | Suite de pruebas unitarias ultrarrápidas para servicios y componentes             |
| **Calidad de Código**        | ESLint + Angular-ESLint            | 10.x / 22.x | Linter con configuración plana (_Flat Config_) y reglas para Signals y TypeScript |
| **Formateo de Código**       | Prettier                           | 3.x         | Formato uniforme en TypeScript, HTML de Angular y archivos de configuración       |
| **CI / CD**                  | GitHub Actions                     | -           | Pipeline automatizado de linting, testing unitario y compilación de producción    |

---

## 🏛️ Arquitectura del Sistema & Flujos Técnicos

### Diagrama de Arquitectura

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     VENTI SHOP PLATFORM                                          │
│                                                                                                  │
│   PÚBLICO / STOREFRONT & SEO (SSR)                           ADMIN PANEL (CSR / SPA)             │
│   • /home (Landing)                                          • /dashboard      • /orders         │
│   • /store (Catálogo, Producto, Checkout)                    • /products       • /commissions    │
│   • Hidratación con Event Replay                             • /customers      • /settings       │
│                                                              • /coupons        • /reports        │
│   RenderMode.Server (Express Node Engine)                    RenderMode.Client (SPA Auth)        │
│                  │                                                          │                    │
│                  └──────────────────────────┬───────────────────────────────┘                    │
│                                             │                                                    │
│                                  ┌──────────▼──────────┐                                         │
│                                  │    Angular 22 Core  │                                         │
│                                  │  • Zoneless Engine  │                                         │
│                                  │  • Angular Signals  │                                         │
│                                  │  • 32 Core Services │                                         │
│                                  └──────────┬──────────┘                                         │
│                                             │                                                    │
│                  ┌──────────────────────────┼──────────────────────────┐                         │
│                  │                          │                          │                         │
│          ┌───────▼────────┐         ┌───────▼────────┐         ┌───────▼────────┐                │
│          │  Supabase DB   │         │ Supabase Auth  │         │  Google Gemini │                │
│          │ PostgreSQL RLS │         │ Storage & RT   │         │ AI Copilot Fns │                │
│          └───────┬────────┘         └───────┬────────┘         └────────────────┘                │
│                  │                          │                                                    │
│                  └──────────┬───────────────┘                                                    │
│                             │                                                                    │
│                     ┌───────▼────────┐                                                           │
│                     │ Edge Functions │  (Deno: DNS / HTTPS verify-domain)                        │
│                     └────────────────┘                                                           │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Estrategia de Renderizado Híbrido (SSR + CSR + Event Replay)

Venti Shop implementa un esquema de renderizado híbrido de última generación configurado en `src/app/app.routes.server.ts`:

- **RenderMode.Server (SSR)**:
  - Aplicado a las rutas públicas: `/store/**`, `/store/product/:id` y `/home`.
  - El servidor Express (`src/server.ts`) renderiza en tiempo real el árbol DOM completo con los datos del tenant y del producto obtenidos desde Supabase.
  - `SeoService` inyecta las etiquetas `<title>`, `<meta name="description">`, `og:title`, `og:image`, `og:price:amount` y `twitter:card`.
  - `StructuredDataService` inserta esquemas `schema.org/Product` y `schema.org/Store` en JSON-LD.
  - Al llegar al navegador del cliente, la aplicación se hidrata utilizando `provideClientHydration(withEventReplay())`, evitando saltos visuales (_layout shifts_) y registrando cualquier clic o interacción ocurrida antes de la activación del JavaScript.
- **RenderMode.Client (CSR)**:
  - Aplicado al panel de administración (`/dashboard`, `/settings`, `/orders`, etc.) y flujos de autenticación.
  - Al requerir autenticación GoTrue, almacenamiento en sesión, suscripciones Realtime y paneles con gráficas pesadas (ApexCharts), estas rutas se sirven puramente como Single Page Application (SPA), optimizando el consumo de CPU del servidor.

### Pipeline de Resolución Multi-Inquilino (Multi-Tenant Resolution)

La identificación del tenant se orquesta de forma transparente tanto en SSR (a través de los encabezados HTTP y `DOCUMENT`) como en el cliente mediante el `storeGuard` y `TenantService`:

1. **Parámetro de Consulta (`?s=slug-de-tienda`)**: Prioridad inicial utilizada en previsualizaciones de administración, pruebas de desarrollo y entornos de integración continua.
2. **Entorno Local**: Detección automática de `localhost` o `127.0.0.1`, resolviendo automáticamente una tienda semilla por defecto (`jd-store`) para agilizar el desarrollo.
3. **Dominio Personalizado (`mitienda.com`)**: Si el hostname no pertenece a la plataforma base, se consulta la tabla `tenants` filtrando por `custom_domain`.
   - La validez del dominio se asegura mediante la Supabase Edge Function `verify-domain`, que comprueba registros DNS de tipo CNAME y la disponibilidad HTTPS.
4. **Subdominio de Plataforma (`slug.venti.com`)**: Se extrae el primer segmento del host y se resuelve contra `tenants.slug`.

### Aislamiento de Datos & Row Level Security (RLS)

- Cada tabla dependiente (`products`, `orders`, `customers`, `coupons`, `commissions`, `product_reviews`, etc.) contiene una columna `tenant_id NOT NULL REFERENCES tenants(id)`.
- En Supabase, las políticas de Row Level Security (RLS) evalúan que el `auth.uid()` actual pertenezca a `tenant_members` con los roles adecuados para operaciones administrativas, o permitan lectura pública restringida para el storefront únicamente sobre productos y categorías marcados como activos (`status = 'published'`).
- Las transacciones de órdenes congelan en campos `JSONB` (`order_items`, `shipping_address`, `customer_info`) el estado exacto de los productos y precios al momento de la venta, previniendo alteraciones históricas si el catálogo cambia en el futuro.

### Motor de Sincronización en Vivo del Storefront (`PreviewSyncService`)

Para proporcionar una experiencia WYSIWYG de alto nivel:

- El editor de temas y secciones (`/settings`) se comunica de forma bidireccional con el frame de previsualización (`/preview`) a través de un canal reactivo basado en Angular Signals y `window.postMessage`.
- Cualquier modificación en la paleta de colores, tipografía, radio de botones o visibilidad de secciones se refleja inmediatamente en el simulador sin necesidad de guardar en la base de datos ni recargar la página.

---

## 📁 Estructura del Proyecto

```
venti-multi-tenant/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Pipeline automatizado de GitHub Actions (Lint, Test, Build)
├── scripts/
│   └── set-env.js                 # Generación dinámica de entornos a partir de variables de sistema
├── src/
│   ├── main.server.ts             # Punto de entrada para el entorno del servidor SSR
│   ├── main.ts                    # Punto de entrada para el navegador cliente
│   ├── server.ts                  # Servidor Express Node.js para Angular SSR
│   │
│   ├── app/
│   │   ├── app.config.server.ts   # Configuración de proveedores específicos para SSR
│   │   ├── app.config.ts          # Proveedores globales (Zoneless, Hydration, Interceptores, Router)
│   │   ├── app.routes.server.ts   # Modos de renderizado por ruta (RenderMode.Server vs RenderMode.Client)
│   │   ├── app.routes.ts          # Definición de rutas del sistema, guards y lazy loading
│   │   │
│   │   ├── core/                  # Capa de infraestructura y lógica transversal
│   │   │   ├── enums/             # Roles (TenantRole), Estados (OrderStatus), Métodos de pago, etc.
│   │   │   ├── guards/            # authGuard, guestGuard, storeGuard, roleGuard
│   │   │   ├── interceptors/      # authInterceptor, loaderInterceptor, errorInterceptor
│   │   │   ├── layouts/           # Shells de navegación (MainLayout con Sidebar y Header)
│   │   │   ├── models/            # 18 modelos TypeScript fuertemente tipados
│   │   │   ├── services/          # 34 servicios de negocio y acceso a datos
│   │   │   └── types/             # Utilidades de tipos (Nullable, etc.)
│   │   │
│   │   ├── features/              # Módulos de funcionalidad (Lazy Loaded)
│   │   │   ├── abandoned-carts/   # Monitoreo y métricas de carritos abandonados
│   │   │   ├── auth/              # Login, registro, recuperación de contraseña y compra
│   │   │   ├── commissions/       # Motor de comisiones, reglas por pasarela y liquidaciones
│   │   │   ├── coupons/           # Gestión de cupones de descuento y tarjetas de regalo
│   │   │   ├── customers/         # CRM de compradores y libreta de direcciones
│   │   │   ├── dashboard/         # Métricas KPI y gráficas interactivas con ApexCharts
│   │   │   ├── inventory-history/ # Auditoría histórica de entradas y salidas de stock
│   │   │   ├── landing/           # Landing page institucional del SaaS Venti
│   │   │   ├── members/           # Invitaciones de equipo y control de acceso RBAC
│   │   │   ├── orders/            # Procesamiento de órdenes, trazabilidad y notas
│   │   │   ├── products-catalog/  # Catálogo, variantes, jerarquía de categorías y subida de fotos
│   │   │   ├── reports/           # Informes analíticos y exportación a Excel/PDF
│   │   │   ├── reviews/           # Moderación de valoraciones y reseñas de clientes
│   │   │   ├── settings/          # Configuración de tienda, branding, temas, envíos y simulador
│   │   │   ├── store/             # Storefront público B2C (Home modular, Catálogo, Checkout)
│   │   │   ├── store-selection/   # Selector multi-tienda y aceptación de invitaciones
│   │   │   └── subscription/      # Planes SaaS, cuotas de recursos y facturación
│   │   │
│   │   └── shared/                # Componentes y utilidades compartidas
│   │       ├── components/        # 13 widgets reutilizables (AI, Help Drawer, Notificaciones, etc.)
│   │       ├── directives/        # Directiva de permisos estructural `hasRole`
│   │       └── pipes/             # Pipe de renderizado seguro de Markdown
│   │
│   └── environments/              # Variables de entorno para desarrollo y producción
│
├── supabase/
│   └── functions/
│       └── verify-domain/         # Edge Function en Deno para verificación DNS y HTTPS
│
├── eslint.config.js               # Configuración moderna de linter (ESLint Flat Config)
├── vitest.config.ts               # Configuración del motor de pruebas Vitest
└── package.json                   # Dependencias y scripts de ejecución
```

---

## 🧩 Módulos del Panel Administrativo (Guía por Vistas)

### 1. Panel de Control Principal (`/dashboard`)

- **Tarjetas de Métricas Clave (KPIs)**: Visualización en tiempo real de ingresos totales, volumen de pedidos, ticket medio y compradores activos con comparativa porcentual frente al periodo anterior.
- **Gráficas Interactivas con ApexCharts**:
  - _Tendencia de Ventas_: Ingresos temporales filtrables por día, semana o mes.
  - _Ventas por Categoría_: Gráfico de dona con distribución porcentual de facturación por línea de productos.
- **Productos Más Vendidos & Transacciones Recientes**: Acceso rápido a las órdenes más recientes con indicación de estado y acceso al desglose de artículos.

### 2. Catálogo de Productos y Categorías (`/products`)

- **Gestión Exhaustiva de Productos**: Creación y edición con título, descripción enriquecida, SKU, código de barras, precio de venta, precio de comparación, costo unitario y estado (_Publicado, Borrador, Archivado_).
- **Matriz de Variantes**: Generación dinámica de combinaciones por atributos (ej. Talla, Color), asignando stock individual, SKU único y sobreprecio.
- **Árbol Jerárquico de Categorías**: Categorías padre e hijas con slugs amigables para optimización SEO.
- **Cargador Multimedia Integrado**: Subida directa de múltiples imágenes con reordenamiento arrastrable (_drag-and-drop_) y selección de portada conectada a Supabase Storage.

### 3. Historial y Auditoría de Inventario (`/inventory-history`)

- **Trazabilidad Completa**: Registro cronológico de todas las fluctuaciones de stock de la tienda.
- **Diferenciación de Movimientos**: Clasificación por tipo de evento: Venta en tienda, Devolución de cliente, Reabastecimiento de proveedor, Ajuste por merma o Ajuste manual.

### 4. Gestión de Órdenes y Cumplimiento (`/orders`)

- **Listado y Filtros Avanzados**: Filtrado por estado de orden, estado de pago, cliente, rango de fechas y buscador de número de pedido.
- **Detalle de la Orden**: Visualización del snapshot inmutable de los productos comprados, dirección de despacho, método de envío y cálculo de impuestos aplicados.
- **Historial de Estados y Notas Internas**: Registro con fecha y usuario de cada cambio de fase (_Pendiente -> En preparación -> Enviado -> Entregado_) y área de notas confidenciales para el equipo de despacho.

### 5. CRM de Clientes (`/customers`)

- **Directorio de Compradores**: Búsqueda instantánea por nombre, correo electrónico o teléfono.
- **Detalle del Cliente**: Métricas agregadas de compras (cantidad de pedidos realizados, dinero total gastado), historial completo de compras y libreta de direcciones guardadas.

### 6. Cupones y Promociones (`/coupons`)

- **Reglas de Descuento**: Creación de códigos alfanuméricos con descuento porcentual, rebaja de monto fijo o exoneración de costos de envío.
- **Condiciones de Aplicación**: Requisito de monto mínimo en carrito, cupo máximo de redenciones totales y restricción a un uso por cliente.

### 7. Carritos Abandonados (`/abandoned-carts`)

- **Detección de Sesiones Incompletas**: Identificación automática de carritos que no completaron el pago tras un umbral de tiempo determinado.
- **Analítica de Recuperación**: Visualización de los artículos retenidos, monto potencial de venta y datos de contacto para acciones de remarketing.

### 8. Informes y Exportación Financiera (`/reports`)

- **Filtros Temporales Precisos**: Selector de rangos de fecha mediante el componente interactivo `app-date-range-picker`.
- **Exportación Multiformato**: Generación directa de archivos `.xlsx`, `.csv` y PDF con los datos filtrados y ordenados de las tablas.
- **Reportes PDF Profesionales**: Documentos con nombre y logo del tenant, colores de marca, encabezado, métricas opcionales, tablas con filas alternadas, formato localizado, repetición de encabezados y numeración de páginas.
- **Compatibilidad Financiera**: Los estados de órdenes y pagos se exportan con sus etiquetas localizadas en español, facilitando el envío a contadores y equipos administrativos.

### 9. Motor de Comisiones (`/commissions`)

- **Reglas por Pasarela y Plan**: Configuración de comisiones porcentuales o fijas aplicables a cada venta según la pasarela utilizada o el plan del comercio.
- **Libro Contable de Comisiones**: Registro de cada comisión causada por pedido, con seguimiento de liquidación (_Pendiente_ vs _Liquidada/Pagada_).

### 10. Moderación de Reseñas (`/reviews`)

- **Bandeja de Moderación**: Revisión de comentarios y estrellas otorgadas por compradores en el storefront.
- **Acciones de Moderación**: Aprobación para publicación inmediata, rechazo o eliminación, destacando insignias de _Comprador Verificado_.

### 11. Miembros, Roles y Auditoría (`/members`)

- **Sistema de Invitaciones**: Envío de invitaciones por correo electrónico con tokens de un solo uso enlazados a la pantalla de aceptación (`/accept-invite`).
- **Actividad Reciente del Equipo**: Timeline visible con los últimos cambios y accesos registrados en `audit_logs`, filtrados por el tenant activo y ordenados cronológicamente.
- **Detalle de Actividad**: Cada evento identifica al usuario, la acción y el objeto afectado, utilizando `new_values` y `old_values` para mostrar nombres, números de orden, SKU y campos modificados.
- **Localización de Eventos**: Acciones, estados, roles, fuentes operativas y nombres de campos técnicos se presentan en español, con fallback para eventos incompletos o valores nulos.
- **Actualización Manual**: La actividad puede refrescarse desde la propia vista y dispone de estados de carga y vacío.
- **Control de Roles (RBAC)**:
  - `Owner`: Propietario con control total y facturación.
  - `Admin`: Gestión integral de operaciones, catálogo y configuraciones.
  - `Editor`: Creación y edición de productos, cupones, clientes y pedidos.
  - `Viewer`: Modo de solo lectura para auditoría y visualización.
  - `Delivery`: Acceso restringido exclusivamente a la visualización y despacho de pedidos.

### 12. Suscripción y Cuotas (`/subscription`)

- **Niveles de Plan**: Visualización del plan activo (_Gratis, Básico, Pro, Enterprise_).
- **Indicadores de Uso (`app-usage-progress`)**: Barras de progreso de cuota de productos publicados y consumo de almacenamiento.
- **Historial de Facturación**: Registro de cobros y pagos de la suscripción SaaS.

### 13. Suite de Configuración de Tienda (`/settings`)

- **Ajustes Generales**: Nombre legal, moneda de operación predeterminada y zona horaria.
- **Dirección Física**: Ubicación física del centro de despacho para el cálculo de fletes.
- **Branding & Identidad**: Logotipo principal, favicon, banner de encabezado y paleta de colores de marca reflejada dinámicamente mediante variables CSS.
- **Presets de Diseño**: Catálogo de estilos visuales prediseñados (_Moderno, Minimalista, Neón, Elegante_) aplicables al instante.
- **Constructor de Secciones (Storefront Builder)**: Personalización modular de la página de inicio (activar, ocultar, configurar y reordenar bloques).
- **Envíos e Impuestos**: Creación de zonas de transporte con tarifas fijas o por peso y configuración de tasas impositivas.
- **Pasarelas de Pago**: Activación de métodos de pago soportados (transferencia bancaria, pago contra entrega y pasarela Wompi multi-tenant).
- **Zona de Peligro**: Opciones de archivado o eliminación irreversible del tenant.

### 14. Previsualizador de Tienda en Vivo (`/preview`)

- **Simulador Multidispositivo**: Marco interactivo que permite previsualizar la tienda en resoluciones de Teléfono Móvil, Tablet y Monitor de Escritorio.
- **Sincronización en Tiempo Real**: Recepción inmediata de cambios emitidos desde el panel de ajustes sin requerir refresco de página.

---

## 🛒 Módulos del Storefront Público & Experiencia de Compra

### 1. Página de Inicio Dinámica (`/store`)

- **Arquitectura de Secciones Modulares**: Renderizada en el servidor (SSR) en base a la configuración guardada por el comerciante:
  - _Hero Banner_: Carrusel promocional con llamados a la acción (CTA).
  - _Categorías Destacadas_: Cuadrícula visual para exploración rápida.
  - _Productos Destacados & Ofertas_: Muestrario de productos con badges de descuento.
  - _Testimonios & Propuesta de Valor_: Beneficios de compra y valoraciones.
  - _Suscripción a Newsletter_: Captación de correos para marketing.

### 2. Catálogo y Búsqueda de Productos (`/store/productos`)

- **Filtros en Tiempo Real**: Filtrado facetado por categoría, rango de precios, ordenación por precio o fecha de novedad y paginación reactiva.
- **Tarjetas de Producto Inteligentes (`app-product-card`)**: Indicadores visuales de stock, botón de adición rápida al carrito y cálculo dinámico de porcentajes de ahorro.

### 3. Ficha de Producto con SSR y SEO (`/store/product/:id`)

- **Generación en Servidor & Metaetiquetas**: Carga con SSR que provee títulos, descripciones, etiquetas OpenGraph completas y marcado JSON-LD (`schema.org/Product`) para indexación en Google y vista previa rica en WhatsApp, Telegram o Twitter.
- **Selector Reactivo de Variantes**: Cambio instantáneo de opciones (ej. color o talla) que recalcula dinámicamente la disponibilidad de stock y el precio aplicable.
- **Sistema de Reseñas**: Visualización de opiniones calificadas con estrellas y formulario para que compradores verificados dejen su valoración.

### 4. Carrito de Compras (`/store/carrito`)

- **Persistencia Reactiva**: Manejado mediante el servicio `CartService` con almacenamiento seguro en localStorage y sincronización con sesiones de carritos abandonados.
- **Aplicación de Cupones**: Validación instantánea contra las reglas configuradas por el comerciante y visualización desglosada del descuento.

### 5. Checkout y Pasarela (`/store/checkout`)

- **Integración Geográfica de Colombia**: Conexión con la API oficial de geografía colombiana para desplegar departamentos y municipios en cascada sin errores tipográficos.
- **Cálculo de Envío e Impuestos**: Determinación automática de la tarifa de transporte aplicable según la zona geográfica seleccionada.
- **Selección de Método de Pago**: Soporte para transferencias, efectivo contra entrega y pasarelas de pago digitales.

### 6. Confirmación de Compra (`/store/success`)

- **Resumen Inmutable**: Presentación de la orden recién generada con número único de seguimiento, desglose financiero y copia de confirmación.

### 7. Portal del Cliente (`/store/account`)

- **Autenticación Independiente (`CustomerAuthService`)**: Los compradores cuentan con su propio sistema de sesión desacoplado del panel administrativo.
- **Gestión de Direcciones (`/store/account/direcciones`)**: Libreta de direcciones guardadas para agilizar futuras compras.

---

## 🔔 Herramientas del Header: Soporte, Notificaciones e IA

### ❓ Centro de Ayuda & Diagnóstico (Drawer Interactivo)

- **Diagnóstico de Salud de la Tienda (Health Diagnostic)**: Evaluación automatizada del estado de configuración del comercio en 6 áreas clave:
  1. _Información General_ (Nombre, contacto, moneda).
  2. _Branding_ (Logo e identidad visual).
  3. _Catálogo de Productos_ (Al menos un producto publicado).
  4. _Zonas de Envío_ (Reglas y tarifas de entrega).
  5. _Personalización Visual_ (Tema y secciones de portada).
  6. _Impuestos_ (Tasas fiscales configuradas).
     Cada área incluye accesos directos de navegación para completar la configuración pendiente.
- **Base de Conocimientos de Resolución de Problemas**: Acordeón interactivo con soluciones detalladas para incidencias comunes (verificación DNS, visibilidad de borradores, cálculo de fletes, etc.).
- **Creador de Tickets de Soporte**: Formulario modal para remitir incidencias con clasificación de severidad (_Baja, Media, Alta, Urgente_), categorización y subida de capturas de pantalla adjuntas a Supabase Storage.

### 🔔 Centro de Notificaciones en Tiempo Real

- **Canal WebSocket de Supabase**: Escucha eventos `INSERT` en la tabla `notifications` filtrados por el inquilino activo.
- **Contador con Badge Dinámico**: Indicador numérico animado de notificaciones pendientes de lectura en el encabezado.
- **Bandeja Interactiva**: Pestañas para filtrar entre _Todas_ y _No leídas_, opciones para marcar individualmente o en bloque como leídas y redirección contextual (al pulsar sobre un nuevo pedido abre directamente `/orders/:id`).

### 🤖 Asistente de Inteligencia Artificial Gemini

- **Modelo Google Gemini**: Integración mediante la librería oficial `@google/generative-ai`.
- **Invocación de Herramientas (Function/Tool Calling)**: El asistente no es un simple bot conversacional; cuenta con definiciones de funciones que le permiten consultar la base de datos de la tienda en tiempo real (consultar productos con stock bajo, resumir ventas del día, buscar órdenes por cliente).
- **Formateo Seguro de Markdown**: Las respuestas complejas (tablas, listas, cifras destacadas) se procesan con `marked` y se sanitizan rigurosamente con `DOMPurify`.

#### Límites diarios por plan

Cada tenant tiene una cuota diaria compartida entre todos sus miembros. Una solicitud
del usuario consume una unidad y la cuota se reinicia a medianoche UTC:

| Plan | Solicitudes diarias |
| :--- | ------------------: |
| `free` | 5 |
| `basic` | 20 |
| `professional` | 50 |
| `enterprise` | 100 |

El control se realiza mediante la función SQL `consume_ai_request`, definida en
`supabase/migrations/20260903110000_ai_daily_request_limits.sql`. La función valida
que el usuario sea miembro activo del tenant, consulta su plan y ejecuta el incremento
de forma atómica. Cuando se alcanza el límite, el asistente bloquea la llamada a
Gemini y muestra un mensaje indicando que la cuota se renovará al día siguiente.

En esta versión, una solicitud puede producir varias llamadas internas a Gemini si el
modelo utiliza herramientas para consultar datos. La cuota representa mensajes del
usuario, no tokens ni llamadas individuales al proveedor. El límite de salida está
restringido a 1.000 tokens por respuesta, pero el coste real también depende del
historial enviado y de las respuestas de las herramientas.

Para cambiar estos valores, actualiza el `CASE` de `consume_ai_request` y aplica una
nueva migración. No dependas únicamente de límites del proveedor: las cuotas de
Gemini se aplican por proyecto y pueden ser compartidas por todos los tenants.

> **Estado de seguridad:** actualmente la llamada a Gemini se realiza desde el cliente
> Angular, por lo que `GEMINI_API_KEY` queda expuesta al navegador. La cuota de Supabase
> protege el flujo normal de la aplicación, pero no evita que una clave comprometida
> sea utilizada directamente. Antes de ofrecer el chat en producción o usar un modelo
> pagado, mueve la llamada al modelo y el consumo de cuota a una Supabase Edge Function.

---

## ⚙️ Capa Core del Sistema (Servicios, Guards e Interceptores)

### Directorio de Servicios de Negocio (`src/app/core/services`)

El núcleo de Venti Shop está compuesto por **34 servicios especializados** desacoplados:

| Servicio                | Responsabilidad Principal                                                       |
| :---------------------- | :------------------------------------------------------------------------------ |
| `TenantService`         | Estado central del comercio activo, branding, subdominios y configuración       |
| `AuthService`           | Autenticación administrativa de Supabase (GoTrue), control de sesiones y tokens |
| `CustomerAuthService`   | Autenticación y gestión de sesiones para compradores del Storefront             |
| `ProductsService`       | CRUD de productos, variantes, matrices de stock y asociación con categorías     |
| `CategoriesService`     | Estructura jerárquica de categorías padre e hijas y slugs de navegación         |
| `OrdersService`         | Consulta de pedidos, transiciones de estado, notas internas y snapshots         |
| `CustomersService`      | CRM de clientes, cálculo de LTV, órdenes históricas y libreta de direcciones    |
| `InventoryService`      | Registro de movimientos de inventario y auditoría de ajustes                    |
| `CartService`           | Estado reactivo del carrito de compras del cliente con persistencia local       |
| `AbandonedCartService`  | Seguimiento y métricas de carritos sin finalizar                                |
| `DiscountsService`      | Creación, validación y cómputo de cupones de descuento                          |
| `CommissionsService`    | Cálculo y liquidación de comisiones por pasarela y exportación a Excel          |
| `ReportPdfService`      | Generación de reportes PDF con branding, métricas, tablas estilizadas y paginación |
| `AuditLogsService`      | Consulta de actividad reciente del equipo filtrada por tenant desde `audit_logs` |
| `ReviewsService`        | Moderación de opiniones y cálculo de promedios de calificación                  |
| `AnalyticsService`      | Agregación de KPIs, series temporales y formateo para ApexCharts                |
| `ShippingService`       | Zonas de envío, cálculo de fletes y tarifas por peso o precio                   |
| `GeographyService`      | Carga de departamentos y municipios mediante la API de Colombia                 |
| `SupportService`        | Diagnóstico de salud de tienda, base de conocimientos y tickets de soporte      |
| `NotificationsService`  | Notificaciones en tiempo real vía Supabase Realtime y gestión de lectura        |
| `AiAssistantService`    | Integración con Gemini AI y ejecución de herramientas de consulta a BD          |
| `PreviewSyncService`    | Puente de comunicación en tiempo real entre el panel de diseño y el preview     |
| `SeoService`            | Gestión de etiquetas meta dinámicas, títulos y OpenGraph para SSR               |
| `StructuredDataService` | Inyección de esquemas JSON-LD (Schema.org/Product y Store)                      |
| `StorageService`        | Carga, borrado y obtención de URLs públicas en buckets de Supabase              |
| `FileProcessorService`  | Validación de tipos MIME, compresión de imágenes y extracción de metadatos      |
| `SubscriptionService`   | Monitoreo de planes SaaS, verificación de cuotas y facturación                  |
| `PaymentsService`       | Registro de transacciones y estados de pago                                     |
| `PermissionsService`    | Verificación de permisos y capacidades según el rol del usuario (RBAC)          |
| `EmailService`          | Trazabilidad y auditoría de correos transaccionales enviados                    |
| `LoggerService`         | Sistema de logging centralizado con niveles configurables por entorno           |
| `ToastService`          | Cola reactiva de alertas y notificaciones emergentes                            |
| `LoaderService`         | Señal global de carga para operaciones asíncronas                               |
| `Supabase`              | Singleton de inicialización y configuración del cliente Supabase                |

### Guards de Enrutamiento (`src/app/core/guards`)

- `authGuard`: Protege rutas administrativas verificando que exista una sesión activa de Supabase.
- `guestGuard`: Redirige usuarios ya autenticados que intentan acceder a pantallas de login o registro.
- `storeGuard`: Resuelve el inquilino activo en el Storefront según dominio, subdominio o parámetro `?s=`, controlando navegación tanto en SSR como en el navegador.
- `roleGuard` / `adminGuard` / `editorGuard` / `viewerGuard` / `deliveryRedirectGuard`: Restringen el acceso a submódulos según los roles de `TenantRole`.

### Interceptores HTTP (`src/app/core/interceptors`)

- `authInterceptor`: Inyecta el token Bearer en las peticiones HTTP cuando corresponde.
- `loaderInterceptor`: Notifica al `LoaderService` el inicio y finalización de operaciones de red.
- `errorInterceptor`: Captura excepciones globales y muestra mensajes amigables al usuario vía `ToastService`.

---

## 🧱 Componentes Compartidos Reutilizables

| Componente              | Selector                     | Descripción                                                                          |
| :---------------------- | :--------------------------- | :----------------------------------------------------------------------------------- |
| `HelpDrawer`            | `app-help-drawer`            | Drawer lateral con diagnóstico de configuración de tienda y envío de tickets         |
| `NotificationsDropdown` | `app-notifications-dropdown` | Desplegable de notificaciones Realtime con conteo de no leídas y navegación          |
| `AiAssistant`           | `app-ai-assistant`           | Widget flotante de chat con Google Gemini y renderizado Markdown sanitizado          |
| `DynamicTable`          | `app-dynamic-table`          | Tabla avanzada con ordenamiento, buscador, paginación, acciones y exportación CSV, Excel y PDF |
| `MediaManagerModal`     | `app-media-manager-modal`    | Galería modal para explorar, subir y seleccionar imágenes desde Supabase Storage     |
| `CustomerAuthModal`     | `app-customer-auth-modal`    | Modal emergente para login y registro de clientes finales en el Storefront           |
| `DateRangePicker`       | `app-date-range-picker`      | Selector de rangos de fechas con atajos rápidos para reportes analíticos             |
| `DatePicker`            | `app-date-picker`            | Selector accesible de fecha única                                                    |
| `Dropdown`              | `app-dropdown`               | Menú desplegable estilizado con soporte de iconos y estados activos                  |
| `OrderStatusBadge`      | `app-order-status-badge`     | Píldora visual con código de color según el estado del pedido                        |
| `UsageProgress`         | `app-usage-progress`         | Medidor de cuota de recursos y límites de suscripción                                |
| `Toast`                 | `app-toast`                  | Pila de notificaciones emergentes con animaciones fluidas                            |
| `NotFound`              | `app-not-found`              | Vista 404 estilizada tanto para rutas administrativas como de storefront             |

---

## 🗄️ Modelo de Base de Datos y Seguridad

El esquema relacional en PostgreSQL está diseñado para operar con aislamiento multi-inquilino estricto, comprendiendo **más de 30 tablas** organizadas en dominios funcionales:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            ESQUEMA DE BASE DE DATOS                          │
├──────────────────────┬───────────────────────────────────────────────────────┤
│ Inquilinos & Equipo  │ tenants, tenant_members, tenant_settings,             │
│                      │ subscription_history                                  │
├──────────────────────┼───────────────────────────────────────────────────────┤
│ Catálogo & Productos │ products, categories, product_categories,             │
│                      │ product_variants, product_images, product_tags,        │
│                      │ product_tag_associations                             │
├──────────────────────┼───────────────────────────────────────────────────────┤
│ Órdenes & Clientes   │ customers, customer_addresses, orders, order_items,    │
│                      │ order_status_history, payments, refunds               │
├──────────────────────┼───────────────────────────────────────────────────────┤
│ Promociones & Reseñas│ discount_codes, discount_usage, product_reviews       │
├──────────────────────┼───────────────────────────────────────────────────────┤
│ Finanzas & Comisiones│ commissions, commission_rules                         │
├──────────────────────┼───────────────────────────────────────────────────────┤
│ Soporte & Alertas    │ notifications, support_tickets                        │
├──────────────────────┼───────────────────────────────────────────────────────┤
│ Auditoría & Logs     │ inventory_history, audit_logs, email_logs,            │
│                      │ analytics_events, daily_sales_summary                 │
├──────────────────────┼───────────────────────────────────────────────────────┤
│ Configuración & Web  │ media_library, shipping_zones, shipping_rates,        │
│                      │ tax_rates, webhook_endpoints, webhook_deliveries      │
└──────────────────────┴───────────────────────────────────────────────────────┘
```

---

## 🚀 DevOps, Pruebas y Calidad de Código

- **Integración Continua (CI/CD)**: Configurada mediante GitHub Actions en `.github/workflows/ci.yml`. Cada Pull Request o Push a ramas principales ejecuta en paralelo:
  1. Verificación de formato con Prettier.
  2. Análisis estático con ESLint.
  3. Ejecución de pruebas unitarias con Vitest.
  4. Compilación del proyecto (`ng build`).
- **Pruebas Unitarias con Vitest**: Configuración moderna que aprovecha la velocidad nativa de Vite sin la sobrecarga de Karma/Jasmine, permitiendo ejecutar pruebas instantáneas en servicios y componentes críticos (`npm run test`).
- **Linter con Flat Config (`eslint.config.js`)**: Reglas adaptadas para Angular 22, TypeScript 6 y comprobaciones de buenas prácticas con Angular Signals y RxJS.

---

## 💻 Guía de Instalación y Ejecución

### Prerrequisitos

- **Node.js**: v20.x o v22.x LTS recomendado.
- **npm**: v10.x o v11.x (o `bun`).
- Una cuenta y proyecto activo en **Supabase**.

### 1. Clonación e Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Juliodvp29/venti-multi-tenant.git
cd venti-multi-tenant

# Instalar dependencias
npm install
```

### 2. Configuración de Variables de Entorno

Configura las variables de conexión con Supabase en tu archivo de entorno o mediante variables de sistema (el script `scripts/set-env.js` las inyectará automáticamente en la compilación):

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-de-supabase
GEMINI_API_KEY=tu-api-key-de-google-gemini
```

`GEMINI_API_KEY` solo es necesaria para el asistente actual basado en cliente. No la
incluyas en el repositorio ni la confundas con `SUPABASE_ANON_KEY`; para producción,
la integración recomendada es guardar la clave únicamente como secreto de una Edge
Function.

### 3. Scripts de Ejecución

```bash
# Iniciar servidor de desarrollo en modo SPA (Vite / Angular CLI)
npm start

# Ejecutar el linter de código
npm run lint

# Ejecutar suite de pruebas unitarias
npm run test

# Compilación completa para producción (Browser + Server SSR)
npm run build

# Iniciar servidor de producción con Server-Side Rendering (SSR)
npm run serve:ssr
```

El servidor SSR escuchará por defecto en `http://localhost:4000`, mientras que el servidor de desarrollo Vite lo hará en `http://localhost:4200`.

---

## ⚙️ Configuración de Servicios Externos

### Migraciones de cuotas de IA

Después de configurar el proyecto Supabase, aplica las migraciones, incluida la que
crea la tabla diaria `ai_daily_usage` y la función atómica de consumo:

```bash
supabase db push
```

La tabla tiene RLS habilitado y no concede acceso directo de lectura o escritura a
los clientes. Los usuarios autenticados solo pueden ejecutar `consume_ai_request`,
que valida su pertenencia activa al tenant antes de consumir una unidad.

### Buckets de Almacenamiento en Supabase Storage

Es indispensable que existan los siguientes buckets públicos en tu proyecto de Supabase:

| Nombre del Bucket     | Visibilidad | Propósito                                                                          |
| :-------------------- | :---------- | :--------------------------------------------------------------------------------- |
| `products`            | ✅ Público  | Almacena galerías de imágenes de productos, logotipos de marca y banners de tienda |
| `support-attachments` | ✅ Público  | Almacena capturas de pantalla y diagnósticos adjuntos a los tickets de soporte     |

### Edge Function: `verify-domain`

Para habilitar la verificación en vivo de dominios personalizados de los inquilinos, despliega la función ubicada en `supabase/functions/verify-domain`:

```bash
supabase functions deploy verify-domain --no-verify-jwt
```

### Edge Function: `dispatch-webhook`

La función `dispatch-webhook` está diseñada para llamadas internas desde triggers de
Postgres o servicios backend. No debe invocarse desde el navegador. Configura un
secreto compartido en Supabase y despliega la función sin la validación JWT
automática; la función valida el encabezado `X-Venti-Internal-Secret` antes de
procesar cualquier evento:

```bash
supabase secrets set DISPATCH_WEBHOOK_SECRET="$(openssl rand -hex 32)"
supabase functions deploy dispatch-webhook --no-verify-jwt
```

La llamada interna debe enviar `tenant_id`, un `event_type` del catálogo v1 y
`payload`. La firma HMAC-SHA256 del JSON enviado se incluye en
`X-Venti-Signature`; cada entrega se registra en `webhook_deliveries`.

### Triggers de Webhooks (Opción A)

Los triggers están definidos en
`supabase/migrations/20260903085000_webhook_event_triggers.sql`. Antes de aplicar
la migración, guarda en Supabase Vault la URL desplegada y el mismo secreto
interno configurado para la Edge Function:

```sql
select vault.create_secret(
  'https://TU_PROJECT_REF.supabase.co/functions/v1/dispatch-webhook',
  'dispatch-webhook-url'
);

select vault.create_secret(
  'EL_VALOR_DE_DISPATCH_WEBHOOK_SECRET',
  'dispatch-webhook-secret'
);
```

Después aplica la migración con `supabase db push`. Se crearán triggers para
`order.created`, `order.status_changed`, `payment.confirmed`,
`payment.failed` y `product.stock_low`. El último solo se dispara al cruzar
el umbral de inventario hacia abajo, evitando enviar el mismo evento en cada
actualización posterior.

### Reintentos automáticos

Despliega también la función de reintentos:

```bash
supabase functions deploy retry-webhooks --no-verify-jwt
```

Guarda su URL en Vault y aplica la migración del cron:

```sql
select vault.create_secret(
  'https://TU_PROJECT_REF.supabase.co/functions/v1/retry-webhooks',
  'retry-webhooks-url'
);
```

La migración `20260903090000_webhook_retry_cron.sql` programa una ejecución cada
minuto. Los fallos se reintentan después de 1, 5 y 30 minutos; el cuarto intento
marca la entrega como `failed`. El cron procesa como máximo 100 entregas por
ejecución.

La guía para merchants está disponible desde el `HelpDrawer` en
**Conectar Webhooks** e incluye configuración con Zapier/Make/n8n, verificación
HMAC en Node/Python y ejemplos de eventos.

---

## 📝 Licencia

Este proyecto está bajo la Licencia [MIT](LICENSE).

---

<div align="center">

**Diseñado con pasión para el comercio digital moderno, escalable y multi-inquilino.**

</div>
