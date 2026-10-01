// Small helpers shared by the component tests.

import { ProblemDetail, Ticket } from '../models/ticket.model';

export function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 1,
    title: 'Printer offline',
    description: 'Floor 2 printer is offline.',
    priority: 'HIGH',
    status: 'OPEN',
    createdBy: 'alice',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    ...overrides,
  };
}

/** Options for HttpTestingController's req.flush(body, options) to simulate an error response. */
export function problem(status: number, body: Partial<ProblemDetail> = {}): [ProblemDetail, { status: number; statusText: string }] {
  return [{ status, title: 'Error', ...body }, { status, statusText: 'Error' }];
}

/** Type into an <input>/<textarea> the way a user would (fires the "input" event reactive forms listen to). */
export function typeInto(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  element.value = value;
  element.dispatchEvent(new Event('input'));
}

/** Pick an option in a <select> by its visible text. */
export function selectByText(select: HTMLSelectElement, text: string): void {
  const option = Array.from(select.options).find((o) => o.textContent?.trim() === text);
  if (!option) {
    throw new Error(`No option "${text}"`);
  }
  select.value = option.value;
  select.dispatchEvent(new Event('change'));
}

