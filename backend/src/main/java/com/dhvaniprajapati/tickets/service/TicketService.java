package com.dhvaniprajapati.tickets.service;

import com.dhvaniprajapati.tickets.dto.CreateTicketRequest;
import com.dhvaniprajapati.tickets.dto.TicketMapper;
import com.dhvaniprajapati.tickets.dto.TicketResponse;
import com.dhvaniprajapati.tickets.dto.TicketSummaryResponse;
import com.dhvaniprajapati.tickets.dto.UpdateTicketRequest;
import com.dhvaniprajapati.tickets.entity.Priority;
import com.dhvaniprajapati.tickets.entity.Status;
import com.dhvaniprajapati.tickets.entity.Ticket;
import com.dhvaniprajapati.tickets.exception.TicketNotFoundException;
import com.dhvaniprajapati.tickets.repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Business logic for tickets. The controller calls this; this calls the repository.
 * Every public method runs in a database transaction (read-only unless overridden).
 */
@Service
@Transactional(readOnly = true)
public class TicketService {

    private final TicketRepository ticketRepository;

    // Constructor injection: Spring sees this constructor and passes in the TicketRepository bean.
    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public List<TicketResponse> findAll(Status status, Priority priority, String search) {
        String searchTerm = (search == null || search.isBlank()) ? null : search.trim();
        return ticketRepository.search(status, priority, searchTerm).stream()
                .map(TicketMapper::toResponse)
                .toList();
    }

    public TicketResponse findById(Long id) {
        return TicketMapper.toResponse(getTicketOrThrow(id));
    }

    @Transactional
    public TicketResponse create(CreateTicketRequest request) {
        Ticket saved = ticketRepository.save(TicketMapper.toEntity(request));
        return TicketMapper.toResponse(saved);
    }

    @Transactional
    public TicketResponse update(Long id, UpdateTicketRequest request) {
        Ticket ticket = getTicketOrThrow(id);
        ticket.setTitle(request.title().trim());
        ticket.setDescription(request.description().trim());
        ticket.setPriority(request.priority());
        ticket.setStatus(request.status());
        // Flush now so @PreUpdate sets updatedAt before we build the response.
        return TicketMapper.toResponse(ticketRepository.saveAndFlush(ticket));
    }

    @Transactional
    public TicketResponse updateStatus(Long id, Status status) {
        Ticket ticket = getTicketOrThrow(id);
        ticket.setStatus(status);
        return TicketMapper.toResponse(ticketRepository.saveAndFlush(ticket));
    }

    @Transactional
    public void delete(Long id) {
        if (!ticketRepository.existsById(id)) {
            throw new TicketNotFoundException(id);
        }
        ticketRepository.deleteById(id);
    }

    public TicketSummaryResponse getSummary() {
        return new TicketSummaryResponse(
                ticketRepository.count(),
                ticketRepository.countByStatus(Status.OPEN),
                ticketRepository.countByStatus(Status.IN_PROGRESS),
                ticketRepository.countByStatus(Status.RESOLVED));
    }

    private Ticket getTicketOrThrow(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException(id));
    }
}
