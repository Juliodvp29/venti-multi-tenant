import { Component, ElementRef, inject, ViewChild, AfterViewChecked, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AiAssistantService } from '@core/services/ai-assistant';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
    selector: 'app-ai-assistant',
    standalone: true,
    imports: [CommonModule, FormsModule, MarkdownPipe],
    templateUrl: './ai-assistant.html',
    styleUrl: './ai-assistant.css',
})
export class AiAssistantComponent implements OnInit, AfterViewChecked {
    private readonly aiService = inject(AiAssistantService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    isOpen = false;
    userInput = '';
    messages = this.aiService.messages;
    isLoading = this.aiService.isLoading;

    ngOnInit() {
        this.aiService.navigationRequest$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(path => {
                this.router.navigate([path]);
                // Automatically close on navigation for better UX, or keep open if preferred
                // this.isOpen = false;
            });
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
    }

    async sendMessage() {
        if (!this.userInput.trim() || this.isLoading()) return;

        const text = this.userInput;
        this.userInput = '';
        await this.aiService.sendMessage(text);
    }

    private scrollToBottom(): void {
        try {
            if (this.scrollContainer) {
                this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
            }
        } catch (err) { }
    }
}
