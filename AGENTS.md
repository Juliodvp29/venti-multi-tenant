# AGENTS.md - Venti Multi-Tenant eCommerce Platform

This file provides guidelines for agentic coding agents working on the Venti Shop codebase.

## Project Overview

- **Framework**: Angular 21 with standalone components
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Styling**: Tailwind CSS 4
- **State Management**: Angular Signals
- **Language**: TypeScript 5.9
- **Testing**: Vitest (configured via Angular build system)
- **Package Manager**: npm (v11.9.0)

---

## Build / Lint / Test Commands

### Development
```bash
npm start              # Start dev server (ng serve)
npm run watch          # Build with watch mode (development)
```

### Build
```bash
npm run build          # Production build (ng build)
```

### Testing
```bash
npm run test           # Run all tests (ng test)
```

To run a **single test file**, use:
```bash
npx ng test --include="**/filename.spec.ts"
```

Or with Vitest directly:
```bash
npx vitest run --include="**/filename.spec.ts"
```

### Code Formatting
```bash
npx prettier --write "src/**/*.ts"
npx prettier --write "src/**/*.html"
```

### Pre-commit
No pre-commit hooks are configured. Run prettier before committing.

---

## Code Style Guidelines

### Imports

**Order** (as seen in source files):
1. Angular core imports (from `@angular/*`)
2. Third-party library imports
3. Internal models/types/enums (`@core/models`, `@core/types`, `@core/enums`)
4. Internal services (`@core/services/*`)
5. Internal features (`@features/*`)
6. Internal shared (`@shared/*`)
7. Environment imports (`@env/*`)

**Path Aliases** - Always use these instead of relative paths:
```ts
import { TenantService } from '@core/services/tenant';
import { TenantRole } from '@core/enums';
import { Nullable } from '@core/types';
import { Product } from '@core/models';
import { SettingsGeneral } from '@features/settings/components/settings-general';
```

Available aliases:
- `@core/*` → `src/app/core/*`
- `@features/*` → `src/app/features/*`
- `@shared/*` → `src/app/shared/*`
- `@env/*` → `src/environments/*`
- `@models/*` → `src/app/core/models/*`
- `@enums/*` → `src/app/core/enums/*`
- `@types/*` → `src/app/core/types/*`
- `@guards/*` → `src/app/core/guards/*`
- `@interceptors/*` → `src/app/core/interceptors/*`
- `@services/*` → `src/app/core/services/*`

### Naming Conventions

- **Components**: PascalCase, descriptive (e.g., `SettingsGeneral`, `ProductsList`)
- **Services**: PascalCase, often noun-based (e.g., `TenantService`, `ProductsService`)
- **Files**: kebab-case (e.g., `tenant.service.ts`, `settings-general.ts`)
- **Models/Interfaces**: PascalCase (e.g., `Tenant`, `Product`, `Order`)
- **Enums**: PascalCase with PascalCase values (e.g., `TenantRole`)
- **Signals/Variables**: camelCase (e.g., `isLoading`, `currentTenant`)

### TypeScript Configuration

The project uses **strict mode**. Always:
- Define proper return types for functions
- Use explicit types for function parameters
- Use `Nullable<T>` type from `@core/types` for potentially null values
- Enable `strictTemplates` (templates are type-checked)

```ts
// Good
function getTenantId(): Nullable<string> {
  return this.tenantId() ?? null;
}

// Avoid
function getTenantId() {
  return this.tenantId();
}
```

### Angular Patterns

**Dependency Injection** - Use `inject()` function with `private readonly`:
```ts
export class MyComponent {
  private readonly tenantService = inject(TenantService);
  private readonly toastService = inject(ToastService);
}
```

**Signals** - Use for all local/computed state:
```ts
// Local state
readonly isSaving = signal(false);

// Computed derived state
readonly isOwner = computed(() => this.memberRole() === TenantRole.Owner);

// Reactive side effects
effect(() => {
  const tenant = this.tenant();
  if (tenant) {
    this.form.patchValue({ ... });
  }
});
```

**Standalone Components** - All components are standalone:
```ts
@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './my-component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent { }
```

### Templates

- Use `@if`, `@for`, `@switch` control flow (Angular 17+ syntax)
- Avoid `*ngIf`, `*ngFor`, `*ngSwitch`
- Use signal inputs where applicable

```html
@if (isLoading()) {
  <app-loader />
} @else {
  @for (product of products(); track product.id) {
    <app-product-card [product]="product" />
  }
}
```

### Reactive Forms

- Use `FormBuilder` with `nonNullable` for typed forms
- Define validators inline
- Use `signal()` for form state

```ts
readonly form = this.fb.nonNullable.group({
  business_name: ['', [Validators.required, Validators.minLength(2)]],
  contact_email: ['', [Validators.required, Validators.email]],
});
```

### Error Handling

- Use `try/catch` with async operations
- Always show user-friendly error messages via `ToastService`
- Log errors to console for debugging

```ts
async save() {
  try {
    const result = await this.service.update(data);
    if (result.success) {
      this.toastService.success('Saved successfully');
    } else {
      this.toastService.error(result.error || 'Error saving');
    }
  } catch (error) {
    console.error('Error saving:', error);
    this.toastService.error('An unexpected error occurred');
  }
}
```

### UI/UX Conventions

- User-facing messages should be in **Spanish** (e.g., `toastService.error('Error al guardar')`)
- Use `ChangeDetectionStrategy.OnPush` for all components
- Use Tailwind CSS utility classes for styling
- Loading states should use `signal<boolean>(false)`

### File Organization

```
src/app/
├── core/
│   ├── services/        # 26 services for business logic
│   ├── models/          # TypeScript interfaces
│   ├── enums/           # Application enumerations
│   ├── types/           # Utility types (Nullable, etc.)
│   ├── guards/          # Route guards
│   ├── interceptors/    # HTTP interceptors
│   └── layouts/         # Shell layout components
├── features/            # Lazy-loaded feature modules
│   ├── auth/
│   ├── dashboard/
│   ├── products-catalog/
│   ├── orders/
│   ├── customers/
│   └── ...
└── shared/
    ├── components/     # Reusable UI components
    ├── directives/
    └── pipes/
```

### Git Conventions

- Use meaningful commit messages
- Don't commit sensitive data (environment files, credentials)
- Run `npm run build` before pushing to verify compilation

---

## Database & Backend

- All data access goes through **Supabase** client
- Use Row Level Security (RLS) - never bypass tenant isolation in queries
- Always filter queries by `tenantId` when required
- Use the established service methods instead of raw Supabase calls

---

## Testing

- Test files follow naming: `*.spec.ts`
- Use Angular's `TestBed` or component testing approaches
- Mock external dependencies (Supabase, services)

---

## Key Services

| Service | Purpose |
|---------|---------|
| `TenantService` | Tenant state, settings, branding, members |
| `AuthService` | Authentication (login/logout/session) |
| `ProductsService` | Product CRUD, variants, categories |
| `OrdersService` | Order management, status updates |
| `ToastService` | User notifications |

---

This file should be updated as coding conventions evolve.
