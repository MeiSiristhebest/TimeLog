import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { SymbolView, type SFSymbol, type SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import {
  Platform,
  type ColorValue,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

const IONICON_TO_SF_SYMBOL: Partial<Record<IconName, SFSymbol>> = {
  'alert-circle': 'exclamationmark.circle',
  'alert-circle-outline': 'exclamationmark.circle',
  'arrow-back': 'chevron.backward',
  attach: 'paperclip',
  book: 'book',
  'book-outline': 'book',
  'chatbubble-outline': 'bubble.left',
  chatbubbles: 'bubble.left.and.bubble.right',
  'chatbubbles-outline': 'bubble.left.and.bubble.right',
  checkmark: 'checkmark',
  'checkmark-circle': 'checkmark.circle',
  'chevron-back': 'chevron.backward',
  'chevron-down': 'chevron.down',
  'chevron-forward': 'chevron.forward',
  close: 'xmark',
  'close-circle': 'xmark.circle',
  cloud: 'cloud',
  'cloud-offline': 'icloud.slash',
  'cloud-outline': 'cloud',
  'ellipsis-horizontal': 'ellipsis',
  filter: 'line.3.horizontal.decrease.circle',
  headset: 'headphones',
  hourglass: 'hourglass',
  'information-circle-outline': 'info.circle',
  'key-outline': 'key',
  'link-outline': 'link',
  mic: 'mic',
  'musical-notes-outline': 'music.note',
  'notifications-off-outline': 'bell.slash',
  'notifications-outline': 'bell',
  pause: 'pause',
  pencil: 'pencil',
  'people-circle-outline': 'person.2.circle',
  person: 'person',
  'person-add-outline': 'person.badge.plus',
  'phone-portrait-sharp': 'iphone',
  play: 'play',
  'partly-sunny': 'cloud.sun',
  rainy: 'cloud.rain',
  'shield-checkmark-outline': 'checkmark.shield',
  search: 'magnifyingglass',
  send: 'paperplane',
  'settings-outline': 'gearshape',
  'settings-sharp': 'gearshape',
  snow: 'snowflake',
  sunny: 'sun.max',
  'timer-outline': 'timer',
  trash: 'trash',
  'trash-outline': 'trash',
  wifi: 'wifi',
};

export type IconName = keyof typeof ExpoIonicons.glyphMap;

export type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
  className?: string;
  fallback?: ReactNode;
} & Omit<SymbolViewProps, 'name' | 'size' | 'tintColor' | 'style' | 'fallback'>;

export function Icon({
  name,
  size = 24,
  color,
  style,
  fallback,
  ...symbolProps
}: IconProps): JSX.Element | null {
  const { accessibilityLabel, accessibilityHint, accessibilityRole, accessible, testID } =
    symbolProps;
  const defaultFallback = (
    <ExpoIonicons
      name={name}
      size={size}
      color={color}
      style={style as StyleProp<TextStyle>}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessible={accessible}
      testID={testID}
    />
  );
  const resolvedFallback = fallback ?? defaultFallback;

  if (Platform.OS === 'ios') {
    const symbolName = IONICON_TO_SF_SYMBOL[name];
    if (symbolName) {
      return (
        <SymbolView
          name={symbolName}
          size={size}
          tintColor={color}
          style={style}
          fallback={resolvedFallback}
          {...symbolProps}
        />
      );
    }
  }

  return <>{resolvedFallback}</>;
}

const Ionicons = Icon as typeof Icon & { glyphMap: typeof ExpoIonicons.glyphMap };
Ionicons.glyphMap = ExpoIonicons.glyphMap ?? {};

export { Ionicons };
