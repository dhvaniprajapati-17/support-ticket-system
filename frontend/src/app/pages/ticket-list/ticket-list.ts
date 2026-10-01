import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap, tap } from 'rxjs';

import { PriorityBadge } from '../../components/priority-badge/priority-badge';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { PRIORITIES, Priority, STATUSES, Status, Ticket, TicketFilters } from '../../models/ticket.model';
import { TicketService } from '../../services/ticket.service';
import { errorMessage } from '../../shared/api-error';
import { EnumLabelPipe } from '../../shared/enum-label.pipe';

/** How long to wait after the last keystroke / filter change before calling the API. */
export const FILTER_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-ticket-list',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, EnumLabelPipe, StatusBadge, PriorityBadge],
  templateUrl: './ticket-list.html',
  styleUrl: './ticket-list.css',
})
export class TicketList {
  private readonly ticketService = inject(TicketService);

  protected readonly statuses = STATUSES;
  protected readonly priorities = PRIORITIES;

  /** '' means "any" for the two dropdowns. */
  protected readonly filtersForm = inject(NonNullableFormBuilder).group({
    search: '',
    status: '' as Status | '',
    priority: '' as Priority | '',
  });

  protected readonly tickets = signal<Ticket[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly activeFilters = signal<TicketFilters>({});
  protected readonly hasActiveFilters = computed(() => Object.keys(this.activeFilters()).length > 0);

  constructor() {
    this.filtersForm.valueChanges
      .pipe(
        // Wait until the user pauses, so typing "printer" sends 1 request instead of 7.
        debounceTime(FILTER_DEBOUNCE_MS),
        map(() => this.currentFilters()),
        // Load immediately on page open, without waiting for the debounce.
        startWith(this.currentFilters()),
        // Skip the request if the effective filters did not change (e.g. "abc" -> "abc ").
        distinctUntilChanged(sameFilters),
        tap((filters) => {
          this.activeFilters.set(filters);
          this.loading.set(true);
          this.error.set(null);
        }),
        // Start the new request and cancel the previous one if it is still running,
        // so an old, slow response can never overwrite newer results.
        switchMap((filters) =>
          this.ticketService.getTickets(filters).pipe(
            // Handle the error inside switchMap so the outer stream keeps working for the next change.
            catchError((err: unknown) => {
              this.error.set(errorMessage(err, 'Could not load tickets.'));
              return of<Ticket[]>([]);
            }),
          ),
        ),
        // Unsubscribe automatically when the page is destroyed.
        takeUntilDestroyed(),
      )
      .subscribe((tickets) => {
        this.tickets.set(tickets);
        this.loading.set(false);
      });
  }

  protected clearFilters(): void {
    this.filtersForm.reset();
  }

  /** Form values -> TicketFilters, leaving out empty values. */
  private currentFilters(): TicketFilters {
    const { search, status, priority } = this.filtersForm.getRawValue();
    const filters: TicketFilters = {};
    if (search.trim()) {
      filters.search = search.trim();
    }
    if (status) {
      filters.status = status;
    }
    if (priority) {
      filters.priority = priority;
    }
    return filters;
  }
}

function sameFilters(a: TicketFilters, b: TicketFilters): boolean {
  return a.search === b.search && a.status === b.status && a.priority === b.priority;
}
