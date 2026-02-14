import { AppText } from '@/components/ui/AppText';
import { useState, useCallback, useMemo } from 'react';
import { View, Pressable, TextInput, FlatList, Modal } from 'react-native';
import { Animated } from '@/tw/animated';
import { useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Icon';
import * as Haptics from 'expo-haptics';
import { useHeritageTheme } from '@/theme/heritage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SelectOption = {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
};

type HeritageSelectProps = {
  /** Label text */
  label: string;
  /** Options list */
  options: SelectOption[];
  /** Selected value (single select) */
  value?: string;
  /** Selected values (multi select) */
  values?: string[];
  /** Change handler (single select) */
  onValueChange?: (value: string) => void;
  /** Change handler (multi select) */
  onValuesChange?: (values: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Enable multi-select */
  multiple?: boolean;
  /** Enable search */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
};

export function HeritageSelect({
  label,
  options,
  value,
  values = [],
  onValueChange,
  onValuesChange,
  placeholder = 'Select an option',
  multiple = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  error,
  disabled = false,
}: HeritageSelectProps) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { colors } = useHeritageTheme();

  // Animation values
  const scale = useSharedValue(1);
  const sheetY = useSharedValue(500);
  const backdropOpacity = useSharedValue(0);

  // Filter options by search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(query));
  }, [options, searchQuery]);

  // Get display text
  const displayText = useMemo(() => {
    if (multiple) {
      if (values.length === 0) return placeholder;
      if (values.length === 1) {
        return options.find((o) => o.value === values[0])?.label || placeholder;
      }
      return `${values.length} selected`;
    }
    return options.find((o) => o.value === value)?.label || placeholder;
  }, [multiple, value, values, options, placeholder]);

  const isSelected = useCallback(
    (optionValue: string) => {
      if (multiple) {
        return values.includes(optionValue);
      }
      return value === optionValue;
    },
    [multiple, value, values]
  );

  const handleOpen = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(true);
    setSearchQuery('');
    backdropOpacity.value = withTiming(1, { duration: 200 });
    sheetY.value = withSpring(0, { damping: 25, stiffness: 300 });
  }, [disabled, backdropOpacity, sheetY]);

  const handleClose = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 150 });
    sheetY.value = withTiming(500, { duration: 200 });
    setTimeout(() => setIsOpen(false), 200);
  }, [backdropOpacity, sheetY]);

  const handleSelect = useCallback(
    (option: SelectOption) => {
      if (option.disabled) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (multiple) {
        const newValues = values.includes(option.value)
          ? values.filter((v) => v !== option.value)
          : [...values, option.value];
        onValuesChange?.(newValues);
      } else {
        onValueChange?.(option.value);
        handleClose();
      }
    },
    [multiple, values, onValueChange, onValuesChange, handleClose]
  );

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(0.98, { damping: 15 });
  }, [disabled, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15 });
  }, [scale]);

  // Animated styles
  const triggerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const renderOption = useCallback(
    ({ item }: { item: SelectOption }) => {
      const selected = isSelected(item.value);
      let optionTextColor: string = colors.onSurface;
      if (selected) {
        optionTextColor = colors.primary;
      } else if (item.disabled) {
        optionTextColor = colors.textMuted;
      }

      return (
        <Pressable
          className={styles.option}
          style={[
            { borderBottomColor: colors.border },
            selected && { backgroundColor: `${colors.primary}10` },
            item.disabled && { opacity: 0.4 }
          ]}
          onPress={() => handleSelect(item)}
          disabled={item.disabled}>
          {item.icon && (
            <Ionicons
              name={item.icon}
              size={22}
              color={item.disabled ? colors.textMuted : colors.onSurface}
              style={{ marginRight: 12 }}
            />
          )}
          <AppText
            className={styles.optionLabel}
            style={{
              color: optionTextColor,
              fontWeight: selected ? '600' : 'normal'
            }}>
            {item.label}
          </AppText>
          {selected && <Ionicons name="checkmark" size={22} color={colors.primary} />}
        </Pressable>
      );
    },
    [handleSelect, isSelected, colors]
  );

  return (
    <View className="mb-4">
      {/* Label */}
      <AppText className={styles.label} style={{ color: colors.onSurface }}>{label}</AppText>

      {/* Trigger */}
      <AnimatedPressable
        className={styles.trigger}
        style={[
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border
          },
          disabled && { backgroundColor: colors.surfaceAccent, opacity: 0.6 },
          triggerStyle,
        ]}
        onPress={handleOpen}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}>
        <AppText
          className={styles.triggerText}
          style={[
            { color: colors.onSurface },
            (!value && !values.length) && { color: colors.textMuted }
          ]}
          numberOfLines={1}>
          {displayText}
        </AppText>
        <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
      </AnimatedPressable>

      {/* Error */}
      {error && <AppText className={styles.error} style={{ color: colors.error }}>{error}</AppText>}

      {/* Bottom Sheet Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}>
        <View className={styles.modalContainer}>
          {/* Backdrop */}
          <AnimatedPressable className="absolute inset-0" style={[{ backgroundColor: colors.backdrop }, backdropStyle]} onPress={handleClose} />

          {/* Sheet */}
          <Animated.View
            className={styles.sheet}
            style={[
              { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 },
              sheetStyle
            ]}
          >
            {/* Header */}
            <View className={styles.sheetHeader} style={{ borderBottomColor: colors.border }}>
              <AppText className={styles.sheetTitle} style={{ color: colors.onSurface }}>{label}</AppText>
              {multiple && values.length > 0 && (
                <Pressable
                  onPress={() => {
                    onValuesChange?.([]);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}>
                  <AppText className={styles.clearButton} style={{ color: colors.primary }}>Clear all</AppText>
                </Pressable>
              )}
            </View>

            {/* Search */}
            {searchable && (
              <View className={styles.searchContainer} style={{ backgroundColor: colors.surfaceAccent }}>
                <Ionicons
                  name="search"
                  size={20}
                  color={colors.textMuted}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  className={styles.searchInput}
                  style={{ color: colors.onSurface }}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>
            )}

            {/* Options */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              renderItem={renderOption}
              className="flex-grow-0"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className={styles.emptyContainer}>
                  <AppText className={styles.emptyText} style={{ color: colors.textMuted }}>No options found</AppText>
                </View>
              }
            />

            {/* Done button for multi-select */}
            {multiple && (
              <Pressable
                className={styles.doneButton}
                style={{ backgroundColor: colors.primary }}
                onPress={handleClose}
              >
                <AppText className={styles.doneButtonText}>Done</AppText>
              </Pressable>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = {
  label: 'text-base font-semibold mb-2',
  trigger: 'flex-row items-center justify-between border rounded-2xl px-4 py-4 min-h-[56px]',
  triggerText: 'flex-1 text-lg',
  error: 'text-sm mt-1 px-1',
  modalContainer: 'flex-1 justify-end',
  sheet: 'rounded-t-3xl max-h-[70%] pt-2',
  sheetHeader: 'flex-row items-center justify-between px-5 py-4 border-b-[0.5px]',
  sheetTitle: 'text-lg font-bold',
  clearButton: 'text-base font-medium',
  searchContainer: 'flex-row items-center mx-4 my-3 px-3 rounded-xl',
  searchInput: 'flex-1 text-base py-3',
  option: 'flex-row items-center px-5 py-4 border-b-[0.5px]',
  optionLabel: 'flex-1 text-lg',
  emptyContainer: 'p-8 items-center',
  emptyText: 'text-base',
  doneButton: 'mx-4 mt-4 py-4 rounded-xl items-center',
  doneButtonText: 'text-lg font-semibold text-white',
} as const;

export default HeritageSelect;
