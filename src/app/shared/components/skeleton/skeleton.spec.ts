import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Skeleton } from './skeleton';
import { TableSkeleton } from './table-skeleton';
import { StatCardSkeleton } from './stat-card-skeleton';

describe('Skeleton', () => {
  let fixture: ComponentFixture<Skeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Skeleton],
    }).compileComponents();
    fixture = TestBed.createComponent(Skeleton);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should expose role=status for assistive tech', () => {
    const el = fixture.nativeElement.querySelector('[role="status"]');
    expect(el).toBeTruthy();
  });
});

describe('TableSkeleton', () => {
  it('should create with defaults', async () => {
    await TestBed.configureTestingModule({
      imports: [TableSkeleton],
    }).compileComponents();
    const fixture = TestBed.createComponent(TableSkeleton);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.bodyRows().length).toBe(8);
  });

  it('should respect rows/columns inputs', async () => {
    await TestBed.configureTestingModule({
      imports: [TableSkeleton],
    }).compileComponents();
    const fixture = TestBed.createComponent(TableSkeleton);
    fixture.componentRef.setInput('rows', 3);
    fixture.componentRef.setInput('columns', 2);
    fixture.detectChanges();
    expect(fixture.componentInstance.bodyRows().length).toBe(3);
    expect(fixture.componentInstance.bodyCells().length).toBe(2);
  });
});

describe('StatCardSkeleton', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardSkeleton],
    }).compileComponents();
    const fixture = TestBed.createComponent(StatCardSkeleton);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
