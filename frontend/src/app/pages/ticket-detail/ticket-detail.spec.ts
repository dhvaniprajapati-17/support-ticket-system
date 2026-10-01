import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { makeTicket, problem } from '../../testing/test-helpers';
import { TicketDetail } from './ticket-detail';

describe('TicketDetail', () => {
  let fixture: ComponentFixture<TicketDetail>;
  let httpMock: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;
  let el: HTMLElement;

  const ticket = makeTicket({ id: 7, title: 'Mobile app crashes', status: 'OPEN', priority: 'HIGH' });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TicketDetail],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(TicketDetail);
    fixture.componentRef.setInput('id', 7);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  async function loadTicket(): Promise<void> {
    httpMock.expectOne('/api/tickets/7').flush(ticket); // expectOne: fetched exactly once
    await fixture.whenStable();
  }

  const button = (text: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent?.trim() === text)!;

  it('loads the ticket once and shows its details', async () => {
    await loadTicket();

    expect(el.querySelector('h2')?.textContent).toContain('#7 · Mobile app crashes');
    expect(el.textContent).toContain('alice');
    expect(el.querySelector('app-status-badge')?.textContent?.trim()).toBe('Open');
    expect(el.querySelector('app-priority-badge')?.textContent?.trim()).toBe('High');
    expect(button('Open').disabled).toBe(true); // current status
  });

  it('changes the status with one PATCH and shows the updated ticket', async () => {
    await loadTicket();

    button('Resolved').click();
    await fixture.whenStable();

    const req = httpMock.expectOne('/api/tickets/7/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'RESOLVED' });
    req.flush({ ...ticket, status: 'RESOLVED', updatedAt: '2026-09-02T09:00:00Z' });
    await fixture.whenStable();

    expect(el.querySelector('app-status-badge')?.textContent?.trim()).toBe('Resolved');
    expect(button('Resolved').disabled).toBe(true);
  });

  it('deletes after confirmation and navigates back to the list', async () => {
    await loadTicket();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    button('Delete').click();

    expect(confirmSpy).toHaveBeenCalled();
    const req = httpMock.expectOne('/api/tickets/7');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(navigate).toHaveBeenCalledWith(['/tickets']);
  });

  it('does not delete when the confirmation is cancelled', async () => {
    await loadTicket();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    button('Delete').click();

    httpMock.expectNone('/api/tickets/7');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the ProblemDetail message when an action fails', async () => {
    await loadTicket();

    button('In Progress').click();
    httpMock
      .expectOne('/api/tickets/7/status')
      .flush(...problem(400, { detail: "Invalid value 'X' for field 'status'." }));
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain("Invalid value 'X' for field 'status'.");
    expect(el.querySelector('app-status-badge')?.textContent?.trim()).toBe('Open'); // unchanged
  });

  it('shows a not-found message for an unknown ticket', async () => {
    httpMock.expectOne('/api/tickets/7').flush(...problem(404));
    await fixture.whenStable();

    expect(el.querySelector('[data-testid="not-found"]')?.textContent).toContain('Ticket not found');
  });

  it('treats a non-numeric id as not found without calling the API', async () => {
    httpMock.expectOne('/api/tickets/7').flush(ticket); // request from the id=7 set up in beforeEach

    const other = TestBed.createComponent(TicketDetail);
    other.componentRef.setInput('id', Number.NaN); // what numberAttribute gives for /tickets/abc
    other.detectChanges();
    await other.whenStable();

    httpMock.expectNone((req) => req.url.startsWith('/api/tickets/'));
    expect((other.nativeElement as HTMLElement).querySelector('[data-testid="not-found"]')).not.toBeNull();
  });
});
