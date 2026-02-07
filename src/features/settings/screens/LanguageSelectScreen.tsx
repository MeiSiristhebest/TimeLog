import { AppText } from '@/components/ui/AppText';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';
import { useProfile } from '../hooks/useProfile';
import { buildLanguageOptions, getLanguageLabel, getSystemLocale } from '../utils/languageOptions';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { useLocalSearchParams, useRouter } from 'expo-router';

export function LanguageSelectScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ current?: string; from?: string }>();
  const { profile, updateProfileData } = useProfile();
  const systemLocale = getSystemLocale();
  const [search, setSearch] = useState('');

  const options = useMemo(() => buildLanguageOptions(systemLocale), [systemLocale]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) || option.code.toLowerCase().includes(query)
    );
  }, [options, search]);

  const selected = params.current ?? profile?.language ?? systemLocale;

  const handleSelect = async (code: string) => {
    if (params.from === 'edit-profile') {
      router.replace({
        pathname: '/(tabs)/settings/edit-profile',
        params: { language: code },
      });
      return;
    }

    await updateProfileData({ language: code });
    router.back();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title="Language" showBack />
      <View className="px-4 pt-4">
        <View
          className="flex-row items-center gap-2 rounded-xl border px-3 py-2"
          style={{ borderColor: colors.border, backgroundColor: colors.surfaceCard }}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search language"
            placeholderTextColor={colors.textMuted}
            className="flex-1 text-base"
            style={{ color: colors.onSurface }}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        renderItem={({ item }) => {
          const isSelected = item.code === selected;
          return (
            <Pressable
              onPress={() => handleSelect(item.code)}
              className="flex-row items-center justify-between px-4 py-3 rounded-xl mb-2"
              style={{
                backgroundColor: isSelected ? `${colors.primary}15` : colors.surfaceCard,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : colors.border,
              }}>
              <View>
                <AppText style={{ color: colors.onSurface }}>{item.label}</AppText>
                <AppText className="text-xs" style={{ color: colors.textMuted }}>
                  {item.code}
                </AppText>
              </View>
              {isSelected ? (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              ) : null}
            </Pressable>
          );
        }}
        ListHeaderComponent={
          <View className="mb-4">
            <AppText className="text-xs" style={{ color: colors.textMuted }}>
              System default: {getLanguageLabel(systemLocale, systemLocale)}
            </AppText>
          </View>
        }
      />
    </View>
  );
}
