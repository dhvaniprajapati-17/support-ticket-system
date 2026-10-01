import { Component, OnInit, inject, input, numberAttribute, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { TicketForm, TicketFormValue } from '../../components/ticket-form/ticket-form';
import { Ticket, UpdateTicketRequest } from '../../models/ticket.model';
import { TicketService } from '../../services/ticket.service';
import { errorMessage, fieldErrors, isNotFound } from '../../shared/api-error';

@Component({
  selector: 'app-ticket-edit',
  imports: [TicketForm, RouterLink],
  template: `
    <div class="page-header">
      <h2>Edit ticket @if (ticket(); as ticket) { #{{ ticket.id }} }</h2>
    </div>

    @if (loading()) {
      <p class="message message-info">Loading ticket…</p>
    } @else if (notFound()) {
      <p class="message message-error" role="alert">
        Ticket not found. It may have been deleted. <a routerLink="/tickets">Back to tickets</a>
      </p>
    } @else if (loadError()) {
      <p class="message message-error" role="alert">{{ loadError() }}</p>
    } @else if (ticket(); as ticket) {
      @if (error()) {
        <p class="message message-error" role="alert">{{ error() }}</p>
      }
      <app-ticket-form
        [ticket]="ticket"
        submitLabel="Save changes"
        [cancelLink]="'/tickets/' + ticket.id"
        [saving]="saving()"
        [serverErrors]="serverErrors()"
        (save)="update($event)"
      />
    }
  `,
})
export class TicketEdit implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly router = inject(Router);

  /** From the :id route parameter. */
  readonly id = input.required({ transform: numberAttribute });

  protected readonly ticket = signal<Ticket | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string> | null>(null);

  ngOnInit(): void {
    // /tickets/abc gives NaN: no such ticket, so don't call the API.
    if (!Number.isInteger(this.id()) || this.id() < 1) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.ticketService.getTicket(this.id()).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.notFound.set(isNotFound(err));
        this.loadError.set(errorMessage(err, 'Could not load the ticket.'));
        this.loading.set(false);
      },
    });
  }

  protected update(value: TicketFormValue): void {
    const ticket = this.ticket();
    if (!ticket || this.saving()) {
      return;
    }
    // Only the editable fields are sent. createdBy/id/timestamps are never part of the request;
    // status is not edited on this form, so the current status is kept.
    const request: UpdateTicketRequest = {
      title: value.title,
      description: value.description,
      priority: value.priority,
      status: ticket.status,
    };

    this.saving.set(true);
    this.error.set(null);
    this.serverErrors.set(null);

    this.ticketService.updateTicket(ticket.id, request).subscribe({
      next: () => this.router.navigate(['/tickets', ticket.id]),
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(errorMessage(err, 'Could not save the ticket.'));
        this.serverErrors.set(fieldErrors(err));
      },
    });
  }
}
