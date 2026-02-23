import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Toast } from '@shared/components/toast/toast';
import { AiAssistantComponent } from '@shared/components/ai-assistant/ai-assistant';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Toast, AiAssistantComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);

  protected readonly title = signal('venti-multi-tenant');

  // Logic to hide AI Assistant in the public store
  private readonly currentUrl = toSignal(
    this.router.events.pipe(map(() => this.router.url)),
    { initialValue: '' }
  );

  protected readonly showAiAssistant = computed(() => {
    const url = this.currentUrl();
    return !url.startsWith('/store');
  });
}
