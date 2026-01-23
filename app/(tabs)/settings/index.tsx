import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  Switch,
  Image,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';

import { clearStoredRole } from '@/features/auth/services/roleStorage';
import { signOut } from '@/features/auth/services/authService';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useHeritageTheme } from '@/theme/heritage';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { useProfile } from '@/features/settings/hooks/useProfile';
import { EditProfileModal } from '@/features/settings/components/EditProfileModal';
import { useCloudSettings } from '@/features/settings/hooks/useCloudSettings';

// ------------------------------------------------------------------
// Style Constants
// ------------------------------------------------------------------
const COLORS = {
  background: '#FFFAF5',
  surface: '#FFFFFF',
  primary: '#ea774d',
  textPrimary: '#1b110e',
  textSecondary: '#8C817D',
  border: 'rgba(0,0,0,0.05)',
  danger: '#EF4444',
  success: '#7D9D7A',
};

// ------------------------------------------------------------------
// Subcomponents
// ------------------------------------------------------------------

const CustomToggle = ({ value, onValueChange, disabled }: {
  value: boolean;
  onValueChange?: (val: boolean) => void;
  disabled?: boolean;
}) => (
  <Switch
    value={value}
    onValueChange={onValueChange}
    disabled={disabled}
    trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
    thumbColor={'#FFFFFF'}
    ios_backgroundColor="#E5E7EB"
    style={{ transform: [{ scale: 0.8 }] }}
  />
);

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.card}>{children}</View>
);

interface ListItemProps {
  label: string;
  subLabel?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  isDestructive?: boolean;
  showChevron?: boolean;
  isLast?: boolean;
}

const ListItem = ({
  label,
  subLabel,
  icon,
  rightElement,
  onPress,
  isDestructive,
  showChevron,
  isLast
}: ListItemProps) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    style={({ pressed }) => [
      styles.listItem,
      !isLast && styles.listItemBorder,
      pressed && onPress && styles.listItemPressed
    ]}
  >
    <View style={styles.listItemContent}>
      {icon && (
        <View style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}>
          <MaterialIcons
            name={icon}
            size={24}
            color={isDestructive ? COLORS.danger : COLORS.textSecondary}
          />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemLabel, isDestructive && { color: COLORS.danger }]}>
          {label}
        </Text>
        {subLabel && <Text style={styles.itemSubLabel}>{subLabel}</Text>}
      </View>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {rightElement}
      {showChevron && (
        <MaterialIcons name="chevron-right" size={24} color={`${COLORS.textSecondary}80`} />
      )}
    </View>
  </Pressable>
);

// Status Badge Component
const StatusBadge = ({ status, label }: { status: 'linked' | 'pending' | 'unlinked'; label: string }) => {
  const colorMap = {
    linked: COLORS.success,
    pending: '#D4A012',
    unlinked: COLORS.textSecondary,
  };
  return (
    <View style={[styles.statusBadge, { backgroundColor: `${colorMap[status]}20` }]}>
      <View style={[styles.statusDot, { backgroundColor: colorMap[status] }]} />
      <Text style={[styles.statusText, { color: colorMap[status] }]}>{label}</Text>
    </View>
  );
};

// QR Code Modal
const QRCodeModal = ({
  visible,
  code,
  onClose
}: {
  visible: boolean;
  code: string;
  onClose: () => void;
}) => (
  <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.qrModalContent}>
        <Text style={styles.qrTitle}>Scan to Connect</Text>
        <Text style={styles.qrSubtitle}>Family members can scan this code to link their device</Text>
        <View style={styles.qrCodeContainer}>
          <QRCode
            value={`timelog://connect/${code}`}
            size={200}
            color={COLORS.textPrimary}
            backgroundColor="#fff"
          />
        </View>
        <Text style={styles.qrCodeText}>{code}</Text>
        <HeritageButton
          title="Close"
          onPress={onClose}
          variant="secondary"
          fullWidth
          style={{ marginTop: 16 }}
        />
      </View>
    </View>
  </Modal>
);

// ------------------------------------------------------------------
// Main Screen
// ------------------------------------------------------------------

