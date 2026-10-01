package com.dhvaniprajapati.tickets.dto;

import com.dhvaniprajapati.tickets.entity.Priority;
import com.dhvaniprajapati.tickets.entity.Status;

import java.time.Instant;

/** What the API returns for a ticket. Jackson turns this record into JSON. */
public record TicketResponse(
        Long id,
        String title,
        String description,
        Priority priority,
        Status status,
        String createdBy,
        Instant createdAt,
        Instant updatedAt
) {
}
