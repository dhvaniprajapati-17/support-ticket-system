package com.dhvaniprajapati.tickets;

import org.junit.jupiter.api.Test;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Starts the whole application to check that everything is wired correctly.
 * @AutoConfigureTestDatabase swaps the PostgreSQL DataSource for an in-memory H2 database,
 * so this test runs without a PostgreSQL server (the real database is verified manually, see README).
 */
@SpringBootTest
@AutoConfigureTestDatabase
class TicketsApplicationTests {

	@Test
	void contextLoads() {
	}

}
