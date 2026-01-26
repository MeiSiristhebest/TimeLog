import { AppText } from '@/components/ui/AppText';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HomeNotification } from '@/features/home/components/HomeNotification';
import { ActiveRecordingView } from '@/features/recorder/components/ActiveRecordingView';
import { StorySavedView } from '@/features/recorder/components/StorySavedView';
import { useHeritageTheme } from '@/theme/heritage';
import { useHomeLogic } from '@/features/home/hooks/useHomeLogic';
import { HOME_STRINGS } from '@/features/home/data/mockHomeData';

export default function HomeTab(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation: All business logic in hook
  const { state, actions } = useHomeLogic();
  const {
    recordingHandle,
    lastSavedId,
    currentAmplitude,
    currentQuestion,
    isCurrentTopicAnswered,
    formattedDate,
    greeting,
    weather,
    weatherIcon,
    storyCategoryTitle,
    activities,
    hasUnread,
  } = state;

  // -- Views --

  // Active Recording View (New Heritage Hybrid Design)
  if (recordingHandle) {
    return (
      <ActiveRecordingView
        amplitude={currentAmplitude}
        questionText={currentQuestion?.text}
        onStop={actions.handleStopRecording}
      />
    );
  }

  // Story Saved Success View
  if (lastSavedId) {
    return (
      <StorySavedView
        onDismiss={() => actions.setLastSavedId(null)}
        storyTitle={storyCategoryTitle}
        category={currentQuestion?.category}
      />
    );
  }

  // Idle Home View (New Design)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <View>
          <AppText style={[styles.greeting, { color: colors.onSurface }]}>{greeting}</AppText>
          <View style={styles.dateRow}>
            <AppText style={[styles.dateText, { color: colors.textMuted }]}>
              {formattedDate}
            </AppText>
            {!weather.isLoading && !weather.error && (
              <>
                <View style={[styles.dot, { backgroundColor: `${colors.textMuted}50` }]} />
                <View style={styles.weatherContainer}>
                  <Ionicons
                    name={weatherIcon as any}
                    size={18}
                    color={colors.warning}
                    accessibilityLabel={`Weather: ${weather.condition}`}
                  />
                  <AppText style={[styles.weatherText, { color: colors.textMuted }]}>
                    {weather.temperature}
                    {HOME_STRINGS.weather.unit}
                  </AppText>
                </View>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={actions.navigateToSettings}>
          <Ionicons name="settings-sharp" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Notification Card */}
        {hasUnread && activities.length > 0 && (
          <HomeNotification
            onPress={() => {
              if (activities[0]?.storyId) {
                actions.navigateToStory(activities[0].storyId);
              }
            }}
            actorName={activities[0]?.actorName}
            storyTitle={activities[0]?.storyTitle}
            actionText={
              activities[0]?.type === 'reaction'
                ? HOME_STRINGS.notification.liked
                : HOME_STRINGS.notification.commented
            }
          />
        )}

        {/* Question Card */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          style={{ flex: 1, justifyContent: 'center', marginTop: 8 }}>
          <View
            style={[
              styles.paperCard,
              { borderColor: colors.border, backgroundColor: colors.surfaceWarm },
            ]}>
            {/* Decorative elements */}
            <View style={styles.clipIcon}>
              <Ionicons
                name="attach"
                size={48}
                color={colors.handle}
                style={{ transform: [{ rotate: '-12deg' }] }}
              />
            </View>
            <View style={[styles.tape, { backgroundColor: `${colors.surfaceDim}80` }]} />

            <View>
              <AppText style={[styles.questionText, { color: colors.onSurface }]}>
                {currentQuestion ? currentQuestion.text : HOME_STRINGS.questionCard.defaultQuestion}
              </AppText>

              {/* Answered Status Indicator */}
              {isCurrentTopicAnswered && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 12,
                    gap: 6,
                    backgroundColor: `${colors.success}15`,
                    alignSelf: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <AppText style={{ fontSize: 13, color: colors.success, fontWeight: '600' }}>
                    {HOME_STRINGS.questionCard.answeredBadge}
                  </AppText>
                </View>
              )}
            </View>

            <View style={{ marginTop: 8 }}>
              <HeritageButton
                title={HOME_STRINGS.questionCard.newQuestionButton}
                onPress={actions.newTopic}
                variant="outline"
                size="medium"
                icon="refresh"
                accessibilityLabel="Get a new question prompt"
              />
            </View>
          </View>
        </Animated.View>

        {/* Record Button Area */}
        <Animated.View entering={FadeIn.delay(600).duration(800)} style={styles.recordArea}>
          <View style={styles.recordButtonContainer}>
            <View style={[styles.recordGlow, { backgroundColor: `${colors.primary}30` }]} />
            <TouchableOpacity
              style={[styles.recordButton, { backgroundColor: colors.primary }]}
              onPress={actions.handleStartRecording}
              activeOpacity={0.9}
              accessibilityLabel="Start recording your story"
              accessibilityRole="button"
              accessibilityHint="Tap to begin recording audio">
              <Ionicons name="mic" size={52} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
          <AppText style={[styles.tapToRecord, { color: colors.onSurface }]}>
            {HOME_STRINGS.recording.tapToRecord}
          </AppText>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28, // md:text-3xl
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherText: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 96, // Space for tab bar
    gap: 24,
  },
  clipIcon: {
    position: 'absolute',
    right: 24,
    top: -4,
    zIndex: 10,
  },
  tape: {
    position: 'absolute',
    top: -12,
    left: '50%',
    marginLeft: -48, // w-24 / 2
    width: 96,
    height: 32,
    transform: [{ rotate: '1deg' }],
  },
  paperCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 24,
    elevation: 4,
  },
  questionText: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 30, // text-3xl
    textAlign: 'center',
    lineHeight: 36,
    marginTop: 16,
  },
  recordArea: {
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  recordButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
  },
  recordGlow: {
    position: 'absolute',
    width: 130, // blurred glow
    height: 130,
    borderRadius: 65,
    opacity: 0.8,
  },
  recordButton: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C26B4A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  tapToRecord: {
    fontSize: 18,
    fontWeight: '600',
  },
});
