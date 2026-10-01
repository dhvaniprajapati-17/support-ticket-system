package com.dhvaniprajapati.tickets.repository;

import com.dhvaniprajapati.tickets.entity.Priority;
import com.dhvaniprajapati.tickets.entity.Status;
import com.dhvaniprajapati.tickets.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

/**
 * Spring Data generates the implementation of this interface at startup.
 * JpaRepository already provides save, findById, findAll, existsById, deleteById, count, ...
 */
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    /**
     * Every filter is optional: passing null for a parameter disables that condition.
     * Written in JPQL, which queries entity classes/fields (Ticket, t.status), not tables/columns.
     *
     * CAST(:search AS String) gives the search parameter an explicit text type. Without it, PostgreSQL
     * cannot infer the type of a null parameter, treats it as binary (bytea) and fails with
     * "function lower(bytea) does not exist". (H2 does not have this problem.)
     */
    @Query("""
            SELECT t FROM Ticket t
            WHERE (:status IS NULL OR t.status = :status)
              AND (:priority IS NULL OR t.priority = :priority)
              AND (CAST(:search AS String) IS NULL
                   OR LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:search AS String), '%'))
                   OR LOWER(t.description) LIKE LOWER(CONCAT('%', CAST(:search AS String), '%')))
            ORDER BY t.createdAt DESC, t.id DESC
            """)
    List<Ticket> search(Status status, Priority priority, String search);

    /** Derived query: Spring Data builds "SELECT COUNT(*) ... WHERE status = ?" from the method name. */
    long countByStatus(Status status);
}
