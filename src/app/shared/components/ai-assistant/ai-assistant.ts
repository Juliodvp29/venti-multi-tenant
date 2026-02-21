import { Component, ElementRef, inject, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiAssistantService } from '@core/services/ai-assistant';

@Component({
    selector: 'app-ai-assistant',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-assistant.html',
    styleUrl: './ai-assistant.css',
})
export class AiAssistantComponent implements AfterViewChecked {
    private readonly aiService = inject(AiAssistantService);

    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    isOpen = false;
    userInput = '';
    messages = this.aiService.messages;
    isLoading = this.aiService.isLoading;

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
