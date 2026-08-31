import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BILLING_PLANS } from '@core/models/billing.model';
import { SeoService } from '@core/services/seo';

interface Slide {
  id: number;
  light: string;
  dark: string;
  alt: string;
}

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing implements AfterViewInit, OnDestroy, OnInit {
  private readonly el = inject(ElementRef);
  private readonly seo = inject(SeoService);
  private observer: IntersectionObserver | null = null;
  readonly plans = BILLING_PLANS;
  readonly mobileMenuOpen = signal(false);
  activeSlide = signal<number>(0);
  private timerId: any;

  slides: Slide[] = [
    { id: 1, light: 'dashboard-1.webp', dark: 'dashboard-black-1.webp', alt: 'Dashboard 1' },
    { id: 2, light: 'dashboard-2.webp', dark: 'dashboard-black-2.webp', alt: 'Dashboard 2' },
    { id: 3, light: 'dashboard-3.webp', dark: 'dashboard-black-3.webp', alt: 'Dashboard 3' },
    { id: 4, light: 'dashboard-4.webp', dark: 'dashboard-black-4.webp', alt: 'Dashboard 4' },
  ];

  readonly footerLinks = [
    {
      title: 'Producto',
      links: ['Características', 'Precios', 'Documentación', 'Historial de cambios'],
    },
    {
      title: 'Compañía',
      links: ['Sobre nosotros', 'Blog', 'Carreras', 'Contacto'],
    },
    {
      title: 'Legal',
      links: ['Privacidad', 'Términos', 'Política de cookies', 'SLA'],
    },
  ];

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngAfterViewInit() {
    this.initScrollReveal();
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      setTimeout(() => this.scrollToSection(id), 100);
    }

    this.seo.updateTags({
      title: 'Venti Shop - La Plataforma de Ecommerce Multi-Tenant Moderna',
      description:
        'Lanza tu SaaS en minutos. Gestiona productos, miembros y suscripciones con una interfaz hermosa y unificada.',
      keywords: [
        'multi-tenant',
        'ecommerce',
        'saas',
        'angular',
        'supabase',
        'constructor de tiendas',
      ],
      type: 'website',
    });

    this.seo.setOrganizationSchema({
      name: 'Venti Shop',
      url: window.location.origin,
      logo: window.location.origin + '/assets/logo.png',
    });
  }

  ngOnDestroy() {
    this.stopAutoPlay();

    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private initScrollReveal() {
    const options = {
      root: null,
      threshold: 0.1,
      rootMargin: '0px',
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          this.observer?.unobserve(entry.target);
        }
      });
    }, options);

    const items = this.el.nativeElement.querySelectorAll('.reveal-item');
    items.forEach((item: HTMLElement) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        item.classList.add('reveal-visible');
      } else {
        this.observer?.observe(item);
      }
    });
  }

  scrollToSection(id: string) {
    this.mobileMenuOpen.set(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }

  startAutoPlay(): void {
    this.timerId = setInterval(() => {
      this.activeSlide.update((current) => (current + 1) % this.slides.length);
    }, 4000);
  }

  stopAutoPlay(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  setActiveSlide(index: number): void {
    this.activeSlide.set(index);
    this.stopAutoPlay();
    this.startAutoPlay();
  }
}
