import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, numberAttribute, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { PriorityBadge } from '../../components/priority-badge/priority-badge';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { STATUSES, Status, Ticket } from '../../models/ticket.model';
import { TicketService } from '../../services/ticket.service';
import { errorMessage, isNotFound } from '../../shared/api-error';
import { EnumLabelPipe } from '../../shared/enum-label.pipe';

@Component({
  selector: 'app-ticket-detail',
  imports: [RouterLink, DatePipe, EnumLabelPipe, StatusBadge, PriorityBadge],
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.css',
})
export class TicketDetail implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly router = inject(Router);

  /** From the :id route parameter (withComponentInputBinding), converted from string to number. */
  readonly id = input.required({ transform: numberAttribute });

  protected readonly statuses = STATUSES;

  protected readonly ticket = signal<Ticket | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly loadError = signal<string | null>(null);

  /** Set while a status change or delete is running, to disable the buttons. */
  protected readonly busy = signal(false);
  protected readonly actionError = signal<string | null>(null);

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

  protected changeStatus(status: Status): void {
    const ticket = this.ticket();
    if (!ticket || this.busy() || ticket.status === status) {
      return;
    }
    this.busy.set(true);
    this.actionError.set(null);

    this.ticketService.updateStatus(ticket.id, status).subscribe({
      next: (updated) => {
        this.ticket.set(updated); // the response has the new status and updatedAt
        this.busy.set(false);
      },
      error: (err: unknown) => {
        this.actionError.set(errorMessage(err, 'Could not change the status.'));
        this.busy.set(false);
      },
    });
  }

  protected deleteTicket(): void {
    const ticket = this.ticket();
    if (!ticket || this.busy()) {
      return;
    }
    if (!window.confirm(`Delete ticket #${ticket.id} "${ticket.title}"? This cannot be undone.`)) {
      return;
    }
    this.busy.set(true);
    this.actionError.set(null);

    this.ticketService.deleteTicket(ticket.id).subscribe({
      next: () => this.router.navigate(['/tickets']),
      error: (err: unknown) => {
        this.actionError.set(errorMessage(err, 'Could not delete the ticket.'));
        this.busy.set(false);
      },
    });
  }
}
