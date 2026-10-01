import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { problem } from '../../testing/test-helpers';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges(); // runs ngOnInit -> request
  });

  afterEach(() => httpMock.verify());

  const text = (testId: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${testId}"] .card-value`)?.textContent?.trim();

  it('shows a loading state, then the summary counts from one request', async () => {
    expect(fixture.nativeElement.textContent).toContain('Loading summary');

    httpMock.expectOne('/api/tickets/summary').flush({ total: 8, open: 4, inProgress: 3, resolved: 1 });
    await fixture.whenStable();

    expect(text('total')).toBe('8');
    expect(text('open')).toBe('4');
    expect(text('in-progress')).toBe('3');
    expect(text('resolved')).toBe('1');
  });

  it('shows zero counts normally when there are no tickets', async () => {
    httpMock.expectOne('/api/tickets/summary').flush({ total: 0, open: 0, inProgress: 0, resolved: 0 });
    await fixture.whenStable();

    expect(text('total')).toBe('0');
  });

  it('shows a friendly error without server details when the API fails', async () => {
    httpMock.expectOne('/api/tickets/summary').flush(...problem(500, { detail: 'NullPointerException at line 42' }));
    await fixture.whenStable();

    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Something went wrong on the server');
    expect(fixture.nativeElement.textContent).not.toContain('NullPointerException');
  });
});
