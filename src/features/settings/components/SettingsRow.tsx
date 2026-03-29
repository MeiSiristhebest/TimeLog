import React, { forwardRef } from 'react';
import { Pressable, View, type PressableProps, type PressableStateCallbackType } from 'react-native';
import { AppText } from '@/components/ui/AppText';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type SettingsRowProps = Omit<PressableProps, 'style'> & {
  label: string;
  value?: string;
  iconName?: IconName;
  /** Icon color */
  iconColor?: string;
  showChevron?: boolean;
  destructive?: boolean;
  rightElement?: React.ReactNode;
  align?: 'left' | 'center';
  /** Is this the last item in a group? (Hides separator) */
  isLast?: boolean;
  /** Added by Link component */
  href?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SettingsRow = forwardRef<React.ElementRef<typeof View>, SettingsRowProps>(
  (
    {
      label,
      value,
      iconName,
      iconColor,
      onPress,
      showChevron = true,
      destructive,
      rightElement,
      align = 'left',
      isLast = false,
      href, // Destructure href so it's not passed to Pressable
      ...props
    },
    ref
  ) => {
    const { colors } = useHeritageTheme();
    const scale = useSharedValue(1);

    // WeChat/iOS style: Icon is usually specific color or default gray
    const finalIconColor = iconColor ?? (destructive ? colors.error : colors.textMuted);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      if (onPress || href) {
        scale.value = withSpring(0.98, { damping: 10, stiffness: 300 });
      }
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    };

    const isCentered = align === 'center';

    return (
      <AnimatedPressable
        ref={ref}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress && !href} // allow if href exists (Link)
        style={[{ minHeight: 56 }, animatedStyle]}
        className="active:opacity-70"
        accessibilityRole={onPress || href ? 'button' : 'none'}
        {...props}>
        {({ pressed }: PressableStateCallbackType) => (
          <View
            className="bg-transparent"
            style={[
              { backgroundColor: 'transparent' },
              pressed && (onPress || href) && { backgroundColor: 'rgba(0,0,0,0.05)' },
            ]}>
            <View
              className="flex-row items-center pl-4"
              style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 16 }}>
              {/* Icon Section - Direct Icon, no container */}
              {!isCentered && iconName ? (
                <View
                  className="w-6 mr-4 items-center justify-center"
                  style={{ width: 24, marginRight: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={iconName} size={24} color={finalIconColor} />
                </View>
              ) : null}

              {/* Content Section - Flex row with separator */}
              <View
                className="flex-1 flex-row items-center justify-between py-4 pr-4"
                style={[
                  {
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: isCentered ? 'center' : 'space-between',
                    paddingVertical: 16,
                    paddingRight: 16,
                  },
                  !isLast && {
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.border,
                  },
                ]}>
                <View className={isCentered ? 'flex-1 items-center' : 'flex-1'}>
                  <AppText
                    className="text-[17px] tracking-tight font-medium"
                    style={{
                      fontSize: 17,
                      letterSpacing: -0.2,
                      fontWeight: '500',
                      color: destructive ? colors.error : colors.onSurface,
                      textAlign: isCentered ? 'center' : 'left',
                    }}>
                    {label}
                  </AppText>
                </View>

                <View
                  className="flex-row items-center"
                  style={[
                    { flexDirection: 'row', alignItems: 'center' },
                    isCentered && { position: 'absolute', right: 16 },
                  ]}>
                  {!isCentered && value ? (
                    <AppText
                      variant="caption"
                      className="text-[15px] mr-1"
                      style={{ fontSize: 15, marginRight: 4, color: colors.textMuted }}>
                      {value}
                    </AppText>
                  ) : null}
                  {rightElement}
                  {!isCentered && showChevron ? (
                    <Icon name="chevron-forward" size={20} color="#C7C7CC" />
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        )}
      </AnimatedPressable>
    );
  }
);

// displayName for debugging
SettingsRow.displayName = 'SettingsRow';
