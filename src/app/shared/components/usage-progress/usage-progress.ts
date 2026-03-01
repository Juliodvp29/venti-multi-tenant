import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usage-progress',
  imports: [CommonModule],
  templateUrl: './usage-progress.html',
  styleUrl: './usage-progress.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageProgress {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) used!: number;
  @Input({ required: true }) limit!: number;

  get isUnlimited(): boolean {
    return this.limit === 9999 || this.limit >= 999999;
  }

  get percentage(): number {
    if (!this.limit || this.limit === 0 || this.isUnlimited) return 0;
    return (this.used / this.limit) * 100;
  }
}
