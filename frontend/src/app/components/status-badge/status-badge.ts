import { Component, input } from '@angular/core';

import { Status } from '../../models/ticket.model';
import { EnumLabelPipe } from '../../shared/enum-label.pipe';

/** Coloured label for a ticket status. Usage: <app-status-badge [status]="ticket.status" /> */
@Component({
  selector: 'app-status-badge',
  imports: [EnumLabelPipe],
  template: `<span [class]="'badge status-' + status()">{{ status() | enumLabel }}</span>`,
  styles: `
    .status-OPEN { background: #dbeafe; color: #1e40af; }
    .status-IN_PROGRESS { background: #fef3c7; color: #92400e; }
    .status-RESOLVED { background: #dcfce7; color: #166534; }
  `,
})
export class StatusBadge {
  readonly status = input.required<Status>();
}
