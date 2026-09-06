import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CommandPalette } from './command-palette';
import { CommandPaletteService, matchesQuery, normalizePaletteText } from '@core/services/command-palette';

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

describe('normalizePaletteText & matchesQuery', () => {
  it('ignora mayúsculas y tildes', () => {
    expect(normalizePaletteText('Configuración ÓRDENES')).toBe('configuracion ordenes');
  });

  it('encuentra coincidencias exactas y con stop words como "metodos de pago" y "pagos"', () => {
    const haystack = 'Métodos de Pago metodos de pago metodo pago pagos pasarelas pasarela bold wompi tarjeta tarjetas credito debito pse bancolombia nequi transferencias transferencia contraentrega contra entrega efectivo dinero checkout cobro cobros';
    expect(matchesQuery(haystack, 'pagos')).toBe(true);
    expect(matchesQuery(haystack, 'pago')).toBe(true);
    expect(matchesQuery(haystack, 'metodos de pago')).toBe(true);
    expect(matchesQuery(haystack, 'bold')).toBe(true);
    expect(matchesQuery(haystack, 'wompi')).toBe(true);
    expect(matchesQuery(haystack, 'tarjetas')).toBe(true);
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
