import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dropdown } from './dropdown';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('Dropdown', () => {
  let component: Dropdown;
  let fixture: ComponentFixture<Dropdown>;

  const options = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'Pagado', value: 'completed' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dropdown],
    }).compileComponents();

    fixture = TestBed.createComponent(Dropdown);
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('value', 'pending');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create closed', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(false);
    expect(component.menuPosition()).toBeNull();
  });

  it('should compute a fixed position when opening', () => {
    component.toggle();

    expect(component.isOpen()).toBe(true);
    const pos = component.menuPosition();
    expect(pos).not.toBeNull();
    expect(pos!.width).toBeGreaterThanOrEqual(0);
    expect(pos!.top).toBeDefined();
  });

  it('should emit the value and close on select', () => {
    const emitSpy = vi.fn();
    component.valueChange.subscribe(emitSpy);

    component.toggle();
    component.select(options[1]);

    expect(emitSpy).toHaveBeenCalledWith('completed');
    expect(component.isOpen()).toBe(false);
    expect(component.menuPosition()).toBeNull();
  });

  it('should close on viewport scroll/resize', () => {
    component.toggle();
    expect(component.isOpen()).toBe(true);

    component.onViewportChange();

    expect(component.isOpen()).toBe(false);
  });

  it('should not open when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    component.toggle();

    expect(component.isOpen()).toBe(false);
  });
});
