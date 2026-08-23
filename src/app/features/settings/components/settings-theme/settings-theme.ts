import { ChangeDetectionStrategy, Component, effect, inject, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { PreviewSyncService } from '@core/services/preview-sync.service';
import { ThemeTokens, ThemePresetId, BorderRadiusOption, BorderWidthOption, ShadowStyleOption, ButtonShapeOption, ButtonStyleOption, CardStyleOption, CardOrientationOption, CardBorderStyleOption, CardCartButtonOption, HeaderStyleOption, HeroStyleOption, SpacingDensityOption, MaxContentWidthOption, TypographyPairing, FontWeightOption, BaseFontSizeOption, LineHeightOption, LetterSpacingOption, LogoPositionOption, NavAlignOption, LogoSizeOption, NavSpacingOption, FooterColumnsOption, FooterThemeModeOption, FooterAlignmentOption, FooterPaymentMethod, FooterLegalLink } from '@core/models';
import { THEME_PRESETS, AVAILABLE_FONTS, TYPOGRAPHY_PAIRINGS } from '@core/constants/theme-presets';
import { Dropdown, DropdownOption } from '@shared/components/dropdown/dropdown';
import { validateAndSanitizeCss, highlightCssToHtml, CSS_VARIABLE_CATALOG, CSS_SNIPPETS, CssValidationMessage, CssVariableCatalogGroup, CssSnippet } from '@core/utils/css-validator';

@Component({
    selector: 'app-settings-theme',
    imports: [CommonModule, FormsModule, Dropdown],
    templateUrl: './settings-theme.html',
    styleUrl: './settings-theme.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsTheme {
    private readonly tenantService = inject(TenantService);
    private readonly toastService = inject(ToastService);
    private readonly previewSyncService = inject(PreviewSyncService);

    readonly isPopoutOpen = this.previewSyncService.isPopoutOpen;

    readonly themeChange = output<ThemeTokens>();
    readonly dirtyChange = output<boolean>();

    readonly presets = Object.values(THEME_PRESETS).filter(p => p.id !== 'custom');
    readonly fonts = AVAILABLE_FONTS;
    readonly typographyPairings = TYPOGRAPHY_PAIRINGS;

    readonly fontOptions: DropdownOption[] = AVAILABLE_FONTS.map(f => ({
        label: `${f.name} (${f.category})`,
        value: f.family
    }));

    readonly fontWeightOptions: DropdownOption[] = [
        { label: 'Normal (400)', value: '400' },
        { label: 'Medio (500)', value: '500' },
        { label: 'Semibold (600)', value: '600' },
        { label: 'Bold / Negrita (700)', value: '700' },
        { label: 'Extra Bold (800)', value: '800' },
        { label: 'Black / Pesado (900)', value: '900' },
    ];

    readonly baseFontSizeOptions: DropdownOption[] = [
        { label: 'Compacto (14px)', value: '14px' },
        { label: 'Sutil (15px)', value: '15px' },
        { label: 'Estándar (16px)', value: '16px' },
        { label: 'Grande (18px)', value: '18px' },
    ];

    readonly lineHeightOptions: DropdownOption[] = [
        { label: 'Ajustado (1.2)', value: '1.2' },
        { label: 'Equilibrado (1.4)', value: '1.4' },
        { label: 'Estándar (1.5)', value: '1.5' },
        { label: 'Holgado (1.6)', value: '1.6' },
        { label: 'Amplio (1.8)', value: '1.8' },
    ];

    readonly letterSpacingOptions: DropdownOption[] = [
        { label: 'Estrecho (-0.03em)', value: '-0.03em' },
        { label: 'Normal (0em)', value: '0em' },
        { label: 'Sutil (0.03em)', value: '0.03em' },
        { label: 'Separado (0.08em)', value: '0.08em' },
    ];

    readonly logoPositionOptions: { label: string; value: LogoPositionOption; icon: string; description: string }[] = [
        { label: 'Izquierda', value: 'left',   icon: '◀', description: 'Logo y nombre alineados a la izquierda (clásico)' },
        { label: 'Centro',    value: 'center', icon: '●', description: 'Logo centrado con menú dividido a ambos lados' },
        { label: 'Derecha',   value: 'right',  icon: '▶', description: 'Acciones a la izquierda, logo a la derecha' },
    ];

    readonly navAlignOptions: { label: string; value: NavAlignOption; icon: string; description: string }[] = [
        { label: 'Izquierda', value: 'left',   icon: '◀', description: 'Menú junto al logo' },
        { label: 'Centro',    value: 'center', icon: '●', description: 'Menú horizontalmente centrado' },
        { label: 'Derecha',   value: 'right',  icon: '▶', description: 'Menú hacia los elementos de acción' },
    ];

    readonly logoSizeOptions: DropdownOption[] = [
        { label: 'Pequeño (24px)',      value: 'sm' },
        { label: 'Mediano (32px)',      value: 'md' },
        { label: 'Grande (40px)',       value: 'lg' },
        { label: 'Extra Grande (56px)', value: 'xl' },
    ];

    readonly navSpacingOptions: DropdownOption[] = [
        { label: 'Estrecho (16px)', value: 'tight' },
        { label: 'Normal (32px)',   value: 'normal' },
        { label: 'Amplio (48px)',   value: 'wide' },
    ];

    readonly tokens = signal<ThemeTokens>(structuredClone(this.tenantService.themeTokens()));
    readonly savedTokens = signal<ThemeTokens>(structuredClone(this.tenantService.themeTokens()));
    readonly isSaving = signal(false);
    readonly activeCustomizerTab = signal<'preset' | 'colors' | 'typography' | 'borders' | 'shadows' | 'spacing' | 'buttons' | 'cards' | 'header' | 'footer' | 'custom_css'>('preset');

    // CSS Personalizado Avanzado State
    readonly cssVariableCatalog = CSS_VARIABLE_CATALOG;
    readonly cssSnippets = CSS_SNIPPETS;
    readonly cssSearchQuery = signal('');
    readonly activeVariableCategory = signal<string>('all');
    readonly copiedVariable = signal<string | null>(null);
    readonly cssEditorView = signal<'edit' | 'preview'>('edit');

    readonly cssValidation = computed(() => validateAndSanitizeCss(this.tokens().custom_css || ''));
    readonly cssLineCount = computed(() => {
        const text = this.tokens().custom_css || '';
        if (!text) return 1;
        return text.split('\n').length;
    });

    readonly highlightedCustomCss = computed(() => {
        const text = this.tokens().custom_css || '';
        return highlightCssToHtml(text);
    });

    readonly lineNumbersArray = computed(() => {
        const count = Math.max(this.cssLineCount(), 14);
        return Array.from({ length: count }, (_, i) => i + 1);
    });

    readonly filteredCssVariables = computed(() => {
        const q = this.cssSearchQuery().toLowerCase().trim();
        const cat = this.activeVariableCategory();

        return this.cssVariableCatalog.map(group => {
            if (cat !== 'all' && group.category !== cat) {
                return { ...group, entries: [] };
            }
            if (!q) return group;
            const entries = group.entries.filter(e =>
                e.variable.toLowerCase().includes(q) ||
                e.label.toLowerCase().includes(q) ||
                e.description.toLowerCase().includes(q)
            );
            return { ...group, entries };
        }).filter(g => g.entries.length > 0);
    });

    readonly spacingDensities: { label: string; value: SpacingDensityOption; description: string }[] = [
        { label: 'Compacto', value: 'compact', description: 'Menor espaciado, mayor densidad de productos en pantalla' },
        { label: 'Normal', value: 'normal', description: 'Espaciado equilibrado estándar' },
        { label: 'Espacioso', value: 'spacious', description: 'Diseño editorial con respiración generosa' },
    ];

    readonly maxContentWidths: { label: string; value: MaxContentWidthOption; description: string }[] = [
        { label: 'Compacto (1024px)', value: '1024px', description: 'Diseño estrecho enfocado' },
        { label: 'Estándar (1280px)', value: '1280px', description: 'Ancho tradicional para la mayoría de tiendas' },
        { label: 'Amplio (1440px)', value: '1440px', description: 'Layout moderno aprovechando pantallas grandes' },
        { label: 'Pantalla Completa (100%)', value: '100%', description: 'Diseño fluido sin márgenes rígidos' },
    ];

    readonly borderRadii: { label: string; value: BorderRadiusOption }[] = [
        { label: 'Recto (0px)', value: 'none' },
        { label: 'Sutil (4px)', value: 'sm' },
        { label: 'Medio (8px)', value: 'md' },
        { label: 'Redondeado (12px)', value: 'lg' },
        { label: 'Pronunciado (16px)', value: 'xl' },
        { label: 'Súper redondo (24px)', value: '2xl' },
        { label: 'Píldora (9999px)', value: 'full' },
    ];

    readonly borderRadiusDropdownOptions: DropdownOption[] = [
        { label: 'Recto (0px)', value: 'none' },
        { label: 'Sutil (4px)', value: 'sm' },
        { label: 'Medio (8px)', value: 'md' },
        { label: 'Redondeado (12px)', value: 'lg' },
        { label: 'Pronunciado (16px)', value: 'xl' },
        { label: 'Súper redondo (24px)', value: '2xl' },
        { label: 'Píldora (9999px)', value: 'full' },
    ];

    readonly borderWidths: { label: string; value: BorderWidthOption }[] = [
        { label: 'Sin borde (0px)', value: '0px' },
        { label: 'Fino (1px)', value: '1px' },
        { label: 'Grueso (2px)', value: '2px' },
    ];

    readonly borderWidthDropdownOptions: DropdownOption[] = [
        { label: 'Sin borde (0px)', value: '0px' },
        { label: 'Fino (1px)', value: '1px' },
        { label: 'Grueso (2px)', value: '2px' },
    ];

    readonly shadowStyles: { label: string; value: ShadowStyleOption; description: string }[] = [
        { label: 'Sin sombra', value: 'none', description: 'Diseño plano estilo minimalista' },
        { label: 'Sutil', value: 'subtle', description: 'Elevación suave y limpia' },
        { label: 'Elevada', value: 'elevated', description: 'Profundidad con sombra difusa' },
        { label: 'Sombra Dura Retro', value: 'hard', description: 'Estilo brutalista con sombra solida' },
        { label: 'Resplandor (Glow)', value: 'glow', description: 'Brillo neón contemporáneo' },
        { label: 'Colorida', value: 'colored', description: 'Sombra suave con tinte de color' },
    ];

    readonly buttonShapes: { label: string; value: ButtonShapeOption }[] = [
        { label: 'Rectangular', value: 'sharp' },
        { label: 'Redondeado', value: 'rounded' },
        { label: 'Píldora', value: 'pill' },
    ];

    readonly buttonShapeDropdownOptions: DropdownOption[] = [
        { label: 'Rectangular', value: 'sharp' },
        { label: 'Redondeado', value: 'rounded' },
        { label: 'Píldora', value: 'pill' },
    ];

    readonly buttonStyles: { label: string; value: ButtonStyleOption }[] = [
        { label: 'Relleno', value: 'filled' },
        { label: 'Contorno (Outline)', value: 'outline' },
        { label: 'Relieve', value: 'elevated' },
        { label: 'Suave (Soft)', value: 'soft' },
    ];

    readonly buttonStyleDropdownOptions: DropdownOption[] = [
        { label: 'Relleno', value: 'filled' },
        { label: 'Contorno (Outline)', value: 'outline' },
        { label: 'Relieve', value: 'elevated' },
        { label: 'Suave (Soft)', value: 'soft' },
    ];

    readonly buttonTransformDropdownOptions: DropdownOption[] = [
        { label: 'Normal (Ej. Añadir al Carrito)', value: 'none' },
        { label: 'Mayúsculas (Ej. AÑADIR AL CARRITO)', value: 'uppercase' },
    ];

    readonly cardStyles: { label: string; value: CardStyleOption; description: string }[] = [
        { label: 'Minimalista sin borde', value: 'minimal', description: 'Limpio y flotante sobre el fondo' },
        { label: 'Borde definido', value: 'bordered', description: 'Enmarcado con trazo limpio' },
        { label: 'Elevada con sombra', value: 'elevated', description: 'Efecto flotante elegante' },
        { label: 'Glassmorphism', value: 'glass', description: 'Fondo translúcido con efecto cristal' },
        { label: 'Editorial Magazine', value: 'magazine', description: 'Detalles con marco de revista' },
        { label: 'Playful Juguetón', value: 'playful', description: 'Súper redondeado e interactivo' },
    ];

    readonly cardStyleDropdownOptions: DropdownOption[] = [
        { label: 'Minimalista sin borde', value: 'minimal' },
        { label: 'Borde definido', value: 'bordered' },
        { label: 'Elevada con sombra', value: 'elevated' },
        { label: 'Glassmorphism', value: 'glass' },
        { label: 'Editorial Magazine', value: 'magazine' },
        { label: 'Playful Juguetón', value: 'playful' },
    ];

    readonly cardImageAspectDropdownOptions: DropdownOption[] = [
        { label: 'Cuadrado (1:1)', value: '1/1' },
        { label: 'Retrato (4:5)', value: '4/5' },
        { label: 'Moda Alargada (3:4)', value: '3/4' },
        { label: 'Panorámico (16/9)', value: '16/9' },
    ];

    readonly cardOrientationDropdownOptions: DropdownOption[] = [
        { label: 'Vertical (Estándar)', value: 'vertical' },
        { label: 'Horizontal (Fila / Lista)', value: 'horizontal' },
    ];

    readonly cardBorderStyleDropdownOptions: DropdownOption[] = [
        { label: 'Borde definido', value: 'bordered' },
        { label: 'Sin borde (Limpio)', value: 'borderless' },
        { label: 'Sombra elevada', value: 'shadow' },
        { label: 'Plano (Flat)', value: 'flat' },
    ];

    readonly cardCartButtonDropdownOptions: DropdownOption[] = [
        { label: 'Hover (Al pasar el cursor)', value: 'hover' },
        { label: 'Siempre visible', value: 'always' },
        { label: 'Solo ícono flotante', value: 'icon_only' },
        { label: 'Ocultar botón de compra rápida', value: 'none' },
    ];

    readonly headerStyles: { label: string; value: HeaderStyleOption }[] = [
        { label: 'Minimalista limpio', value: 'minimal' },
        { label: 'Clásico con separador', value: 'classic' },
        { label: 'Logo centrado masthead', value: 'centered' },
        { label: 'Flotante con blur', value: 'floating' },
        { label: 'Audaz (Bold fill)', value: 'bold' },
    ];

    readonly headerStyleDropdownOptions: DropdownOption[] = [
        { label: 'Minimalista limpio', value: 'minimal' },
        { label: 'Clásico con separador', value: 'classic' },
        { label: 'Logo centrado masthead', value: 'centered' },
        { label: 'Flotante con blur', value: 'floating' },
        { label: 'Audaz (Bold fill)', value: 'bold' },
    ];

    readonly heroStyleDropdownOptions: DropdownOption[] = [
        { label: 'Centrado Clásico', value: 'centered' },
        { label: 'Alineado a la Izquierda', value: 'left' },
        { label: 'Dividido en 2 Columnas', value: 'split' },
        { label: 'Minimalista Fino', value: 'minimal' },
        { label: 'Pantalla Completa', value: 'full' },
    ];

    readonly footerColumnOptions: { label: string; value: FooterColumnsOption; icon: string; description: string }[] = [
        { label: '1 Columna', value: '1', icon: '▐', description: 'Centrado simple, ideal para tiendas pequeñas' },
        { label: '2 Columnas', value: '2', icon: '▐▐', description: 'Logo + Navegación, limpio y equilibrado' },
        { label: '3 Columnas', value: '3', icon: '▐▐▐', description: 'Estándar: Logo, Navegación y Contacto' },
        { label: '4 Columnas', value: '4', icon: '▐▐▐▐', description: 'Completo con Newsletter integrado' },
    ];

    readonly footerThemeModeOptions: { label: string; value: FooterThemeModeOption; description: string }[] = [
        { label: 'Automático', value: 'auto', description: 'Usa el color de footer del tema activo' },
        { label: 'Claro', value: 'light', description: 'Fondo blanco o gris claro, texto oscuro' },
        { label: 'Oscuro', value: 'dark', description: 'Fondo oscuro o negro, texto claro' },
        { label: 'Personalizado', value: 'custom', description: 'Elige el color exacto del fondo' },
    ];

    readonly footerAlignmentOptions: { label: string; value: FooterAlignmentOption; description: string }[] = [
        { label: 'Izquierda', value: 'left', description: 'Contenido alineado al margen izquierdo' },
        { label: 'Centrado', value: 'center', description: 'Contenido centrado horizontalmente' },
    ];

    readonly footerPaymentMethodOptions: { id: FooterPaymentMethod; label: string }[] = [
        { id: 'visa', label: 'Visa' },
        { id: 'mastercard', label: 'Mastercard' },
        { id: 'amex', label: 'American Express' },
        { id: 'paypal', label: 'PayPal' },
        { id: 'mercadopago', label: 'Mercado Pago' },
        { id: 'nequi', label: 'Nequi' },
        { id: 'pse', label: 'PSE' },
        { id: 'cash', label: 'Efectivo/Contraentrega' },
    ];

    isPaymentMethodEnabled(method: FooterPaymentMethod): boolean {
        const methods = this.tokens().footer_payment_methods || ['visa', 'mastercard'];
        return methods.includes(method);
    }

    togglePaymentMethod(method: FooterPaymentMethod) {
        const current = this.tokens().footer_payment_methods || ['visa', 'mastercard'];
        const updated = current.includes(method)
            ? current.filter(m => m !== method)
            : [...current, method];
        this.updateToken('footer_payment_methods', updated);
    }

    addLegalLink() {
        const current = this.tokens().footer_legal_links || [];
        this.updateToken('footer_legal_links', [
            ...current,
            { id: Date.now().toString(), label: 'Nuevo Enlace', url: '#' }
        ]);
    }

    removeLegalLink(id: string) {
        const current = this.tokens().footer_legal_links || [];
        this.updateToken('footer_legal_links', current.filter(l => l.id !== id));
    }

    updateLegalLink(id: string, field: 'label' | 'url', value: string) {
        const current = this.tokens().footer_legal_links || [];
        this.updateToken('footer_legal_links', current.map(l => l.id === id ? { ...l, [field]: value } : l));
    }

    constructor() {
        effect(() => {
            const current = this.tenantService.themeTokens();
            if (current) {
                this.tokens.set(structuredClone(current));
                this.savedTokens.set(structuredClone(current));
                this.themeChange.emit(current);
            }
        });
    }

    selectPreset(presetId: ThemePresetId) {
        const preset = THEME_PRESETS[presetId];
        if (!preset) return;

        const newTokens = structuredClone(preset.tokens);
        this.tokens.set(newTokens);
        this.emitChanges();
        this.toastService.info(`Tema "${preset.name}" aplicado. Puedes guardar o seguir personalizando.`);
    }

    applyTypographyPairing(pairing: TypographyPairing) {
        this.tokens.update(t => ({
            ...t,
            theme_id: 'custom',
            theme_name: 'Personalizado',
            font_heading: pairing.font_heading,
            font_body: pairing.font_body,
            font_button: pairing.font_button,
            font_weight_heading: pairing.font_weight_heading,
        }));
        this.emitChanges();
        this.toastService.info(`Combinación tipográfica "${pairing.name}" aplicada.`);
    }

    updateColor(key: keyof ThemeTokens['colors'], value: string) {
        this.tokens.update(t => ({
            ...t,
            theme_id: 'custom',
            theme_name: 'Personalizado',
            colors: {
                ...t.colors,
                [key]: value,
            },
        }));
        this.emitChanges();
    }

    updateToken<K extends keyof ThemeTokens>(key: K, value: ThemeTokens[K]) {
        this.tokens.update(t => ({
            ...t,
            theme_id: 'custom',
            theme_name: 'Personalizado',
            [key]: value,
        }));
        this.emitChanges();
    }

    resetToPreset() {
        const currentPresetId = this.tokens().theme_id;
        const preset = THEME_PRESETS[currentPresetId] || THEME_PRESETS.minimalist;
        this.tokens.set(structuredClone(preset.tokens));
        this.emitChanges();
        this.toastService.info(`Restablecidos los valores base del tema "${preset.name}"`);
    }

    private emitChanges() {
        this.themeChange.emit(this.tokens());
        const isDirty = JSON.stringify(this.tokens()) !== JSON.stringify(this.savedTokens());
        this.dirtyChange.emit(isDirty);
    }

    async save() {
        this.isSaving.set(true);
        try {
            const result = await this.tenantService.updateThemeTokens(this.tokens());
            if (result.success) {
                this.savedTokens.set(structuredClone(this.tokens()));
                this.toastService.success('Sistema visual y tema guardados exitosamente');
                this.dirtyChange.emit(false);
            } else {
                this.toastService.error(result.error || 'Error al guardar el tema visual');
            }
        } catch {
            this.toastService.error('Error al guardar la configuración visual');
        } finally {
            this.isSaving.set(false);
        }
    }

    // Advanced Custom CSS Methods
    updateCustomCss(value: string) {
        this.updateToken('custom_css', value);
    }

    insertCssSnippet(snippet: CssSnippet) {
        const current = this.tokens().custom_css || '';
        const separator = current.trim().length > 0 ? '\n\n' : '';
        const updated = current + separator + `/* === ${snippet.name} === */\n` + snippet.css;
        this.updateCustomCss(updated);
        this.toastService.success(`Snippet "${snippet.name}" insertado`);
    }

    insertCssVariable(variable: string) {
        const current = this.tokens().custom_css || '';
        const toInsert = `var(${variable})`;
        const updated = current + (current.endsWith(' ') || current.endsWith(':') ? '' : ' ') + toInsert;
        this.updateCustomCss(updated);
        this.toastService.info(`Variable ${variable} agregada`);
    }

    copyCssVariable(variable: string) {
        navigator.clipboard?.writeText(`var(${variable})`);
        this.copiedVariable.set(variable);
        setTimeout(() => this.copiedVariable.set(null), 2000);
        this.toastService.success(`Copiado: var(${variable})`);
    }

    clearCustomCss() {
        if (confirm('¿Estás seguro de que deseas borrar todo el CSS personalizado?')) {
            this.updateCustomCss('');
            this.toastService.info('CSS personalizado limpiado');
        }
    }

    formatCustomCss() {
        const raw = this.tokens().custom_css || '';
        if (!raw.trim()) return;

        // Simple beautifier: format braces, indentation and newlines
        let formatted = '';
        let indentLevel = 0;
        const lines = raw.split('\n');

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            if (line.includes('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }

            const indent = '  '.repeat(indentLevel);
            formatted += indent + line + '\n';

            if (line.includes('{')) {
                indentLevel++;
            }
        }

        this.updateCustomCss(formatted.trim());
        this.toastService.info('CSS formateado');
    }

    onCodeInput(event: Event) {
        const value = (event.target as HTMLTextAreaElement).value;
        this.updateCustomCss(value);
    }

    syncEditorScroll(textarea: HTMLTextAreaElement, pre: HTMLElement) {
        if (pre) {
            pre.scrollTop = textarea.scrollTop;
            pre.scrollLeft = textarea.scrollLeft;
        }
    }

    handleTabKey(event: Event, textarea: HTMLTextAreaElement) {
        const kbEvent = event as KeyboardEvent;
        kbEvent.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        // Insert 2 spaces
        const updated = value.substring(0, start) + '  ' + value.substring(end);
        this.updateCustomCss(updated);

        // Restore caret position
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
    }

    cancel() {
        this.tokens.set(structuredClone(this.savedTokens()));
        this.emitChanges();
        this.dirtyChange.emit(false);
        this.toastService.info('Cambios descartados');
    }
}
