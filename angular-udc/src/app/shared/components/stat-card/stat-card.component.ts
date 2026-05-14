import { Component, Input } from '@angular/core';
import { StatCardVm } from '../../../core/models';

@Component({
  selector: 'app-stat-card',
  imports: [],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css',
})
export class StatCardComponent {
  @Input({ required: true }) card!: StatCardVm;
}
