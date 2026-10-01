import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { App } from './app';
import { routes } from './app.routes';
import { TicketDetail } from './pages/ticket-detail/ticket-detail';
import { TicketEdit } from './pages/ticket-edit/ticket-edit';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // Same router setup as the real app. HttpClient is faked because the dashboard loads data.
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should render the title and navigation links', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Mini Support Ticket System');
    const links = Array.from(compiled.querySelectorAll('nav a')).map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/', '/tickets']);
  });

  describe('routes', () => {
    async function headingAt(url: string): Promise<string | undefined> {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url);
      return (harness.routeNativeElement as HTMLElement).querySelector('h2')?.textContent?.trim();
    }

    it('shows the dashboard at /', async () => {
      expect(await headingAt('/')).toBe('Dashboard');
    });

    it('shows the ticket list at /tickets', async () => {
      expect(await headingAt('/tickets')).toBe('Tickets');
    });

    it('matches /tickets/new before /tickets/:id', async () => {
      expect(await headingAt('/tickets/new')).toBe('New ticket');
    });

    it('passes the :id route parameter into the detail page', async () => {
      const harness = await RouterTestingHarness.create();
      const page = await harness.navigateByUrl('/tickets/7', TicketDetail);
      expect(page.id()).toBe(7);
    });

    it('passes the :id route parameter into the edit page', async () => {
      const harness = await RouterTestingHarness.create();
      const page = await harness.navigateByUrl('/tickets/7/edit', TicketEdit);
      expect(page.id()).toBe(7);
    });

    it('shows the not-found page for unknown URLs', async () => {
      expect(await headingAt('/does/not/exist')).toBe('Page not found');
    });
  });
});
