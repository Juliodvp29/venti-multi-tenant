import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Settings } from './settings';
import { TenantService } from '@core/services/tenant';
import { ToastService } from '@core/services/toast';
import { PreviewSyncService } from '@core/services/preview-sync.service';
import { THEME_PRESETS } from '@core/constants/theme-presets';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;

  const defaultTokens = THEME_PRESETS.minimalist.tokens;

  const tenantServiceMock = {
    tenantId: signal('tenant-123'),
    currentTenant: signal({
      id: 'tenant-123',
      business_name: 'Tienda Test',
      slug: 'tienda-test',
      primary_color: '#000000',
      secondary_color: '#ffffff',
      accent_color: '#3b82f6',
      background_color: '#ffffff',
      header_color: '#ffffff',
      footer_color: '#ffffff',
      layout: 'modern',
      settings: { currency: 'COP', timezone: 'America/Bogota' },
    }),
    tenant: signal({
      id: 'tenant-123',
      business_name: 'Tienda Test',
      slug: 'tienda-test',
      settings: { currency: 'COP', timezone: 'America/Bogota' },
    }),
    branding: signal({
      logo_url: 'https://test.com/logo.png',
      brand_gallery: [],
    }),
    loading: signal(false),
    storeUrl: signal('https://test.venti.com'),
    themeTokens: signal(defaultTokens),
    draftThemeTokens: signal(defaultTokens),
    publishedThemeTokens: signal(defaultTokens),
    draftStorefrontLayout: signal({ sections: [] }),
    publishedStorefrontLayout: signal({ sections: [] }),
    storeDesignState: signal({ published_at: new Date().toISOString() }),
    designVersions: signal([]),
    savedCustomPresets: signal([]),
    hasUnpublishedChanges: signal(false),
    saveDraft: vi.fn().mockResolvedValue({ success: true }),
    publishDesign: vi.fn().mockResolvedValue({ success: true }),
    discardDraft: vi.fn().mockResolvedValue({ success: true }),
    updateThemeTokens: vi.fn().mockResolvedValue({ success: true }),
  };

  const toastServiceMock = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    confirm: vi.fn().mockResolvedValue(true),
  };

  const previewSyncServiceMock = {
    isPopoutOpen: signal(false),
    broadcastPreview: vi.fn(),
    openPopout: vi.fn(),
    closePopout: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    tenantServiceMock.saveDraft.mockResolvedValue({ success: true });
    tenantServiceMock.publishDesign.mockResolvedValue({ success: true });
    toastServiceMock.confirm.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        { provide: TenantService, useValue: tenantServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: PreviewSyncService, useValue: previewSyncServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create and have default activeTab as theme', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab()).toBe('theme');
  });

  it('should switch tabs when no unsaved changes', async () => {
    await component.setActiveTab('branding');
    expect(component.activeTab()).toBe('branding');
  });

  it('should flush pending changes via autosave when switching tabs', async () => {
    component.onDirtyChange(true);

    await component.setActiveTab('general');

    expect(tenantServiceMock.saveDraft).toHaveBeenCalled();
    expect(toastServiceMock.confirm).not.toHaveBeenCalled();
    expect(component.activeTab()).toBe('general'); // Should switch without asking
    expect(component.autosaveStatus()).toBe('saved');
  });

  it('should prompt confirmation when autosave flush fails on tab switch', async () => {
    tenantServiceMock.saveDraft.mockRejectedValueOnce(new Error('offline'));
    component.onDirtyChange(true);
    toastServiceMock.confirm.mockResolvedValue(false);

    await component.setActiveTab('general');
    expect(component.activeTab()).toBe('theme'); // Should stay on theme
    expect(component.autosaveStatus()).toBe('error');

    toastServiceMock.confirm.mockResolvedValue(true);
    await component.setActiveTab('general');
    expect(component.activeTab()).toBe('general'); // Should switch after confirm
  });

  it('should schedule an autosave after dirty changes', async () => {
    vi.useFakeTimers();
    try {
      component.onDirtyChange(true);
      expect(tenantServiceMock.saveDraft).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1500);

      expect(tenantServiceMock.saveDraft).toHaveBeenCalled();
      expect(component.autosaveStatus()).toBe('saved');
      expect(component.lastAutosavedLabel()).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should toggle viewMode between desktop and mobile', () => {
    expect(component.viewMode()).toBe('desktop');
    component.viewMode.set('mobile');
    expect(component.viewMode()).toBe('mobile');
  });

  it('should open and close presets modal', () => {
    component.openPresetsModal();
    expect(component.isPresetsModalOpen()).toBe(true);

    component.closePresetsModal();
    expect(component.isPresetsModalOpen()).toBe(false);
  });

  it('should open and close publish modal', () => {
    component.openPublishModal();
    expect(component.isPublishModalOpen()).toBe(true);
    expect(component.publishVersionName()).toContain('Versión');

    component.closePublishModal();
    expect(component.isPublishModalOpen()).toBe(false);
  });

  it('should save draft and display success toast', async () => {
    await component.saveDraftOnly();

    expect(tenantServiceMock.saveDraft).toHaveBeenCalled();
    expect(toastServiceMock.success).toHaveBeenCalledWith(
      expect.stringContaining('Borrador guardado exitosamente'),
    );
  });

  it('should confirm publish and update store design', async () => {
    component.publishVersionName.set('v1.0.0');
    component.publishNotes.set('Lanzamiento inicial');

    await component.confirmPublish();

    expect(tenantServiceMock.publishDesign).toHaveBeenCalledWith('v1.0.0', 'Lanzamiento inicial');
    expect(toastServiceMock.success).toHaveBeenCalledWith(
      expect.stringContaining('Diseño publicado exitosamente'),
    );
  });
});
