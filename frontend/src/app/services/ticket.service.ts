import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateTicketRequest,
  Status,
  StatusUpdateRequest,
  Ticket,
  TicketFilters,
  TicketSummary,
  UpdateTicketRequest,
} from '../models/ticket.model';

/**
 * The single place that talks to the backend's /api/tickets endpoints.
 * Components call these methods and never use HttpClient directly.
 *
 * URLs are relative: in development the Angular dev server proxies /api to Spring Boot
 * (see proxy.conf.json), so the backend address never appears in application code.
 *
 * Every method returns a cold Observable: no request is sent until something subscribes.
 */
@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/tickets';

  /** GET /api/tickets?status=&priority=&search= (empty filters are left out of the URL). */
  getTickets(filters: TicketFilters = {}): Observable<Ticket[]> {
    let params = new HttpParams();
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.priority) {
      params = params.set('priority', filters.priority);
    }
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    return this.http.get<Ticket[]>(this.baseUrl, { params });
  }

  /** GET /api/tickets/{id} */
  getTicket(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.baseUrl}/${id}`);
  }

  /** POST /api/tickets -> the created ticket (backend answers 201 Created). */
  createTicket(request: CreateTicketRequest): Observable<Ticket> {
    return this.http.post<Ticket>(this.baseUrl, request);
  }

  /** PUT /api/tickets/{id} -> the updated ticket. */
  updateTicket(id: number, request: UpdateTicketRequest): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.baseUrl}/${id}`, request);
  }

  /** PATCH /api/tickets/{id}/status -> the updated ticket. */
  updateStatus(id: number, status: Status): Observable<Ticket> {
    const body: StatusUpdateRequest = { status };
    return this.http.patch<Ticket>(`${this.baseUrl}/${id}/status`, body);
  }

  /** DELETE /api/tickets/{id} -> no body (backend answers 204 No Content). */
  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** GET /api/tickets/summary -> counts for the dashboard. */
  getSummary(): Observable<TicketSummary> {
    return this.http.get<TicketSummary>(`${this.baseUrl}/summary`);
  }
}
