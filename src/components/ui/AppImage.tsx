import { useHeritageTheme } from '@/theme/heritage';
import { Image, ImageProps } from 'expo-image';
import { View, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { useState } from 'react';
import { Icon } from './Icon';

interface AppImageProps extends Omit<ImageProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  containerClassName?: string;
  variant?: 'default' | 'parchment' | 'circle';
  showLoading?: boolean;
}

/**
 * Standardized High-Performance Image Component.
 * - Powered by expo-image for premium caching & blurhash support.
 * - Minimalism + Heritage Parchment aesthetic.
 * - Fallback icons for dead links (Humble Persona).
 * - Optional "Hand-drawn" border style for storytelling.
 */
export function AppImage({
  style,
  containerClassName,
  variant = 'default',
  showLoading = true,
  contentFit = 'cover',
  transition = 300,
  ...rest
}: AppImageProps): JSX.Element {
  const { colors, radius } = useHeritageTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'circle':
        return { borderRadius: 999 };
      case 'parchment':
        return {
          borderRadius: radius.card,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surfaceWarm,
        };
      default:
        return { borderRadius: radius.md };
    }
  };

  return (
    <View
      className={`overflow-hidden justify-center items-center ${containerClassName || ''}`}
      style={[getVariantStyle(), style]}>
      {error ? (
        <View className="items-center justify-center p-4">
          <Icon name="image" size={32} color={colors.disabledText} />
        </View>
      ) : (
        <Image
          {...rest}
          contentFit={contentFit}
          transition={transition}
          onLoadStart={() => showLoading && setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          style={[{ width: '100%', height: '100%' }]}
        />
      )}

      {loading && showLoading && (
        <View className="absolute inset-0 items-center justify-center bg-transparent">
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </View>
  );
}
