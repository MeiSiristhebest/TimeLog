import React from 'react';
import { Switch, SwitchProps, View, Text, StyleSheet } from 'react-native';
import { useHeritageTheme } from '@/theme/heritage';

export interface HeritageSwitchProps extends Omit<SwitchProps, 'trackColor' | 'thumbColor'> {
    /** Optional label to display next to switch */
    label?: string;
    /** Custom track colors (overrides theme) */
    trackColor?: { false: string; true: string };
    /** Custom thumb color (overrides theme) */
    thumbColor?: string;
}

/**
 * HeritageSwitch - Themed Switch Component
 * 
 * Provides consistent Switch styling across the app using Heritage theme colors.
 * Automatically applies theme colors for track and thumb.
 * 
 * @example
 * ```tsx
 * <HeritageSwitch
 *   value={isEnabled}
 *   onValueChange={setIsEnabled}
 *   label="Enable Notifications"
 * />
 * ```
 */
export const HeritageSwitch: React.FC<HeritageSwitchProps> = ({
    label,
    trackColor,
    thumbColor,
    value,
    ...props
}) => {
    const { colors } = useHeritageTheme();

    // Theme-based colors with override support
    const finalTrackColor = trackColor || {
        false: colors.disabled,
        true: colors.primary,
    };

    const finalThumbColor = thumbColor || colors.surface;

    if (label) {
        return (
            <View style={styles.container}>
                <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>
                <Switch
                    value={value}
                    trackColor={finalTrackColor}
                    thumbColor={finalThumbColor}
                    {...props}
                />
            </View>
        );
    }

    return (
        <Switch
            value={value}
            trackColor={finalTrackColor}
            thumbColor={finalThumbColor}
            {...props}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
    },
});
