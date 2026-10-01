// TypeScript shapes of the JSON exchanged with the Spring Boot API.
// Each one mirrors a Java DTO in backend/.../dto (field names must match exactly).

/** Mirrors the Java enum Priority. A union of string literals matches the JSON ("HIGH") directly. */
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

/** Mirrors the Java enum Status. */
export type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

/** All values, in display order - handy for dropdowns and filters. */
export const PRIORITIES: readonly Priority[] = ['LOW', 'MEDIUM', 'HIGH'];
export const STATUSES: readonly Status[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

/** Mirrors TicketResponse. */
export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdBy: string;
  /** ISO-8601 UTC timestamp, e.g. "2026-09-23T10:17:12Z". JSON has no Date type, so it arrives as a string. */
  createdAt: string;
  updatedAt: string;
}

/** Mirrors TicketSummaryResponse (GET /api/tickets/summary). */
export interface TicketSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}

/** Mirrors CreateTicketRequest (POST /api/tickets). Status is optional; the backend defaults it to OPEN. */
export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: Priority;
  status?: Status;
  createdBy: string;
}

/** Mirrors UpdateTicketRequest (PUT /api/tickets/{id}). createdBy cannot be changed, so it is not here. */
export interface UpdateTicketRequest {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
}

/** Mirrors StatusUpdateRequest (PATCH /api/tickets/{id}/status). */
export interface StatusUpdateRequest {
  status: Status;
}

/** Optional query parameters for GET /api/tickets. */
export interface TicketFilters {
  status?: Status;
  priority?: Priority;
  search?: string;
}

/**
 * Error body returned by the backend's GlobalExceptionHandler (RFC 9457 ProblemDetail).
 * Available as HttpErrorResponse.error when a request fails.
 */
export interface ProblemDetail {
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  /** Field name -> message, present on validation errors. */
  errors?: Record<string, string>;
}
