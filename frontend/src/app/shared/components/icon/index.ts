// Główny eksport komponentu
export { IconComponent } from './icon.component';

// Eksport typów i interfejsów
export type {
  IconName,
  HeroIconName,
  IconNameWithVariant
} from './icons/icon.types';

// Eksport typów i interfejsów
export type {
  IconSize,
  IconVariant,
  IconColor,
  IconConfig,
  HeroIcon,
  IconComponentProps,
} from './icons/icon.interfaces';

// Eksport funkcji pomocniczych
export {
  getIcon,
  getIconVariant,
  getIconSvg,
  HEROICONS
} from './icons/heroicons';

// Domyślny eksport komponentu
export default IconComponent;
