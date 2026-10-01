package com.dhvaniprajapati.tickets.exception;

/** Thrown when a ticket id does not exist. Turned into a 404 response by GlobalExceptionHandler. */
public class TicketNotFoundException extends RuntimeException {

    public TicketNotFoundException(Long id) {
        super("Ticket not found with id " + id);
    }
}
