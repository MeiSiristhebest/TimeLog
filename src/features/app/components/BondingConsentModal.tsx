/**
 * Bonding Consent Modal
 *
 * Appears when a family member requests access to the senior's stories.
 */

import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { useHeritageTheme } from '@/theme/heritage';
import { Ionicons } from '@/components/ui/Icon';
import { respondToRequest, BondingRequest } from '@/features/family-listener/services/familyInteractionService';
import { devLog } from '@/lib/devLogger';

interface BondingConsentModalProps {
  request: BondingRequest | null;
  onClose: () => void;
}

export const BondingConsentModal: React.FC<BondingConsentModalProps> = ({
  request,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const { colors } = useHeritageTheme();

  if (!request) return null;

  const handleResponse = async (status: 'approved' | 'rejected') => {
    setIsProcessing(true);
    try {
      await respondToRequest(request.id, status);
      onClose();
      if (status === 'approved') {
        Alert.alert('Linked!', 'You have successfully linked with your family member.');
      }
    } catch (error) {
      devLog.error('[BondingConsentModal] Failed to update connection:', error);
      Alert.alert('Error', 'Failed to update connection request.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={!!request} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="people-outline" size={48} color={colors.primary} />
          </View>

          <AppText style={[styles.title, { color: colors.onSurface }]}>
            Family Connection Request
          </AppText>
          
          <AppText style={[styles.subtitle, { color: colors.onSurface }]}>
            Your family member would like to listen to your stories and suggest topics.
          </AppText>

          <AppText style={[styles.description, { color: colors.textMuted }]}>
            If you allow this, they will be able to see your recorded stories and send you questions to answer.
          </AppText>

          <View style={styles.buttonColumn}>
            <HeritageButton
              title={isProcessing ? 'Processing...' : 'Allow Access'}
              onPress={() => handleResponse('approved')}
              variant="primary"
              style={styles.button}
              disabled={isProcessing}
              icon={isProcessing ? undefined : 'checkmark-circle-outline'}
            />

            <HeritageButton
              title="Ignore"
              onPress={() => handleResponse('rejected')}
              variant="outline"
              style={styles.button}
              disabled={isProcessing}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Fraunces_700Bold',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonColumn: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
