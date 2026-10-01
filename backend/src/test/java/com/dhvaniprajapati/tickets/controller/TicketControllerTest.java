package com.dhvaniprajapati.tickets.controller;

import com.dhvaniprajapati.tickets.dto.CreateTicketRequest;
import com.dhvaniprajapati.tickets.dto.TicketResponse;
import com.dhvaniprajapati.tickets.dto.TicketSummaryResponse;
import com.dhvaniprajapati.tickets.dto.UpdateTicketRequest;
import com.dhvaniprajapati.tickets.entity.Priority;
import com.dhvaniprajapati.tickets.entity.Status;
import com.dhvaniprajapati.tickets.exception.TicketNotFoundException;
import com.dhvaniprajapati.tickets.service.TicketService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * API contract tests: real HTTP handling (URL mapping, JSON, validation, GlobalExceptionHandler),
 * with TicketService replaced by a Mockito mock. No server is started and no database is used.
 */
@WebMvcTest(TicketController.class)
class TicketControllerTest {

    private static final Instant CREATED = Instant.parse("2026-09-01T10:00:00Z");
    private static final Instant UPDATED = Instant.parse("2026-09-02T12:30:00Z");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TicketService ticketService;

    private static TicketResponse ticket(long id, Status status) {
        return new TicketResponse(id, "Printer offline", "Floor 2 printer is offline.",
                Priority.HIGH, status, "alice", CREATED, UPDATED);
    }

    // ---------- Successful requests ----------

    @Test
    void listTickets_passesFiltersToServiceAndReturnsArray() throws Exception {
        when(ticketService.findAll(Status.OPEN, Priority.HIGH, "printer"))
                .thenReturn(List.of(ticket(1, Status.OPEN), ticket(2, Status.OPEN)));

        mockMvc.perform(get("/api/tickets")
                        .param("status", "OPEN")
                        .param("priority", "HIGH")
                        .param("search", "printer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    void getTicket_returnsAllFieldsWithIsoTimestamps() throws Exception {
        when(ticketService.findById(1L)).thenReturn(ticket(1, Status.OPEN));

        mockMvc.perform(get("/api/tickets/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Printer offline"))
                .andExpect(jsonPath("$.description").value("Floor 2 printer is offline."))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.createdBy").value("alice"))
                .andExpect(jsonPath("$.createdAt").value("2026-09-01T10:00:00Z"))
                .andExpect(jsonPath("$.updatedAt").value("2026-09-02T12:30:00Z"));
    }

    @Test
    void createTicket_returns201WithLocationHeader() throws Exception {
        when(ticketService.create(any(CreateTicketRequest.class))).thenReturn(ticket(42, Status.OPEN));

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Printer offline", "description": "Floor 2 printer is offline.",
                                 "priority": "HIGH", "createdBy": "alice"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", endsWith("/api/tickets/42")))
                .andExpect(jsonPath("$.id").value(42));
    }

    @Test
    void updateTicket_returns200WithUpdatedTicket() throws Exception {
        UpdateTicketRequest request =
                new UpdateTicketRequest("Printer offline", "Floor 2 printer is offline.", Priority.HIGH, Status.IN_PROGRESS);
        when(ticketService.update(1L, request)).thenReturn(ticket(1, Status.IN_PROGRESS));

        mockMvc.perform(put("/api/tickets/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Printer offline", "description": "Floor 2 printer is offline.",
                                 "priority": "HIGH", "status": "IN_PROGRESS"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    void updateStatus_returns200WithNewStatus() throws Exception {
        when(ticketService.updateStatus(1L, Status.RESOLVED)).thenReturn(ticket(1, Status.RESOLVED));

        mockMvc.perform(patch("/api/tickets/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status": "RESOLVED"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));
    }

    @Test
    void deleteTicket_returns204WithEmptyBody() throws Exception {
        mockMvc.perform(delete("/api/tickets/1"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        verify(ticketService).delete(1L);
    }

    @Test
    void getSummary_returnsCounts() throws Exception {
        when(ticketService.getSummary()).thenReturn(new TicketSummaryResponse(8, 4, 2, 2));

        mockMvc.perform(get("/api/tickets/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(8))
                .andExpect(jsonPath("$.open").value(4))
                .andExpect(jsonPath("$.inProgress").value(2))
                .andExpect(jsonPath("$.resolved").value(2));
    }

    // ---------- Error responses (GlobalExceptionHandler) ----------

    @Test
    void getTicket_unknownId_returns404ProblemDetail() throws Exception {
        when(ticketService.findById(99L)).thenThrow(new TicketNotFoundException(99L));

        mockMvc.perform(get("/api/tickets/99"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.title").value("Ticket not found"))
                .andExpect(jsonPath("$.detail").value("Ticket not found with id 99"))
                .andExpect(jsonPath("$.instance").value("/api/tickets/99"));
    }

    @Test
    void createTicket_invalidFields_returns400WithFieldErrorsAndSkipsService() throws Exception {
        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "ab", "description": "", "priority": "LOW"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Validation failed"))
                .andExpect(jsonPath("$.errors.title").value("size must be between 3 and 100"))
                .andExpect(jsonPath("$.errors.description").value("must not be blank"))
                .andExpect(jsonPath("$.errors.createdBy").value("must not be blank"));

        verify(ticketService, never()).create(any());
    }

    @Test
    void updateStatus_invalidEnumInBody_returns400ListingAllowedValues() throws Exception {
        mockMvc.perform(patch("/api/tickets/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status": "DONE"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid value"))
                .andExpect(jsonPath("$.detail").value(
                        "Invalid value 'DONE' for field 'status'. Allowed values: [OPEN, IN_PROGRESS, RESOLVED]."))
                .andExpect(jsonPath("$.errors.status").value("must be one of [OPEN, IN_PROGRESS, RESOLVED]"));
    }

    @Test
    void createTicket_malformedJson_returns400() throws Exception {
        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"Oops\","))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Malformed JSON"))
                .andExpect(jsonPath("$.detail").value("The request body is not valid JSON."));
    }

    @Test
    void listTickets_invalidEnumQueryParam_returns400() throws Exception {
        mockMvc.perform(get("/api/tickets").param("priority", "URGENT"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid parameter"))
                .andExpect(jsonPath("$.detail").value(
                        "Invalid value 'URGENT' for 'priority'. Allowed values: [LOW, MEDIUM, HIGH]."));
    }

    @Test
    void getTicket_nonNumericId_returns400() throws Exception {
        mockMvc.perform(get("/api/tickets/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid parameter"))
                .andExpect(jsonPath("$.detail").value("Invalid value 'abc' for 'id'."));
    }

    @Test
    void unexpectedException_returns500WithoutLeakingDetails() throws Exception {
        when(ticketService.getSummary()).thenThrow(new IllegalStateException("database password is hunter2"));

        mockMvc.perform(get("/api/tickets/summary"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Internal server error"))
                .andExpect(jsonPath("$.detail").value("An unexpected error occurred."))
                .andExpect(content().string(not(containsString("hunter2"))));
    }
}
