// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: Record<string, ComponentProps<typeof MaterialIcons>['name']> = {
  'house.fill': 'home',
  'list.bullet': 'list',
  'arrow.down.doc.fill': 'file-download',
  'gearshape.fill': 'settings',
  'utensils': 'restaurant',
  'car': 'directions-car',
  'zap': 'bolt',
  'wifi': 'wifi',
  'arrow-up-right': 'north-east',
  'arrow-down-left': 'south-west',
  'wallet': 'account-balance-wallet',
  'briefcase': 'work',
  'shopping-bag': 'shopping-bag',
  'clapperboard': 'movie',
  'stethoscope': 'medical-services',
  'graduation-cap': 'school',
  'home': 'home',
  'help-circle': 'help',
  'plus': 'add',
  'magnifyingglass': 'search',
  'bell': 'notifications',
  'ellipsis': 'more-horiz',
  'a.circle.fill': 'font-download',
  'applelogo': 'apple',
  'person.fill': 'person',
  'arrow.up.doc.fill': 'file-upload',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
