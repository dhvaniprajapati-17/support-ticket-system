import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <h2>Page not found</h2>
    <p>The page you are looking for does not exist.</p>
    <p><a routerLink="/">Go to the dashboard</a></p>
  `,
})
export class NotFound {}
