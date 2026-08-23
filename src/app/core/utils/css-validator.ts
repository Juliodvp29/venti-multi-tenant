export interface CssValidationResult {
    isValid: boolean;
    sanitizedCss: string;
    errors: CssValidationMessage[];
    warnings: CssValidationMessage[];
}

export interface CssValidationMessage {
    line: number;
    message: string;
    severity: 'error' | 'warning';
}

/** Patterns that must be blocked for security (XSS, injection) */
const DANGEROUS_PATTERNS: { pattern: RegExp; message: string }[] = [
    { pattern: /@import\b/gi, message: 'La regla @import no está permitida por seguridad' },
    { pattern: /javascript\s*:/gi, message: 'Las URLs con javascript: no están permitidas' },
    { pattern: /expression\s*\(/gi, message: 'CSS expressions no están permitidas (IE legacy)' },
    { pattern: /behavior\s*:/gi, message: 'La propiedad behavior no está permitida' },
    { pattern: /vbscript\s*:/gi, message: 'Las URLs con vbscript: no están permitidas' },
    { pattern: /-moz-binding\s*:/gi, message: 'La propiedad -moz-binding no está permitida' },
    { pattern: /<\s*\/?script/gi, message: 'Las etiquetas <script> no están permitidas en CSS' },
    { pattern: /data\s*:\s*text\/html/gi, message: 'Las URLs data:text/html no están permitidas' },
    { pattern: /url\s*\(\s*['"]?\s*javascript/gi, message: 'Las URLs con javascript: no están permitidas' },
];

/** Patterns that generate warnings but are not blocked */
const WARNING_PATTERNS: { pattern: RegExp; message: string }[] = [
    { pattern: /position\s*:\s*fixed/gi, message: 'position: fixed puede afectar la navegación de la tienda' },
    { pattern: /z-index\s*:\s*\d{4,}/gi, message: 'z-index muy alto podría cubrir elementos de la interfaz' },
    { pattern: /!important/gi, message: 'El uso de !important puede ser difícil de mantener' },
    { pattern: /display\s*:\s*none/gi, message: 'display: none podría ocultar elementos críticos de la tienda' },
];

/** Maximum allowed CSS length in characters */
const MAX_CSS_LENGTH = 10000;

/**
 * Validates and sanitizes user-provided CSS.
 * Checks for balanced braces, dangerous patterns (XSS vectors),
 * and common issues. Returns sanitized CSS safe for DOM injection.
 */
export function validateAndSanitizeCss(rawCss: string): CssValidationResult {
    const errors: CssValidationMessage[] = [];
    const warnings: CssValidationMessage[] = [];

    if (!rawCss || rawCss.trim().length === 0) {
        return { isValid: true, sanitizedCss: '', errors: [], warnings: [] };
    }

    // Length check
    if (rawCss.length > MAX_CSS_LENGTH) {
        errors.push({
            line: 0,
            message: `El CSS excede el límite de ${MAX_CSS_LENGTH.toLocaleString()} caracteres (actual: ${rawCss.length.toLocaleString()})`,
            severity: 'error',
        });
    }

    const lines = rawCss.split('\n');

    // Check dangerous patterns per line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        for (const { pattern, message } of DANGEROUS_PATTERNS) {
            // Reset lastIndex for global regex
            pattern.lastIndex = 0;
            if (pattern.test(line)) {
                errors.push({ line: lineNum, message, severity: 'error' });
            }
        }

        for (const { pattern, message } of WARNING_PATTERNS) {
            pattern.lastIndex = 0;
            if (pattern.test(line)) {
                warnings.push({ line: lineNum, message, severity: 'warning' });
            }
        }
    }

    // Check balanced braces
    let braceDepth = 0;
    for (let i = 0; i < lines.length; i++) {
        for (const ch of lines[i]) {
            if (ch === '{') braceDepth++;
            if (ch === '}') braceDepth--;

            if (braceDepth < 0) {
                errors.push({
                    line: i + 1,
                    message: 'Llave de cierre "}" sin apertura correspondiente',
                    severity: 'error',
                });
                braceDepth = 0;
            }
        }
    }

    if (braceDepth > 0) {
        errors.push({
            line: lines.length,
            message: `Faltan ${braceDepth} llave(s) de cierre "}"`,
            severity: 'error',
        });
    }

    // Build sanitized CSS: strip dangerous lines entirely
    let sanitized = rawCss;
    for (const { pattern } of DANGEROUS_PATTERNS) {
        pattern.lastIndex = 0;
        sanitized = sanitized.replace(pattern, '/* [BLOQUEADO] */');
    }

    return {
        isValid: errors.length === 0,
        sanitizedCss: sanitized.trim(),
        errors,
        warnings,
    };
}

/**
 * Catalog of available CSS custom properties exposed by Venti.
 * Used in the UI to show users which variables they can use.
 */
export interface CssVariableCatalogEntry {
    variable: string;
    label: string;
    description: string;
    example: string;
}

export interface CssVariableCatalogGroup {
    category: string;
    icon: string;
    entries: CssVariableCatalogEntry[];
}

export const CSS_VARIABLE_CATALOG: CssVariableCatalogGroup[] = [
    {
        category: 'Colores',
        icon: 'palette',
        entries: [
            { variable: '--store-color-primary', label: 'Color Primario', description: 'Color principal de la marca (botones, acentos)', example: 'color: var(--store-color-primary);' },
            { variable: '--store-color-primary-contrast', label: 'Contraste del Primario', description: 'Texto sobre fondo primario (blanco o negro)', example: 'color: var(--store-color-primary-contrast);' },
            { variable: '--store-color-secondary', label: 'Color Secundario', description: 'Color complementario al primario', example: 'background: var(--store-color-secondary);' },
            { variable: '--store-color-accent', label: 'Color de Acento', description: 'Color terciario para destacar elementos', example: 'border-color: var(--store-color-accent);' },
            { variable: '--store-color-bg', label: 'Fondo General', description: 'Color de fondo principal de la tienda', example: 'background-color: var(--store-color-bg);' },
            { variable: '--store-color-surface', label: 'Superficie', description: 'Fondo de tarjetas y paneles elevados', example: 'background: var(--store-color-surface);' },
            { variable: '--store-color-header', label: 'Fondo del Header', description: 'Color de fondo de la cabecera', example: 'background: var(--store-color-header);' },
            { variable: '--store-color-footer', label: 'Fondo del Footer', description: 'Color de fondo del pie de página', example: 'background: var(--store-color-footer);' },
            { variable: '--store-color-text', label: 'Texto Principal', description: 'Color de textos principales', example: 'color: var(--store-color-text);' },
            { variable: '--store-color-muted', label: 'Texto Atenuado', description: 'Color de textos secundarios/descripciones', example: 'color: var(--store-color-muted);' },
            { variable: '--store-color-border', label: 'Bordes', description: 'Color de bordes y divisores', example: 'border-color: var(--store-color-border);' },
        ],
    },
    {
        category: 'Tipografía',
        icon: 'type',
        entries: [
            { variable: '--store-font-heading', label: 'Fuente Títulos', description: 'Familia tipográfica de encabezados H1-H6', example: 'font-family: var(--store-font-heading);' },
            { variable: '--store-font-body', label: 'Fuente Cuerpo', description: 'Familia tipográfica de párrafos y textos', example: 'font-family: var(--store-font-body);' },
            { variable: '--store-font-button', label: 'Fuente Botones', description: 'Familia tipográfica de botones y CTAs', example: 'font-family: var(--store-font-button);' },
            { variable: '--store-font-weight-heading', label: 'Peso Títulos', description: 'Grosor del texto en encabezados (400-900)', example: 'font-weight: var(--store-font-weight-heading);' },
            { variable: '--store-font-size-base', label: 'Tamaño Base', description: 'Tamaño de fuente base del cuerpo (14-18px)', example: 'font-size: var(--store-font-size-base);' },
            { variable: '--store-line-height', label: 'Interlineado', description: 'Espaciado entre líneas de texto', example: 'line-height: var(--store-line-height);' },
            { variable: '--store-letter-spacing', label: 'Espaciado Letras', description: 'Separación entre caracteres', example: 'letter-spacing: var(--store-letter-spacing);' },
        ],
    },
    {
        category: 'Bordes y Sombras',
        icon: 'box',
        entries: [
            { variable: '--store-radius', label: 'Radio General', description: 'Redondeo general de esquinas', example: 'border-radius: var(--store-radius);' },
            { variable: '--store-radius-card', label: 'Radio Tarjetas', description: 'Redondeo de tarjetas de producto', example: 'border-radius: var(--store-radius-card);' },
            { variable: '--store-radius-btn', label: 'Radio Botones', description: 'Redondeo de botones y acciones', example: 'border-radius: var(--store-radius-btn);' },
            { variable: '--store-radius-badge', label: 'Radio Badges', description: 'Redondeo de etiquetas y badges', example: 'border-radius: var(--store-radius-badge);' },
            { variable: '--store-border-width', label: 'Ancho de Borde', description: 'Grosor de bordes (0-2px)', example: 'border-width: var(--store-border-width);' },
            { variable: '--store-shadow', label: 'Sombra', description: 'Sombra predeterminada de elementos elevados', example: 'box-shadow: var(--store-shadow);' },
        ],
    },
    {
        category: 'Espaciado y Layout',
        icon: 'layout',
        entries: [
            { variable: '--store-max-width', label: 'Ancho Máximo', description: 'Ancho máximo del contenido principal', example: 'max-width: var(--store-max-width);' },
            { variable: '--store-grid-gap', label: 'Espacio Grilla', description: 'Separación entre columnas y filas', example: 'gap: var(--store-grid-gap);' },
            { variable: '--store-section-py', label: 'Padding Secciones', description: 'Espaciado vertical entre secciones', example: 'padding-block: var(--store-section-py);' },
            { variable: '--store-btn-transform', label: 'Texto Botones', description: 'Transformación de texto en botones (none/uppercase)', example: 'text-transform: var(--store-btn-transform);' },
        ],
    },
];

/**
 * Predefined CSS snippet templates for quick insertion
 */
export interface CssSnippet {
    id: string;
    name: string;
    description: string;
    css: string;
}

export const CSS_SNIPPETS: CssSnippet[] = [
    {
        id: 'glassmorphism',
        name: 'Efecto Glassmorphism',
        description: 'Tarjetas con efecto vidrio esmerilado translúcido',
        css: `.product-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}`,
    },
    {
        id: 'hover-glow',
        name: 'Hover con Brillo',
        description: 'Los botones brillan al pasar el cursor',
        css: `.store-btn-primary:hover {
  box-shadow: 0 0 20px rgba(var(--store-color-primary), 0.4);
  transform: translateY(-2px);
  transition: all 0.3s ease;
}`,
    },
    {
        id: 'gradient-heading',
        name: 'Títulos con Degradado',
        description: 'Degradado de color en los títulos principales',
        css: `.hero-section h1,
.hero-section h2,
h1, h2, h3 {
  background: linear-gradient(135deg, var(--store-color-primary), var(--store-color-accent, #6366f1));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}`,
    },
    {
        id: 'shadow-3d',
        name: 'Sombras 3D',
        description: 'Efecto sólido tridimensional en tarjetas de producto',
        css: `.product-card {
  box-shadow: 4px 4px 0px 0px var(--store-color-primary);
  transition: all 0.2s ease;
}
.product-card:hover {
  box-shadow: 6px 6px 0px 0px var(--store-color-primary);
  transform: translate(-2px, -2px);
}`,
    },
    {
        id: 'animated-underline',
        name: 'Subrayado Animado',
        description: 'Los enlaces del menú se subrayan con animación',
        css: `.store-header a {
  position: relative;
}
.store-header a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--store-color-primary);
  transition: width 0.3s ease;
}
.store-header a:hover::after {
  width: 100%;
}`,
    },
    {
        id: 'rounded-images',
        name: 'Imágenes Redondeadas',
        description: 'Imágenes de producto con bordes completamente redondos',
        css: `.product-card img {
  border-radius: 1rem;
  transition: transform 0.3s ease;
}
.product-card:hover img {
  transform: scale(1.03);
}`,
    },
];

/**
 * Transforms raw CSS into colorized HTML for code editor preview with syntax highlighting.
 */
export function highlightCssToHtml(css: string): string {
    if (!css) return '';

    // Step 1: Escape HTML entities
    let code = css
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Token placeholder storage
    const tokens: string[] = [];
    const createToken = (html: string) => {
        const id = `__TOK_${tokens.length}__`;
        tokens.push(html);
        return id;
    };

    // 1. Comments
    code = code.replace(/(\/\*[\s\S]*?\*\/)/g, (m) => createToken(`<span class="css-tok-comment">${m}</span>`));

    // 2. Strings
    code = code.replace(/(['"])(?:(?=(\\?))\2.)*?\1/g, (m) => createToken(`<span class="css-tok-string">${m}</span>`));

    // 3. CSS Variables var(--...)
    code = code.replace(/\b(var\s*\([^)]+\))/g, (m) => createToken(`<span class="css-tok-var">${m}</span>`));

    // 4. !important
    code = code.replace(/(!important)/gi, (m) => createToken(`<span class="css-tok-important">${m}</span>`));

    // 5. Hex colors
    code = code.replace(/(#[0-9a-fA-F]{3,8})\b/g, (m) => createToken(`<span class="css-tok-hex">${m}</span>`));

    // 6. Numbers with optional CSS units
    code = code.replace(/\b(\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms|deg|fr)?)\b/g, (m) => createToken(`<span class="css-tok-num">${m}</span>`));

    // 7. @rules
    code = code.replace(/(@[a-zA-Z-]+)/g, (m) => createToken(`<span class="css-tok-atrule">${m}</span>`));

    // 8. Properties before colon
    code = code.replace(/([a-zA-Z-][a-zA-Z0-9-]*)\s*:/g, (_, prop) => `${createToken(`<span class="css-tok-prop">${prop}</span>`)}:`);

    // Restore all tokens
    for (let i = tokens.length - 1; i >= 0; i--) {
        code = code.replaceAll(`__TOK_${i}__`, tokens[i]);
    }

    return code;
}
