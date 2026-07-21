import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, isDevMode, LOCALE_ID } from '@angular/core'
import { provideRouter, withInMemoryScrolling } from '@angular/router'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { registerLocaleData } from '@angular/common'
import localeEsMx from '@angular/common/locales/es-MX'
import { provideStore } from '@ngrx/store'
import { provideEffects } from '@ngrx/effects'
import { provideStoreDevtools } from '@ngrx/store-devtools'
import { provideServiceWorker } from '@angular/service-worker'
import Aura from '@primeng/themes/aura'
import { providePrimeNG } from 'primeng/config'

import { routes } from './app.routes'
import { authReducer } from './features/auth/store/auth.reducer'
import { AuthEffects } from './features/auth/store/auth.effects'
import { authInterceptor } from './core/interceptors/auth.interceptor'

registerLocaleData(localeEsMx, 'es-MX')

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-MX' },
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({ auth: authReducer }),
    provideEffects([AuthEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: false }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: '.dark-mode' },
      },
    }),
  ],
}
