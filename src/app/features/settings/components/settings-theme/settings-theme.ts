import { ChangeDetectionStrategy, Component, effect, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { PreviewSyncService } from '@core/services/preview-sync.service';
import { ThemeTokens, ThemePresetId, BorderRadiusOption, BorderWidthOption, ShadowStyleOption, ButtonShapeOption, ButtonStyleOption, CardStyleOption, HeaderStyleOption, HeroStyleOption, SpacingDensityOption, MaxContentWidthOption, TypographyPairing, FontWeightOption, BaseFontSizeOption, LineHeightOption, LetterSpacingOption } from '@core/models';
import { THEME_PRESETS, AVAILABLE_FONTS, TYPOGRAPHY_PAIRINGS } from '@core/constants/theme-presets';
import { Dropdown, DropdownOption } from '@shared/components/dropdown/dropdown';

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

    readonly tokens = signal<ThemeTokens>(structuredClone(this.tenantService.themeTokens()));
    readonly savedTokens = signal<ThemeTokens>(structuredClone(this.tenantService.themeTokens()));
    readonly isSaving = signal(false);
    readonly activeCustomizerTab = signal<'preset' | 'colors' | 'typography' | 'borders' | 'shadows' | 'spacing' | 'buttons' | 'cards'>('preset');

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

    cancel() {
        this.tokens.set(structuredClone(this.savedTokens()));
        this.emitChanges();
        this.dirtyChange.emit(false);
        this.toastService.info('Cambios descartados');
    }
}
