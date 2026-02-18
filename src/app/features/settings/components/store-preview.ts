import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PreviewData {
    business_name: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    layout: 'modern' | 'classic' | 'minimal';
    viewMode: 'desktop' | 'mobile';
}

@Component({
    selector: 'app-store-preview',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './store-preview.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorePreview {
    readonly data = input.required<PreviewData>();

    readonly mockProducts = [
        { name: 'Classic Chrono', price: '$129.00', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400' },
        { name: 'Sport Runner', price: '$85.00', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400' },
        { name: 'Leather Wallet', price: '$45.00', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=400' },
        { name: 'Wireless Pods', price: '$199.00', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400' },
        { name: 'Minimal Backpack', price: '$120.00', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400' },
        { name: 'Smart Glasses', price: '$250.00', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=400' }
    ];

    get containerClass() {
        const base = this.data().viewMode === 'mobile'
            ? 'w-[375px] h-[667px] border-[12px] border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden'
            : 'w-full h-full border border-slate-200 rounded-xl shadow-lg overflow-hidden';
        return base;
    }

    get fontStyle() {
        return { 'font-family': this.data().font_family };
    }

    preventDefault(event: Event) {
        event.preventDefault();
    }
}
