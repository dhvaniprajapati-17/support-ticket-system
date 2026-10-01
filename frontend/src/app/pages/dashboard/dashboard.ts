import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TicketSummary } from '../../models/ticket.model';
import { TicketService } from '../../services/ticket.service';
import { errorMessage } from '../../shared/api-error';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly ticketService = inject(TicketService);

  protected readonly summary = signal<TicketSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.ticketService.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Could not load the dashboard.'));
        this.loading.set(false);
      },
    });
  }
}
