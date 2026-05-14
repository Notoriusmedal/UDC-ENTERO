import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  imports: [FormsModule, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly loginForm = {
    username: 'admin',
    password: 'admin',
  };

  async ngOnInit(): Promise<void> {
    await this.auth.restoreSession();
  }

  login(): void {
    void this.auth.login(this.loginForm.username, this.loginForm.password);
  }
}
