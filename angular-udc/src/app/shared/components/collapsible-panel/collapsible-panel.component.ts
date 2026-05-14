import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-collapsible-panel',
  imports: [],
  templateUrl: './collapsible-panel.component.html',
  styleUrl: './collapsible-panel.component.css',
})
export class CollapsiblePanelComponent implements OnInit {
  @Input() kicker = '';
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() icon = 'bi-layout-sidebar';
  @Input() count: number | string | null = null;
  @Input() defaultCollapsed = true;

  collapsed = true;

  ngOnInit(): void {
    this.collapsed = this.defaultCollapsed;
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
  }
}
