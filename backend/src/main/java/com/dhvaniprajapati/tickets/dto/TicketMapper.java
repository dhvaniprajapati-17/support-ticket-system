package com.dhvaniprajapati.tickets.dto;

import com.dhvaniprajapati.tickets.entity.Status;
import com.dhvaniprajapati.tickets.entity.Ticket;

/** Converts between API objects (DTOs) and the JPA entity. Plain static methods, no framework. */
public final class TicketMapper {

    private TicketMapper() {
    }

    public static Ticket toEntity(CreateTicketRequest request) {
        Status status = request.status() != null ? request.status() : Status.OPEN;
        return new Ticket(
                request.title().trim(),
                request.description().trim(),
                request.priority(),
                status,
                request.createdBy().trim());
    }

    public static TicketResponse toResponse(Ticket ticket) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getPriority(),
                ticket.getStatus(),
                ticket.getCreatedBy(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt());
    }
}
