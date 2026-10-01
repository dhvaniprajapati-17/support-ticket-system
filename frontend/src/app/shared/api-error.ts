import { HttpErrorResponse } from '@angular/common/http';

import { ProblemDetail } from '../models/ticket.model';

// Small helpers for turning a failed HttpClient call into something we can show the user.
// The backend's GlobalExceptionHandler returns RFC 9457 ProblemDetail bodies (see models/ticket.model.ts).

function problemDetailOf(error: unknown): ProblemDetail | null {
  if (error instanceof HttpErrorResponse && typeof error.error === 'object' && error.error !== null) {
    return error.error as ProblemDetail;
  }
  return null;
}

/**
 * A user-friendly message for any failed request.
 * Uses ProblemDetail.detail for client errors (4xx); never shows server internals for 5xx.
 */
export function errorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }
  // 0 = no response at all; 502/503/504 = a proxy (e.g. the Angular dev server) could not reach the backend.
  if (error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504) {
    return 'Cannot reach the server. Please check that the backend is running.';
  }
  if (error.status >= 500) {
    return 'Something went wrong on the server. Please try again.';
  }
  return problemDetailOf(error)?.detail ?? fallback;
}

/** Field-level validation messages from a 400 ProblemDetail ({ title: "must not be blank", ... }), if any. */
export function fieldErrors(error: unknown): Record<string, string> | null {
  const errors = problemDetailOf(error)?.errors;
  return errors && Object.keys(errors).length > 0 ? errors : null;
}

export function isNotFound(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 404;
}
