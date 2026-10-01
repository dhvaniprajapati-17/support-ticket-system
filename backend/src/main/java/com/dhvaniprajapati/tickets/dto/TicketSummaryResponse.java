package com.dhvaniprajapati.tickets.dto;

/** Dashboard counts returned by GET /api/tickets/summary. */
public record TicketSummaryResponse(long total, long open, long inProgress, long resolved) {
}
