import { ChangeDetectionStrategy, Component, inject, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BILLING_PLANS } from '@core/models/billing.model';
import { SeoService } from '@core/services/seo';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly seo = inject(SeoService);
  private observer: IntersectionObserver | null = null;
  readonly plans = BILLING_PLANS;

  readonly footerLinks = [
    {
      title: 'Product',
      links: ['Features', 'Pricing', 'Documentation', 'Changelog']
    },
    {
      title: 'Company',
      links: ['About Us', 'Blog', 'Careers', 'Contact']
    },
    {
      title: 'Legal',
      links: ['Privacy', 'Terms', 'Cookie Policy', 'SLA']
    }
  ];

  ngAfterViewInit() {
    this.initScrollReveal();
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      setTimeout(() => this.scrollToSection(id), 100);
    }

    this.seo.updateTags({
      title: 'Venti Shop - The Modern Multi-Tenant Ecommerce Platform',
      description: 'Launch your SaaS in minutes. Manage products, members, and subscriptions with a beautiful, unified interface.',
      keywords: ['multi-tenant', 'ecommerce', 'saas', 'angular', 'supabase', 'store builder'],
      type: 'website'
    });

    this.seo.setOrganizationSchema({
      name: 'Venti Shop',
      url: window.location.origin,
      logo: window.location.origin + '/assets/logo.png'
    });
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private initScrollReveal() {
    const options = {
      root: null,
      threshold: 0.1,
      rootMargin: '0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
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
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}
