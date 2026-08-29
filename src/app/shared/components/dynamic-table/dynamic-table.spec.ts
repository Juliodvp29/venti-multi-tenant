import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { DynamicTable } from './dynamic-table';
import { ColumnDef } from '@core/types/table';

registerLocaleData(localeEs, 'es');

describe('DynamicTable', () => {
  let component: DynamicTable<any>;
  let fixture: ComponentFixture<DynamicTable<any>>;

  const mockColumns: ColumnDef<any>[] = [
    { key: 'name', label: 'Producto', sortable: true, type: 'text' },
    { key: 'price', label: 'Precio', sortable: true, type: 'currency' },
    { key: 'stock', label: 'Stock', sortable: true, type: 'number' },
  ];

  const mockData = [
    { id: '1', name: 'Zapatos', price: 150000, stock: 10 },
    { id: '2', name: 'Camiseta', price: 50000, stock: 100 },
    { id: '3', name: 'Gorra', price: 80000, stock: 5 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicTable],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicTable);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('data', mockData);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sort data ascending and descending by numeric price', () => {
    // Sort asc
    component.onSort('price');
    expect(component.sortState()).toEqual({ key: 'price', direction: 'asc' });
    let sorted = component.filteredData();
    expect(sorted.map((item) => item.price)).toEqual([50000, 80000, 150000]);

    // Sort desc
    component.onSort('price');
    expect(component.sortState()).toEqual({ key: 'price', direction: 'desc' });
    sorted = component.filteredData();
    expect(sorted.map((item) => item.price)).toEqual([150000, 80000, 50000]);

    // Sort off
    component.onSort('price');
    expect(component.sortState()).toBeNull();
  });

  it('should sort data by text name alphabetically', () => {
    component.onSort('name');
    expect(component.sortState()).toEqual({ key: 'name', direction: 'asc' });
    const sorted = component.filteredData();
    expect(sorted.map((item) => item.name)).toEqual(['Camiseta', 'Gorra', 'Zapatos']);
  });

  it('should emit sortChange event when onSort is called', () => {
    const emittedSorts: any[] = [];
    component.sortChange.subscribe((val) => emittedSorts.push(val));

    component.onSort('stock');
    expect(emittedSorts).toEqual([{ key: 'stock', direction: 'asc' }]);

    component.onSort('stock');
    expect(emittedSorts).toEqual([
      { key: 'stock', direction: 'asc' },
      { key: 'stock', direction: 'desc' },
    ]);

    component.onSort('stock');
    expect(emittedSorts).toEqual([
      { key: 'stock', direction: 'asc' },
      { key: 'stock', direction: 'desc' },
      null,
    ]);
  });
});

