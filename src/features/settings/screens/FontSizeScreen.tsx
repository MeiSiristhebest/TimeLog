import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { AppText } from '@/components/ui/AppText';
import { useHeritageTheme } from '@/theme/heritage';
import { useDisplaySettingsLogic } from '../hooks/useSettingsLogic';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';

export function FontSizeScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const { state, actions } = useDisplaySettingsLogic();
  const { fontScaleIndex } = state;

  // Mock Chat Messages for Preview
  const messages = [
    { id: 1, type: 'received', text: 'This text size affects chat messages.' },
    { id: 2, type: 'sent', text: 'And also story descriptions!' },
    { id: 3, type: 'received', text: 'Adjust the slider below to find your preference.' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceDim }]}>
      <HeritageHeader title="Font Size" showBack />

      {/* 1. Preview Area (Chat Style) */}
      <View style={styles.previewContainer}>
        <ScrollView contentContainerStyle={styles.chatContent}>
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.bubble,
                msg.type === 'sent'
                  ? { alignSelf: 'flex-end', backgroundColor: '#95EC69' } // WeChat Green
                  : { alignSelf: 'flex-start', backgroundColor: colors.surfaceCard },
              ]}>
              <AppText
                style={{
                  color: msg.type === 'sent' ? '#000' : colors.onSurface,
                  lineHeight: undefined, // Let AppText handle scaling naturally
                }}>
                {msg.text}
              </AppText>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 2. Controls Area */}
      <View style={[styles.controlsContainer, { backgroundColor: colors.surfaceCard }]}>
        <View style={styles.sliderHeader}>
          <AppText style={{ fontSize: 14 }}>A</AppText>
          <AppText style={{ fontSize: 24, fontWeight: 'bold' }}>A</AppText>
        </View>

        <Slider
          style={{ width: '100%', height: 40 }}
          value={fontScaleIndex}
          minimumValue={0}
          maximumValue={6} // standard mappings 0-6
          step={1}
          onValueChange={actions.setFontScaleIndex}
          minimumTrackTintColor={colors.primary} // active color
          maximumTrackTintColor="#E5E5E5"
          thumbTintColor="#FFFFFF" // White thumb with shadow typically
        />
        <AppText style={[styles.hint, { color: colors.textMuted }]}>
          Standard size is recommended.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 16,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  controlsContainer: {
    padding: 24,
    paddingBottom: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  hint: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
});