export default function SettingsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sessionUserId = useAuthStore((state) => state.sessionUserId);

  // Profile State
  const { profile, isLoading: profileLoading, updateProfileData, uploadProfileAvatar } = useProfile();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  // Cloud Settings State
  const { cloudAIEnabled, setCloudAIEnabled, isLoading: cloudSettingsLoading } = useCloudSettings();

  // Sign Out State
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Mock data - replace with real data when backend is ready
  const deviceCode = '829-103';
  const familySharingStatus: 'linked' | 'pending' | 'unlinked' = 'linked';
  const userRole = profile?.role || 'storyteller';

  // Handlers
  const handleSignOut = useCallback(async () => {
    HeritageAlert.show({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      variant: 'warning',
      primaryAction: {
        label: 'Sign Out',
        destructive: true,
        onPress: async () => {
          setIsSigningOut(true);
          try {
            await signOut();
            router.replace('/login');
          } catch (e) {
            console.error('Sign out failed:', e);
          }
          setIsSigningOut(false);
        }
      },
      secondaryAction: { label: 'Cancel' }
    });
  }, [router]);

  const handleSwitchRole = useCallback(async () => {
    await clearStoredRole();
    router.replace('/role');
  }, [router]);

  const handleShareCode = useCallback(async () => {
    try {
      await Share.share({
        message: `Join my TimeLog family! Use code: ${deviceCode} or scan the QR code in the app.`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [deviceCode]);

  const handleRevokeSharing = useCallback(() => {
    HeritageAlert.show({
      title: 'Stop Sharing?',
      message: 'Once stopped, family can no longer access your stories.',
      variant: 'warning',
      primaryAction: {
        label: 'Stop Sharing',
        destructive: true,
        onPress: async () => {
          // TODO: Implement revoke sharing logic
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
      secondaryAction: { label: 'Keep Sharing' }
    });
  }, []);

  const handleCallFamilySupport = useCallback(() => {
    // TODO: Get family member phone from settings
    Linking.openURL('tel:+1234567890');
  }, []);

  // Display values
  const displayName = profile?.displayName || 'Loading...';
  const avatarUrl = profile?.avatarUrl || 'https://via.placeholder.com/100';
  const roleLabel = profile?.role === 'storyteller' ? 'Storyteller' : 'Family';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 1. Profile Section */}
        <View style={styles.profileSection}>
          <Pressable onPress={() => setShowEditProfile(true)} style={styles.avatarContainer}>
            {profileLoading ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            )}
            <View style={styles.editBadge}>
              <MaterialIcons name="edit" size={14} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={styles.profileName}>{displayName}</Text>
          {sessionUserId && (
            <Text style={styles.profileId}>ID: {sessionUserId.slice(0, 8)}...</Text>
          )}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
        </View>

        {/* 2. Connection Code Card with QR Support */}
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <View>
              <Text style={styles.connectionLabel}>CONNECTION CODE</Text>
              <Text style={styles.connectionSubLabel}>Share with family to pair</Text>
            </View>
            <Pressable onPress={() => setShowQRCode(true)} style={styles.qrButton}>
              <MaterialIcons name="qr-code-2" size={40} color={COLORS.primary} />
            </Pressable>
          </View>

          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{deviceCode}</Text>
          </View>

          <HeritageButton
            title="Share with Family"
            icon="share"
            variant="primary"
            fullWidth
            onPress={handleShareCode}
            style={{ backgroundColor: COLORS.primary, height: 50, borderRadius: 12 }}
            textStyle={{ fontWeight: '600', fontSize: 16 }}
          />
        </View>

        {/* 3. Privacy & Sharing Section */}
        <SectionHeader title="Privacy & Sharing" />
        <Card>
          <ListItem
            label="Cloud AI & Sharing"
            subLabel={cloudAIEnabled ? 'Enabled: AI prompts and cloud backup active' : 'Disabled: Local recording only'}
            icon="cloud"
            rightElement={
              <CustomToggle
                value={cloudAIEnabled}
                onValueChange={setCloudAIEnabled}
                disabled={cloudSettingsLoading}
              />
            }
          />
          <ListItem
            label="Review Consent"
            subLabel="View or modify consented content"
            icon="verified-user"
            onPress={() => router.push('/consent-review')}
            showChevron
            isLast
          />
        </Card>

        {/* 4. Family Sharing Section */}
        <SectionHeader title="Family Sharing" />
        <Card>
          <ListItem
            label="Sharing Status"
            icon="family-restroom"
            rightElement={
              <StatusBadge
                status={familySharingStatus}
                label={familySharingStatus === 'linked' ? 'Linked' : familySharingStatus === 'pending' ? 'Pending' : 'Not Linked'}
              />
            }
          />
          <ListItem
            label="View Family Members"
            icon="group"
            onPress={() => router.push('/family-members')}
            showChevron
          />
          {familySharingStatus === 'linked' && (
            <ListItem
              label="Revoke Sharing"
              icon="link-off"
              onPress={handleRevokeSharing}
              isDestructive
              isLast
            />
          )}
        </Card>

        {/* 5. Preferences Section */}
        <SectionHeader title="Preferences" />
        <Card>
          <ListItem
            label="Notification Settings"
            subLabel="Manage alerts and quiet hours"
            icon="notifications"
            onPress={() => router.push('/settings/notifications')}
            showChevron
          />
          <ListItem
            label="Invite Family"
            subLabel="Send invitation link"
            icon="person-add"
            onPress={() => router.push('/invite')}
            showChevron
          />
          <ListItem
            label="Switch Role"
            subLabel={`Currently: ${roleLabel}`}
            icon="swap-horiz"
            onPress={handleSwitchRole}
            showChevron
          />
          <ListItem
            label="Help & FAQ"
            icon="help-outline"
            onPress={() => router.push('/help')}
            showChevron
            isLast
          />
        </Card>

        {/* 6. Recovery Section */}
        <SectionHeader title="Recovery & Security" />
        <Card>
          {userRole === 'family' && (
            <ListItem
              label="Recovery Code"
              subLabel="Generate code for device loss"
              icon="vpn-key"
              onPress={() => router.push('/recovery-code')}
              showChevron
            />
          )}
          <ListItem
            label="Device Management"
            subLabel="Manage linked devices"
            icon="devices"
            onPress={() => router.push('/device-management')}
            showChevron
          />
          <ListItem
            label="Deleted Items"
            subLabel="View and restore deleted stories"
            icon="delete-outline"
            onPress={() => router.push('/settings/deleted-items')}
            showChevron
            isLast
          />
        </Card>

        {/* 7. Data Transparency Section */}
        <SectionHeader title="Data Transparency" />
        <Card>
          <ListItem
            label="Service Providers"
            subLabel="Supabase, Deepgram, Gemini"
            icon="dns"
          />
          <ListItem
            label="Data Retention"
            subLabel="Zero Retention Policy"
            icon="security"
            isLast
          />
        </Card>

        {/* 8. Account Section */}
        <SectionHeader title="Account" />
        <Card>
          <ListItem
            label={isSigningOut ? 'Signing Out...' : 'Sign Out'}
            icon="logout"
            isDestructive
            onPress={handleSignOut}
            isLast
          />
        </Card>

        {/* 9. Emergency Help (Storyteller Only) */}
        {userRole === 'storyteller' && (
          <Pressable
            onPress={handleCallFamilySupport}
            style={styles.emergencyButton}
          >
            <MaterialIcons name="phone" size={24} color="#fff" />
            <Text style={styles.emergencyText}>Call Family Support</Text>
          </Pressable>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>TimeLog Version 2.4.1 (Build 890)</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <EditProfileModal
        visible={showEditProfile}
        profile={profile}
        onClose={() => setShowEditProfile(false)}
        onSave={updateProfileData}
        onUploadAvatar={uploadProfileAvatar}
      />

      <QRCodeModal
        visible={showQRCode}
        code={deviceCode}
        onClose={() => setShowQRCode(false)}
      />
    </View>
  );
}

// ------------------------------------------------------------------
// Styles
// ------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 34,
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileName: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 24,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileId: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Section Headers
  sectionHeader: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: 'Fraunces_600SemiBold',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  // Connection Card
  connectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: `${COLORS.primary}10`,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  connectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  connectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  connectionSubLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    opacity: 0.8,
    marginTop: 4,
  },
  qrButton: {
    padding: 4,
  },
  codeContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  codeText: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  // List Items
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 64,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listItemPressed: {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxDestructive: {
    backgroundColor: '#FEF2F2',
  },
  itemLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  itemSubLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // QR Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  qrModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 24,
    fontFamily: 'Fraunces_600SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrCodeText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
    marginTop: 16,
  },
  // Emergency Button
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 24,
    gap: 12,
  },
  emergencyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Footer
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    opacity: 0.6,
  },
});
