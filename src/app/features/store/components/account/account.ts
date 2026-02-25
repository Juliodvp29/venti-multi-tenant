import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-account',
    imports: [CommonModule, RouterModule],
    templateUrl: './account.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Account {
}
