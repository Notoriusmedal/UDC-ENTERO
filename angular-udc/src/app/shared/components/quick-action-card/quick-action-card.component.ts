import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuickActionVm } from '../../../core/models';

@Component({
  selector: 'app-quick-action-card',
  imports: [RouterLink],
  templateUrl: './quick-action-card.component.html',
  styleUrl: './quick-action-card.component.css',
})
export class QuickActionCardComponent {
  @Input({ required: true }) action!: QuickActionVm;
}
