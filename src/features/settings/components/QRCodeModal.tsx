import React from 'react';
import { AppText } from '@/components/ui/AppText';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { useHeritageTheme } from '@/theme/heritage';
import { Icon } from '@/components/ui/Icon';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import QRCode from 'react-native-qrcode-svg';
import { Modal, TouchableOpacity, View } from 'react-native';

interface QRCodeModalProps {
    isVisible: boolean;
    onClose: () => void;
    uid: string;
    displayName: string;
    avatarUrl?: string;
}

export function QRCodeModal({
    isVisible,
    onClose,
    uid,
    displayName,
    avatarUrl,
}: QRCodeModalProps): JSX.Element {
    const { colors } = useHeritageTheme();

    // QR Value protocol
    const qrValue = `heritage:user:${uid}`;

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
            statusBarTranslucent>
            <View className="flex-1 justify-center items-center p-5 bg-black/50">
                {/* Blur Background */}
                <BlurView intensity={20} className="absolute inset-0" tint="dark" />

                {/* Modal Card */}
                <View
                    className="w-full max-w-[340px] rounded-3xl overflow-hidden"
                    style={{ backgroundColor: colors.surface }}>
                    {/* Header */}
                    <View
                        className="flex-row items-center justify-between p-4 border-b"
                        style={{ borderBottomColor: colors.border }}>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <Icon name="close" size={24} color={colors.onSurface} />
                        </TouchableOpacity>
                        <AppText className="text-lg font-serif font-semibold" style={{ color: colors.onSurface }}>
                            My Heritage Code
                        </AppText>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Content */}
                    <View className="items-center p-8 gap-6">
                        {/* User Info */}
                        <View className="flex-row items-center gap-3 self-start w-full">
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} className="w-[60px] h-[60px] rounded-xl" />
                            ) : (
                                <View
                                    className="w-[60px] h-[60px] rounded-xl items-center justify-center"
                                    style={{ backgroundColor: colors.surfaceDim }}>
                                    <Icon name="person" size={40} color={colors.textMuted} />
                                </View>
                            )}
                            <View>
                                <AppText className="text-xl font-semibold" style={{ color: colors.onSurface }}>{displayName}</AppText>
                                <AppText className="text-sm mt-1" style={{ color: colors.textMuted }}>
                                    Family Member
                                </AppText>
                            </View>
                        </View>

                        {/* QR Code */}
                        <View
                            className="p-4 bg-white rounded-2xl items-center justify-center shadow-sm elevation-4"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 10,
                            }}>
                            <QRCode
                                value={qrValue}
                                size={200}
                                color={colors.onSurface}
                                backgroundColor="transparent"
                            />
                        </View>

                        <AppText className="text-sm text-center" style={{ color: colors.textMuted }}>
                            Scan to add me to your Family Circle
                        </AppText>
                    </View>

                    {/* Action */}
                    <View className="p-5 pt-0">
                        <HeritageButton title="Share My Code" variant="primary" onPress={() => { }} />
                    </View>
                </View>
            </View>
        </Modal>
    );
}
