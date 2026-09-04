import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CommandPalette } from './command-palette';
import { CommandPaletteService, normalizePaletteText } from '@core/services/command-palette';

function stubPaletteService() {
  return {
    isOpen: signal(false),
    query: signal(''),
    isSearching: signal(false),
    groups: signal([]),
    flatItems: signal([]),
    setQuery: vi.fn(),
    go: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
  };
}

describe('normalizePaletteText', () => {
  it('ignora mayúsculas y tildes', () => {
    expect(normalizePaletteText('Configuración ÓRDENES')).toBe('configuracion ordenes');
  });
});

describe('CommandPalette', () => {
  let component: CommandPalette;
  let fixture: ComponentFixture<CommandPalette>;
  let palette: ReturnType<typeof stubPaletteService>;

  beforeEach(async () => {
    palette = stubPaletteService();

    await TestBed.configureTestingModule({
      imports: [CommandPalette],
      providers: [{ provide: CommandPaletteService, useValue: palette }],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandPalette);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('Cmd+K alterna y Escape cierra', () => {
    component.onGlobalKeydown(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, cancelable: true }),
    );
    expect(palette.toggle).toHaveBeenCalled();

    palette.isOpen.set(true);
    component.onGlobalKeydown(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    expect(palette.close).toHaveBeenCalled();
  });

  it('Ctrl+K también alterna (Windows/Linux)', () => {
    component.onGlobalKeydown(
      new KeyboardEvent('keydown', { key: 'K', ctrlKey: true, cancelable: true }),
    );
    expect(palette.toggle).toHaveBeenCalled();
  });

  it('reporta el query al escribir y resetea el índice', () => {
    component.onQueryInput({ target: { value: 'pedido' } } as unknown as Event);
    expect(palette.setQuery).toHaveBeenCalledWith('pedido');
    expect(component.activeIndex()).toBe(0);
  });
});
