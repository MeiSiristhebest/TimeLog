/**
 * Family Management Screen
 *
 * Screen for family members to manage their connection to the senior,
 * generate recovery codes, and add new family members.
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/ui/AppText';
import { Container } from '@/components/ui/Container';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { Ionicons } from '@/components/ui/Icon';
import { generateRecoveryCodeByFamily } from '../services/familyInteractionService';
import { devLog } from '@/lib/devLogger';

export default function FamilyManagementScreen() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<string | null>(null);

  // Mocked senior ID for now - in production this would come from the active connection store
  const seniorId = '00000000-0000-0000-0000-000000000000'; 

  const handleGenerateRecoveryCode = async () => {
    setIsGenerating(true);
    try {
      const result = await generateRecoveryCodeByFamily(seniorId);
      setActiveCode(result.code);
      setExpiry(new Date(result.expiresAt).toLocaleString());
      
      // Critical Feedback: Success Haptic
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      devLog.error('[FamilyManagementScreen] Failed to generate code:', error);
      // Critical Feedback: Error Haptic
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Could not generate recovery code. Make sure you are linked to a senior.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (activeCode) {
      await Clipboard.setStringAsync(activeCode);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copied', 'Recovery code copied to clipboard');
    }
  };

  return (
    <Container className="bg-surface">
      <HeritageHeader title="Family Management" showBack />
      
      <ScrollView 
        contentContainerClassName="p-lg pb-xl"
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Recovery Code Section */}
        <View className="p-lg rounded-card mb-md bg-primary-soft border border-border">
          <View className="flex-row items-center mb-md gap-md">
            <Ionicons name="shield-checkmark-outline" size={28} className="text-primary" />
            <AppText className="text-title font-serif text-onSurface">
              Account Recovery
            </AppText>
          </View>
          
          <AppText className="text-body text-text-muted mb-lg">
            If your family member loses access to their device, generate a recovery code here to help them log back in.
          </AppText>

          {activeCode ? (
            <View className="p-lg rounded-button items-center border-2 border-dashed border-primary bg-surface">
              <AppText className="text-display font-bold tracking-widest text-primary-dark">
                {activeCode.slice(0, 3)}-{activeCode.slice(3)}
              </AppText>
              <AppText className="mt-sm text-small text-text-muted">
                Expires: {expiry}
              </AppText>
              <HeritageButton 
                title="Copy Code" 
                onPress={copyToClipboard} 
                variant="outline" 
                size="small"
                className="mt-md"
              />
            </View>
          ) : (
            <HeritageButton
              title={isGenerating ? 'Generating...' : 'Generate Recovery Code'}
              onPress={handleGenerateRecoveryCode}
              variant="primary"
              disabled={isGenerating}
              icon={isGenerating ? undefined : 'key-outline'}
            />
          )}
        </View>

        {/* Connection Request Section */}
        <View className="p-lg rounded-card mb-md bg-primary-soft border border-border">
          <View className="flex-row items-center mb-md gap-md">
            <Ionicons name="link-outline" size={28} className="text-blue-accent" />
            <AppText className="text-title font-serif text-onSurface">
              Connect to Senior
            </AppText>
          </View>

          <AppText className="text-body text-text-muted mb-lg">
            Linking with a new family participant requires their approval. Enter their User ID to send a request.
          </AppText>

          <HeritageButton
            title="Request Connection"
            onPress={() => Alert.alert('Request Connection', 'Please enter the senior user ID to continue.')}
            variant="secondary"
            icon="person-add-outline"
          />
        </View>

        {/* Privacy Note */}
        <View className="flex-row px-md gap-sm items-center mt-md">
          <Ionicons name="information-circle-outline" size={20} className="text-text-muted" />
          <AppText className="text-small flex-1 italic text-text-muted">
            Privacy Rule: Family links are only active after the senior explicitly approves the request on their device.
          </AppText>
        </View>
      </ScrollView>
    </Container>
  );
}
