import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { IconComponent, IconName, IconSize } from '../icon';

type ButtonVariant = 'fill' | 'outline';
type IconPosition = 'before' | 'after';

@Component({
  selector: 'app-button',
  imports: [
    MatButton,
    IconComponent
  ],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  // Inputs używając funkcji input()
  readonly variant = input<ButtonVariant>('fill');
  readonly text = input<string>('');
  readonly iconName = input<IconName | undefined>(undefined);
  readonly iconSize = input<IconSize>('mini');
  readonly iconPosition = input<IconPosition>('before');
  readonly disabled = input<boolean>(false);
  readonly fillColor = input<string>('primary-400');
  readonly accentColor = input<string>('primary-400');
  readonly fullWidth = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  // Output dla kliknięcia
  readonly click = output<void>();

  // Computed properties
  readonly hasIcon = computed(() => !!this.iconName());
  readonly showIconBefore = computed(() => this.hasIcon() && this.iconPosition() === 'before');
  readonly showIconAfter = computed(() => this.hasIcon() && this.iconPosition() === 'after');

  readonly buttonClasses = computed(() => {
    const baseClasses = 'p-2 !rounded-xl gap-2 whitespace-nowrap !h-10';
    const widthClass = this.fullWidth() ? '!w-full' : '!w-fit';

    return `${baseClasses} ${widthClass}`;
  });

  readonly buttonStyle = computed(() => {
    if (this.variant() === 'fill') {
      return {
        'background-color': this.getColorHex(this.fillColor()),
        'border': 'none'
      };
    } else {
      return {
        'border-color': this.getColorHex(this.accentColor()),
        'color': this.getColorHex(this.accentColor()),
        'background-color': 'transparent'
      };
    }
  });

  readonly textStyle = computed(() => {
    if (this.variant() === 'fill') {
      return { color: 'white' };
    }
    return { color: this.getColorHex(this.accentColor()) };
  });

  readonly iconClasses = computed(() => {
    if (this.variant() === 'fill') {
      return 'text-white'; // klasa Tailwind zamiast style
    } else {
      return `text-${this.accentColor()}`; // np. text-red-600
    }
  });

  // Event handler
  handleClick(event?: Event): void {
    console.log("handleClick - timestamp:", Date.now());
    console.log("handleClick - event:", event);

    if (!this.disabled()) {
      console.log("About to emit...");
      this.click.emit();
      console.log("Emitted!");
    }
  }

  private getColorHex(colorName: string): string {
    const colors: { [key: string]: string } = {
      // Primary
      'primary-50': '#FEF2F2',
      'primary-100': '#FEE2E2',
      'primary-200': '#FECACA',
      'primary-300': '#FCA5A5',
      'primary-400': '#F87171',
      'primary-500': '#EF4444',
      'primary-600': '#DC2626',
      'primary-700': '#B91C1C',
      'primary-800': '#991B1B',
      'primary-900': '#7F1D1D',

      // Secondary
      'secondary-50': '#FFFBEB',
      'secondary-100': '#FEF3C7',
      'secondary-200': '#FDE68A',
      'secondary-300': '#FCD34D',
      'secondary-400': '#FBBF24',
      'secondary-500': '#F59E0B',
      'secondary-600': '#D97706',
      'secondary-700': '#B45309',
      'secondary-800': '#92400E',
      'secondary-900': '#78350F',

      // Gray
      'gray-50': '#FAFAFA',
      'gray-100': '#F4F4F5',
      'gray-200': '#E4E4E7',
      'gray-300': '#D4D4D8',
      'gray-400': '#A1A1AA',
      'gray-500': '#71717A',
      'gray-600': '#52525B',
      'gray-700': '#3F3F46',
      'gray-800': '#27272A',
      'gray-900': '#18181B',

      // True Gray
      'true-gray-50': '#f5f5f5',
      'true-gray-100': '#eeeeee',
      'true-gray-200': '#e0e0e0',
      'true-gray-300': '#d4d4d4',
      'true-gray-400': '#a3a3a3',
      'true-gray-500': '#737373',
      'true-gray-600': '#525252',
      'true-gray-700': '#404040',
      'true-gray-800': '#262626',
      'true-gray-900': '#171717',

      // Warm Gray
      'warm-gray-50': '#FAFAF9',
      'warm-gray-100': '#F5F5F4',
      'warm-gray-200': '#E7E5E4',
      'warm-gray-300': '#D6D3D1',
      'warm-gray-400': '#A8A29E',
      'warm-gray-500': '#78716C',
      'warm-gray-600': '#57534E',
      'warm-gray-700': '#44403C',
      'warm-gray-800': '#292524',
      'warm-gray-900': '#1C1917',

      // Blue Gray
      'blue-gray-50': '#F8FAFC',
      'blue-gray-100': '#F1F5F9',
      'blue-gray-200': '#E2E8F0',
      'blue-gray-300': '#CBD5E1',
      'blue-gray-400': '#94A3B8',
      'blue-gray-500': '#64748B',
      'blue-gray-600': '#475569',
      'blue-gray-700': '#334155',
      'blue-gray-800': '#1E293B',
      'blue-gray-900': '#0F172A',

      // Cool Gray
      'cool-gray-50': '#F9FAFB',
      'cool-gray-100': '#F3F4F6',
      'cool-gray-200': '#E5E7EB',
      'cool-gray-300': '#D1D5DB',
      'cool-gray-400': '#9CA3AF',
      'cool-gray-500': '#6B7280',
      'cool-gray-600': '#4B5563',
      'cool-gray-700': '#374151',
      'cool-gray-800': '#1F2937',
      'cool-gray-900': '#111827',

      // Red
      'red-50': '#FEF2F2',
      'red-100': '#FEE2E2',
      'red-200': '#FECACA',
      'red-300': '#FCA5A5',
      'red-400': '#F87171',
      'red-500': '#EF4444',
      'red-600': '#DC2626',
      'red-700': '#B91C1C',
      'red-800': '#991B1B',
      'red-900': '#7F1D1D',

      // Amber
      'amber-50': '#FFFBEB',
      'amber-100': '#FEF3C7',
      'amber-200': '#FDE68A',
      'amber-300': '#FCD34D',
      'amber-400': '#FBBF24',
      'amber-500': '#F59E0B',
      'amber-600': '#D97706',
      'amber-700': '#B45309',
      'amber-800': '#92400E',
      'amber-900': '#78350F',

      // Yellow
      'yellow-50': '#FEFCE8',
      'yellow-100': '#FEF9C3',
      'yellow-200': '#FEF08A',
      'yellow-300': '#FDE047',
      'yellow-400': '#FACC15',
      'yellow-500': '#EAB308',
      'yellow-600': '#CA8A04',
      'yellow-700': '#A16207',
      'yellow-800': '#854D0E',
      'yellow-900': '#713F12',

      // Purple
      'purple-50': '#FAF5FF',
      'purple-100': '#F3E8FF',
      'purple-200': '#E9D5FF',
      'purple-300': '#D8B4FE',
      'purple-400': '#C084FC',
      'purple-500': '#A855F7',
      'purple-600': '#9333EA',
      'purple-700': '#7E22CE',
      'purple-800': '#6B21A8',
      'purple-900': '#581C87'
    };

    return colors[colorName] || '#A1A1AA';
  }
}
