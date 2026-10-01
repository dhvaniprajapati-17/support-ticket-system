import { Component, input } from '@angular/core';

import { Priority } from '../../models/ticket.model';
import { EnumLabelPipe } from '../../shared/enum-label.pipe';

/** Coloured label for a ticket priority. Usage: <app-priority-badge [priority]="ticket.priority" /> */
@Component({
  selector: 'app-priority-badge',
  imports: [EnumLabelPipe],
  template: `<span [class]="'badge priority-' + priority()">{{ priority() | enumLabel }}</span>`,
  styles: `
    .priority-LOW { background: #f3f4f6; color: #374151; }
    .priority-MEDIUM { background: #ffedd5; color: #9a3412; }
    .priority-HIGH { background: #fee2e2; color: #991b1b; }
  `,
})
export class PriorityBadge {
  readonly priority = input.required<Priority>();
}
