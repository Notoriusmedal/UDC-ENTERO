import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
})
export class EmptyStateComponent {
  @Input() icon = 'bi-check2-circle';
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() actionHref = '';
}
