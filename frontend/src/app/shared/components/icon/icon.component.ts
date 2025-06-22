import { Component, Input, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconSize, IconComponentProps } from './icons/icon.interfaces';
import { getIconSvg, getIconVariant } from './icons/heroicons';
import {IconName} from './icons/icon.types';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: './icon.component.html',
  styles: './icon.component.scss',
})
export class IconComponent implements OnInit {
  // Inputs jako sygnały
  name = signal<IconName>('home');
  size = signal<IconSize>(24);
  customClass = signal<string>('');
  ariaLabel = signal<string | undefined>(undefined);
  ariaHidden = signal<boolean>(false);

  // Settery dla inputs (kompatybilność z Angular)
  @Input() set iconName(value: IconName) {
    this.name.set(value);
  }

  @Input() set iconSize(value: IconSize) {
    this.size.set(value);
  }

  @Input() set class(value: string) {
    this.customClass.set(value || '');
  }

  @Input() set iconAriaLabel(value: string | undefined) {
    this.ariaLabel.set(value);
  }

  @Input() set iconAriaHidden(value: boolean) {
    this.ariaHidden.set(value);
  }

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // Sprawdź czy ikona istnieje
    if (!this.iconExists()) {
      console.warn(`Icon "${this.name()}" not found. Available icons should be checked.`);
    }
  }

  // Computed sygnały
  computedSize = computed(() => {
    const size = this.size();

    // Mapowanie nazw na piksele
    if (typeof size === 'string') {
      switch (size) {
        case 'micro': return 16;
        case 'mini': return 20;
        case 'outline': return 24;
        case 'solid': return 24;
        default: return 24;
      }
    }

    return size;
  });

  computedClasses = computed(() => {
    const baseClasses = ['inline-flex', 'items-center', 'justify-center'];
    const customClasses = this.customClass().split(' ').filter(c => c.trim());

    // Dodaj domyślny kolor jeśli nie został podany
    const hasColorClass = customClasses.some(cls =>
      cls.includes('text-') || cls.includes('stroke-') || cls.includes('fill-')
    );

    if (!hasColorClass) {
      baseClasses.push('text-current');
    }

    return [...baseClasses, ...customClasses].join(' ');
  });

  iconExists = computed(() => {
    const svgContent = getIconSvg(this.name());
    return !!svgContent;
  });

  sanitizedSvg = computed(() => {
    const svgContent = getIconSvg(this.name());

    if (!svgContent) {
      // Fallback - pokaż placeholder lub pusty element
      const fallbackSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
        </svg>
      `;
      return this.sanitizer.bypassSecurityTrustHtml(fallbackSvg);
    }

    return this.sanitizer.bypassSecurityTrustHtml(svgContent);
  });

  // Metody pomocnicze
  getIconVariant(): string {
    return getIconVariant(this.name());
  }

  isOutline(): boolean {
    return this.getIconVariant() === 'outline';
  }

  isSolid(): boolean {
    return this.getIconVariant() === 'solid';
  }

  isMini(): boolean {
    return this.getIconVariant() === 'mini';
  }

  isMicro(): boolean {
    return this.getIconVariant() === 'micro';
  }
}
