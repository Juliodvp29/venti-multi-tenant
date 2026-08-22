import { ChangeDetectionStrategy, Component, effect, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { ThemeTokens, ThemePresetId, BorderRadiusOption, BorderWidthOption, ShadowStyleOption, ButtonShapeOption, ButtonStyleOption, CardStyleOption, HeaderStyleOption, HeroStyleOption } from '@core/models';
import { THEME_PRESETS, AVAILABLE_FONTS } from '@core/constants/theme-presets';

@Component({
    selector: 'app-settings-theme',
    imports: [CommonModule, FormsModule],
    templateUrl: './settings-theme.html',
    styleUrl: './settings-theme.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsTheme {
    private readonly tenantService = inject(TenantService);
    private readonly toastService = inject(ToastService);

    readonly themeChange = output<ThemeTokens>();
    readonly dirtyChange = output<boolean>();

    readonly presets = Object.values(THEME_PRESETS).filter(p => p.id !== 'custom');
    readonly fonts = AVAILABLE_FONTS;

    readonly tokens = signal<ThemeTokens>(structuredClone(this.tenantService.themeTokens()));
    readonly savedTokens = signal<ThemeTokens>(structuredClone(this.tenantService.themeTokens()));
    readonly isSaving = signal(false);
    readonly activeCustomizerTab = signal<'preset' | 'colors' | 'typography' | 'borders' | 'shadows' | 'buttons' | 'cards'>('preset');

    readonly borderRadii: { label: string; value: BorderRadiusOption }[] = [
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

    readonly buttonStyles: { label: string; value: ButtonStyleOption }[] = [
        { label: 'Relleno', value: 'filled' },
        { label: 'Contorno (Outline)', value: 'outline' },
        { label: 'Relieve', value: 'elevated' },
        { label: 'Suave (Soft)', value: 'soft' },
    ];

    readonly cardStyles: { label: string; value: CardStyleOption; description: string }[] = [
        { label: 'Minimalista sin borde', value: 'minimal', description: 'Limpio y flotante sobre el fondo' },
        { label: 'Borde definido', value: 'bordered', description: 'Enmarcado con trazo limpio' },
        { label: 'Elevada con sombra', value: 'elevated', description: 'Efecto flotante elegante' },
        { label: 'Glassmorphism', value: 'glass', description: 'Fondo translúcido con efecto cristal' },
        { label: 'Editorial Magazine', value: 'magazine', description: 'Detalles con marco de revista' },
        { label: 'Playful Juguetón', value: 'playful', description: 'Súper redondeado e interactivo' },
    ];

    readonly headerStyles: { label: string; value: HeaderStyleOption }[] = [
        { label: 'Minimalista limpio', value: 'minimal' },
        { label: 'Clásico con separador', value: 'classic' },
        { label: 'Logo centrado masthead', value: 'centered' },
        { label: 'Flotante con blur', value: 'floating' },
        { label: 'Audaz (Bold fill)', value: 'bold' },
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
