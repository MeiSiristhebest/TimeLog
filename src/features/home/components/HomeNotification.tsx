/**
 * HomeNotification - "Alice liked..." notification card.
 *
 * Design:
 * - Rounded-2xl container
 * - Left accent border (amber/gold)
 * - Avatar with white border
 * - SF Symbols chevron
 */

import { Icon } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import { TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

interface HomeNotificationProps {
  onPress: () => void;
  actorName?: string;
  actionText?: string;
  storyTitle?: string;
  avatarUrl?: string;
}

export function HomeNotification({
  onPress,
  actorName = 'Alice',
  actionText = 'liked',
  storyTitle = 'My first job',
  avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-OqETNsiT8Xqn2RatVrhmvn2NfAD32baNOtlysgZFZvSVZq8DJJmJDywJwTD1M0idINIntiAIRmsX3TtScSrjtv3RZW2tbAoUddvUyMNQO276fWw5CLD3eQZuGskX4yGl507vagE4hZ12a3Wy0wO4olUkt--hZeUFzc5VAqLePuyPbLwbWqNosk2VUpRcJWtZIfckzdChN7VJTlpuxAHRzJ1N9XtPUVjvHulRvKPvjUDxFXjk-Isvv9rsEndnXj4kvNWYj4jWkhw',
}: HomeNotificationProps): JSX.Element {
  const { colors } = useHeritageTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="mt-2 flex-row items-center justify-between rounded-2xl border p-4 pr-3 shadow-sm elevation-1"
      style={{
        backgroundColor: colors.surfaceCream,
        borderColor: `${colors.amberDeep}4D`, // 30% opacity
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2
      }}
      accessibilityRole="button"
      accessibilityLabel={`${actorName} ${actionText} "${storyTitle}". Tap to see details.`}>
      
      {/* Heritage Left Accent Bar */}
      <View
        className="absolute bottom-0 left-0 top-0 w-1.5 rounded-l-2xl"
        style={{ backgroundColor: colors.amberDeep }}
      />

      <View className="flex-1 flex-row items-center gap-3 pl-2">
        {/* Profile Avatar */}
        <View
          className="h-10 w-10 overflow-hidden rounded-full border-2 shadow-sm elevation-1"
          style={{
            backgroundColor: `${colors.primary}1A`, // primary/10
            borderColor: colors.onPrimary,
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2
          }}>
          <Image source={{ uri: avatarUrl }} className="h-full w-full" contentFit="cover" />
        </View>

        {/* Notification Text */}
        <View className="flex-1">
          <AppText className="text-sm font-bold leading-tight text-onSurface">
            {`${actorName} ${actionText} "${storyTitle}".`}
          </AppText>
          <AppText className="mt-0.5 text-xs font-semibold text-textFaint uppercase tracking-wider">Tap to see</AppText>
        </View>
      </View>

      {/* Navigation Icon */}
      <Icon name="chevron-forward" size={20} color={colors.textFaint} />
    </TouchableOpacity>
  );
}
