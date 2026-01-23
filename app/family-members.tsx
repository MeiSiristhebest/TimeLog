/**
 * Family Members Screen
 * 
 * Displays list of connected family members with management options.
 */

import React from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    Pressable,
    StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { useHeritageTheme } from '@/theme/heritage';

type FamilyMember = {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: 'admin' | 'member';
    linkedAt: string;
};

// Mock data - replace with real data from API
const MOCK_MEMBERS: FamilyMember[] = [
    {
        id: '1',
        name: 'Alice Chen',
        email: 'alice@example.com',
        avatarUrl: null,
        role: 'admin',
        linkedAt: '2026-01-10',
    },
    {
        id: '2',
        name: 'Bob Chen',
        email: 'bob@example.com',
        avatarUrl: null,
        role: 'member',
        linkedAt: '2026-01-12',
    },
];

function MemberCard({ member, onRemove }: { member: FamilyMember; onRemove: (id: string) => void }) {
    const theme = useHeritageTheme();

    const handleRemove = () => {
        HeritageAlert.show({
            title: 'Remove Member?',
            message: `${member.name} will no longer be able to view your stories.`,
            variant: 'warning',
            primaryAction: {
                label: 'Remove',
                destructive: true,
                onPress: () => {
                    onRemove(member.id);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                },
            },
            secondaryAction: { label: 'Cancel' },
        });
    };

    return (
        <View style={[styles.memberCard, { borderColor: theme.colors.border }]}>
            <View style={styles.memberInfo}>
                {member.avatarUrl ? (
                    <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: `${theme.colors.primary}20` }]}>
                        <Text style={[styles.avatarInitial, { color: theme.colors.primary }]}>
                            {member.name.charAt(0)}
                        </Text>
                    </View>
                )}
                <View style={styles.memberDetails}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.memberName, { color: theme.colors.onSurface }]}>
                            {member.name}
                        </Text>
                        {member.role === 'admin' && (
                            <View style={[styles.adminBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
                                <Text style={[styles.adminText, { color: theme.colors.primary }]}>Admin</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.memberEmail, { color: `${theme.colors.onSurface}60` }]}>
                        {member.email}
                    </Text>
                    <Text style={[styles.linkedDate, { color: `${theme.colors.onSurface}40` }]}>
                        Linked since {member.linkedAt}
                    </Text>
                </View>
            </View>
            {member.role !== 'admin' && (
                <Pressable onPress={handleRemove} style={styles.removeButton}>
                    <MaterialIcons name="close" size={20} color="#EF4444" />
                </Pressable>
            )}
        </View>
    );
}

export default function FamilyMembersScreen() {
    const theme = useHeritageTheme();
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const handleRemoveMember = (id: string) => {
        // TODO: Implement remove member API call
        console.log('Remove member:', id);
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
            <HeritageHeader
                title="Family Members"
                showBack
                scrollY={scrollY}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}
            />

            <Animated.ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.headerText, { color: theme.colors.onSurface }]}>
                    Connected Family
                </Text>
                <Text style={[styles.subText, { color: `${theme.colors.onSurface}80` }]}>
                    These family members can listen to your stories and leave comments.
                </Text>

                {MOCK_MEMBERS.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="group-off" size={48} color={`${theme.colors.onSurface}30`} />
                        <Text style={[styles.emptyText, { color: `${theme.colors.onSurface}60` }]}>
                            No family members connected yet.
                        </Text>
                    </View>
                ) : (
                    MOCK_MEMBERS.map((member) => (
                        <MemberCard key={member.id} member={member} onRemove={handleRemoveMember} />
                    ))
                )}

                <View style={{ height: 40 }} />
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingTop: 100,
    },
    headerText: {
        fontSize: 24,
        fontFamily: 'Fraunces_600SemiBold',
        marginBottom: 8,
    },
    subText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 24,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        fontSize: 20,
        fontWeight: '600',
    },
    memberDetails: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    memberName: {
        fontSize: 17,
        fontWeight: '600',
    },
    adminBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    adminText: {
        fontSize: 11,
        fontWeight: '600',
    },
    memberEmail: {
        fontSize: 14,
        marginTop: 2,
    },
    linkedDate: {
        fontSize: 12,
        marginTop: 2,
    },
    removeButton: {
        padding: 8,
        marginLeft: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
});
