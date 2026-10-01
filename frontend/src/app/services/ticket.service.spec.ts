import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Ticket, TicketSummary } from '../models/ticket.model';
import { TicketService } from './ticket.service';

/**
 * provideHttpClientTesting() swaps the real HTTP backend for a fake one.
 * HttpTestingController lets each test check the request that was made and choose the response.
 */
describe('TicketService', () => {
  let service: TicketService;
  let httpMock: HttpTestingController;

  const ticket: Ticket = {
    id: 1,
    title: 'Printer offline',
    description: 'Floor 2 printer is offline.',
    priority: 'HIGH',
    status: 'OPEN',
    createdBy: 'alice',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TicketService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Fails the test if a request was made that the test did not expect.
    httpMock.verify();
  });

  it('getTickets() without filters calls GET /api/tickets with no query string', () => {
    let result: Ticket[] | undefined;
    service.getTickets().subscribe((tickets) => (result = tickets));

    const req = httpMock.expectOne('/api/tickets');
    expect(req.request.method).toBe('GET');
    req.flush([ticket]);

    expect(result).toEqual([ticket]);
  });

  it('getTickets() sends only non-empty filters as query parameters', () => {
    service.getTickets({ status: 'OPEN', search: '  printer  ' }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/tickets');
    expect(req.request.params.get('status')).toBe('OPEN');
    expect(req.request.params.get('search')).toBe('printer');
    expect(req.request.params.has('priority')).toBe(false);
    req.flush([]);
  });

  it('getTicket() calls GET /api/tickets/{id}', () => {
    service.getTicket(1).subscribe();

    const req = httpMock.expectOne('/api/tickets/1');
    expect(req.request.method).toBe('GET');
    req.flush(ticket);
  });

  it('createTicket() POSTs the request body to /api/tickets', () => {
    const body = { title: 'Printer offline', description: 'Floor 2', priority: 'HIGH' as const, createdBy: 'alice' };
    service.createTicket(body).subscribe();

    const req = httpMock.expectOne('/api/tickets');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(ticket, { status: 201, statusText: 'Created' });
  });

  it('updateTicket() PUTs the request body to /api/tickets/{id}', () => {
    const body = { title: 'New title', description: 'New', priority: 'LOW' as const, status: 'RESOLVED' as const };
    service.updateTicket(1, body).subscribe();

    const req = httpMock.expectOne('/api/tickets/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush({ ...ticket, ...body });
  });

  it('updateStatus() PATCHes {status} to /api/tickets/{id}/status', () => {
    service.updateStatus(1, 'RESOLVED').subscribe();

    const req = httpMock.expectOne('/api/tickets/1/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'RESOLVED' });
    req.flush({ ...ticket, status: 'RESOLVED' });
  });

  it('deleteTicket() calls DELETE /api/tickets/{id}', () => {
    let completed = false;
    service.deleteTicket(1).subscribe({ complete: () => (completed = true) });

    const req = httpMock.expectOne('/api/tickets/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('getSummary() calls GET /api/tickets/summary and returns the counts', () => {
    const summary: TicketSummary = { total: 8, open: 4, inProgress: 2, resolved: 2 };
    let result: TicketSummary | undefined;
    service.getSummary().subscribe((s) => (result = s));

    httpMock.expectOne('/api/tickets/summary').flush(summary);

    expect(result).toEqual(summary);
  });

  it('does not send any request until subscribed (Observables are lazy)', () => {
    service.getSummary(); // no subscribe()

    httpMock.expectNone('/api/tickets/summary');
  });
});
