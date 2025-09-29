export type IconSize = 16 | 20 | 24 | 'micro' | 'mini' | 'outline' | 'solid' | 'xl';

export type IconVariant = 'outline' | 'solid' | 'mini' | 'micro';

export type IconColor =
  | 'current'
  | 'inherit'
  | 'transparent'
  | 'black'
  | 'white'
  | string; // dla custom Tailwind classes

export interface IconConfig {
  variant: IconVariant;
  size: number;
  strokeWidth?: number;
  fill?: 'none' | 'currentColor';
  stroke?: 'currentColor' | 'none';
}

export interface HeroIcon {
  name: string;
  variants: {
    outline?: string;
    solid?: string;
    mini?: string;
    micro?: string;
  };
}

export interface IconComponentProps {
  name: string;
  size?: IconSize;
  class?: string;
  ariaLabel?: string;
  ariaHidden?: boolean;
}
