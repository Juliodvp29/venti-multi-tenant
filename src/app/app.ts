import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from '@shared/components/toast/toast';
import { AiAssistantComponent } from '@shared/components/ai-assistant/ai-assistant';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, Toast, AiAssistantComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('venti-multi-tenant');
}
