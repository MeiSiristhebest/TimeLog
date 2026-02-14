import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { HeritageModal } from './HeritageModal';
import { useHeritageTheme } from '@/theme/heritage';
import { EN_COPY, formatPickerA11yLabel } from '@/features/app/copy/en';

const ITEM_HEIGHT = 56;
const PICKER_HEIGHT = ITEM_HEIGHT * 5;
const MIN_YEAR = 1920;

type HeritageDatePickerProps = {
  visible: boolean;
  value?: Date | null;
  maximumDate?: Date;
  minimumDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  title?: string;
  testID?: string;
};

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function WheelColumn({
  items,
  selectedIndex,
  onSelect,
  formatItem,
  tokens,
  width = 90,
}: {
  items: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatItem: (value: number) => string;
  tokens: {
    primary: string;
    textMuted: string;
  };
  width?: number;
}): JSX.Element {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      y: selectedIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, [selectedIndex]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.max(0, Math.min(items.length - 1, Math.round(offsetY / ITEM_HEIGHT)));
      if (index !== selectedIndex) {
        onSelect(index);
        void Haptics.selectionAsync();
      }
      scrollViewRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    },
    [items.length, onSelect, selectedIndex]
  );

  return (
    <View style={{ width, height: PICKER_HEIGHT, overflow: 'hidden' }}>
      <View
        style={{
          position: 'absolute',
          top: ITEM_HEIGHT * 2,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          borderRadius: 12,
          backgroundColor: `${tokens.primary}15`,
        }}
      />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}>
        {items.map((item, index) => {
          const selected = index === selectedIndex;
          return (
            <Pressable
              key={item}
              style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => {
                onSelect(index);
                scrollViewRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
                void Haptics.selectionAsync();
              }}>
              <AppText
                style={{
                  color: selected ? tokens.primary : tokens.textMuted,
                  fontSize: 30,
                  fontWeight: selected ? '700' : '400',
                }}>
                {formatItem(item)}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function HeritageDatePicker({
  visible,
  value,
  maximumDate = new Date(),
  minimumDate = new Date(MIN_YEAR, 0, 1),
  onConfirm,
  onCancel,
  title = EN_COPY.pickers.selectBirthday,
  testID = 'heritage-date-picker',
}: HeritageDatePickerProps): JSX.Element {
  const { colors } = useHeritageTheme();
  const tokens = {
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    textMuted: colors.textMuted,
    border: colors.border,
    surface: colors.surfaceCard,
  };
  const resolved = useMemo(() => value ?? new Date(1950, 0, 1), [value]);
  const maxYear = maximumDate.getFullYear();
  const minYear = minimumDate.getFullYear();

  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i),
    [maxYear, minYear]
  );
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const initialYearIndex = Math.max(
    0,
    years.findIndex((year) => year === resolved.getFullYear())
  );
  const [selectedYearIndex, setSelectedYearIndex] = useState(initialYearIndex);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(resolved.getMonth());
  const [selectedDayIndex, setSelectedDayIndex] = useState(resolved.getDate() - 1);

  useEffect(() => {
    const nextYearIndex = Math.max(
      0,
      years.findIndex((year) => year === resolved.getFullYear())
    );
    setSelectedYearIndex(nextYearIndex);
    setSelectedMonthIndex(resolved.getMonth());
    setSelectedDayIndex(resolved.getDate() - 1);
  }, [resolved, years]);

  const selectedYear = years[selectedYearIndex] ?? maxYear;
  const selectedMonth = months[selectedMonthIndex] ?? 1;
  const monthDays = daysInMonth(selectedYear, selectedMonth);
  const days = useMemo(() => Array.from({ length: monthDays }, (_, i) => i + 1), [monthDays]);

  useEffect(() => {
    if (selectedDayIndex >= days.length) {
      setSelectedDayIndex(days.length - 1);
    }
  }, [days.length, selectedDayIndex]);

  const selectedDay = days[Math.max(0, selectedDayIndex)] ?? 1;
  const display = `${selectedYear}-${pad(selectedMonth)}-${pad(selectedDay)}`;

  const handleConfirm = () => {
    const next = new Date(selectedYear, selectedMonth - 1, selectedDay, 12, 0, 0, 0);
    if (next > maximumDate) {
      onConfirm(maximumDate);
      return;
    }
    if (next < minimumDate) {
      onConfirm(minimumDate);
      return;
    }
    onConfirm(next);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <HeritageModal
      visible={visible}
      onClose={onCancel}
      closeOnBackdrop={false}
      accessibilityLabel={formatPickerA11yLabel(EN_COPY.pickers.datePickerA11yPrefix, title)}
      testID={testID}>
      <View style={{ padding: 24, backgroundColor: tokens.surface }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <AppText style={{ color: tokens.textMuted, fontSize: 16, marginBottom: 6 }}>
            {title}
          </AppText>
          <AppText
            style={{
              color: tokens.primary,
              fontSize: 44,
              lineHeight: 50,
              fontFamily: 'Fraunces_600SemiBold',
              letterSpacing: 1.2,
            }}>
            {display}
          </AppText>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <WheelColumn
            items={years}
            selectedIndex={selectedYearIndex}
            onSelect={setSelectedYearIndex}
            formatItem={(year) => `${year}`}
            width={118}
            tokens={tokens}
          />
          <WheelColumn
            items={months}
            selectedIndex={selectedMonthIndex}
            onSelect={setSelectedMonthIndex}
            formatItem={(month) => pad(month)}
            tokens={tokens}
          />
          <WheelColumn
            items={days}
            selectedIndex={Math.max(0, selectedDayIndex)}
            onSelect={setSelectedDayIndex}
            formatItem={(day) => pad(day)}
            tokens={tokens}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <Pressable
            onPress={onCancel}
            style={{
              flex: 1,
              minHeight: 56,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: tokens.border,
            }}>
            <AppText style={{ color: tokens.textMuted, fontSize: 18, fontWeight: '700' }}>
              {EN_COPY.common.cancel}
            </AppText>
          </Pressable>
          <Pressable
            onPress={handleConfirm}
            style={{
              flex: 1,
              minHeight: 56,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              backgroundColor: tokens.primary,
            }}>
            <AppText style={{ color: tokens.onPrimary, fontSize: 18, fontWeight: '700' }}>
              {EN_COPY.common.confirm}
            </AppText>
          </Pressable>
        </View>
      </View>
    </HeritageModal>
  );
}

export default HeritageDatePicker;
