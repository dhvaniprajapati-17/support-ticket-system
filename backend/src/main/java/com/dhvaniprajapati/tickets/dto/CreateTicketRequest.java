package com.dhvaniprajapati.tickets.dto;

import com.dhvaniprajapati.tickets.entity.Priority;
import com.dhvaniprajapati.tickets.entity.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Body of POST /api/tickets. Status is optional and defaults to OPEN. */
public record CreateTicketRequest(
        @NotBlank @Size(min = 3, max = 100) String title,
        @NotBlank @Size(max = 2000) String description,
        @NotNull Priority priority,
        Status status,
        @NotBlank @Size(max = 100) String createdBy
) {
}
