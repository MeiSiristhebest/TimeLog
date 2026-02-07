import { AppText } from '@/components/ui/AppText';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';
import { useProfile } from '../hooks/useProfile';
import { setStoredRole } from '@/features/auth/services/roleStorage';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';

type RoleOption = {
  value: 'storyteller' | 'family';
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'storyteller',
    label: 'Storyteller',
    description: 'Record and share your life stories.',
    icon: 'mic',
  },
  {
    value: 'family',
    label: 'Family Member',
    description: 'Listen and support a storyteller.',
    icon: 'heart',
  },
];

export function RoleSelectScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const { profile, updateProfileData } = useProfile();
  const selected = profile?.role ?? 'storyteller';

  const handleSelect = useCallback(
    async (value: 'storyteller' | 'family') => {
      await updateProfileData({ role: value });
      await setStoredRole(value);
    },
    [updateProfileData]
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title="My Role" showBack />
      <View className="px-4 pt-4 gap-3">
        {ROLE_OPTIONS.map((option) => {
          const isActive = option.value === selected;
          return (
            <Pressable
              key={option.value}
              onPress={() => handleSelect(option.value)}
              className="flex-row items-center gap-4 rounded-2xl border px-4 py-4"
              style={{
                borderColor: isActive ? colors.primary : colors.border,
                backgroundColor: isActive ? `${colors.primary}10` : colors.surfaceCard,
              }}>
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: `${colors.primary}20` }}>
                <Ionicons name={option.icon} size={22} color={colors.primary} />
              </View>
              <View className="flex-1">
                <AppText className="text-base font-semibold" style={{ color: colors.onSurface }}>
                  {option.label}
                </AppText>
                <AppText className="text-sm" style={{ color: colors.textMuted }}>
                  {option.description}
                </AppText>
              </View>
              {isActive ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              ) : (
                <Ionicons name="ellipse-outline" size={20} color={colors.textMuted} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
