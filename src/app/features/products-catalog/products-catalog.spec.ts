import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsCatalog } from './products-catalog';

describe('ProductsCatalog', () => {
  let component: ProductsCatalog;
  let fixture: ComponentFixture<ProductsCatalog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsCatalog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsCatalog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
