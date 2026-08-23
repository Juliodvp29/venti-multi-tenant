import { describe, it, expect } from 'vitest';
import { validateAndSanitizeCss, highlightCssToHtml, CSS_VARIABLE_CATALOG, CSS_SNIPPETS } from './css-validator';

describe('css-validator', () => {
    it('should validate clean CSS and report valid status', () => {
        const cleanCss = `
            .product-card {
                border-radius: var(--store-radius);
                background-color: var(--store-color-surface);
            }
        `;
        const result = validateAndSanitizeCss(cleanCss);

        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
        expect(result.sanitizedCss).toContain('.product-card');
    });

    it('should block dangerous @import rule', () => {
        const maliciousCss = `
            @import url('https://evil.com/malicious.css');
            .product-card { color: red; }
        `;
        const result = validateAndSanitizeCss(maliciousCss);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.message.includes('@import'))).toBe(true);
        expect(result.sanitizedCss).not.toContain('@import');
    });

    it('should block javascript: URLs and script tags', () => {
        const maliciousCss = `
            .test {
                background: url(javascript:alert(1));
            }
            <script>alert('xss')</script>
        `;
        const result = validateAndSanitizeCss(maliciousCss);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
        expect(result.sanitizedCss).not.toContain('javascript:');
        expect(result.sanitizedCss).not.toContain('<script>');
    });

    it('should detect unbalanced curly braces', () => {
        const invalidCss = `
            .product-card {
                color: blue;
        `;
        const result = validateAndSanitizeCss(invalidCss);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.message.includes('llave(s)'))).toBe(true);
    });

    it('should detect warnings for position: fixed and !important', () => {
        const warningCss = `
            .floating {
                position: fixed;
                color: red !important;
            }
        `;
        const result = validateAndSanitizeCss(warningCss);

        expect(result.isValid).toBe(true);
        expect(result.warnings.length).toBeGreaterThanOrEqual(2);
    });

    it('should provide complete CSS variables catalog and snippets', () => {
        expect(CSS_VARIABLE_CATALOG.length).toBeGreaterThan(0);
        expect(CSS_VARIABLE_CATALOG.some(c => c.category === 'Colores')).toBe(true);
        expect(CSS_SNIPPETS.length).toBeGreaterThan(0);
        expect(CSS_SNIPPETS.some(s => s.id === 'glassmorphism')).toBe(true);
    });

    it('should highlight CSS tokens to colorized HTML', () => {
        const sampleCss = `/* Comentario */\n.product-card { color: var(--store-color-primary); background: #ffffff; }`;
        const highlighted = highlightCssToHtml(sampleCss);

        expect(highlighted).toContain('css-tok-comment');
        expect(highlighted).toContain('css-tok-var');
        expect(highlighted).toContain('css-tok-prop');
        expect(highlighted).toContain('css-tok-hex');
    });
});
