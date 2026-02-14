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

import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { HeritageModal } from './HeritageModal';
import { AppText } from '@/components/ui/AppText';
import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useHeritageTheme } from '@/theme/heritage';
import { EN_COPY, formatPickerA11yLabel } from '@/features/app/copy/en';

type PickerTokens = {
  primary: string;
  onPrimary: string;
  surface: string;
  textMuted: string;
  border: string;
};

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
  tokens,
  testID,
}: {
  items: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatItem: (value: number) => string;
  tokens: PickerTokens;
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
    <View className="overflow-hidden" style={{ width: 80, height: PICKER_HEIGHT }} testID={testID}>
      {/* Selection indicator */}
      <View
        className="absolute left-0 right-0 -z-10 rounded-xl"
        style={{
          top: ITEM_HEIGHT * 2,
          height: ITEM_HEIGHT,
          backgroundColor: `${tokens.primary}15`
        }}
      />

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
              className="items-center justify-center"
              style={{ height: ITEM_HEIGHT }}
              onPress={() => {
                onSelect(index);
                scrollViewRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
                Haptics.selectionAsync();
              }}>
              <AppText
                className={isSelected ? "text-3xl font-semibold" : "text-3xl"}
                style={{ color: isSelected ? tokens.primary : tokens.textMuted }}
              >
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
  title = EN_COPY.pickers.selectTime,
  testID = 'heritage-time-picker',
}: HeritageTimePickerProps) {
  const { colors } = useHeritageTheme();
  const initialDate = value ?? new Date();
  const [selectedHour, setSelectedHour] = useState(initialDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(initialDate.getMinutes());
  const tokens: PickerTokens = {
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    surface: colors.surfaceCard,
    textMuted: colors.textMuted,
    border: colors.border,
  };

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
      accessibilityLabel={formatPickerA11yLabel(EN_COPY.pickers.timePickerA11yPrefix, title)}
      testID={testID}>
      <View className="p-6" style={{ backgroundColor: tokens.surface }}>
        {/* Header */}
        <View className="mb-6 items-center">
          <AppText className="text-lg mb-2" style={{ color: tokens.textMuted }}>{title}</AppText>
          <AppText className="text-5xl" style={{ fontFamily: 'Fraunces_600SemiBold', color: tokens.primary, letterSpacing: 2 }}>{displayTime}</AppText>
        </View>

        {/* Wheel Picker */}
        <View className="flex-row items-center justify-center mb-6" style={{ height: PICKER_HEIGHT }}>
          {/* Hours */}
          <WheelColumn
            items={HOURS}
            selectedIndex={selectedHour}
            onSelect={setSelectedHour}
            formatItem={formatHour}
            tokens={tokens}
            testID={`${testID}-hours`}
          />

          {/* Separator */}
          <View className="w-6 items-center justify-center">
            <AppText className="text-4xl font-semibold" style={{ color: tokens.primary }}>:</AppText>
          </View>

          {/* Minutes */}
          <WheelColumn
            items={MINUTES}
            selectedIndex={selectedMinute}
            onSelect={setSelectedMinute}
            formatItem={formatMinute}
            tokens={tokens}
            testID={`${testID}-minutes`}
          />
        </View>

        {/* Actions */}
        <View className="flex-row gap-3">
          <Pressable
            className="flex-1 min-h-[56px] items-center justify-center rounded-2xl border-[1.5px] bg-transparent py-4"
            style={{ borderColor: tokens.border }}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel={EN_COPY.common.cancel}>
            <AppText className="text-lg font-semibold" style={{ color: tokens.textMuted }}>
              {EN_COPY.common.cancel}
            </AppText>
          </Pressable>

          <Pressable
            className="flex-1 min-h-[56px] items-center justify-center rounded-2xl py-4 shadow-sm elevation-[4]"
            style={{
              backgroundColor: tokens.primary,
              shadowColor: tokens.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
            }}
            onPress={handleConfirm}
            accessibilityRole="button"
            accessibilityLabel={EN_COPY.pickers.confirmTimeSelectionA11y}>
            <AppText className="text-lg font-semibold" style={{ color: tokens.onPrimary }}>
              {EN_COPY.common.confirm}
            </AppText>
          </Pressable>
        </View>
      </View>
    </HeritageModal>
  );
}

export default HeritageTimePicker;

