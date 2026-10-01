import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { makeTicket, problem, selectByText, typeInto } from '../../testing/test-helpers';
import { TicketCreate } from './ticket-create';

describe('TicketCreate', () => {
  let fixture: ComponentFixture<TicketCreate>;
  let httpMock: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;
  let el: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [TicketCreate],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(TicketCreate);
    el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => httpMock.verify());

  function fillValidForm(): void {
    typeInto(el.querySelector<HTMLInputElement>('#title')!, 'Printer offline');
    typeInto(el.querySelector<HTMLTextAreaElement>('#description')!, 'Floor 2 printer is offline.');
    selectByText(el.querySelector<HTMLSelectElement>('#priority')!, 'High');
    typeInto(el.querySelector<HTMLInputElement>('#createdBy')!, 'alice');
  }

  const submitButton = () => el.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const errorText = (field: string) => el.querySelector(`[data-testid="${field}-error"]`)?.textContent?.trim();

  it('shows required messages and sends nothing when submitted empty', async () => {
    submitButton().click();
    await fixture.whenStable();

    expect(errorText('title')).toBe('Title is required.');
    expect(errorText('description')).toBe('Description is required.');
    expect(errorText('priority')).toBe('Priority is required.');
    expect(errorText('createdBy')).toBe('Created by is required.');
    httpMock.expectNone('/api/tickets');
  });

  it('validates title length and whitespace-only values', async () => {
    typeInto(el.querySelector<HTMLInputElement>('#title')!, 'ab');
    typeInto(el.querySelector<HTMLInputElement>('#createdBy')!, '   ');
    submitButton().click();
    await fixture.whenStable();

    expect(errorText('title')).toBe('Title must be 3–100 characters.');
    expect(errorText('createdBy')).toBe('Created by is required.');
    httpMock.expectNone('/api/tickets');
  });

  it('checks the length of the trimmed text, which is what gets sent', async () => {
    fillValidForm();
    typeInto(el.querySelector<HTMLInputElement>('#title')!, 'ab '); // 3 characters, but only 2 after trimming
    submitButton().click();
    await fixture.whenStable();

    expect(errorText('title')).toBe('Title must be 3–100 characters.');
    httpMock.expectNone('/api/tickets');
  });

  it('sends one POST with the form values and opens the new ticket', async () => {
    fillValidForm();
    submitButton().click();
    submitButton().click(); // a double-click must not create two tickets
    await fixture.whenStable();

    const req = httpMock.expectOne('/api/tickets');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      title: 'Printer offline',
      description: 'Floor 2 printer is offline.',
      priority: 'HIGH',
      createdBy: 'alice',
    });
    req.flush(makeTicket({ id: 42 }), { status: 201, statusText: 'Created' });

    expect(navigate).toHaveBeenCalledWith(['/tickets', 42]);
  });

  it('maps backend validation errors (ProblemDetail.errors) onto the form fields', async () => {
    fillValidForm();
    submitButton().click();

    httpMock.expectOne('/api/tickets').flush(
      ...problem(400, {
        title: 'Validation failed',
        detail: 'One or more fields are invalid.',
        errors: { title: 'Title already used by another ticket', createdBy: 'unknown user' },
      }),
    );
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('One or more fields are invalid.');
    expect(errorText('title')).toBe('Title already used by another ticket');
    expect(errorText('createdBy')).toBe('unknown user');
    expect(submitButton().disabled).toBe(false); // user can fix and resubmit
    expect(navigate).not.toHaveBeenCalled();
  });
});
