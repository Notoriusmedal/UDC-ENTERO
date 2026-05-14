import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  imports: [],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css',
})
export class StatusBadgeComponent {
  @Input({ required: true }) status = '';
  @Input() label = '';

  get displayLabel(): string {
    if (this.label) {
      return this.label;
    }

    const normalized = this.normalize(this.status);
    const labels: Record<string, string> = {
      programado: 'Programado',
      en_curso: 'En directo',
      en_directo: 'En directo',
      finalizado: 'Finalizado',
      pendiente: 'Pendiente',
      cancelado: 'Cancelado',
      conflicto: 'Requiere revisión',
      sin_conflictos: 'Sin conflictos',
    };

    return labels[normalized] ?? this.toTitle(this.status);
  }

  get toneClass(): string {
    const normalized = this.normalize(this.status);

    if (['en_curso', 'en_directo', 'sin_conflictos', 'confirmada'].includes(normalized)) {
      return 'status-success';
    }

    if (['programado', 'pendiente'].includes(normalized)) {
      return normalized === 'pendiente' ? 'status-warning' : 'status-primary';
    }

    if (['cancelado', 'conflicto', 'rechazada'].includes(normalized)) {
      return 'status-danger';
    }

    if (normalized === 'finalizado') {
      return 'status-neutral';
    }

    return 'status-primary';
  }

  private normalize(value: string): string {
    return (value ?? '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s-]+/g, '_');
  }

  private toTitle(value: string): string {
    return (value || 'Estado')
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
  }
}
