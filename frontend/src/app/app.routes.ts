import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './pages/not-found/not-found';
import { TicketCreate } from './pages/ticket-create/ticket-create';
import { TicketDetail } from './pages/ticket-detail/ticket-detail';
import { TicketEdit } from './pages/ticket-edit/ticket-edit';
import { TicketList } from './pages/ticket-list/ticket-list';

/**
 * URL -> page component. The router checks routes top to bottom and uses the first match,
 * so 'tickets/new' must come before 'tickets/:id' (otherwise "new" would be treated as an id).
 * `title` sets the browser tab title.
 */
export const routes: Routes = [
  { path: '', component: Dashboard, title: 'Dashboard · Support Tickets' },
  { path: 'tickets', component: TicketList, title: 'Tickets · Support Tickets' },
  { path: 'tickets/new', component: TicketCreate, title: 'New ticket · Support Tickets' },
  { path: 'tickets/:id', component: TicketDetail, title: 'Ticket details · Support Tickets' },
  { path: 'tickets/:id/edit', component: TicketEdit, title: 'Edit ticket · Support Tickets' },
  { path: '**', component: NotFound, title: 'Not found · Support Tickets' },
];
