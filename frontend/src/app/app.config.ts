import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';

/** App-wide providers: services and features available to every component through dependency injection. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: route params like :id are passed to the page component as inputs.
    provideRouter(routes, withComponentInputBinding()),
    // Registers HttpClient so services can inject it.
    provideHttpClient(),
  ],
};
