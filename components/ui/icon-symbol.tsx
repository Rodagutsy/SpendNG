// Fallback for using MaterialIcons on Android and web.
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
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
  'square.and.pencil': 'edit',
  'chart.pie': 'pie-chart',
  'arrow.up.doc': 'file-upload',
  'person.fill': 'person-outline',
  'lock.fill': 'lock-outline',
  'link': 'link',
  'envelope.fill': 'email',
  'message.fill': 'message',
  'plus.circle.fill': 'add-circle-outline',
  'magnifyingglass': 'search',
  'tag.fill': 'local-offer',
  'questionmark.circle.fill': 'help-outline',
  'bubble.left.fill': 'chat-bubble-outline',
  'info.circle.fill': 'info-outline',
  'trash.fill': 'delete-outline',
  'crown.fill': 'stars',
  'bell': 'notifications-none',
  'plus': 'add',
  'chevron.right': 'chevron-right',
  'arrow.up.right': 'trending-up',
  'arrow.down.right': 'trending-down',
  'arrow.up.right.circle.fill': 'arrow-circle-up',
  'lightbulb.fill': 'lightbulb-outline',
  'arrow.down.doc.fill': 'file-download',
  'arrow.up.doc.fill': 'file-upload',
  'utensils': 'restaurant',
  'car': 'directions-car',
  'zap': 'bolt',
  'wifi': 'wifi',
  'wallet': 'account-balance-wallet',
  'briefcase': 'work-outline',
  'shopping-bag': 'shopping-bag',
  'clapperboard': 'movie-filter',
  'stethoscope': 'medical-services',
  'graduation-cap': 'school',
  'home': 'home',
  'help-circle': 'help-outline',
  'a.circle.fill': 'font-download',
  'applelogo': 'apple',
  'export': 'ios-share',
  'report': 'assessment',
  'eye': 'visibility',
  'eye.slash': 'visibility-off',
  'line.3.horizontal.decrease': 'filter-list',
  'chart-up': 'show-chart',
  'arrow-up-right': 'trending-up',
  'arrow-down-left': 'call-received',
  'checkmark': 'check',
  'calendar': 'calendar-today',
  'money': 'attach-money',
};

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
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
