package com.dhvaniprajapati.tickets.repository;

import com.dhvaniprajapati.tickets.entity.Priority;
import com.dhvaniprajapati.tickets.entity.Status;
import com.dhvaniprajapati.tickets.entity.Ticket;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Runs the real JPQL query against a real (in-memory) H2 database.
 * Each test runs in a transaction that is rolled back afterwards, so tests don't affect each other.
 */
@DataJpaTest
@TestPropertySource(properties = "spring.sql.init.mode=never") // skip data.sql; each test uses its own rows
class TicketRepositoryTest {

    @Autowired
    private TicketRepository ticketRepository;

    private Ticket loginBug;
    private Ticket invoiceBug;
    private Ticket darkMode;

    @BeforeEach
    void setUp() {
        // Saved in this order, so darkMode is the newest.
        loginBug = ticketRepository.save(
                new Ticket("Cannot log in", "Session error after signing in", Priority.HIGH, Status.OPEN, "alice"));
        invoiceBug = ticketRepository.save(
                new Ticket("Invoice currency wrong", "Shows USD instead of EUR", Priority.MEDIUM, Status.IN_PROGRESS, "bob"));
        darkMode = ticketRepository.save(
                new Ticket("Add dark mode", "Customers want a LOGIN page theme too", Priority.LOW, Status.OPEN, "carol"));
    }

    @Test
    void save_setsIdAndTimestamps() {
        assertThat(loginBug.getId()).isNotNull();
        assertThat(loginBug.getCreatedAt()).isNotNull();
        assertThat(loginBug.getUpdatedAt()).isEqualTo(loginBug.getCreatedAt());
    }

    @Test
    void search_withNoFilters_returnsAllTicketsNewestFirst() {
        List<Ticket> result = ticketRepository.search(null, null, null);

        assertThat(result).containsExactly(darkMode, invoiceBug, loginBug);
    }

    @Test
    void search_combinesStatusAndPriorityFilters() {
        assertThat(ticketRepository.search(Status.OPEN, null, null)).containsExactly(darkMode, loginBug);
        assertThat(ticketRepository.search(Status.OPEN, Priority.HIGH, null)).containsExactly(loginBug);
        assertThat(ticketRepository.search(Status.RESOLVED, null, null)).isEmpty();
    }

    @Test
    void search_matchesTitleOrDescriptionCaseInsensitively() {
        // "login" is in loginBug's title ("log in" does not match) and in darkMode's description ("LOGIN").
        assertThat(ticketRepository.search(null, null, "login")).containsExactly(darkMode);
        assertThat(ticketRepository.search(null, null, "LOG IN")).containsExactly(loginBug);
        assertThat(ticketRepository.search(null, null, "eur")).containsExactly(invoiceBug);
    }

    @Test
    void countByStatus_countsOnlyThatStatus() {
        assertThat(ticketRepository.countByStatus(Status.OPEN)).isEqualTo(2);
        assertThat(ticketRepository.countByStatus(Status.IN_PROGRESS)).isEqualTo(1);
        assertThat(ticketRepository.countByStatus(Status.RESOLVED)).isZero();
    }
}
