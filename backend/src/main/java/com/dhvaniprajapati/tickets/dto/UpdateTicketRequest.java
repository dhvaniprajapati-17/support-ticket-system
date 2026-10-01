package com.dhvaniprajapati.tickets.dto;

import com.dhvaniprajapati.tickets.entity.Priority;
import com.dhvaniprajapati.tickets.entity.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Body of PUT /api/tickets/{id}. Replaces all editable fields; createdBy cannot be changed. */
public record UpdateTicketRequest(
        @NotBlank @Size(min = 3, max = 100) String title,
        @NotBlank @Size(max = 2000) String description,
        @NotNull Priority priority,
        @NotNull Status status
) {
}
