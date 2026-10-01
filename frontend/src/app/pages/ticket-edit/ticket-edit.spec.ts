import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { makeTicket, problem, selectByText, typeInto } from '../../testing/test-helpers';
import { TicketEdit } from './ticket-edit';

describe('TicketEdit', () => {
  let fixture: ComponentFixture<TicketEdit>;
  let httpMock: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;
  let el: HTMLElement;

  const existing = makeTicket({ id: 5, status: 'IN_PROGRESS', createdBy: 'alice' });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TicketEdit],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(TicketEdit);
    fixture.componentRef.setInput('id', 5); // what the router does for /tickets/5/edit
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('loads the ticket once and fills the form; createdBy is read-only', async () => {
    httpMock.expectOne('/api/tickets/5').flush(existing);
    await fixture.whenStable();

    expect(el.querySelector<HTMLInputElement>('#title')!.value).toBe(existing.title);
    expect(el.querySelector<HTMLTextAreaElement>('#description')!.value).toBe(existing.description);
    expect(el.querySelector<HTMLSelectElement>('#priority')!.selectedOptions[0].textContent?.trim()).toBe('High');
    expect(el.querySelector('#createdBy')).toBeNull(); // no input for createdBy
    expect(el.querySelector('[data-testid="created-by-readonly"]')?.textContent).toContain('alice');
  });

  it('PUTs only the editable fields (keeps status, never sends createdBy) and returns to the detail page', async () => {
    httpMock.expectOne('/api/tickets/5').flush(existing);
    await fixture.whenStable();

    typeInto(el.querySelector<HTMLInputElement>('#title')!, 'Printer offline on floor 2');
    selectByText(el.querySelector<HTMLSelectElement>('#priority')!, 'Low');
    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();

    const req = httpMock.expectOne('/api/tickets/5');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      title: 'Printer offline on floor 2',
      description: existing.description,
      priority: 'LOW',
      status: 'IN_PROGRESS',
    });
    expect(req.request.body).not.toHaveProperty('createdBy');
    expect(req.request.body).not.toHaveProperty('id');
    req.flush({ ...existing, title: 'Printer offline on floor 2', priority: 'LOW' });

    expect(navigate).toHaveBeenCalledWith(['/tickets', 5]);
  });

  it('shows a not-found message for an unknown ticket', async () => {
    httpMock.expectOne('/api/tickets/5').flush(...problem(404, { detail: 'Ticket not found with id 5' }));
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Ticket not found');
    expect(el.querySelector('form')).toBeNull();
  });
});
