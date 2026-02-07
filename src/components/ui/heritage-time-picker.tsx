import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { HeritageModal } from './HeritageModal';
import { AppText } from '@/components/ui/AppText';
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { View, Pressable, ScrollView } from 'react-native';

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
// Helper functions
const formatHour = (h: number) => h.toString().padStart(2, '0');
const formatMinute = (m: number) => m.toString().padStart(2, '0');

/**
 * Individual wheel column
 */
const WheelColumn = memo(function WheelColumn({
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
    <View className="w-20 h-[280px] overflow-hidden" testID={testID}>
      {/* Selection indicator */}
      <View className="absolute top-[112px] left-0 right-0 h-14 bg-[#B85A3B26] rounded-xl -z-10" />

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
              className="h-14 items-center justify-center"
              onPress={() => {
                onSelect(index);
                scrollViewRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
                Haptics.selectionAsync();
              }}>
              <AppText
                className={
                  isSelected
                    ? 'text-[32px] font-semibold text-[#B85A3B]'
                    : 'text-[28px] text-[#475569]'
                }>
                {formatItem(item)}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

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

  // Display time
  const displayTime = `${formatHour(selectedHour)}:${formatMinute(selectedMinute)}`;

  return (
    <HeritageModal
      visible={visible}
      onClose={onCancel}
      closeOnBackdrop={false}
      accessibilityLabel={`Time picker: ${title}`}
      testID={testID}>
      <View className="p-6">
        {/* Header */}
        <View className="items-center mb-6">
          <AppText className="text-lg text-[#475569] mb-2">{title}</AppText>
          <AppText className="text-5xl font-serif font-semibold text-[#B85A3B] tracking-widest">
            {displayTime}
          </AppText>
        </View>

        {/* Wheel Picker */}
        <View className="flex-row items-center justify-center h-[280px] mb-6">
          {/* Hours */}
          <WheelColumn
            items={HOURS}
            selectedIndex={selectedHour}
            onSelect={setSelectedHour}
            formatItem={formatHour}
            testID={`${testID}-hours`}
          />

          {/* Separator */}
          <View className="w-6 items-center justify-center">
            <AppText className="text-[40px] font-semibold text-[#B85A3B]">:</AppText>
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
        <View className="flex-row gap-3">
          <Pressable
            className="flex-1 bg-transparent rounded-2xl border-[1.5px] border-[#E2E8F0] py-4 items-center justify-center min-h-[56px]"
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel">
            <AppText className="text-lg font-semibold text-[#475569]">Cancel</AppText>
          </Pressable>

          <Pressable
            className="flex-1 bg-[#B85A3B] rounded-2xl py-4 items-center justify-center min-h-[56px] shadow-sm elevation-4"
            style={{ shadowColor: TOKENS.primary }}
            onPress={handleConfirm}
            accessibilityRole="button"
            accessibilityLabel="Confirm time selection">
            <AppText className="text-lg font-semibold text-white">Confirm</AppText>
          </Pressable>
        </View>
      </View>
    </HeritageModal>
  );
}

export default HeritageTimePicker;
