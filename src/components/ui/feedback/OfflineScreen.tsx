import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { useHeritageTheme } from '@/theme/heritage';
import { HeritageButton } from '../heritage/HeritageButton';

interface OfflineScreenProps {
    onRetry?: () => void;
}

export const OfflineScreen = ({ onRetry }: OfflineScreenProps) => {
    const { colors } = useHeritageTheme();

    const handleRetry = () => {
        NetInfo.fetch().then(state => {
            if (state.isConnected && onRetry) {
                onRetry();
            }
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
            <View style={styles.content}>
                {/* Icon Section */}
                <View style={styles.iconWrapper}>
                    <View style={[styles.iconCircle, { backgroundColor: `${colors.error}15` }]}>
                        <Ionicons name="cloud-offline" size={80} color={colors.error} />
                    </View>
                </View>

                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.onSurface }]}>No connection</Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                        Your memories are safe, but we need the internet to upload them.
                    </Text>
                </View>

                {/* Action Button */}
                <View style={styles.buttonContainer}>
                    <HeritageButton
                        title="Try Again"
                        onPress={handleRetry}
                        variant="outline"
                        size="large"
                        fullWidth
                        style={{ borderColor: colors.primary }}
                        textStyle={{ color: colors.primary, letterSpacing: 0.5, fontWeight: '700' }}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        width: '100%',
        maxWidth: 420,
        paddingHorizontal: 24,
        alignItems: 'center',
        gap: 32,
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 160, // approximate padding 10 * 4 + 80 size
        height: 160,
        borderRadius: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontSize: 32, // md:text-4xl
        fontFamily: 'Fraunces_600SemiBold', // Fallback to Serif
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 28,
        maxWidth: 320,
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 280,
        marginTop: 16,
    }
});
