import { useMemo } from 'react';
import { Ionicons } from '@/components/ui/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { BreathingGlow } from '@/components/ui/heritage/BreathingGlow';
import { HomeNotification } from '@/features/home/components/HomeNotification';
import { HomeRecordButton } from '@/features/home/components/HomeRecordButton';
import { ActiveRecordingView } from '@/features/recorder/components/ActiveRecordingView';
import { AiConnectingView } from '@/features/recorder/components/AiConnectingView';
import { AiRecordingView } from '@/features/recorder/components/AiRecordingView';
import { StorySavedView } from '@/features/recorder/components/StorySavedView';
import { useHeritageTheme } from '@/theme/heritage';
import { useHomeLogic } from '@/features/home/hooks/useHomeLogic';
import { HOME_STRINGS } from '@/features/home/data/mockHomeData';
import { AppText } from '@/components/ui/AppText';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Animated } from '@/tw/animated';
import { FadeIn, FadeInDown } from 'react-native-reanimated';
const RECORD_BUTTON_CONTAINER_SIZE = 142;
const BREATHING_GLOW_SIZE = 140;
const BREATHING_RING_SIZE = Math.round(BREATHING_GLOW_SIZE * 1.04);
const BREATHING_GLOW_OFFSET = (RECORD_BUTTON_CONTAINER_SIZE - BREATHING_RING_SIZE) / 2;

