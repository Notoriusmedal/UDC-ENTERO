import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

type AuthSlide = {
  image: string;
  title: string;
  description: string;
  kicker: string;
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
  readonly loginForm = {
    username: 'admin',
    password: 'admin',
  };
  readonly activeSlide = signal(0);
  readonly carouselIndicators = [0, 1, 2, 3];
  readonly activeIndicator = computed(() => this.activeSlide() % this.carouselIndicators.length);
  readonly authSlides: AuthSlide[] = [
    {
      image: '/assets/images/foto-teide.avif',
      title: 'Gestiona partidos, árbitros y asignaciones con una experiencia clara y moderna.',
      description: 'Una nueva interfaz Angular pensada para coordinadores, árbitros, clubes y organizadores deportivos de Canarias.',
      kicker: 'Plataforma deportiva',
      meta: 'Teide · Tenerife',
      position: 'center',
    },
    {
      image: '/assets/images/imagen-portada-1.png',
      title: 'Gestiona partidos, árbitros y asignaciones con una experiencia clara y moderna.',
      description: 'Una nueva interfaz Angular pensada para coordinadores, árbitros, clubes y organizadores deportivos de Canarias.',
      kicker: 'Plataforma deportiva',
      meta: 'Deporte Canarias',
      position: 'center',
    },
    {
      image: '/assets/images/imagen-portada-2.png',
      title: 'Gestiona partidos, árbitros y asignaciones con una experiencia clara y moderna.',
      description: 'Una nueva interfaz Angular pensada para coordinadores, árbitros, clubes y organizadores deportivos de Canarias.',
      kicker: 'Plataforma deportiva',
      meta: 'Partidos y asignaciones',
      position: 'center',
    },
    {
      image: '/assets/images/imagen-portada-3.png',
      title: 'Gestiona partidos, árbitros y asignaciones con una experiencia clara y moderna.',
      description: 'Una nueva interfaz Angular pensada para coordinadores, árbitros, clubes y organizadores deportivos de Canarias.',
      kicker: 'Plataforma deportiva',
      meta: 'Calendario deportivo',
      position: 'center',
    },
    {
      image: '/assets/images/imagen-portada-4.png',
      title: 'Gestiona partidos, árbitros y asignaciones con una experiencia clara y moderna.',
      description: 'Una nueva interfaz Angular pensada para coordinadores, árbitros, clubes y organizadores deportivos de Canarias.',
      kicker: 'Plataforma deportiva',
      meta: 'Coordinación arbitral',
      position: 'center',
    },
    {
      image: '/assets/images/imagen-portada-5.png',
      title: 'Gestiona partidos, árbitros y asignaciones con una experiencia clara y moderna.',
      description: 'Una nueva interfaz Angular pensada para coordinadores, árbitros, clubes y organizadores deportivos de Canarias.',
      kicker: 'Plataforma deportiva',
      meta: 'Jornadas deportivas',
      position: 'center',
    },
    {
      image: '/assets/images/imagen-portada-6.png',
      title: 'Gestiona partidos, árbitros y asignaciones con una experiencia clara y moderna.',
      description: 'Una nueva interfaz Angular pensada para coordinadores, árbitros, clubes y organizadores deportivos de Canarias.',
      kicker: 'Plataforma deportiva',
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
