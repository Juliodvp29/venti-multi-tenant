import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommissionsList } from './components/commissions-list/commissions-list';

@Component({
    selector: 'app-commissions',
    imports: [CommonModule, CommissionsList],
    template: `<app-commissions-list />`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Commissions {}