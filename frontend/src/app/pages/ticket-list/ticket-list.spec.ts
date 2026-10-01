import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { makeTicket, problem, selectByText, typeInto } from '../../testing/test-helpers';
import { FILTER_DEBOUNCE_MS, TicketList } from './ticket-list';

describe('TicketList', () => {
  let fixture: ComponentFixture<TicketList>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;

  beforeEach(() => {
    // Fake timers let the test control debounceTime instead of really waiting 300 ms.
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [TicketList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TicketList);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify(); // fails if any unexpected (e.g. duplicate) request was sent
    vi.useRealTimers();
  });

  const searchInput = () => el.querySelector<HTMLInputElement>('#search')!;
  const statusSelect = () => el.querySelector<HTMLSelectElement>('#status')!;
  const prioritySelect = () => el.querySelector<HTMLSelectElement>('#priority')!;

  it('loads all tickets once on open and renders them', () => {
    httpMock
      .expectOne('/api/tickets')
      .flush([makeTicket({ id: 1 }), makeTicket({ id: 2, title: 'Invoice wrong', status: 'IN_PROGRESS' })]);
    fixture.detectChanges();

    const rows = el.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[1].textContent).toContain('Invoice wrong');
    expect(rows[1].textContent).toContain('In Progress'); // StatusBadge label
  });

  it('debounces typing and sends one request with all search/filter parameters', () => {
    httpMock.expectOne('/api/tickets').flush([]);

    // Simulate a user typing quickly, then choosing filters, all within the debounce window.
    typeInto(searchInput(), 'p');
    typeInto(searchInput(), 'pri');
    typeInto(searchInput(), 'printer');
    selectByText(statusSelect(), 'Open');
    selectByText(prioritySelect(), 'High');

    vi.advanceTimersByTime(FILTER_DEBOUNCE_MS - 1);
    httpMock.expectNone((req) => req.url === '/api/tickets'); // still waiting

    vi.advanceTimersByTime(1);
    const req = httpMock.expectOne((r) => r.url === '/api/tickets'); // exactly one
    expect(req.request.params.get('search')).toBe('printer');
    expect(req.request.params.get('status')).toBe('OPEN');
    expect(req.request.params.get('priority')).toBe('HIGH');
    req.flush([]);
  });

  it('does not send a request when the effective filters did not change', () => {
    httpMock.expectOne('/api/tickets').flush([]);

    typeInto(searchInput(), '   '); // only spaces -> still "no search"
    vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);

    httpMock.expectNone((req) => req.url === '/api/tickets');
  });

  it('shows the no-results state and can clear the filters', () => {
    httpMock.expectOne('/api/tickets').flush([makeTicket()]);

    selectByText(statusSelect(), 'Resolved');
    vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);
    httpMock.expectOne((r) => r.params.get('status') === 'RESOLVED').flush([]);
    fixture.detectChanges();

    expect(el.querySelector('[data-testid="no-results"]')?.textContent).toContain('No tickets match your filters');

    el.querySelector<HTMLButtonElement>('[data-testid="no-results"] button')!.click();
    vi.advanceTimersByTime(FILTER_DEBOUNCE_MS);
    const req = httpMock.expectOne('/api/tickets'); // back to no filters
    expect(req.request.params.keys()).toEqual([]);
    req.flush([makeTicket()]);
  });

  it('shows an error message when loading fails', () => {
    httpMock.expectOne('/api/tickets').flush(...problem(500));
    fixture.detectChanges();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Something went wrong on the server');
  });
});
