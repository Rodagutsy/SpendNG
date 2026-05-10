// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

const MAPPING: Record<string, ComponentProps<typeof MaterialIcons>['name']> = {
  'house': 'home',
  'house.fill': 'home',
  'list.bullet': 'list',
  'chart.bar': 'bar-chart',
  'chart.bar.fill': 'bar-chart',
  'ellipsis.circle': 'more-horiz',
  'ellipsis.circle.fill': 'more-vert',
  'gearshape.fill': 'settings',
  'person.fill': 'person',
  'lock.fill': 'lock',
  'link': 'link',
  'plus.circle.fill': 'add-circle',
  'magnifyingglass': 'search',
  'tag.fill': 'local-offer',
  'questionmark.circle.fill': 'help',
  'bubble.left.fill': 'chat-bubble',
  'info.circle.fill': 'info',
  'trash.fill': 'delete',
  'crown.fill': 'stars',
  'bell': 'notifications',
  'plus': 'add',
  'chevron.right': 'chevron-right',
  'arrow.up.right': 'trending-up',
  'arrow.down.right': 'trending-down',
  'arrow.up.right.circle.fill': 'arrow-circle-up',
  'lightbulb.fill': 'lightbulb',
  'arrow.down.doc.fill': 'file-download',
  'arrow.up.doc.fill': 'file-upload',
  'utensils': 'restaurant',
  'car': 'directions-car',
  'zap': 'bolt',
  'wifi': 'wifi',
  'wallet': 'account-balance-wallet',
  'briefcase': 'work',
  'shopping-bag': 'shopping-bag',
  'clapperboard': 'movie',
  'stethoscope': 'medical-services',
  'graduation-cap': 'school',
  'home': 'home',
  'help-circle': 'help',
  'a.circle.fill': 'font-download',
  'applelogo': 'apple',
};

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
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
