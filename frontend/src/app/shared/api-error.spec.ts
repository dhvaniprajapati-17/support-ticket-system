import { HttpErrorResponse } from '@angular/common/http';

import { errorMessage, fieldErrors, isNotFound } from './api-error';

const httpError = (status: number, error: unknown = null) => new HttpErrorResponse({ status, error });

describe('api-error helpers', () => {
  it('uses ProblemDetail.detail for client errors', () => {
    expect(errorMessage(httpError(400, { status: 400, title: 'Bad', detail: 'Title is too short.' }), 'fallback')).toBe(
      'Title is too short.',
    );
  });

  it('falls back when a client error has no ProblemDetail body', () => {
    expect(errorMessage(httpError(400, 'plain text'), 'Could not save.')).toBe('Could not save.');
  });

  it('never shows server-side details for 5xx errors', () => {
    const message = errorMessage(httpError(500, { status: 500, title: 'x', detail: 'SQL syntax error' }), 'fallback');
    expect(message).toBe('Something went wrong on the server. Please try again.');
  });

  it('reports an unreachable backend for status 0 and proxy errors (502/503/504)', () => {
    for (const status of [0, 502, 503, 504]) {
      expect(errorMessage(httpError(status), 'fallback')).toContain('Cannot reach the server');
    }
  });

  it('extracts field errors and detects 404', () => {
    expect(fieldErrors(httpError(400, { status: 400, title: 'x', errors: { title: 'too short' } }))).toEqual({
      title: 'too short',
    });
    expect(fieldErrors(httpError(400, { status: 400, title: 'x' }))).toBeNull();
    expect(isNotFound(httpError(404))).toBe(true);
    expect(isNotFound(httpError(400))).toBe(false);
  });
});
