package com.dhvaniprajapati.tickets.controller;

import com.dhvaniprajapati.tickets.dto.CreateTicketRequest;
import com.dhvaniprajapati.tickets.dto.StatusUpdateRequest;
import com.dhvaniprajapati.tickets.dto.TicketResponse;
import com.dhvaniprajapati.tickets.dto.TicketSummaryResponse;
import com.dhvaniprajapati.tickets.dto.UpdateTicketRequest;
import com.dhvaniprajapati.tickets.entity.Priority;
import com.dhvaniprajapati.tickets.entity.Status;
import com.dhvaniprajapati.tickets.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

/**
 * HTTP layer only: maps URLs to methods, reads/validates input, picks status codes.
 * All real work is delegated to TicketService.
 */
@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    // GET /api/tickets?status=OPEN&priority=HIGH&search=login
    @GetMapping
    public List<TicketResponse> getTickets(
            @RequestParam(required = false) Status status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) String search) {
        return ticketService.findAll(status, priority, search);
    }

    // GET /api/tickets/summary  (literal paths win over /{id}, so there is no clash)
    @GetMapping("/summary")
    public TicketSummaryResponse getSummary() {
        return ticketService.getSummary();
    }

    // GET /api/tickets/5
    @GetMapping("/{id}")
    public TicketResponse getTicket(@PathVariable Long id) {
        return ticketService.findById(id);
    }

    // POST /api/tickets  -> 201 Created + Location: /api/tickets/{newId}
    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(@Valid @RequestBody CreateTicketRequest request) {
        TicketResponse created = ticketService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    // PUT /api/tickets/5
    @PutMapping("/{id}")
    public TicketResponse updateTicket(@PathVariable Long id, @Valid @RequestBody UpdateTicketRequest request) {
        return ticketService.update(id, request);
    }

    // PATCH /api/tickets/5/status
    @PatchMapping("/{id}/status")
    public TicketResponse updateStatus(@PathVariable Long id, @Valid @RequestBody StatusUpdateRequest request) {
        return ticketService.updateStatus(id, request.status());
    }

    // DELETE /api/tickets/5  -> 204 No Content
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTicket(@PathVariable Long id) {
        ticketService.delete(id);
    }
}
