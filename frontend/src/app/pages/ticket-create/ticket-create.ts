import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { TicketForm, TicketFormValue } from '../../components/ticket-form/ticket-form';
import { CreateTicketRequest } from '../../models/ticket.model';
import { TicketService } from '../../services/ticket.service';
import { errorMessage, fieldErrors } from '../../shared/api-error';

@Component({
  selector: 'app-ticket-create',
  imports: [TicketForm],
  template: `
    <div class="page-header">
      <h2>New ticket</h2>
    </div>

    @if (error()) {
      <p class="message message-error" role="alert">{{ error() }}</p>
    }

    <app-ticket-form
      submitLabel="Create ticket"
      cancelLink="/tickets"
      [saving]="saving()"
      [serverErrors]="serverErrors()"
      (save)="create($event)"
    />
  `,
})
export class TicketCreate {
  private readonly ticketService = inject(TicketService);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string> | null>(null);

  protected create(value: TicketFormValue): void {
    if (this.saving()) {
      return;
    }
    // status is left out: the backend defaults new tickets to OPEN.
    const request: CreateTicketRequest = {
      title: value.title,
      description: value.description,
      priority: value.priority,
      createdBy: value.createdBy,
    };

    this.saving.set(true);
    this.error.set(null);
    this.serverErrors.set(null);

    this.ticketService.createTicket(request).subscribe({
      next: (created) => this.router.navigate(['/tickets', created.id]),
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(errorMessage(err, 'Could not create the ticket.'));
        this.serverErrors.set(fieldErrors(err));
      },
    });
  }
}
