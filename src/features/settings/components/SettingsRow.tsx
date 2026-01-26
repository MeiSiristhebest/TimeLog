import React, { forwardRef } from 'react';
import { Pressable, View, StyleSheet, type PressableProps } from 'react-native';
import { AppText } from '@/components/ui/AppText';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';

type SettingsRowProps = Omit<PressableProps, 'style'> & {
  label: string;
  value?: string;
  iconName?: IconName;
  /** Icon color */
  iconColor?: string;
  showChevron?: boolean;
  destructive?: boolean;
  rightElement?: React.ReactNode;
  /** Is this the last item in a group? (Hides separator) */
  isLast?: boolean;
  /** Added by Link component */
  href?: string;
};

export const SettingsRow = forwardRef<View, SettingsRowProps>(
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
      isLast = false,
      href, // Destructure href so it's not passed to Pressable
      ...props
    },
    ref
  ) => {
    const { colors } = useHeritageTheme();

    // WeChat/iOS style: Icon is usually specific color or default gray
    const finalIconColor = iconColor ?? (destructive ? colors.error : colors.textMuted);

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        disabled={!onPress && !href} // allow if href exists (Link)
        style={({ pressed }) => [
          styles.container,
          pressed && (onPress || href) && { backgroundColor: 'rgba(0,0,0,0.05)' },
          { minHeight: 56 }, // Ensure touch target
        ]}
        accessibilityRole={onPress || href ? 'button' : 'none'}
        {...props}>
        <View style={styles.innerContainer}>
          {/* Icon Section - Direct Icon, no container */}
          {iconName ? (
            <View style={styles.iconWrapper}>
              <Icon name={iconName} size={24} color={finalIconColor} />
            </View>
          ) : null}

          {/* Content Section - Flex row with separator */}
          <View
            style={[
              styles.contentContainer,
              !isLast && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
              },
            ]}>
            <View style={styles.labelContainer}>
              <AppText
                style={[
                  styles.label,
                  { color: destructive ? colors.error : colors.onSurface, fontWeight: '500' },
                ]}>
                {label}
              </AppText>
            </View>

            <View style={styles.rightSection}>
              {value ? (
                <AppText
                  variant="label"
                  style={{ color: colors.textMuted, fontSize: 15, marginRight: 4 }}>
                  {value}
                </AppText>
              ) : null}
              {rightElement}
              {showChevron ? <Icon name="chevron-forward" size={20} color="#C7C7CC" /> : null}
            </View>
          </View>
        </View>
      </Pressable>
    );
  }
);

// displayName for debugging
SettingsRow.displayName = 'SettingsRow';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16, // Left spacing for icon
  },
  iconWrapper: {
    width: 24,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16, // py-4
    paddingRight: 16,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 17, // iOS Standard
    letterSpacing: -0.4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
