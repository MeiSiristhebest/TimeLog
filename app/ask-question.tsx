import { AppText } from '@/components/ui/AppText';
import { View, ScrollView, Pressable } from 'react-native';

import { useAuthStore } from '@/features/auth/store/authStore';

// Heritage
import { useHeritageTheme } from '@/theme/heritage';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageInput } from '@/components/ui/heritage/HeritageInput';
import Animated from 'react-native-reanimated';
import { useAskQuestionLogic } from '@/features/family/hooks/useFamilyLogic';
import { FAMILY_STRINGS } from '@/features/family/data/mockFamilyData';

export default function AskQuestionScreen(): JSX.Element {
  const theme = useHeritageTheme();

  // Logic Separation
  const { state, actions } = useAskQuestionLogic();
  const {
    categories,
    selectedCategory,
    customQuestion,
    isSubmitting,
    scrollY,
    suggestedQuestions,
    selectedQuestion,
  } = state;
  const STRINGS = FAMILY_STRINGS.askQuestion;

  const renderQuestion = ({ item }: { item: string }) => (
    <Pressable
      onPress={() => actions.handleSelectQuestion(item)}
      style={({ pressed }) => ({
        padding: 16,
        borderRadius: theme.radius.md,
        backgroundColor:
          selectedQuestion === item ? `${theme.colors.primary} 15` : theme.colors.surfaceDim,
        borderWidth: 1,
        borderColor: selectedQuestion === item ? theme.colors.primary : 'transparent',
        opacity: pressed ? 0.9 : 1,
      })}>
      <AppText
        style={{
          fontSize: 16,
          color: theme.colors.onSurface,
          lineHeight: 24,
        }}>
        {item}
      </AppText>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <HeritageHeader
        title={STRINGS.title}
        showBack
        scrollY={scrollY}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}
      />

      <Animated.FlatList
        data={suggestedQuestions}
        keyExtractor={(item, index) => `${selectedCategory ?? 'none'} -${index} `}
        renderItem={renderQuestion}
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingTop: 100, paddingBottom: 40 }}
        onScroll={actions.scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <>
            <AppText
              style={{
                fontSize: 18,
                color: theme.colors.textMuted,
                marginBottom: 24,
                fontFamily: 'System',
                lineHeight: 26,
              }}>
              {STRINGS.header}
            </AppText>

            {/* Category Tabs */}
            {categories.length > 0 && (
              <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
                style={{ marginBottom: 24, marginHorizontal: -24, paddingHorizontal: 24 }}>
                {categories.map((category) => (
                  <HeritageButton
                    key={category.id}
                    title={`${category.icon} ${category.name} `}
                    onPress={() => actions.setSelectedCategory(category.id)}
                    variant={selectedCategory === category.id ? 'primary' : 'secondary'}
                    size="small"
                    style={{
                      height: 40,
                      borderRadius: 20,
                    }}
                  />
                ))}
              </ScrollView>
            )}

            {selectedCategory ? (
              <View style={{ marginBottom: 32 }}>
                <AppText
                  style={{
                    fontSize: 20,
                    fontFamily: 'Fraunces_600SemiBold',
                    marginBottom: 16,
                    color: theme.colors.onSurface,
                  }}>
                  {STRINGS.suggestionsTitle}
                </AppText>
              </View>
            ) : null}
          </>
        }
        ListFooterComponent={
          <>
            {/* Custom Question Input */}
            <View style={{ marginBottom: 32 }}>
              <HeritageInput
                label={STRINGS.customInputLabel}
                value={customQuestion}
                onChangeText={actions.setCustomQuestion}
                placeholder={STRINGS.customInputPlaceholder}
                multiline
                numberOfLines={4}
                inputStyle={{ minHeight: 120, textAlignVertical: 'top' }}
              />
            </View>

            {/* Submit Button */}
            <HeritageButton
              title={isSubmitting ? STRINGS.submitButton.sending : STRINGS.submitButton.idle}
              onPress={actions.handleSubmit}
              disabled={isSubmitting || !customQuestion.trim()}
              loading={isSubmitting}
              fullWidth
              size="large"
            />
          </>
        }
      />
    </View>
  );
}
