package com.dhvaniprajapati.tickets.dto;

import com.dhvaniprajapati.tickets.entity.Status;
import jakarta.validation.constraints.NotNull;

/** Body of PATCH /api/tickets/{id}/status. */
public record StatusUpdateRequest(@NotNull Status status) {
}
