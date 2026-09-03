import { TroubleshootingGuide } from '@core/models/support';

export const TROUBLESHOOTING_GUIDES: TroubleshootingGuide[] = [
  {
    id: 'trouble-shipping',
    title: '¿Por qué los clientes no pueden calcular el envío en el Checkout?',
    category: 'shipping_taxes',
    summary:
      'Si un cliente ingresa su dirección y no ve opciones de envío disponibles, suele deberse a que su país o región no está cubierto por una Zona de Envío.',
    commonCauses: [
      'No se ha creado una Zona de Envío para el país de destino del cliente.',
      'La zona existe pero no tiene ninguna tarifa activa (Tarifa Fija, por Peso o por Precio).',
      'El peso o valor total del pedido no entra en los rangos mínimos/máximos de la tarifa.',
    ],
    solutionSteps: [
      'Ve a Configuración > Envíos e Impuestos.',
      'Revisa si el país del comprador está incluido en alguna de tus Zonas de Envío.',
      'Asegúrate de agregar al menos una tarifa (ej. "Envío Estándar") y guardar los cambios.',
    ],
    actionLabel: 'Configurar Envíos',
    actionRoute: '/settings',
    queryParams: { tab: 'shipping-taxes' },
  },
  {
    id: 'trouble-draft-publish',
    title: '¿Por qué no se ven los cambios de diseño en mi tienda pública?',
    category: 'theme_storefront',
    summary:
      'Venti Shop utiliza un sistema de Borrador y Publicación para que puedas experimentar sin alterar tu tienda en vivo.',
    commonCauses: [
      'Guardaste cambios en el modo Borrador pero aún no has hecho clic en el botón "Publicar Cambios".',
      'El navegador del cliente tiene la versión anterior en caché.',
    ],
    solutionSteps: [
      'Entra a Configuración > Temas o Secciones.',
      'Verifica en la barra superior si dice "Borrador con cambios pendientes".',
      'Haz clic en el botón verde "Publicar" en la esquina superior derecha.',
    ],
    actionLabel: 'Ir al Editor de Tienda',
    actionRoute: '/settings',
    queryParams: { tab: 'storefront' },
  },
  {
    id: 'trouble-domain-dns',
    title: '¿Cómo configurar y verificar mi Dominio Personalizado?',
    category: 'domain_dns',
    summary:
      'Puedes conectar tu propio dominio (ej. mitienda.com) para que los clientes no tengan que usar el subdominio por defecto.',
    commonCauses: [
      'El registro DNS CNAME no apunta correctamente al servidor de Venti.',
      'La propagación DNS aún está en curso (puede tomar de 15 minutos a 24 horas).',
    ],
    solutionSteps: [
      'Ve a tu proveedor de dominio (GoDaddy, Namecheap, Cloudflare, etc.).',
      'Crea un registro CNAME apuntando a "cname.ventishop.com".',
      'En Venti Shop ve a Configuración > General > Dominio y haz clic en "Verificar Dominio".',
    ],
    actionLabel: 'Verificar Dominio',
    actionRoute: '/settings',
    queryParams: { tab: 'general' },
  },
  {
    id: 'trouble-stock-sold-out',
    title: '¿Por qué mi producto aparece como "Agotado" si acabo de crearlo?',
    category: 'catalog_products',
    summary:
      'Los productos con inventario cero o sin variantes configuradas se marcan automáticamente como fuera de stock en el storefront.',
    commonCauses: [
      'El campo "Cantidad en Stock" se dejó en 0.',
      'El producto tiene variantes (tallas/colores) y ninguna de las variantes tiene inventario disponible.',
    ],
    solutionSteps: [
      'Ve a Catálogo de Productos y edita el producto afectado.',
      'Verifica la sección de Inventario o la tabla de Variantes.',
      'Ajusta las cantidades disponibles y guarda los cambios.',
    ],
    actionLabel: 'Revisar Productos',
    actionRoute: '/products',
  },
  {
    id: 'trouble-tax-rates',
    title: '¿Cómo aplicar impuestos (IVA) automáticamente en las compras?',
    category: 'shipping_taxes',
    summary:
      'Si necesitas cobrar impuestos según el país o estado del cliente, debes activar las tasas correspondientes.',
    commonCauses: [
      'No hay tasas de impuestos registradas para la ubicación del comprador.',
      'La tasa está creada pero está marcada como inactiva.',
    ],
    solutionSteps: [
      'Entra a Configuración > Envíos e Impuestos > Tasas de Impuesto.',
      'Agrega tu porcentaje de impuesto (ej. 19% o 16%) indicando el país o región.',
      'Verifica que el estado esté activo.',
    ],
    actionLabel: 'Configurar Impuestos',
    actionRoute: '/settings',
    queryParams: { tab: 'shipping-taxes' },
  },
  {
    id: 'trouble-store-not-visible',
    title: '¿Por qué mi tienda todavía no está visible para los clientes?',
    category: 'store_setup',
    summary:
      'Una tienda puede estar lista en el panel pero permanecer oculta mientras no esté activa o publicada.',
    commonCauses: [
      'La tienda aún está en modo borrador o no ha sido activada.',
      'No se ha configurado un dominio o subdominio válido.',
    ],
    solutionSteps: [
      'Revisa el estado de la tienda desde el selector de tiendas.',
      'Confirma que exista al menos un producto activo.',
      'Abre la URL pública en una ventana de incógnito para comprobar el resultado.',
    ],
    actionLabel: 'Revisar Configuración',
    actionRoute: '/settings',
    queryParams: { tab: 'general' },
  },
  {
    id: 'trouble-product-not-published',
    title: '¿Por qué un producto no aparece en la tienda?',
    category: 'catalog_products',
    summary:
      'El producto debe estar activo, tener información comercial básica y estar disponible para el storefront.',
    commonCauses: [
      'El producto está guardado como borrador o inactivo.',
      'El producto no tiene precio o está asignado a una colección que no se muestra.',
    ],
    solutionSteps: [
      'Edita el producto y cambia su estado a Activo.',
      'Completa el precio, la imagen principal y la descripción.',
      'Comprueba la tienda pública después de guardar.',
    ],
    actionLabel: 'Revisar Catálogo',
    actionRoute: '/products',
  },
  {
    id: 'trouble-product-image',
    title: '¿Por qué no se carga la imagen de un producto?',
    category: 'catalog_products',
    summary:
      'Las imágenes deben terminar de subirse y utilizar un formato compatible para mostrarse correctamente.',
    commonCauses: [
      'El archivo supera el tamaño permitido o usa un formato no compatible.',
      'La conexión se interrumpió durante la carga.',
    ],
    solutionSteps: [
      'Usa una imagen JPG, PNG o WebP optimizada.',
      'Elimina la imagen fallida y vuelve a cargarla con una conexión estable.',
      'Guarda el producto y verifica la miniatura antes de publicarlo.',
    ],
    actionLabel: 'Abrir Productos',
    actionRoute: '/products',
  },
  {
    id: 'trouble-variant-options',
    title: '¿Por qué no puedo seleccionar una variante en el storefront?',
    category: 'catalog_products',
    summary:
      'Las opciones de variante deben tener valores definidos y stock disponible para poder seleccionarse.',
    commonCauses: [
      'Una opción no tiene valores o contiene nombres duplicados.',
      'La variante seleccionada está agotada o inactiva.',
    ],
    solutionSteps: [
      'Revisa las opciones de talla, color u otra característica.',
      'Confirma que cada combinación tenga precio y cantidad disponible.',
      'Guarda los cambios y prueba cada combinación desde la tienda pública.',
    ],
    actionLabel: 'Editar Variantes',
    actionRoute: '/products',
  },
  {
    id: 'trouble-checkout-payment',
    title: '¿Por qué un cliente no puede completar el pago?',
    category: 'payments_commissions',
    summary:
      'El checkout necesita al menos un método de pago activo y una configuración válida para la tienda.',
    commonCauses: [
      'El proveedor de pagos no está conectado o sus credenciales no son válidas.',
      'El método de pago está en modo prueba o inactivo.',
    ],
    solutionSteps: [
      'Ve a Configuración y revisa el estado de tus métodos de pago.',
      'Confirma que la cuenta del proveedor esté verificada.',
      'Realiza una compra de prueba antes de compartir la tienda.',
    ],
    actionLabel: 'Configurar Pagos',
    actionRoute: '/settings',
    queryParams: { tab: 'payments' },
  },
  {
    id: 'trouble-payment-pending',
    title: '¿Por qué un pedido aparece como pago pendiente?',
    category: 'payments_commissions',
    summary: 'Un pago pendiente indica que el proveedor aún no ha confirmado la transacción.',
    commonCauses: [
      'El cliente abandonó el proceso antes de finalizarlo.',
      'La confirmación del proveedor está tardando o fue rechazada.',
    ],
    solutionSteps: [
      'Abre el pedido y revisa el mensaje devuelto por el proveedor.',
      'No marques el pedido como pagado sin confirmar el movimiento.',
      'Contacta al cliente si el estado no cambia después del tiempo esperado.',
    ],
    actionLabel: 'Ver Pedidos',
    actionRoute: '/orders',
  },
  {
    id: 'trouble-order-not-found',
    title: '¿Por qué no encuentro un pedido reciente?',
    category: 'store_setup',
    summary:
      'Los pedidos se muestran dentro de la tienda activa y pueden filtrarse por estado, fecha o cliente.',
    commonCauses: [
      'Estás consultando otra tienda del mismo usuario.',
      'Hay un filtro activo que oculta el pedido.',
    ],
    solutionSteps: [
      'Confirma la tienda seleccionada en el panel.',
      'Limpia los filtros de fecha y estado.',
      'Busca el pedido por correo del cliente o número de orden.',
    ],
    actionLabel: 'Abrir Pedidos',
    actionRoute: '/orders',
  },
  {
    id: 'trouble-coupon-not-applying',
    title: '¿Por qué un cupón no se aplica al carrito?',
    category: 'billing',
    summary: 'Los cupones pueden depender de fechas, productos, montos mínimos o límites de uso.',
    commonCauses: [
      'El cupón está vencido, inactivo o ya alcanzó su límite de usos.',
      'El carrito no cumple el monto mínimo o las condiciones de productos.',
    ],
    solutionSteps: [
      'Revisa las fechas, el estado y el límite de uso del cupón.',
      'Confirma los productos y categorías incluidos.',
      'Prueba el código con un carrito que cumpla todas las condiciones.',
    ],
    actionLabel: 'Revisar Cupones',
    actionRoute: '/coupons',
  },
  {
    id: 'trouble-billing-plan',
    title: '¿Cómo cambiar o revisar mi plan de suscripción?',
    category: 'billing',
    summary: 'El plan controla los límites y funciones disponibles para cada tienda.',
    commonCauses: [
      'El usuario no tiene permisos para administrar la suscripción.',
      'El cambio de plan está pendiente de confirmación de pago.',
    ],
    solutionSteps: [
      'Entra a la sección de Suscripción desde el panel.',
      'Revisa el plan activo y la fecha del próximo cobro.',
      'Confirma cualquier actualización con el método de pago autorizado.',
    ],
    actionLabel: 'Ver Suscripción',
    actionRoute: '/subscription',
  },
  {
    id: 'trouble-customer-login',
    title: '¿Por qué un cliente no puede iniciar sesión?',
    category: 'store_setup',
    summary:
      'El acceso del cliente depende de que su correo esté registrado y de que complete la verificación requerida.',
    commonCauses: [
      'El correo no está registrado o la contraseña es incorrecta.',
      'El enlace de recuperación expiró o fue bloqueado por el correo del cliente.',
    ],
    solutionSteps: [
      'Pide al cliente que confirme el correo usado en el registro.',
      'Solicita un nuevo enlace de recuperación de contraseña.',
      'Revisa si el correo de verificación llegó a spam o promociones.',
    ],
    actionLabel: 'Revisar Clientes',
    actionRoute: '/customers',
  },
  {
    id: 'trouble-email-not-received',
    title: '¿Por qué no llegan los correos de confirmación?',
    category: 'other',
    summary:
      'Los correos transaccionales pueden retrasarse o ser filtrados por el proveedor del destinatario.',
    commonCauses: [
      'El correo del cliente contiene un error o el mensaje llegó a spam.',
      'La configuración de correo de la tienda está incompleta.',
    ],
    solutionSteps: [
      'Confirma la dirección de correo en el pedido o perfil del cliente.',
      'Pide al destinatario revisar spam, promociones y filtros.',
      'Verifica la configuración de notificaciones y envía una prueba.',
    ],
    actionLabel: 'Abrir Soporte',
    actionRoute: '/support',
  },
  {
    id: 'trouble-mobile-layout',
    title: '¿Por qué mi tienda se ve mal en el celular?',
    category: 'theme_storefront',
    summary:
      'Algunas imágenes, textos o secciones necesitan ajustes específicos para pantallas pequeñas.',
    commonCauses: [
      'El banner utiliza una imagen demasiado ancha o texto difícil de leer.',
      'Una sección tiene contenido que excede el ancho disponible.',
    ],
    solutionSteps: [
      'Abre el editor y revisa la vista previa móvil.',
      'Usa imágenes optimizadas para móvil y títulos más breves.',
      'Publica los cambios y comprueba la tienda desde un teléfono real.',
    ],
    actionLabel: 'Editar Tienda',
    actionRoute: '/settings',
    queryParams: { tab: 'theme' },
  },
  {
    id: 'trouble-team-access',
    title: '¿Por qué un miembro del equipo no puede acceder?',
    category: 'store_setup',
    summary:
      'El acceso depende de que la invitación esté vigente y de los permisos asignados a la tienda.',
    commonCauses: [
      'La invitación expiró o fue enviada a otro correo.',
      'El miembro no tiene un rol con permiso para la sección que intenta abrir.',
    ],
    solutionSteps: [
      'Revisa el estado de la invitación y vuelve a enviarla si es necesario.',
      'Confirma que el correo del miembro sea correcto.',
      'Ajusta su rol o permisos desde la administración de miembros.',
    ],
    actionLabel: 'Administrar Miembros',
    actionRoute: '/members',
  },
  {
    id: 'trouble-dashboard-data',
    title: '¿Por qué los datos del panel no se han actualizado?',
    category: 'other',
    summary: 'Las métricas pueden tardar unos minutos en reflejar pedidos o cambios recientes.',
    commonCauses: [
      'El rango de fechas o la tienda seleccionada no corresponde al dato buscado.',
      'La sesión mantiene información anterior mientras termina la sincronización.',
    ],
    solutionSteps: [
      'Confirma la tienda y el rango de fechas del panel.',
      'Actualiza la vista después de verificar que el pedido esté confirmado.',
      'Compara el resultado con el listado de pedidos para detectar diferencias.',
    ],
    actionLabel: 'Ir al Panel',
    actionRoute: '/dashboard',
  },
  {
    id: 'trouble-review-not-visible',
    title: '¿Por qué una reseña no aparece publicada?',
    category: 'other',
    summary:
      'Las reseñas pueden quedar pendientes mientras se revisan o si la moderación está desactivada.',
    commonCauses: [
      'La reseña está pendiente de moderación o fue marcada como oculta.',
      'El producto relacionado está inactivo o no admite reseñas visibles.',
    ],
    solutionSteps: [
      'Ve a la sección de Reseñas y revisa los estados pendientes.',
      'Aprueba la reseña si cumple tus criterios de publicación.',
      'Confirma que el producto relacionado esté activo en la tienda.',
    ],
    actionLabel: 'Revisar Reseñas',
    actionRoute: '/reviews',
  },
];
