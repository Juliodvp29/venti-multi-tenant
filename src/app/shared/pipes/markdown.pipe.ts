import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import * as DOMPurifyMod from 'dompurify';

const DOMPurify = (DOMPurifyMod as any).default || DOMPurifyMod;

@Pipe({
    name: 'markdown',
    standalone: true
})
export class MarkdownPipe implements PipeTransform {
    private readonly sanitizer = inject(DomSanitizer);

    async transform(value: string): Promise<SafeHtml> {
        if (!value) return '';

        const html = await marked.parse(value);
        const cleanHtml = DOMPurify.sanitize(html);
        return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
    }
}
