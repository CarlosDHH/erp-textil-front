import { Component, HostListener, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { AuthService } from './features/auth/services/auth.service';
import { selectAccessToken } from './features/auth/store/auth.selectors';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  providers: [MessageService],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('erp-textil-front');
  private messageService = inject(MessageService);

  private store = inject(Store);
  private authService = inject(AuthService);

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.store.select(selectAccessToken).pipe(take(1)).subscribe((accessToken) => {
      if (accessToken) this.authService.notifyOfflineBeacon(accessToken);
    });
  }
}
