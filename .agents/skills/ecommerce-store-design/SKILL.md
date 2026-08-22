---
name: ecommerce-store-design
description: 'Diseña y mejora tiendas virtuales y experiencias ecommerce multi-tenant. Usar para personalización visual, temas, design tokens, constructores de storefront, layouts responsive, previews, headers, footers, tarjetas de producto, checkout, accesibilidad y diferenciación de tiendas Angular/Tailwind.'
argument-hint: 'Describe la tienda, el estilo deseado y la sección ecommerce que quieres mejorar.'
user-invocable: true
disable-model-invocation: false
---

# Diseño de Tiendas Ecommerce

## Objetivo

Crear storefronts que puedan verse y sentirse diferentes aunque compartan la plataforma Venti. La personalización debe afectar la identidad visual, la composición, la densidad de información, los componentes y el comportamiento responsive.

## Cuándo usarla

- Crear o mejorar el constructor de tiendas.
- Diseñar temas, presets o design tokens por tenant.
- Personalizar home, catálogo, producto, carrito o checkout.
- Revisar una preview visual o corregir problemas responsive.
- Diseñar headers, footers, banners, tarjetas y secciones ecommerce.
- Evaluar accesibilidad, conversión y claridad de una tienda.

## Flujo de trabajo

1. **Inspeccionar el contexto**
   - Identificar framework, sistema CSS, componentes reutilizables, modelos de tenant y datos disponibles.
   - Revisar la preview, la tienda pública y los puntos donde se aplican branding y layout.
   - Formular una hipótesis concreta sobre el problema visual y una comprobación rápida.

2. **Definir la personalidad de la tienda**
   - Preguntar o inferir categoría, público, nivel de precio y tono de marca.
   - Elegir una dirección visual clara: editorial, lujo, deportiva, artesanal, tecnológica, minimalista, etc.
   - Evitar diseños genéricos basados únicamente en tarjetas, gradientes o una sola familia cromática.

3. **Diseñar el sistema visual**
   - Preferir tokens por tenant para colores, tipografías, radios, sombras, bordes, espaciado y ancho de contenido.
   - Separar fuente de títulos, cuerpo y elementos de acción.
   - Permitir variantes de densidad, contraste, forma de botones y estilo de tarjetas.
   - Garantizar contraste, foco visible y estados hover/focus/disabled.

4. **Diseñar la estructura**
   - Permitir ordenar, duplicar, activar y ocultar secciones por dispositivo.
   - Soportar variantes de hero, header, navegación, catálogo, producto, testimonios, galería, newsletter y footer.
   - Hacer que cada sección tenga configuración propia de fondo, texto, imagen, espaciado y alineación.
   - Diferenciar desktop, tablet y móvil con reglas explícitas, no solo escalado automático.

5. **Cuidar el ecommerce**
   - Mantener visibles precio, disponibilidad, descuento, variantes y acción principal.
   - Reducir pasos en búsqueda, filtrado, carrito y checkout.
   - Usar etiquetas claras para `Nuevo`, `Oferta`, `Agotado` y `Compra verificada`.
   - No sacrificar legibilidad por decoración.

6. **Mantener la preview fiel**
   - Reflejar cambios de colores, tipografías, navegación, imágenes, textos, precios y secciones en tiempo real.
   - Ofrecer vistas desktop, tablet y móvil con scroll interno.
   - Mostrar estados de carga, error y ausencia de contenido.
   - Diferenciar `Guardar borrador`, `Vista previa` y `Publicar` cuando exista flujo de publicación.

7. **Validar antes de terminar**
   - Probar desktop y móvil, incluyendo contenido largo y listas vacías.
   - Revisar desbordamientos, contraste, foco, labels, alt text y navegación por teclado.
   - Ejecutar typecheck, lint, tests o build disponibles.
   - Verificar que los cambios de un tenant no contaminen a otro.

## Principios de implementación

- Reutilizar componentes y patrones existentes antes de crear abstracciones nuevas.
- Mantener configuración serializable y compatible hacia atrás.
- Añadir defaults para tenants antiguos y migraciones solo cuando sean necesarias.
- Evitar CSS global que altere tiendas no relacionadas.
- Usar iconos consistentes y tooltips para controles no textuales.
- Mantener acciones destructivas separadas y confirmadas.
- Preferir una mejora pequeña, visible y comprobable por iteración.

## Lista de comprobación visual

- ¿La tienda tiene una personalidad reconocible sin depender del logo?
- ¿La jerarquía visual guía hacia la compra?
- ¿La preview representa realmente la tienda pública?
- ¿Los controles se entienden sin explicación adicional?
- ¿El diseño sigue funcionando con nombres, precios e imágenes reales?
- ¿Dos tenants con presets distintos producen composiciones claramente diferentes?
- ¿La experiencia respeta modo oscuro, responsive y accesibilidad?
