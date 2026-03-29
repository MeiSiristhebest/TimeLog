import { useMemo } from 'react';
import { Icon } from '@/components/ui/Icon';
import { AppButton } from '@/components/ui/AppButton';
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
import { View } from 'react-native';
import { Animated } from '@/tw/animated';
import { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Container } from '@/components/ui/Container';

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
    isRecordAllowed,
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

  if (!isRecordAllowed) {
    return (
      <Container safe className="items-center justify-center p-6 gap-6">
        <Icon name="headset" size={64} color={colors.primary} />
        <AppText variant="headline" className="text-center">
          Listener Mode
        </AppText>
        <AppText variant="body" className="text-center text-textMuted max-w-[360px]">
          Recording is unavailable for family listeners. Open the Listen tab to continue.
        </AppText>
        <AppButton
          label="Open Listen"
          onPress={actions.navigateToFamilyTab}
          variant="primary"
          icon="headset"
          className="w-full mt-4"
        />
      </Container>
    );
  }

  // Active Recording View Overlays
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
        onSetTimeCapsule={() => {
          const id = lastSavedId;
          actions.setLastSavedId(null);
          if (id) {
            actions.navigateToEditTimeCapsule(id);
          }
        }}
        storyTitle={currentQuestion?.text || HOME_STRINGS.questionCard.defaultQuestion}
        category={currentQuestion?.category}
      />
    );
  }

  // Idle Home Dashboard View
  return (
    <Container safe scrollable contentContainerClassName="px-4 pb-24 gap-4">
      {/* Header Section */}
      <Animated.View entering={FadeInDown.duration(600)} className="flex-row items-start justify-between px-2 pt-6 pb-2">
        <View className="flex-1">
          <AppText variant="headline" className="leading-tight">
            {greeting}
          </AppText>
          <View className="flex-row items-center mt-1 gap-3">
            <AppText variant="small" className="font-bold text-textMuted">
              {formattedDate}
            </AppText>
            {!weather.isLoading && (
              <>
                <View className="w-1 h-1 rounded-full opacity-30" style={{ backgroundColor: colors.textMuted }} />
                <View className="flex-row items-center gap-1.5">
                  <Icon
                    name={weatherIcon as any}
                    size={20}
                    color={colors.warning}
                    accessibilityLabel={`Weather: ${weather.condition}`}
                  />
                  <AppText variant="small" className="font-bold text-textMuted">
                    {weather.error ? '--' : weather.temperature}
                    {HOME_STRINGS.weather.unit}
                  </AppText>
                </View>
              </>
            )}
          </View>
        </View>
      </Animated.View>

        {/* Unread Activities / Notification Bar */}
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

        {/* Paper-Styled Question Prompt Card */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          className="flex-1 justify-center mt-2">
          <View
            className="rounded-card border p-6 items-center gap-4 elevation-4 shadow-xl"
            style={{ borderColor: colors.border, backgroundColor: colors.surfaceWarm, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
            
            {/* Decorative Heritage Elements */}
            <View className="absolute -top-1 right-6 z-10">
              <View className="rotate-[-12deg]">
                <Icon name="attach" size={48} color={`${colors.handle}CC`} />
              </View>
            </View>
            <View className="absolute -top-3.5 self-center w-28 h-7.5 rounded-sm z-10 rotate-[-2deg]" style={{ backgroundColor: `${colors.textMuted}4D` }} />

            <View className="w-full">
              <AppText variant="display" className="text-center px-2">
                {renderedWords.map((word, index) => (
                  <AppText
                    variant="display"
                    key={`${currentQuestion?.id ?? 'question'}-${word}-${index}`}
                    style={[
                      isSpeaking && index === currentWordIndex
                        ? { color: colors.primary }
                        : { color: colors.onSurface },
                    ]}>
                    {word + (index === renderedWords.length - 1 ? '' : ' ')}
                  </AppText>
                ))}
              </AppText>

              {/* Answered Status Badge */}
              {isCurrentTopicAnswered && (
                <View className="flex-row items-center justify-center mt-4 gap-1.5 self-center px-4 py-2 rounded-pill" style={{ backgroundColor: `${colors.success}26` }}>
                  <Icon name="checkmark-circle" size={18} color={colors.success} />
                  <AppText variant="small" className="font-bold uppercase tracking-wider" style={{ color: colors.success }}>
                    {HOME_STRINGS.questionCard.answeredBadge}
                  </AppText>
                </View>
              )}
            </View>

            {/* Quick Actions Container */}
            <View className="mt-4 flex-row items-center gap-3 w-full px-1">
              <AppButton
                label="Play"
                onPress={actions.replayQuestion}
                variant="secondary"
                size="md"
                icon="volume-high-outline"
                className="flex-1"
              />

              <AppButton
                label={HOME_STRINGS.questionCard.newQuestionButton}
                onPress={actions.newTopic}
                variant="outline"
                size="md"
                icon="arrow-forward"
                className="flex-1"
              />
            </View>
          </View>
        </Animated.View>

        {/* Start Recording (The Heritage Orb) Area */}
        <Animated.View entering={FadeIn.delay(600).duration(800)} className="items-center mt-8 px-4">
          <View className="relative items-center justify-center overflow-visible" style={{ width: RECORD_BUTTON_CONTAINER_SIZE, height: RECORD_BUTTON_CONTAINER_SIZE }}>
            <View pointerEvents="none" className="absolute inset-0 items-center justify-center overflow-visible">
              <BreathingGlow
                color={colors.primary}
                size={BREATHING_GLOW_SIZE}
                profile="home"
              />
            </View>
            <HomeRecordButton
              onPress={actions.handleStartRecording}
              color={colors.primary}
              iconColor={colors.onPrimary}
              disabled={isStartingRecording}
            />
          </View>
          <AppText variant="title" className="font-bold text-center mt-6">
            {HOME_STRINGS.recording.tapToRecord}
          </AppText>
        </Animated.View>
      </Container>
  );
}
