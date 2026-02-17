import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Loader {
  private readonly _requests = signal<Set<string>>(new Set());

  readonly isLoading = computed(() => this._requests().size > 0);
  readonly activeRequests = computed(() => this._requests().size);

  show(requestId: string = crypto.randomUUID()): string {
    this._requests.update((set) => new Set([...set, requestId]));
    return requestId;
  }

  hide(requestId: string): void {
    this._requests.update((set) => {
      const next = new Set(set);
      next.delete(requestId);
      return next;
    });
  }

  hideAll(): void {
    this._requests.set(new Set());
  }
}
