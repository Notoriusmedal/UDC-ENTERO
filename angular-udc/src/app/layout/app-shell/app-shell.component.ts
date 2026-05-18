import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

type AuthSlide = {
  image: string;
  meta: string;
  position: string;
};

@Component({
  selector: 'app-shell',
  imports: [FormsModule, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly authMode = signal<'login' | 'register'>('login');
  readonly loginForm = {
    username: 'admin',
    password: 'admin',
  };
  readonly registerForm = {
    username: '',
    password: '',
    nombre: '',
    apellidos: '',
    correo: '',
    documentoIdentidad: '',
    telefono: '',
    rol: 'ESPECTADOR' as 'ESPECTADOR' | 'ORGANIZADOR' | 'ARBITRO',
  };
  readonly activeSlide = signal(0);
  readonly carouselIndicators = [0, 1, 2, 3];
  readonly activeIndicator = computed(() => this.activeSlide() % this.carouselIndicators.length);
  readonly authSlides: AuthSlide[] = [
    {
      image: '/assets/images/foto-teide.avif',
      meta: 'Teide · Tenerife',
      position: 'center',
    },
    {
      image: '/assets/images/imagen-portada-1.png',
      meta: 'Deporte Canarias',
      position: 'center',
    },
    {
      image: '/assets/images/imagen-portada-2.png',
      meta: 'Partidos y asignaciones',
      position: 'center',
    },
    {
      image: '/assets/images/imagen-portada-3.png',
      meta: 'Calendario deportivo',
      position: 'center',
    },
    {
      image: '/assets/images/imagen-portada-4.png',
      meta: 'Coordinación arbitral',
      position: 'center',
    },
    {
      image: '/assets/images/imagen-portada-5.png',
      meta: 'Jornadas deportivas',
      position: 'center',
    },
    {
      image: '/assets/images/imagen-portada-6.png',
      meta: 'UDC',
      position: 'center',
    },
  ];
  private carouselTimer?: ReturnType<typeof setInterval>;

  async ngOnInit(): Promise<void> {
    await this.auth.restoreSession();
    this.startCarousel();
  }

  ngOnDestroy(): void {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
    }
  }

  login(): void {
    void this.auth.login(this.loginForm.username, this.loginForm.password);
  }

  register(): void {
    void this.auth.register({ ...this.registerForm });
  }

  setAuthMode(mode: 'login' | 'register'): void {
    this.authMode.set(mode);
    this.auth.clearError();
  }

  nextSlide(): void {
    this.activeSlide.update((index) => (index + 1) % this.authSlides.length);
  }

  private startCarousel(): void {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
    }

    if (this.authSlides.length <= 1) {
      return;
    }

    this.carouselTimer = setInterval(() => this.nextSlide(), 7000);
  }
}