export default function HomeTabScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation: All business logic in hook
  const { state, actions } = useHomeLogic();

  const {
    recordingHandle,
    isRecordingPaused,
    lastSavedId,
    currentAmplitude,
    currentQuestion,
    isSpeaking,
    words,
    currentWordIndex,
    isCurrentTopicAnswered,
    formattedDate,
    greeting,
    weather,
    weatherIcon,
    activities,
    hasUnread,
    isOnline,
    recordingMode,
    canEnableAiMode,
    cloudDialogMode,
    cloudNetworkQuality,
    isCloudDialogConnected,
    cloudDialogError,
    transcripts,
    recordingDurationSec,
    isStoppingRecording,
    isPauseTransitioning,
    isStartingRecording,
  } = state;
  const promptText = currentQuestion?.text || HOME_STRINGS.questionCard.defaultQuestion;
  const renderedWords = useMemo(
    () => (words.length > 0 ? words : promptText.split(/\s+/).filter(Boolean)),
    [words, promptText]
  );

  // -- Views --

  // Active Recording View (New Heritage Hybrid Design)
  if (recordingHandle) {
    if (recordingMode === 'ai') {
      const shouldShowAiConnecting =
        !isCloudDialogConnected && !cloudDialogError && transcripts.length === 0;

      if (shouldShowAiConnecting) {
        return (
          <AiConnectingView
            questionText={currentQuestion?.text}
            isOnline={isOnline}
            dialogMode={cloudDialogMode}
            onSwitchToClassic={() => actions.setRecordingMode('basic')}
          />
        );
      }

      return (
        <AiRecordingView
          amplitude={currentAmplitude}
          questionText={currentQuestion?.text}
          recordingDurationSec={recordingDurationSec}
          isPaused={isRecordingPaused}
          isOnline={isOnline}
          dialogMode={cloudDialogMode}
          networkQuality={cloudNetworkQuality}
          isCloudConnected={isCloudDialogConnected}
          transcripts={transcripts}
          cloudErrorMessage={cloudDialogError?.message ?? null}
          controlsDisabled={isStoppingRecording || isPauseTransitioning}
          onPause={actions.handlePauseRecording}
          onResume={actions.handleResumeRecording}
          onSwitchToClassic={() => actions.setRecordingMode('basic')}
          onStop={actions.handleStopRecording}
        />
      );
    }

    return (
        <ActiveRecordingView
          amplitude={currentAmplitude}
          questionText={currentQuestion?.text}
          recordingDurationSec={recordingDurationSec}
          isPaused={isRecordingPaused}
          isOnline={isOnline}
          canSwitchToAi={canEnableAiMode}
          controlsDisabled={isStoppingRecording || isPauseTransitioning}
          onSwitchToAi={() => actions.setRecordingMode('ai')}
          onPause={actions.handlePauseRecording}
          onResume={actions.handleResumeRecording}
          onStop={actions.handleStopRecording}
        />
      );
    }

  if (recordingMode === 'ai' && canEnableAiMode && isStartingRecording) {
    return (
      <AiConnectingView
        questionText={currentQuestion?.text}
        isOnline={isOnline}
        dialogMode={cloudDialogMode}
        onSwitchToClassic={() => actions.setRecordingMode('basic')}
      />
    );
  }

  // Story Saved Success View
  if (lastSavedId) {
    return (
      <StorySavedView
        onDismiss={() => {
          actions.setLastSavedId(null);
          actions.navigateToListen();
        }}
        storyTitle={currentQuestion?.text || HOME_STRINGS.questionCard.defaultQuestion}
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
            {!weather.isLoading && (
              <>
                <View style={[styles.dot, { backgroundColor: `${colors.textMuted}50` }]} />
                <View style={styles.weatherContainer}>
                  <Ionicons
                    name={weatherIcon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={colors.warning}
                    accessibilityLabel={`Weather: ${weather.condition}`}
                  />
                  <AppText style={[styles.weatherText, { color: colors.textMuted }]}>
                    {weather.error ? '--' : weather.temperature}
                    {HOME_STRINGS.weather.unit}
                  </AppText>
                </View>
              </>
            )}
          </View>
        </View>
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
            <View style={[styles.tape, { backgroundColor: `${colors.textMuted}80` }]} />

            <View>
              <AppText style={[styles.questionText, { color: colors.onSurface }]}>
                {renderedWords.map((word, index) => (
                  <AppText
                    key={`${currentQuestion?.id ?? 'question'}-${word}-${index}`}
                    style={[
                      isSpeaking && index === currentWordIndex
                        ? {
                            color: colors.primary,
                          }
                        : { color: colors.onSurface },
                    ]}>
                    {word + (index === renderedWords.length - 1 ? '' : ' ')}
                  </AppText>
                ))}
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

            <View
              style={{
                marginTop: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                paddingHorizontal: 12,
              }}>
              <HeritageButton
                title="Play"
                onPress={actions.replayQuestion}
                variant="secondary"
                size="small"
                icon="volume-high-outline"
                style={{ flex: 1, height: 48 }}
                accessibilityLabel="Replay the question"
              />

              <HeritageButton
                title={HOME_STRINGS.questionCard.newQuestionButton}
                onPress={actions.newTopic}
                variant="outline"
                size="small"
                icon="arrow-forward"
                style={{ flex: 1, height: 48 }}
                accessibilityLabel="Get a new question prompt"
              />
            </View>
          </View>
        </Animated.View>

        {/* Record Button Area */}
        <Animated.View entering={FadeIn.delay(600).duration(800)} style={styles.recordArea}>
          <View style={styles.recordButtonContainer}>
            <View pointerEvents="none" style={styles.breathingLayer}>
              <BreathingGlow
                color={colors.primary}
                size={BREATHING_GLOW_SIZE}
                profile="home"
                style={styles.breathingGlow}
              />
            </View>
            <HomeRecordButton
              onPress={actions.handleStartRecording}
              color={colors.primary}
              iconColor={colors.onPrimary}
              disabled={isStartingRecording}
            />
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
    lineHeight: 40,
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 96, // Space for tab bar
    gap: 16,
  },
  clipIcon: {
    position: 'absolute',
    right: 24,
    top: -4,
    zIndex: 10,
  },
  tape: {
    position: 'absolute',
    top: -15,
    width: 120,
    height: 30,
    alignSelf: 'center',
    transform: [{ rotate: '-2deg' }],
    borderRadius: 0,
    zIndex: 10,
  },
  paperCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    elevation: 4,
  },
  questionText: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 36,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  recordArea: {
    alignItems: 'center',
    marginTop: 24,
  },
  recordButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: RECORD_BUTTON_CONTAINER_SIZE,
    height: RECORD_BUTTON_CONTAINER_SIZE,
    overflow: 'visible',
  },
  breathingLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
  },
  breathingGlow: {
    left: BREATHING_GLOW_OFFSET,
    top: BREATHING_GLOW_OFFSET,
  },
  tapToRecord: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    marginTop: 16,
    minHeight: 24,
    textAlign: 'center',
  },
});
