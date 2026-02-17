# 📘 Documentación Completa de la Plataforma SaaS Ecommerce Multi-Tenant

## 🎯 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura General](#arquitectura-general)
3. [Módulos del Sistema](#módulos-del-sistema)
4. [Flujos de Usuario](#flujos-de-usuario)
5. [Modelo de Datos Explicado](#modelo-de-datos-explicado)
6. [Seguridad y Aislamiento](#seguridad-y-aislamiento)
7. [Escalabilidad](#escalabilidad)
8. [Casos de Uso](#casos-de-uso)

---

## 🌟 Visión General

### ¿Qué es esta Plataforma?

Esta es una plataforma SaaS (Software as a Service) completa de comercio electrónico multi-tenant. Imagina que es como Shopify o WooCommerce, pero construido desde cero con tecnología moderna.

**¿Qué significa Multi-Tenant?**

Multi-tenant significa que múltiples comerciantes (tiendas) pueden usar la misma aplicación simultáneamente, pero cada uno tiene sus datos completamente separados y privados. Es como un edificio de apartamentos: muchas familias viven en el mismo edificio, pero cada una tiene su propio espacio privado con su propia llave.

### Ventajas de esta Arquitectura

**Para el Dueño de la Plataforma:**
- Un solo código base para mantener
- Una sola base de datos para gestionar
- Economía de escala en costos de infraestructura
- Actualizaciones instantáneas para todos los clientes
- Fácil agregar nuevas características

**Para los Comerciantes (Tenants):**
- Acceso inmediato sin instalar nada
- Costos compartidos = más económico
- Actualizaciones automáticas
- Escalabilidad automática
- Soporte profesional incluido

### Público Objetivo

**Tres tipos de usuarios:**

1. **Superadmin** (Dueño de la Plataforma)
   - Gestiona todos los tenants
   - Controla planes y suscripciones
   - Monitorea la salud del sistema
   - Maneja facturación global

2. **Comerciantes** (Owners de Tiendas)
   - Crean y gestionan su tienda virtual
   - Administran productos e inventario
   - Procesan órdenes
   - Ven analytics de su negocio
   - Personalizan su marca

3. **Compradores** (Clientes Finales)
   - Navegan productos
   - Agregan al carrito
   - Realizan compras
   - Rastrean sus pedidos
   - Dejan reseñas

---

## 🏗️ Arquitectura General

### Capas de la Aplicación

La plataforma está organizada en 4 capas principales:

#### 1. Capa de Presentación (Frontend)

**¿Qué hace?**
Es lo que los usuarios ven y tocan. Hay dos interfaces principales:

**Storefront (Tienda Pública)**
- Página de inicio con productos destacados
- Catálogo de productos con búsqueda y filtros
- Páginas de detalle de producto
- Carrito de compras
- Proceso de checkout
- Página de confirmación de orden
- Rastreo de pedidos

**Dashboard (Panel de Administración)**
- Dashboard con métricas clave
- Gestión de productos
- Gestión de órdenes
- Gestión de clientes
- Analytics y reportes
- Configuración de la tienda
- Personalización de marca

**Características Técnicas:**
- Responsive (funciona en móvil, tablet, desktop)
- Single Page Application (SPA) - rápida y fluida
- Actualización en tiempo real
- Accesible (WCAG compliant)

#### 2. Capa de Seguridad y Autenticación

**¿Qué hace?**
Protege toda la aplicación y asegura que cada usuario solo vea lo que debe ver.

**Componentes:**

**Autenticación:**
- Login con email/password
- Registro de nuevos usuarios
- Recuperación de contraseña
- Sesiones seguras con JWT tokens
- Soporte para 2FA (autenticación de dos factores)

**Autorización:**
- Row Level Security (RLS) automático
- Roles y permisos por usuario
- Políticas de acceso granulares
- Prevención de acceso no autorizado

**¿Cómo Funciona el Aislamiento?**

Imagina que tienes dos tiendas: "Zapatería Pedro" y "Ropa María"

1. Pedro inicia sesión → El sistema identifica que Pedro es dueño de tenant "zapateria-pedro"
2. Pedro pide ver sus productos → La base de datos automáticamente filtra: "WHERE tenant_id = zapateria-pedro"
3. Pedro NUNCA puede ver productos de María, ni siquiera si intenta hackear la URL
4. María tiene el mismo proceso, pero con "ropa-maria"

Esto sucede AUTOMÁTICAMENTE en cada consulta. No hay forma de que un tenant acceda a datos de otro.

#### 3. Capa de Lógica de Negocio

**¿Qué hace?**
Contiene todas las reglas del negocio y automatizaciones.

**Funcionalidades Principales:**

**Gestión de Inventario:**
- Al crear una orden, el stock se reserva automáticamente
- Si no hay stock suficiente, la compra no procede
- Alertas automáticas cuando el stock es bajo
- Predicción de días restantes de inventario

**Procesamiento de Órdenes:**
- Generación automática de número de orden único
- Cálculo automático de impuestos según región
- Cálculo de costos de envío
- Validación de cupones de descuento
- Aplicación de descuentos

**Notificaciones:**
- Email de confirmación de orden
- Email cuando el pedido se envía
- Email si la orden se cancela
- Notificaciones al comerciante de nuevas órdenes

**Analytics:**
- Cálculo diario de métricas de ventas
- Identificación de productos más vendidos
- Segmentación automática de clientes (VIP, Leal, Nuevo)
- Predicción de reabastecimiento

#### 4. Capa de Datos

**¿Qué hace?**
Almacena TODA la información de la plataforma de manera organizada, segura y eficiente.

**Características:**

**Organización:**
- 37 tablas especializadas
- Relaciones bien definidas
- Integridad referencial garantizada
- Normalización de datos

**Performance:**
- 80+ índices para búsquedas rápidas
- Vistas pre-calculadas para reportes
- Caché de consultas frecuentes
- Optimización de queries

**Seguridad:**
- Encriptación en reposo
- Encriptación en tránsito
- Row Level Security
- Audit logs completos
- Backups automáticos

---

## 📦 Módulos del Sistema

### Módulo 1: Gestión de Tenants (Tiendas)

**¿Qué hace?**
Maneja la creación y configuración de cada tienda virtual.

**Funcionalidades Principales:**

#### A. Registro de Nueva Tienda

**Proceso:**
1. El comerciante crea su cuenta con email y contraseña
2. Elige nombre de negocio y subdominio (ej: mi-tienda.plataforma.com)
3. Selecciona plan inicial (Free, Basic, Professional, Enterprise)
4. El sistema crea automáticamente:
   - Registro del tenant en la base de datos
   - Templates de email predeterminados
   - Configuraciones iniciales
   - Estructura completa para operar

**Lo que se crea automáticamente:**
- Cuenta de administrador principal
- 5 plantillas de email personalizables
- Configuración de moneda, zona horaria, unidades
- Paleta de colores por defecto
- Estructura de categorías sugerida

#### B. Personalización de Marca

**Elementos Personalizables:**

**Visuales:**
- Logo de la tienda (recomendado: 200x60px)
- Favicon (icono en el navegador)
- Colores corporativos:
  * Color primario (botones, enlaces)
  * Color secundario (fondos, bordes)
  * Color de acento (ofertas, destacados)
- Banner principal de la tienda
- Imágenes de fondo

**Textos:**
- Descripción del negocio
- Mensaje de bienvenida
- Políticas de envío
- Políticas de devolución
- Términos y condiciones
- Información de contacto

#### C. Configuración de la Tienda

**Configuraciones Generales:**
- Nombre del negocio
- Dirección física completa
- Teléfono y email de contacto
- Horarios de atención
- Redes sociales

**Configuraciones Técnicas:**
- Moneda (USD, EUR, MXN, etc.)
- Zona horaria (para mostrar horarios correctos)
- Unidades de peso (kg, lb)
- Unidades de dimensión (cm, in)
- Idioma principal

**Configuraciones de Compra:**
- ¿Permitir checkout como invitado?
- ¿Requerir creación de cuenta?
- ¿Auto-aprobar órdenes digitales?
- Umbral de stock bajo (default: 10 unidades)
- Monto mínimo de compra
- Envío gratis a partir de X cantidad

#### D. Gestión de Equipo

**Roles Disponibles:**

1. **Owner (Dueño)**
   - Acceso total a todo
   - Puede invitar/remover usuarios
   - Gestiona planes y facturación
   - Puede eliminar la tienda

2. **Admin (Administrador)**
   - Gestiona productos
   - Gestiona órdenes
   - Ve analytics
   - No puede cambiar configuraciones críticas

3. **Editor**
   - Puede editar productos
   - Puede ver órdenes
   - No puede eliminar ni aprobar

4. **Viewer (Observador)**
   - Solo puede ver
   - No puede modificar nada
   - Útil para contadores, consultores

**Proceso de Invitación:**
1. Owner envía invitación por email
2. Invitado recibe link
3. Crea su cuenta o inicia sesión
4. Automáticamente tiene acceso a esa tienda
5. Puede pertenecer a múltiples tiendas

#### E. Planes y Suscripciones

**Plan Free:**
- Hasta 50 productos
- Hasta 100 órdenes/mes
- 1 usuario
- Almacenamiento: 1GB
- Sin dominio personalizado
- Logo de la plataforma en footer

**Plan Basic ($29/mes):**
- Hasta 500 productos
- Órdenes ilimitadas
- 3 usuarios
- Almacenamiento: 10GB
- Dominio personalizado
- Sin marca de la plataforma
- Soporte por email

**Plan Professional ($79/mes):**
- Productos ilimitados
- Órdenes ilimitadas
- 10 usuarios
- Almacenamiento: 50GB
- Analytics avanzados
- Exportación de datos
- Webhooks
- Soporte prioritario

**Plan Enterprise ($299/mes):**
- Todo ilimitado
- Usuarios ilimitados
- Almacenamiento: 500GB
- API completa
- Integraciones personalizadas
- Manager dedicado
- SLA 99.9%
- Soporte 24/7

---

### Módulo 2: Catálogo de Productos

**¿Qué hace?**
Permite a los comerciantes crear, organizar y gestionar todo su inventario de productos.

#### A. Gestión de Categorías

**Estructura Jerárquica:**

Las categorías pueden tener múltiples niveles, como un árbol:

```
Electrónica
├── Computadoras
│   ├── Laptops
│   ├── Desktops
│   └── Tablets
├── Celulares
│   ├── iPhones
│   ├── Android
│   └── Accesorios
└── Audio
    ├── Audífonos
    └── Bocinas
```

**Información de Categoría:**
- Nombre
- Descripción
- Imagen representativa
- URL amigable (slug)
- Orden de aparición
- Categoría padre (si aplica)
- Meta descripción para SEO
- Estado (activa/inactiva)

**Uso Múltiple:**
Un producto puede estar en varias categorías. Ejemplo:
- "iPhone 15 Pro" puede estar en:
  * Celulares > iPhones
  * Ofertas
  * Novedades
  * Premium

#### B. Creación de Productos

**Información Básica:**
- Nombre del producto
- Descripción corta (para listados)
- Descripción larga (para página de detalle)
- SKU (código único del producto)
- Código de barras (opcional)

**Precios:**
- Precio de venta
- Precio comparativo (para mostrar descuento)
- Precio de costo (para cálculos internos)
- Moneda

**Inventario:**
- ¿Rastrear inventario? (sí/no)
- Cantidad en stock
- Umbral de stock bajo
- ¿Permitir backorder? (vender sin stock)
- Ubicación en bodega (opcional)

**Propiedades Físicas:**
- Peso
- Dimensiones (largo, ancho, alto)
- Unidad de medida
- ¿Es producto digital?
- ¿Requiere envío?

**Visibilidad:**
- Estado (Borrador, Activo, Archivado)
- ¿Producto destacado?
- Fecha de publicación
- Fecha de expiración (opcional)

**SEO:**
- Título meta
- Descripción meta
- Palabras clave
- URL personalizada

#### C. Variantes de Producto

**¿Qué son?**
Las variantes son versiones diferentes del mismo producto. Por ejemplo:

**Camiseta:**
- Talla: S, M, L, XL
- Color: Rojo, Azul, Negro
- Combinaciones: Rojo/S, Rojo/M, Azul/S, Azul/M, etc.

**Características:**
- Cada variante puede tener:
  * Su propio precio
  * Su propio SKU
  * Su propio stock
  * Su propia imagen
  * Su propio peso

**Ejemplo Real:**

Producto: "Zapatos Deportivos Nike"
- Variante 1: Talla 7 / Negro → Stock: 15 unidades
- Variante 2: Talla 7 / Blanco → Stock: 8 unidades
- Variante 3: Talla 8 / Negro → Stock: 20 unidades
- Variante 4: Talla 8 / Blanco → Stock: 0 unidades (agotado)

#### D. Imágenes de Productos

**Gestión de Imágenes:**
- Múltiples imágenes por producto (recomendado: mínimo 4)
- Imagen principal (la que aparece en listados)
- Orden personalizable (arrastar y soltar)
- Texto alternativo para accesibilidad
- Zoom automático en la página de detalle

**Recomendaciones:**
- Resolución mínima: 800x800px
- Formato: JPG, PNG, WEBP
- Tamaño máximo: 5MB por imagen
- Fondo blanco para consistencia
- Múltiples ángulos del producto

#### E. Etiquetas (Tags)

**¿Para qué sirven?**
Las etiquetas permiten clasificación flexible sin estructura rígida.

**Ejemplos de Uso:**
- Temporada: "Verano 2024", "Navidad", "Black Friday"
- Ocasión: "Casual", "Formal", "Deportivo"
- Características: "Vegano", "Orgánico", "Hecho a mano"
- Tendencias: "Bestseller", "Nuevo", "Trending"

**Beneficios:**
- Búsqueda más fácil
- Filtrado flexible
- Colecciones dinámicas
- SEO mejorado

---

### Módulo 3: Gestión de Clientes

**¿Qué hace?**
Administra toda la información de los compradores y su historial.

#### A. Perfiles de Cliente

**Información Almacenada:**

**Básica:**
- Email (único)
- Nombre completo
- Teléfono
- Fecha de registro
- Última actividad

**Preferencias:**
- ¿Acepta marketing? (emails promocionales)
- Idioma preferido
- Notas del comerciante

**Estadísticas Automáticas:**
- Total de órdenes realizadas
- Monto total gastado
- Valor promedio de orden
- Fecha de primera compra
- Fecha de última compra
- Días desde última compra

**Segmentación Automática:**

El sistema clasifica automáticamente a los clientes en:

1. **Prospect (Prospecto)**
   - Ha navegado pero nunca compró
   - 0 órdenes

2. **New (Nuevo)**
   - Ha hecho 1 compra
   - Dentro de los últimos 30 días

3. **Repeat (Repetidor)**
   - Ha hecho 2-4 compras
   - Compra ocasionalmente

4. **Loyal (Leal)**
   - Ha hecho 5-9 compras
   - Compra regularmente

5. **VIP**
   - Ha hecho 10+ compras
   - Alto valor de compra
   - Compra frecuentemente

**Uso de Segmentos:**
- Enviar campañas específicas
- Ofrecer descuentos personalizados
- Atención prioritaria
- Programas de lealtad

#### B. Direcciones de Clientes

**Tipos de Dirección:**
- Dirección de envío
- Dirección de facturación
- Múltiples direcciones guardadas

**Información:**
- Etiqueta ("Casa", "Oficina", "Padres")
- Nombre del destinatario
- Empresa (opcional)
- Línea 1 de dirección
- Línea 2 (apartamento, suite)
- Ciudad
- Estado/Provincia
- Código postal
- País
- Teléfono de contacto
- Instrucciones de entrega

**Dirección Predeterminada:**
- Se puede marcar una dirección como predeterminada
- Se usa automáticamente en el checkout
- Ahorra tiempo al comprador frecuente

#### C. Historial del Cliente

**Vista 360 del Cliente:**

El comerciante puede ver:
- Todas las órdenes (completadas, pendientes, canceladas)
- Total gastado
- Productos favoritos (más comprados)
- Categorías de interés
- Frecuencia de compra
- Método de pago preferido
- Reviews dejadas
- Cupones usados
- Última visita a la tienda

**Beneficio:**
- Atención personalizada
- Identificar clientes de alto valor
- Prevenir fraude
- Mejorar servicio

---

### Módulo 4: Procesamiento de Órdenes

**¿Qué hace?**
Maneja todo el ciclo de vida de una compra, desde que se crea hasta que se entrega.

#### A. Estados de una Orden

Una orden pasa por diferentes estados durante su vida:

**1. Pending (Pendiente)**
- Orden creada pero pago no procesado
- Cliente aún puede cancelar fácilmente
- Stock reservado temporalmente
- Esperando confirmación de pago

**2. Processing (Procesando)**
- Pago recibido
- Orden en preparación
- Se imprime etiqueta de envío
- Se empaca el producto

**3. Paid (Pagada)**
- Pago confirmado
- Stock definitivamente reservado
- Cliente recibe confirmación
- Listo para enviar

**4. Shipped (Enviada)**
- Paquete entregado a mensajería
- Cliente recibe número de rastreo
- Se puede rastrear en tiempo real
- En tránsito al cliente

**5. Delivered (Entregada)**
- Cliente confirmó recepción
- Mensajería confirmó entrega
- Orden completada exitosamente
- Se puede dejar review

**6. Cancelled (Cancelada)**
- Orden cancelada (por cliente o comerciante)
- Stock restaurado automáticamente
- Pago reembolsado (si aplica)
- Razón de cancelación registrada

**7. Refunded (Reembolsada)**
- Devolución procesada
- Dinero devuelto al cliente
- Producto devuelto (opcional)
- Registro de reembolso

#### B. Información de la Orden

**Snapshot de Datos:**

Cuando se crea una orden, se guarda una "foto" de todo:

**¿Por qué?**
Imagina que vendes una camiseta a $20. El cliente la compra. Dos días después, subes el precio a $25. La orden debe seguir mostrando $20 (el precio al momento de compra), no $25.

**Lo que se guarda:**
- Precio de cada producto (al momento de compra)
- Dirección de envío completa
- Dirección de facturación completa
- Información del cliente
- Método de pago usado
- Descuentos aplicados
- Impuestos calculados
- Costo de envío

**Detalles de Envío:**
- Método seleccionado
- Costo de envío
- Tiempo estimado de entrega
- Número de rastreo
- Compañía de mensajería
- URL de rastreo
- Fecha de envío
- Fecha de entrega

**Detalles de Pago:**
- Método usado (tarjeta, PayPal, etc.)
- Últimos 4 dígitos de tarjeta
- ID de transacción
- Gateway usado (Stripe, PayPal)
- Estado del pago
- Fecha de procesamiento

#### C. Items de la Orden

Cada orden contiene uno o más items:

**Información por Item:**
- Producto comprado
- Variante específica (si aplica)
- Cantidad
- Precio unitario (en ese momento)
- Subtotal
- Descuento aplicado
- Impuesto
- Total

**Ejemplo de Orden:**

```
Orden #ABC-20240216-0001
Cliente: Juan Pérez
Fecha: 16 Feb 2024 10:30 AM

Items:
1. Camiseta Roja (Talla M)
   Cantidad: 2
   Precio unitario: $20.00
   Subtotal: $40.00

2. Pantalón Azul (Talla 32)
   Cantidad: 1
   Precio unitario: $45.00
   Subtotal: $45.00

Subtotal: $85.00
Descuento (VERANO10): -$8.50
Impuesto (10%): $7.65
Envío: $5.00
────────────────
TOTAL: $89.15
```

#### D. Cálculos Automáticos

**Subtotal:**
Suma de (precio × cantidad) de todos los items

**Descuentos:**
- Cupones de descuento
- Promociones activas
- Descuentos por volumen
- Descuentos VIP

**Impuestos:**
- Se calculan según:
  * País del comprador
  * Estado/Provincia
  * Código postal
  * Tipo de producto
- Pueden ser múltiples impuestos

**Envío:**
- Según peso total
- Según destino
- Según método seleccionado
- Puede ser gratis si supera monto

**Total Final:**
`Subtotal + Impuestos + Envío - Descuentos`

#### E. Historial de Cambios

**Trazabilidad Completa:**

Cada vez que cambia algo en la orden, se registra:
- ¿Qué cambió?
- ¿Quién lo cambió?
- ¿Cuándo?
- ¿Por qué? (nota opcional)
- Estado anterior
- Estado nuevo

**Ejemplo:**
```
16 Feb 2024, 10:30 - Orden creada por Juan Pérez
16 Feb 2024, 10:32 - Estado: Pending → Processing (pago confirmado)
16 Feb 2024, 14:15 - Estado: Processing → Shipped (enviado por María Admin)
                     Nota: "Enviado vía FedEx, tracking: 123456"
17 Feb 2024, 18:20 - Estado: Shipped → Delivered
```

---

### Módulo 5: Pagos y Facturación

**¿Qué hace?**
Procesa pagos de manera segura y lleva registro de todas las transacciones.

#### A. Métodos de Pago Soportados

**Tarjetas de Crédito/Débito:**
- Visa
- Mastercard
- American Express
- Discover
- Procesado vía Stripe o PayPal

**Wallets Digitales:**
- PayPal
- Apple Pay
- Google Pay
- Amazon Pay

**Transferencia Bancaria:**
- ACH (USA)
- SEPA (Europa)
- SPEI (México)
- Confirmación manual

**Pago Contra Entrega:**
- Cash on Delivery (COD)
- Solo en áreas seleccionadas
- Verificación telefónica requerida

#### B. Proceso de Pago

**Flujo Estándar:**

1. **Cliente Hace Checkout**
   - Revisa su orden
   - Confirma dirección
   - Selecciona método de pago

2. **Ingresa Información de Pago**
   - Datos de tarjeta (encriptados)
   - O selecciona wallet
   - Acepta términos

3. **Validación**
   - Se verifica la tarjeta
   - Se valida el monto
   - Se detecta fraude (si aplica)

4. **Procesamiento**
   - Se procesa el cargo
   - Se espera confirmación del banco
   - Usualmente toma 2-5 segundos

5. **Confirmación**
   - Pago exitoso: Orden se marca como "Paid"
   - Pago fallido: Cliente puede reintentar
   - Stock se reserva definitivamente

6. **Notificaciones**
   - Email al cliente
   - Email al comerciante
   - Notificación en dashboard

**Seguridad:**
- PCI DSS compliant
- Tokens en lugar de tarjetas reales
- 3D Secure para tarjetas
- Detección de fraude
- Encriptación end-to-end

#### C. Reembolsos

**Tipos de Reembolso:**

**Completo:**
- Se devuelve todo el dinero
- Incluyendo envío (opcional)
- Orden marcada como "Refunded"

**Parcial:**
- Solo algunos items
- O descuento por daño/faltante
- Orden permanece como "Delivered"

**Proceso:**

1. **Solicitud de Reembolso**
   - Cliente solicita (o comerciante ofrece)
   - Se especifica razón
   - Se adjunta evidencia (fotos, etc.)

2. **Revisión**
   - Comerciante revisa caso
   - Verifica política de devolución
   - Aprueba o rechaza

3. **Procesamiento**
   - Se inicia reembolso en gateway
   - Se registra en sistema
   - Stock se restaura (opcional)

4. **Confirmación**
   - Cliente recibe confirmación
   - Dinero llega en 5-10 días hábiles
   - Depende del banco

**Políticas Configurables:**
- Período de devolución (ej: 30 días)
- ¿Quién paga el envío de regreso?
- Productos no retornables
- Condiciones del producto

---

### Módulo 6: Descuentos y Promociones

**¿Qué hace?**
Permite crear cupones y promociones para impulsar ventas.

#### A. Tipos de Descuento

**1. Porcentaje (%)**
- Ejemplo: 10% de descuento
- Se aplica sobre el subtotal
- Límite opcional (ej: máximo $50 de descuento)

**2. Monto Fijo**
- Ejemplo: $10 de descuento
- Se resta directamente del total
- Puede tener mínimo de compra

**3. Envío Gratis**
- Elimina costo de envío
- Muy popular y efectivo
- Puede tener mínimo de compra

#### B. Configuración de Cupones

**Información Básica:**
- Código del cupón (ej: "VERANO2024")
- Descripción interna
- Tipo de descuento
- Valor del descuento

**Limitaciones:**

**Por Uso:**
- Uso total permitido (ej: solo 100 personas)
- Uso por cliente (ej: 1 vez por persona)
- Contador de usos actual

**Por Monto:**
- Compra mínima requerida
- Compra máxima (opcional)
- Aplica sobre subtotal o total

**Por Productos:**
- Aplicable a todo el catálogo
- Solo productos específicos
- Solo categorías específicas
- Excluir productos en oferta

**Por Tiempo:**
- Fecha de inicio
- Fecha de fin
- Hora específica (opcional)
- Zona horaria

**Por Cliente:**
- Solo clientes nuevos
- Solo clientes VIP
- Solo segmento específico
- Lista de emails permitidos

#### C. Ejemplos de Promociones

**Promoción de Bienvenida:**
```
Código: BIENVENIDO10
Descuento: 10%
Uso: 1 vez por cliente
Solo: Clientes nuevos
Mínimo: $30
Vigencia: Todo el año
```

**Flash Sale:**
```
Código: FLASH50
Descuento: 50%
Uso: Primeros 100 clientes
Productos: Categoría "Outlet"
Vigencia: Hoy 12pm - 6pm
Mínimo: $50
```

**Envío Gratis:**
```
Código: ENVIOGRATIS
Descuento: Envío gratis
Uso: Ilimitado
Mínimo: $100
Vigencia: Todo el mes
```

**Descuento Escalonado:**
```
SAVE10: 10% con compra de $50+
SAVE15: 15% con compra de $100+
SAVE20: 20% con compra de $200+
```

#### D. Validación Automática

Cuando un cliente aplica un cupón, el sistema verifica:

1. ✅ ¿El código existe?
2. ✅ ¿Está activo?
3. ✅ ¿Está dentro del período de vigencia?
4. ✅ ¿No ha excedido el límite de uso total?
5. ✅ ¿El cliente no ha excedido su límite personal?
6. ✅ ¿El carrito cumple el mínimo de compra?
7. ✅ ¿Los productos en el carrito son elegibles?

Si alguna validación falla, se muestra un mensaje claro al cliente.

---

### Módulo 7: Analytics y Reportes

**¿Qué hace?**
Proporciona insights sobre el negocio para tomar mejores decisiones.

#### A. Dashboard Principal

**Métricas en Tiempo Real:**

**Hoy:**
- Ventas del día actual
- Número de órdenes
- Comparación con ayer (↑ o ↓)
- Valor promedio de orden

**Esta Semana:**
- Ventas totales
- Órdenes completadas
- Nuevos clientes
- Comparación con semana anterior

**Este Mes:**
- Ingresos del mes
- Total de órdenes
- Clientes nuevos vs. recurrentes
- Comparación con mes anterior

**Visualizaciones:**
- Gráfica de ventas por día (últimos 30 días)
- Gráfica de órdenes por hora (hoy)
- Distribución de métodos de pago
- Top 5 productos más vendidos

#### B. Reportes de Productos

**Productos Más Vendidos:**
- Ranking por unidades vendidas
- Ranking por ingresos generados
- Período personalizable (7d, 30d, 90d, todo)
- Filtrable por categoría

**Productos con Bajo Rendimiento:**
- Menos vendidos en X días
- Con más vistas pero sin ventas
- Alto inventario, bajas ventas
- Sugerencia de descuento o remoción

**Stock y Reabastecimiento:**
- Productos con stock bajo
- Días de inventario restantes
- Predicción de cuándo se agotará
- Sugerencia de reorden

**Ejemplo de Alerta:**
```
⚠️ Camiseta Negra (M)
Stock actual: 5 unidades
Ventas promedio: 3 por día
Días restantes: ~2 días
Sugerencia: Reabastecer 50 unidades
```

#### C. Reportes de Clientes

**Segmentación Detallada:**

**Por Valor:**
- Top 10% de clientes (VIPs)
- Clientes de valor medio
- Clientes de bajo valor
- Clientes inactivos

**Por Frecuencia:**
- Compradores semanales
- Compradores mensuales
- Compradores ocasionales
- One-time buyers

**Por Recencia:**
- Compraron en últimos 7 días
- Compraron en últimos 30 días
- Compraron hace 30-60 días
- Compraron hace 60+ días (en riesgo)

**Lifetime Value (LTV):**
- Valor total gastado por cliente
- Promedio de gasto por orden
- Frecuencia de compra
- Predicción de valor futuro

**Análisis RFM:**
- Recency (Recencia): ¿Cuándo compró?
- Frequency (Frecuencia): ¿Qué tan seguido?
- Monetary (Monetario): ¿Cuánto gasta?

Combinando estos tres, se clasifican clientes automáticamente.

#### D. Reportes de Ventas

**Por Período:**
- Ventas diarias (gráfica)
- Ventas semanales (comparativa)
- Ventas mensuales (tendencia)
- Ventas anuales (proyección)

**Por Categoría:**
- Ingresos por categoría
- Unidades vendidas por categoría
- Margen de ganancia por categoría
- Crecimiento por categoría

**Por Canal:**
- Ventas directas en tienda
- Ventas por búsqueda orgánica
- Ventas por campañas pagadas
- Ventas por redes sociales
- Ventas por email marketing

**Por Ubicación:**
- Ventas por país
- Ventas por estado/provincia
- Ventas por ciudad
- Mapa de calor de ventas

#### E. Análisis de Conversión

**Embudo de Ventas:**

```
1000 visitantes
  ↓ (20% conversión)
200 vieron producto
  ↓ (50% conversión)
100 agregaron al carrito
  ↓ (30% conversión)
30 iniciaron checkout
  ↓ (70% conversión)
21 completaron compra

Tasa de conversión global: 2.1%
```

**Métricas Clave:**
- Tasa de abandono de carrito
- Tasa de abandono de checkout
- Tiempo promedio hasta compra
- Páginas vistas antes de comprar

**Oportunidades de Mejora:**
- Si abandono de carrito es alto: Ofrecer cupón
- Si abandono de checkout es alto: Simplificar proceso
- Si tiempo hasta compra es largo: Agregar urgencia
- Si views son altos pero ventas bajas: Revisar precio/descripción

---

### Módulo 8: Reviews y Calificaciones

**¿Qué hace?**
Permite a los clientes dejar opiniones sobre productos comprados.

#### A. Sistema de Reviews

**Componentes:**

**Calificación:**
- Estrellas (1 a 5)
- Solo clientes que compraron pueden calificar
- Verificación de compra mostrada

**Review Escrita:**
- Título corto (opcional)
- Texto de review
- Límite de caracteres
- Soporte para emojis

**Información del Reviewer:**
- Nombre (o "Cliente Verificado" si es privado)
- Fecha de review
- Badge de "Compra Verificada"
- Número de reviews hechas

#### B. Moderación

**Proceso:**

1. **Cliente deja review**
   - Después de recibir producto
   - O desde su historial de órdenes

2. **Review entra en cola**
   - Estado: "Pendiente de aprobación"
   - No visible públicamente aún

3. **Comerciante revisa**
   - Lee el review
   - Verifica que cumple políticas
   - Aprueba o rechaza

4. **Review publicada**
   - Visible en página de producto
   - Cliente notificado
   - Cuenta para promedio

**Razones para Rechazar:**
- Lenguaje ofensivo
- Spam o enlaces
- Review falso/comprado
- Información personal compartida
- No relacionado al producto

**Auto-Aprobación (Opcional):**
- Reviews con 4-5 estrellas: Auto-aprobadas
- Reviews con 1-3 estrellas: Requieren revisión
- Configurable por comerciante

#### C. Respuestas del Comerciante

**¿Para qué?**
Los comerciantes pueden responder a reviews para:
- Agradecer reviews positivos
- Explicar situaciones negativas
- Ofrecer soluciones
- Mostrar atención al cliente

**Ejemplo:**

```
⭐⭐⭐⭐⭐ "Excelente producto"
"Llegó rápido y en perfectas condiciones. Muy satisfecho."
- Juan P., 15 Feb 2024 (Compra Verificada)

  → Respuesta del vendedor:
    "¡Gracias Juan! Nos alegra que te haya gustado. 
    Esperamos verte pronto de nuevo." 
    - Tienda XYZ, 16 Feb 2024
```

#### D. Estadísticas de Reviews

**Por Producto:**
- Promedio de calificación
- Total de reviews
- Distribución por estrellas:
  * 5 estrellas: 45 reviews
  * 4 estrellas: 30 reviews
  * 3 estrellas: 10 reviews
  * 2 estrellas: 3 reviews
  * 1 estrella: 2 reviews

**Insights:**
- % de recomendación
- Palabras clave mencionadas
- Aspectos más valorados
- Aspectos a mejorar

**Uso:**
- Mostrar en página de producto
- Ordenar productos por rating
- Identificar productos problemáticos
- Mejorar descripciones de producto

---

### Módulo 9: Envíos y Logística

**¿Qué hace?**
Gestiona todo lo relacionado con el envío de productos físicos.

#### A. Zonas de Envío

**¿Qué son?**
Agrupaciones geográficas con tarifas de envío similares.

**Ejemplos:**

**Zona 1: Local**
- Mismo estado/provincia
- Ciudades cercanas
- Entrega: 1-2 días

**Zona 2: Nacional**
- Resto del país
- Entrega: 3-5 días

**Zona 3: Internacional**
- Países seleccionados
- Entrega: 7-15 días

**Configuración:**
- Nombre de la zona
- Países incluidos
- Estados/provincias incluidos
- Códigos postales específicos (opcional)

#### B. Métodos de Envío

**Por Zona:**

Cada zona puede tener múltiples métodos:

**Ejemplo para Zona Local:**

1. **Envío Estándar**
   - Costo: $5.00
   - Tiempo: 2-3 días
   - Para pedidos <5kg

2. **Envío Express**
   - Costo: $15.00
   - Tiempo: Siguiente día
   - Hasta 3pm para envío mismo día

3. **Recogida en Tienda**
   - Costo: Gratis
   - Tiempo: 2 horas
   - Horario: Lun-Vie 9am-6pm

**Cálculo de Envío:**

**Basado en Peso:**
```
0-1kg: $5
1-5kg: $10
5-10kg: $20
10kg+: $30
```

**Basado en Precio:**
```
$0-$50: $7
$50-$100: $5
$100+: Gratis
```

**Basado en Destino:**
```
Local: $5
Nacional: $12
Internacional: $25
```

**Combinado:**
- Peso + Destino
- Precio + Peso
- Todos los factores

#### C. Rastreo de Envíos

**Información Proporcionada:**

1. **Número de Rastreo**
   - Código único del paquete
   - Asignado por mensajería
   - Compartido con cliente

2. **Compañía de Envío**
   - FedEx, UPS, DHL, etc.
   - Logo y contacto
   - Horarios de atención

3. **URL de Rastreo**
   - Link directo a página de rastreo
   - Cliente puede ver en tiempo real
   - Actualizaciones automáticas

4. **Actualizaciones de Estado:**
   ```
   16 Feb, 10:00 - Paquete recogido
   16 Feb, 14:30 - En centro de distribución
   17 Feb, 08:15 - En ruta de entrega
   17 Feb, 11:40 - Entregado a Juan Pérez
   ```

**Notificaciones:**
- Email cuando se envía
- Email cuando está en camino
- Email cuando se entrega
- SMS opcional en cada paso

#### D. Etiquetas de Envío

**Generación Automática:**

El sistema puede generar etiquetas que incluyen:
- Dirección del remitente (comerciante)
- Dirección del destinatario (cliente)
- Número de orden
- Código de barras para escaneo
- Instrucciones especiales

**Impresión:**
- Formato PDF descargable
- Tamaño estándar (4x6 pulgadas)
- Compatible con impresoras térmicas
- Múltiples etiquetas en una página

---

### Módulo 10: Notificaciones y Comunicación

**¿Qué hace?**
Mantiene informados a clientes y comerciantes sobre eventos importantes.

#### A. Emails Transaccionales

**Tipos de Email:**

**Para el Cliente:**

1. **Confirmación de Orden**
   - Enviado: Al completar compra
   - Contiene: Resumen de orden, total, productos
   - Propósito: Confirmar que orden fue recibida

2. **Confirmación de Pago**
   - Enviado: Al procesar pago
   - Contiene: Método de pago, monto, fecha
   - Propósito: Confirmar transacción exitosa

3. **Orden Enviada**
   - Enviado: Al marcar como "Shipped"
   - Contiene: Tracking number, link de rastreo
   - Propósito: Informar que paquete está en camino

4. **Orden Entregada**
   - Enviado: Al confirmar entrega
   - Contiene: Invitación a dejar review
   - Propósito: Confirmar recepción

5. **Orden Cancelada**
   - Enviado: Al cancelar orden
   - Contiene: Razón, información de reembolso
   - Propósito: Explicar cancelación

6. **Reembolso Procesado**
   - Enviado: Al procesar reembolso
   - Contiene: Monto, método, tiempo estimado
   - Propósito: Confirmar devolución de dinero

**Para el Comerciante:**

1. **Nueva Orden Recibida**
   - Enviado: Al crear orden nueva
   - Contiene: Detalles de orden, cliente, productos
   - Propósito: Alerta para procesar

2. **Producto con Stock Bajo**
   - Enviado: Diariamente si hay productos bajo umbral
   - Contiene: Lista de productos, stock actual
   - Propósito: Recordar reabastecer

3. **Nueva Review Pendiente**
   - Enviado: Al recibir review nueva
   - Contiene: Producto, calificación, texto
   - Propósito: Moderar review

#### B. Personalización de Emails

**Plantillas Editables:**

Cada email tiene una plantilla que se puede personalizar:

**Variables Disponibles:**
- `{{customer_name}}` - Nombre del cliente
- `{{order_number}}` - Número de orden
- `{{order_total}}` - Total de orden
- `{{order_url}}` - Link a detalles de orden
- `{{tracking_number}}` - Número de rastreo
- `{{tracking_url}}` - Link de rastreo
- `{{store_name}}` - Nombre de la tienda
- `{{store_url}}` - URL de la tienda

**Ejemplo de Plantilla:**

```
Asunto: Tu orden {{order_number}} ha sido enviada!

Hola {{customer_name}},

Buenas noticias! Tu orden de {{store_name}} está en camino.

Número de Rastreo: {{tracking_number}}
Puedes rastrear tu paquete aquí: {{tracking_url}}

Esperamos que disfrutes tu compra!

Saludos,
Equipo de {{store_name}}
```

**Personalización Visual:**
- Logo de la tienda
- Colores corporativos
- Footer personalizado
- Links a redes sociales

#### C. Webhooks

**¿Qué son?**
Notificaciones automáticas a sistemas externos cuando sucede algo.

**¿Para qué sirven?**

Imagina que usas un sistema de contabilidad externo. Cada vez que se completa una venta, quieres que se registre automáticamente en tu contabilidad.

**Solución: Webhook**

1. Configuras webhook apuntando a tu sistema de contabilidad
2. Cada vez que hay una venta, la plataforma le "avisa" automáticamente
3. Tu sistema recibe los datos y los registra
4. Todo pasa sin intervención manual

**Eventos Disponibles:**
- `order.created` - Nueva orden creada
- `order.paid` - Orden pagada
- `order.shipped` - Orden enviada
- `order.delivered` - Orden entregada
- `order.cancelled` - Orden cancelada
- `product.out_of_stock` - Producto agotado
- `customer.created` - Nuevo cliente
- `refund.processed` - Reembolso procesado

**Configuración:**
- URL del webhook (tu servidor)
- Eventos a escuchar
- Secreto para verificación
- Reintentos automáticos si falla

---

## 🔄 Flujos de Usuario

### Flujo 1: Registro y Configuración de Tienda

**Actor: Nuevo Comerciante**

**Pasos:**

1. **Llega a la Landing Page**
   - Ve características de la plataforma
   - Compara planes
   - Click en "Empezar Gratis"

2. **Formulario de Registro**
   - Ingresa email
   - Crea contraseña segura
   - Acepta términos y condiciones
   - Click en "Crear Cuenta"

3. **Verificación de Email**
   - Recibe email de confirmación
   - Click en link de verificación
   - Redirigido a plataforma

4. **Wizard de Configuración Inicial**

   **Paso 1: Información del Negocio**
   - Nombre del negocio
   - Tipo de negocio (dropdown)
   - Subdominio deseado (mi-tienda)
   - Validación de disponibilidad

   **Paso 2: Información de Contacto**
   - Dirección física completa
   - Teléfono de contacto
   - Email de atención al cliente
   - Redes sociales (opcional)

   **Paso 3: Configuración Regional**
   - País
   - Moneda
   - Zona horaria
   - Idioma

   **Paso 4: Selección de Plan**
   - Ver comparativa de planes
   - Seleccionar plan (puede empezar con Free)
   - Ingresar datos de pago (si no es Free)
   - Confirmar

5. **Personalización Básica**
   - Subir logo
   - Elegir colores corporativos
   - Escribir descripción del negocio
   - Subir banner (opcional)

6. **Onboarding Guided Tour**
   - Tour interactivo del dashboard
   - Explicación de secciones principales
   - Video tutorial (opcional)
   - Links a documentación

7. **Primeros Pasos Sugeridos**
   - Checklist visible:
     * ✅ Cuenta creada
     * ⬜ Agregar primer producto
     * ⬜ Configurar método de envío
     * ⬜ Configurar método de pago
     * ⬜ Personalizar tienda
     * ⬜ Compartir tienda

8. **Invitación a Agregar Producto**
   - "Agregar tu primer producto" destacado
   - Plantillas de producto sugeridas
   - Importador de productos (CSV)

**Resultado:**
Tienda funcional lista para recibir el primer producto.

**Tiempo Estimado:** 10-15 minutos

---

### Flujo 2: Creación de Producto

**Actor: Comerciante**

**Pasos:**

1. **Acceder a Gestión de Productos**
   - Login al dashboard
   - Menu lateral → Productos
   - Click en "+ Agregar Producto"

2. **Información Básica**
   - Nombre del producto
   - Descripción corta (para listados)
   - Descripción larga (editor rich text)
   - SKU (auto-generado o manual)

3. **Pricing**
   - Precio de venta
   - Precio comparativo (opcional, para mostrar descuento)
   - Precio de costo (solo para reportes internos)
   - Vista previa de márgenes

4. **Inventario**
   - Toggle: ¿Rastrear inventario?
   - Si sí:
     * Cantidad inicial en stock
     * Umbral de stock bajo
     * ¿Permitir vender sin stock?
   - Si no: Stock infinito

5. **Categorización**
   - Seleccionar categorías (multi-select)
   - Crear nueva categoría (si no existe)
   - Agregar etiquetas (tags)
   - Marcar como "Destacado" (opcional)

6. **Imágenes**
   - Arrastrar y soltar imágenes
   - O seleccionar de biblioteca de medios
   - Reordenar arrastrando
   - Marcar imagen principal
   - Agregar texto alt (accesibilidad)

7. **Variantes (Opcional)**
   - Toggle: ¿Este producto tiene variantes?
   - Si sí:
     * Definir opciones (Talla, Color, Material)
     * Generar combinaciones automáticamente
     * O agregar variantes manualmente
     * Configurar precio/stock por variante

8. **Detalles de Envío**
   - Peso del producto
   - Dimensiones (L x W x H)
   - ¿Requiere envío especial?
   - Clase de envío (estándar, frágil, peligroso)

9. **SEO**
   - URL personalizada (slug)
   - Título meta
   - Descripción meta
   - Palabras clave
   - Preview de Google

10. **Visibilidad**
    - Estado:
      * Borrador (no visible)
      * Activo (visible en tienda)
      * Archivado (oculto pero guardado)
    - Programar publicación (opcional)
    - Restricciones de edad (si aplica)

11. **Revisión Final**
    - Vista previa del producto
    - Ver cómo se ve en móvil
    - Ver cómo se ve en tienda
    - Hacer ajustes

12. **Publicación**
    - Click en "Publicar"
    - Confirmación
    - Producto visible en tienda
    - Link compartible generado

**Resultado:**
Producto creado y visible en la tienda para compra.

**Tiempo Estimado:** 
- Simple (sin variantes): 5-10 minutos
- Complejo (con variantes): 15-20 minutos

---

### Flujo 3: Compra de un Cliente

**Actor: Comprador (Cliente)**

**Pasos:**

1. **Descubrimiento**
   - Llega a la tienda (mi-tienda.plataforma.com)
   - Ve página de inicio
   - Productos destacados visibles
   - Banner principal llamativo

2. **Exploración**
   - Navega por categorías
   - O usa buscador
   - Aplica filtros:
     * Precio (rango)
     * Categoría
     * Etiquetas
     * Calificación
     * Disponibilidad

3. **Ver Producto**
   - Click en producto que le interesa
   - Ve galería de imágenes
   - Lee descripción completa
   - Ve precio y descuento (si aplica)
   - Revisa calificaciones y reviews
   - Ve stock disponible

4. **Selección de Variante (si aplica)**
   - Selecciona talla
   - Selecciona color
   - Ve cambio de precio (si varía)
   - Ve disponibilidad de esa combinación

5. **Agregar al Carrito**
   - Selecciona cantidad
   - Click en "Agregar al Carrito"
   - Animación de confirmación
   - Puede:
     * Seguir comprando
     * Ver carrito
     * Ir a checkout

6. **Revisión de Carrito**
   - Ve resumen de productos
   - Puede:
     * Cambiar cantidades
     * Eliminar items
     * Aplicar cupón de descuento
   - Ve subtotal actualizado

7. **Inicio de Checkout**
   - Click en "Proceder al Pago"
   - Opción de:
     * Login (si tiene cuenta)
     * Crear cuenta
     * Continuar como invitado

8. **Información de Contacto**
   - Email
   - Nombre completo
   - Teléfono
   - Checkbox: "Crear cuenta" (opcional)

9. **Dirección de Envío**
   - Si tiene cuenta: Seleccionar dirección guardada
   - Si no:
     * Dirección completa
     * Ciudad, Estado, CP, País
     * Teléfono de contacto
     * Instrucciones especiales

10. **Método de Envío**
    - Ve opciones disponibles según su ubicación:
      * Estándar (3-5 días) - $5
      * Express (1-2 días) - $15
      * Recogida en tienda - Gratis
    - Selecciona método preferido
    - Ve actualización del total

11. **Método de Pago**
    - Opciones mostradas:
      * Tarjeta de crédito/débito
      * PayPal
      * Transferencia bancaria
    - Selecciona método
    - Ingresa información requerida
    - Datos encriptados automáticamente

12. **Revisión Final**
    - Ve resumen completo:
      * Productos y cantidades
      * Subtotal
      * Descuento aplicado
      * Impuestos
      * Envío
      * **TOTAL**
    - Revisa dirección de envío
    - Acepta términos y condiciones

13. **Confirmación de Pago**
    - Click en "Completar Orden"
    - Pantalla de carga "Procesando pago..."
    - Validación con banco (2-5 segundos)
    - Confirmación o error

14. **Página de Confirmación**
    - ✅ "¡Orden completada con éxito!"
    - Número de orden mostrado
    - Resumen de orden
    - Información de rastreo (cuando esté disponible)
    - Opciones:
      * Ver detalles de orden
      * Seguir comprando
      * Crear cuenta (si fue invitado)

15. **Emails Recibidos**
    - Inmediatamente: Confirmación de orden
    - En unas horas: Confirmación de pago
    - Cuando se envíe: Notificación de envío
    - Cuando se entregue: Confirmación de entrega

16. **Rastreo de Orden**
    - Link en email
    - O login en "Mi Cuenta"
    - Ve status actual
    - Puede:
      * Ver detalles completos
      * Descargar factura
      * Rastrear paquete
      * Contactar soporte

**Resultado:**
Orden completada exitosamente, cliente satisfecho, comerciante notificado.

**Tiempo Estimado:**
- Cliente experimentado: 3-5 minutos
- Cliente nuevo: 7-10 minutos

---

### Flujo 4: Procesamiento de Orden (Comerciante)

**Actor: Comerciante**

**Pasos:**

1. **Notificación de Nueva Orden**
   - Email recibido
   - Notificación en dashboard
   - Sonido de alerta (opcional)
   - Badge de número de órdenes pendientes

2. **Revisión de Orden**
   - Login al dashboard
   - Menu → Órdenes
   - Ve nueva orden destacada
   - Click para ver detalles

3. **Verificación de Información**
   - Revisa productos ordenados
   - Verifica disponibilidad de stock
   - Revisa dirección de envío
   - Ve método de pago y estado

4. **Validación de Pago**
   - Verifica que pago fue procesado
   - Revisa posibles señales de fraude:
     * Dirección sospechosa
     * Múltiples órdenes seguidas
     * Tarjeta internacional con envío local
   - Si todo está bien, continúa
   - Si hay dudas, contacta al cliente

5. **Preparación de Productos**
   - Localiza productos en bodega
   - Verifica calidad
   - Empaca apropiadamente:
     * Material de protección
     * Caja o sobre
     * Incluye factura
     * Incluye nota de agradecimiento (opcional)

6. **Generación de Etiqueta**
   - En sistema: Click en "Generar Etiqueta"
   - Selecciona compañía de envío
   - Ingresa peso del paquete
   - Sistema genera PDF con etiqueta
   - Imprime e incluye en paquete

7. **Actualización de Status**
   - Marca orden como "En Procesamiento"
   - Cliente recibe notificación automática

8. **Envío del Paquete**
   - Llama a mensajería o lleva a sucursal
   - Obtiene número de rastreo
   - Ingresa en sistema:
     * Número de rastreo
     * Compañía
     * Fecha de envío
   - Marca orden como "Enviada"

9. **Notificación Automática**
   - Sistema envía email al cliente con:
     * Confirmación de envío
     * Número de rastreo
     * Link de rastreo
     * Tiempo estimado de llegada

10. **Seguimiento**
    - Monitorea status del envío
    - Ve updates de la mensajería
    - Si hay retraso, contacta cliente proactivamente

11. **Confirmación de Entrega**
    - Mensajería confirma entrega
    - Sistema marca orden como "Entregada"
    - Email automático al cliente
    - Invitación a dejar review

12. **Cierre de Orden**
    - Orden completada
    - Ingresos registrados
    - Stock actualizado
    - Métricas actualizadas

**Resultado:**
Orden procesada exitosamente, producto entregado, cliente satisfecho.

**Tiempo Invertido:**
- Revisión y validación: 2-3 minutos
- Preparación y empaque: 10-15 minutos
- Actualización de sistema: 2-3 minutos
- **Total por orden: ~20 minutos**

---

### Flujo 5: Gestión de Reembolso

**Actor: Comerciante + Cliente**

**Pasos:**

**Solicitud del Cliente:**

1. **Cliente Solicita Devolución**
   - Login a su cuenta
   - Ve historial de órdenes
   - Selecciona orden a devolver
   - Click en "Solicitar Devolución"

2. **Formulario de Devolución**
   - Selecciona producto(s) a devolver
   - Razón de devolución:
     * Producto defectuoso
     * Producto incorrecto
     * No coincide con descripción
     * Ya no lo necesito
     * Otra (especificar)
   - Sube fotos del producto (si aplica)
   - Escribe descripción detallada
   - Submit

3. **Confirmación**
   - "Solicitud recibida"
   - Número de caso de devolución
   - Tiempo estimado de respuesta (24-48 hrs)
   - Instrucciones de envío de vuelta

**Procesamiento del Comerciante:**

4. **Notificación al Comerciante**
   - Email de alerta
   - Dashboard: Badge en "Devoluciones"
   - Prioridad según plan del cliente

5. **Revisión de Solicitud**
   - Lee razón de devolución
   - Ve fotos adjuntas
   - Revisa políticas de devolución:
     * ¿Está dentro del período? (ej: 30 días)
     * ¿Producto es retornable?
     * ¿Condiciones aceptables?

6. **Decisión**

   **Opción A: Aprobar**
   - Click en "Aprobar Devolución"
   - Selecciona tipo de reembolso:
     * Completo (100%)
     * Parcial (especificar monto)
     * Crédito en tienda
   - Genera etiqueta de retorno (opcional)
   - Instrucciones para cliente

   **Opción B: Rechazar**
   - Click en "Rechazar Devolución"
   - Razón del rechazo
   - Ofrecer alternativa (descuento, cambio)

7. **Notificación al Cliente**
   - Email con decisión
   - Si aprobado:
     * Etiqueta de retorno adjunta
     * Instrucciones de envío
     * Dirección de retorno
   - Si rechazado:
     * Razón explicada
     * Alternativas ofrecidas

**Retorno Físico:**

8. **Cliente Envía Producto**
   - Empaca producto
   - Usa etiqueta proporcionada
   - Envía vía mensajería
   - Guarda recibo

9. **Comerciante Recibe Producto**
   - Inspecciona condición
   - Verifica que es el producto correcto
   - Documenta con fotos

10. **Actualización de Status**
    - Marca como "Producto Recibido"
    - Cliente notificado

**Procesamiento de Reembolso:**

11. **Inicia Reembolso**
    - En sistema: "Procesar Reembolso"
    - Confirma monto
    - Selecciona método original de pago
    - Click en "Confirmar Reembolso"

12. **Procesamiento por Gateway**
    - Sistema contacta Stripe/PayPal
    - Procesa reembolso
    - Confirmación recibida
    - Generalmente 2-3 minutos

13. **Notificación Final**
    - Email al cliente:
      * "Reembolso procesado"
      * Monto reembolsado
      * Método (tarjeta terminada en XXXX)
      * Tiempo estimado de llegada (5-10 días)
    - Status actualizado a "Reembolsado"

14. **Actualización de Inventario**
    - Si producto en buenas condiciones:
      * Stock restaurado
      * Producto disponible de nuevo
    - Si producto dañado:
      * Stock no restaurado
      * Pérdida registrada

**Resultado:**
Devolución procesada, cliente reembolsado, relación preservada.

**Tiempo Total:**
- Solicitud del cliente: 5-10 minutos
- Revisión del comerciante: 10-15 minutos
- Envío de retorno: 3-7 días
- Inspección y reembolso: 15-20 minutos
- Llegada de dinero al cliente: 5-10 días

---

## 🔒 Seguridad y Aislamiento

### Row Level Security (RLS) Explicado

**¿Qué es?**

Row Level Security es como tener un guardia de seguridad en cada fila de cada tabla de la base de datos. Cada vez que alguien intenta acceder a datos, el guardia pregunta: "¿Tienes permiso para ver esto?"

**Ejemplo sin RLS:**

```
Todas las tiendas en una tabla:

ID | tenant_id    | nombre_tienda    | ventas_mes
1  | tienda-A     | Zapatería Pedro  | $10,000
2  | tienda-B     | Ropa María       | $15,000
3  | tienda-C     | Tech Store       | $25,000

Si Pedro hace una consulta:
Pedro ve: TODAS las filas (problema de seguridad!)
```

**Ejemplo con RLS:**

```
Pedro hace login → Sistema sabe que Pedro es dueño de "tienda-A"

Pedro hace consulta → RLS automáticamente agrega filtro

Pedro ve solo:
ID | tenant_id    | nombre_tienda    | ventas_mes
1  | tienda-A     | Zapatería Pedro  | $10,000

María hace login → Sistema sabe que María es dueña de "tienda-B"
María ve solo sus datos de "tienda-B"

¡Imposible que Pedro vea datos de María!
```

**¿Cómo Funciona Internamente?**

1. **Usuario se autentica**
   - Login con email/password
   - Sistema genera JWT token
   - Token contiene: user_id, email, rol

2. **Usuario hace request**
   - Request incluye JWT token
   - Sistema valida token
   - Extrae user_id

3. **Sistema busca tenant(s) del usuario**
   - Consulta: "¿De qué tenants es miembro este usuario?"
   - Obtiene lista de tenant_ids
   - Ejemplo: ["tienda-A"]

4. **Cada query se filtra automáticamente**
   - Usuario pide: "Dame todos mis productos"
   - Sistema convierte a: "Dame productos WHERE tenant_id IN ('tienda-A')"
   - Usuario NUNCA ve esto, pasa automáticamente

5. **Validación en escritura también**
   - Usuario intenta crear producto
   - Sistema verifica: "¿Este usuario puede escribir en este tenant?"
   - Si sí: Permite
   - Si no: Error "Permission denied"

**Ventajas:**

✅ **Automático**: No hay que recordar agregar filtros
✅ **A prueba de errores**: Imposible olvidar filtrar
✅ **Consistente**: Aplica en TODA la aplicación
✅ **Seguro**: Imposible bypassear desde el código
✅ **Performance**: Optimizado por la base de datos

**Políticas Implementadas:**

1. **Políticas Públicas** (Storefront)
   - Cualquiera puede ver productos activos
   - Cualquiera puede ver categorías activas
   - Cualquiera puede crear clientes (checkout)
   - Cualquiera puede crear órdenes (comprar)

2. **Políticas de Usuario Autenticado**
   - Ver sus propias órdenes
   - Ver su perfil de cliente
   - Modificar sus direcciones
   - Dejar reviews en productos comprados

3. **Políticas de Miembro de Tenant**
   - Ver productos del tenant
   - Crear/editar productos
   - Ver órdenes del tenant
   - Actualizar órdenes
   - Ver analytics del tenant
   - Gestionar clientes del tenant

4. **Políticas de Owner**
   - Todo lo anterior +
   - Editar configuración del tenant
   - Invitar/remover miembros
   - Cambiar plan de suscripción
   - Eliminar tenant

5. **Políticas de Superadmin**
   - Ver TODOS los tenants
   - Editar cualquier tenant
   - Acceder a métricas globales
   - Gestionar planes
   - Suspender/activar tenants

### Encriptación de Datos

**En Tránsito:**
- HTTPS/TLS obligatorio
- Certificado SSL válido
- HSTS habilitado
- Conexiones inseguras rechazadas

**En Reposo:**
- Base de datos encriptada
- Backups encriptados
- Passwords hasheados (bcrypt)
- Datos sensibles encriptados (pgcrypto)

**En Procesamiento:**
- Datos de tarjeta nunca almacenados
- Solo tokens de Stripe/PayPal
- PCI DSS compliant
- 3D Secure para autenticación

### Audit Logs

**¿Qué se registra?**

Toda acción importante deja un rastro:

```
16 Feb 2024, 10:30:15
Usuario: pedro@example.com (ID: user-123)
Acción: UPDATE
Recurso: products (ID: prod-456)
Tenant: tienda-A
IP: 192.168.1.1
Cambios:
  - precio: $20 → $25
  - stock: 100 → 95
```

**Uso:**
- Auditorías de seguridad
- Resolver disputas
- Debugging de problemas
- Cumplimiento regulatorio
- Análisis forense

---

## 📈 Escalabilidad

### Arquitectura Escalable

**Horizontal Scaling:**

A medida que crece el negocio:

```
Etapa 1: Startup (0-100 tenants)
┌─────────────┐
│ Single      │
│ Server      │
│ PostgreSQL  │
└─────────────┘

Etapa 2: Crecimiento (100-1,000 tenants)
┌──────────┐    ┌──────────┐
│ Primary  │───>│ Replica  │
│ Server   │    │ (Read)   │
└──────────┘    └──────────┘

Etapa 3: Escala (1,000-10,000 tenants)
                ┌──────────┐
                │ Load     │
                │ Balancer │
                └────┬─────┘
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼───┐  ┌───▼────┐  ┌──▼─────┐
    │ App 1  │  │ App 2  │  │ App 3  │
    └────┬───┘  └───┬────┘  └──┬─────┘
         │          │           │
         └──────────┼───────────┘
                    │
           ┌────────▼────────┐
           │   PostgreSQL    │
           │   Cluster       │
           │ (Master+Replicas│
           └─────────────────┘

Etapa 4: Hiper-escala (10,000+ tenants)
- CDN global
- Caching layer (Redis)
- Database sharding por región
- Microservicios
```

### Performance Optimizations

**Database Level:**
- 80+ índices estratégicos
- Partial indexes (solo datos activos)
- Covering indexes (evitan lookup)
- GIN indexes (búsquedas full-text)
- B-tree indexes (lookups rápidos)

**Application Level:**
- Connection pooling (PgBouncer)
- Query caching
- Result caching
- Rate limiting
- Debouncing de requests

**Frontend Level:**
- Code splitting (lazy loading)
- Image optimization (WebP, lazy load)
- CDN para assets estáticos
- Service workers (PWA)
- Gzip/Brotli compression

**Infraestructura:**
- Auto-scaling de servers
- Database read replicas
- Geographic distribution
- DDoS protection
- WAF (Web Application Firewall)

### Monitoring y Alerts

**Métricas Monitoreadas:**

**Application:**
- Request latency (p50, p95, p99)
- Error rate
- Throughput (requests/second)
- Active users

**Database:**
- Query performance
- Connection pool usage
- Disk usage
- Replication lag
- Slow queries

**Business:**
- Tenants activos
- Órdenes por minuto
- Revenue por hora
- Tasa de conversión

**Alertas Automáticas:**
- Error rate > 1%
- Latency > 500ms
- Disk usage > 80%
- Failed payments spike
- Unusual traffic patterns

---

## 🎯 Casos de Uso

### Caso 1: Boutique de Ropa

**Perfil:**
- Negocio pequeño
- 200 productos
- 50-100 órdenes/mes
- 1-2 personas gestionando

**Uso de la Plataforma:**

**Setup Inicial:**
- Plan Basic ($29/mes)
- Personalización completa con colores de marca
- 5 categorías principales (Mujer, Hombre, Niños, Accesorios, Ofertas)
- Integración con Instagram

**Operación Diaria:**
- Recibe 3-5 órdenes por día
- Procesa órdenes en la tarde
- Envía vía mensajería local
- Responde mensajes en dashboard

**Características Usadas:**
- Variantes de producto (tallas, colores)
- Galería de imágenes (5-7 por producto)
- Cupones de descuento estacionales
- Reviews de clientes
- Analytics básico

**Beneficios:**
- Costo bajo comparado con tienda física
- Alcance nacional
- Gestión desde smartphone
- Inventario automatizado

---

### Caso 2: Electrónica Mayorista

**Perfil:**
- Negocio mediano
- 2,000+ productos
- 500-1,000 órdenes/mes
- Equipo de 5 personas

**Uso de la Plataforma:**

**Setup Inicial:**
- Plan Professional ($79/mes)
- Subdominios personalizados
- Integración con ERP
- Webhooks a sistema de contabilidad

**Operación Diaria:**
- Equipo de 3 personas procesando órdenes
- 1 persona gestionando inventario
- 1 persona atención al cliente
- Importación diaria de precios vía CSV

**Características Usadas:**
- Catálogo masivo con búsqueda avanzada
- Descuentos por volumen
- Múltiples métodos de pago
- Facturación electrónica
- Analytics avanzado
- API para integraciones
- Múltiples usuarios con roles

**Beneficios:**
- Automatización de procesos
- Reducción de errores
- Escalabilidad sin contratar más personal
- Insights de negocio en tiempo real

---

### Caso 3: Marketplace de Artesanías

**Perfil:**
- 50 artesanos vendiendo
- 5,000+ productos únicos
- 2,000+ órdenes/mes
- Modelo de comisión

**Uso de la Plataforma:**

**Setup Inicial:**
- Plan Enterprise ($299/mes)
- Desarrollo custom de multiples tiendas dentro de un tenant
- API completa habilitada
- Soporte dedicado

**Operación Diaria:**
- Cada artesano gestiona sus productos
- Plataforma gestiona pagos y split de comisiones
- Artesanos ven solo sus ventas
- Admin ve todo

**Características Usadas:**
- Multi-usuario con permisos granulares
- Dashboard por vendedor
- Comisiones automáticas
- Pagos programados a vendedores
- Reviews unificados
- Chat interno

**Beneficios:**
- Consolidación de múltiples negocios
- Economía de escala
- Brand unificado
- Experiencia de compra consistente

---

## 📊 Métricas de Éxito

**Para la Plataforma:**
- Tenants activos
- Churn rate (cancelaciones)
- MRR (Monthly Recurring Revenue)
- Uptime del sistema
- Satisfaction score

**Para los Comerciantes:**
- Órdenes completadas
- Revenue total
- Tasa de conversión
- Valor promedio de orden
- Customer retention

**Para los Clientes:**
- Tiempo de carga < 2s
- Checkout completion rate > 70%
- Return rate < 5%
- 5-star reviews

---

## 🎓 Conclusión

Esta plataforma SaaS de ecommerce multi-tenant proporciona una solución completa, escalable y segura para que múltiples comerciantes puedan vender en línea sin la complejidad de crear y mantener su propia infraestructura.

**Ventajas Clave:**
✅ Aislamiento total entre tenants
✅ Personalización por marca
✅ Escalabilidad automática
✅ Seguridad robusta
✅ Analytics incorporados
✅ Automatización de procesos
✅ Costos compartidos

**Tecnologías Modernas:**
- PostgreSQL con RLS
- Supabase (BaaS)
- Angular 21 (Frontend)
- TypeScript
- Signals (Reactividad)

**Listo para Producción:**
- Backups automáticos
- Monitoring integrado
- Audit logs completos
- Documentación exhaustiva
- Soporte multi-idioma

Esta documentación cubre la arquitectura completa del sistema, sus módulos, flujos y casos de uso. Para implementación técnica, consulta los documentos de código y API.