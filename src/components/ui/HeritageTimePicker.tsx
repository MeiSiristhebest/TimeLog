/**
 * HeritageTimePicker - Custom time picker with Heritage Memoir styling.
 *
 * Features:
 * - Wheel-style picker for intuitive selection
 * - Heritage Memoir color scheme
 * - Large touch targets for elderly users
 * - Confirm/Cancel actions
 *
 * @example
 * <HeritageTimePicker
 *   visible={showPicker}
 *   value={selectedTime}
 *   onConfirm={(date) => setSelectedTime(date)}
 *   onCancel={() => setShowPicker(false)}
 * />
 */

import { AppText } from '@/components/ui/AppText';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { HeritageModal } from './HeritageModal';

// Heritage Memoir Design Tokens
const TOKENS = {
  primary: '#B85A3B',
  onPrimary: '#FFFFFF',
  surface: '#FFFCF7',
  surfaceDim: '#F9F3E8',
  onSurface: '#1E293B',
  textMuted: '#475569',
  border: '#E2E8F0',
} as const;

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

type HeritageTimePickerProps = {
  /** Whether picker is visible */
  visible: boolean;
  /** Initial time value */
  value?: Date;
  /** Called when user confirms selection */
  onConfirm: (date: Date) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Title shown above picker */
  title?: string;
  /** Test ID */
  testID?: string;
};

// Generate hour/minute options
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

/**
 * Individual wheel column
 */
function WheelColumn({
  items,
  selectedIndex,
  onSelect,
  formatItem,
  testID,
}: {
  items: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatItem: (value: number) => string;
  testID?: string;
}) {
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrollingRef = useRef(false);

  // Scroll to selected item on mount
  useEffect(() => {
    if (!isScrollingRef.current) {
      scrollViewRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }
  }, [selectedIndex]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const newIndex = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, newIndex));

      if (clampedIndex !== selectedIndex) {
        onSelect(clampedIndex);
        Haptics.selectionAsync();
      }

      // Snap to nearest item
      scrollViewRef.current?.scrollTo({
        y: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });

      isScrollingRef.current = false;
    },
    [items.length, selectedIndex, onSelect]
  );

  const handleScrollBegin = useCallback(() => {
    isScrollingRef.current = true;
  }, []);

  return (
    <View style={styles.wheelColumn} testID={testID}>
      {/* Selection indicator */}
      <View style={styles.selectionIndicator} />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * 2,
        }}>
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Pressable
              key={item}
              style={styles.wheelItem}
              onPress={() => {
                onSelect(index);
                scrollViewRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
                Haptics.selectionAsync();
              }}>
              <AppText style={[styles.wheelItemText, isSelected && styles.wheelItemTextSelected]}>
                {formatItem(item)}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function HeritageTimePicker({
  visible,
  value,
  onConfirm,
  onCancel,
  title = 'Select Time',
  testID = 'heritage-time-picker',
}: HeritageTimePickerProps) {
  const initialDate = value ?? new Date();
  const [selectedHour, setSelectedHour] = useState(initialDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(initialDate.getMinutes());

  // Reset when value changes
  useEffect(() => {
    if (value) {
      setSelectedHour(value.getHours());
      setSelectedMinute(value.getMinutes());
    }
  }, [value]);

  const handleConfirm = useCallback(() => {
    const date = new Date();
    date.setHours(selectedHour);
    date.setMinutes(selectedMinute);
    date.setSeconds(0);
    date.setMilliseconds(0);
    onConfirm(date);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [selectedHour, selectedMinute, onConfirm]);

  const formatHour = (h: number) => h.toString().padStart(2, '0');
  const formatMinute = (m: number) => m.toString().padStart(2, '0');

  // Display time
  const displayTime = `${formatHour(selectedHour)}:${formatMinute(selectedMinute)}`;

  return (
    <HeritageModal
      visible={visible}
      onClose={onCancel}
      closeOnBackdrop={false}
      accessibilityLabel={`Time picker: ${title}`}
      testID={testID}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.title}>{title}</AppText>
          <AppText style={styles.displayTime}>{displayTime}</AppText>
        </View>

        {/* Wheel Picker */}
        <View style={styles.pickerContainer}>
          {/* Hours */}
          <WheelColumn
            items={HOURS}
            selectedIndex={selectedHour}
            onSelect={setSelectedHour}
            formatItem={formatHour}
            testID={`${testID}-hours`}
          />

          {/* Separator */}
          <View style={styles.separator}>
            <AppText style={styles.separatorText}>:</AppText>
          </View>

          {/* Minutes */}
          <WheelColumn
            items={MINUTES}
            selectedIndex={selectedMinute}
            onSelect={setSelectedMinute}
            formatItem={formatMinute}
            testID={`${testID}-minutes`}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={styles.cancelButton}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel">
            <AppText style={styles.cancelButtonText}>Cancel</AppText>
          </Pressable>

          <Pressable
            style={styles.confirmButton}
            onPress={handleConfirm}
            accessibilityRole="button"
            accessibilityLabel="Confirm time selection">
            <AppText style={styles.confirmButtonText}>Confirm</AppText>
          </Pressable>
        </View>
      </View>
    </HeritageModal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    color: TOKENS.textMuted,
    marginBottom: 8,
  },
  displayTime: {
    fontSize: 48,
    fontFamily: 'Fraunces_600SemiBold',
    color: TOKENS.primary,
    letterSpacing: 2,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: PICKER_HEIGHT,
    marginBottom: 24,
  },
  wheelColumn: {
    width: 80,
    height: PICKER_HEIGHT,
    overflow: 'hidden',
  },
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: `${TOKENS.primary}15`,
    borderRadius: 12,
    zIndex: -1,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    fontSize: 28,
    color: TOKENS.textMuted,
  },
  wheelItemTextSelected: {
    fontSize: 32,
    fontWeight: '600',
    color: TOKENS.primary,
  },
  separator: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorText: {
    fontSize: 40,
    fontWeight: '600',
    color: TOKENS.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: TOKENS.border,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: TOKENS.textMuted,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: TOKENS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    // Shadow
    shadowColor: TOKENS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: TOKENS.onPrimary,
  },
});

export default HeritageTimePicker;
