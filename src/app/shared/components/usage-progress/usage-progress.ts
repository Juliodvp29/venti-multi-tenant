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
  @Input({ required: true }) limit!: number | null;

  get isUnlimited(): boolean {
    return this.limit === null;
  }

  get percentage(): number {
    if (this.isUnlimited || this.limit === 0) {
      return 0;
    }

    return Math.min((this.used / this.limit!) * 100, 100);
  }
}
