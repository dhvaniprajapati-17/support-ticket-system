package com.dhvaniprajapati.tickets.service;

import com.dhvaniprajapati.tickets.dto.CreateTicketRequest;
import com.dhvaniprajapati.tickets.dto.TicketResponse;
import com.dhvaniprajapati.tickets.dto.TicketSummaryResponse;
import com.dhvaniprajapati.tickets.dto.UpdateTicketRequest;
import com.dhvaniprajapati.tickets.entity.Priority;
import com.dhvaniprajapati.tickets.entity.Status;
import com.dhvaniprajapati.tickets.entity.Ticket;
import com.dhvaniprajapati.tickets.exception.TicketNotFoundException;
import com.dhvaniprajapati.tickets.repository.TicketRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit test: TicketService in isolation. No Spring, no database.
 * The repository is a Mockito mock, so each test decides exactly what the "database" returns.
 */
@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @InjectMocks
    private TicketService ticketService;

    @Test
    void create_defaultsStatusToOpenAndTrimsInput() {
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TicketResponse response = ticketService.create(
                new CreateTicketRequest("  Printer offline  ", " Floor 2 ", Priority.LOW, null, " dhvani "));

        ArgumentCaptor<Ticket> saved = ArgumentCaptor.forClass(Ticket.class);
        verify(ticketRepository).save(saved.capture());
        assertThat(saved.getValue().getStatus()).isEqualTo(Status.OPEN);
        assertThat(saved.getValue().getTitle()).isEqualTo("Printer offline");
        assertThat(saved.getValue().getCreatedBy()).isEqualTo("dhvani");
        assertThat(response.status()).isEqualTo(Status.OPEN);
    }

    @Test
    void findAll_treatsBlankSearchAsNoFilter() {
        when(ticketRepository.search(Status.OPEN, null, null)).thenReturn(List.of());

        ticketService.findAll(Status.OPEN, null, "   ");

        verify(ticketRepository).search(Status.OPEN, null, null);
    }

    @Test
    void update_changesEditableFields() {
        Ticket existing = new Ticket("Old title", "Old description", Priority.LOW, Status.OPEN, "alice");
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(ticketRepository.saveAndFlush(existing)).thenReturn(existing);

        TicketResponse response = ticketService.update(1L,
                new UpdateTicketRequest("New title", "New description", Priority.HIGH, Status.IN_PROGRESS));

        assertThat(response.title()).isEqualTo("New title");
        assertThat(response.priority()).isEqualTo(Priority.HIGH);
        assertThat(response.status()).isEqualTo(Status.IN_PROGRESS);
        assertThat(response.createdBy()).isEqualTo("alice");
    }

    @Test
    void update_throwsWhenTicketDoesNotExist() {
        when(ticketRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ticketService.update(99L,
                new UpdateTicketRequest("Title", "Description", Priority.LOW, Status.OPEN)))
                .isInstanceOf(TicketNotFoundException.class)
                .hasMessage("Ticket not found with id 99");
    }

    @Test
    void delete_throwsAndDeletesNothingWhenTicketDoesNotExist() {
        when(ticketRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> ticketService.delete(99L)).isInstanceOf(TicketNotFoundException.class);
        verify(ticketRepository, never()).deleteById(any());
    }

    @Test
    void getSummary_combinesTotalAndPerStatusCounts() {
        when(ticketRepository.count()).thenReturn(6L);
        when(ticketRepository.countByStatus(Status.OPEN)).thenReturn(3L);
        when(ticketRepository.countByStatus(Status.IN_PROGRESS)).thenReturn(2L);
        when(ticketRepository.countByStatus(Status.RESOLVED)).thenReturn(1L);

        assertThat(ticketService.getSummary()).isEqualTo(new TicketSummaryResponse(6, 3, 2, 1));
    }
}
