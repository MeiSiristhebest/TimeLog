/**
 * HomeNotification - "Alice liked..." notification card.
 *
 * Design:
 * - Rounded-2xl container
 * - Left accent border (amber/gold) (w-1.5)
 * - Avatar with white border
 * - "Alice liked..." test
 * - Chevron right
 * - Subtle background color (#FFFDF5)
 *
 * Matches HTML:
 * <div class="group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl border border-amber-border/30 bg-[#FFFDF5] ...">
 */

import { AppText } from '@/components/ui/AppText';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';

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
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceCream,
          borderColor: colors.amberDeep + '4D', // 30% opacity (hex 4D) roughly
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${actorName} ${actionText} "${storyTitle}". Tap to see details.`}>
      {/* Left accent border */}
      <View style={[styles.accentBorder, { backgroundColor: colors.amberDeep }]} />

      <View style={styles.content}>
        {/* Avatar */}
        <View
          style={[
            styles.avatarContainer,
            {
              backgroundColor: colors.primary + '1A', // primary/10
              borderColor: colors.onPrimary,
            },
          ]}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <AppText style={[styles.mainText, { color: colors.onSurface }]}>
            {`${actorName} ${actionText} "${storyTitle}".`}
          </AppText>
          <AppText style={[styles.subText, { color: colors.textFaint }]}>Tap to see.</AppText>
        </View>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16, // p-4
    paddingRight: 12, // pr-3
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    overflow: 'hidden',
    // shadow-sm
    // shadow-sm
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // elevation: 2,
    // @ts-ignore
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    marginTop: 8,
  },
  accentBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6, // w-1.5
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // gap-3
    paddingLeft: 8, // pl-2
  },
  avatarContainer: {
    width: 40, // w-10
    height: 40, // h-10
    borderRadius: 20, // rounded-full
    borderWidth: 2,
    overflow: 'hidden',
    // shadow-sm
    // shadow-sm
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // @ts-ignore
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 14, // text-sm
    fontWeight: '700', // font-bold
    lineHeight: 18, // leading-tight
  },
  subText: {
    fontSize: 14,
    fontWeight: '400', // font-normal
    marginTop: 2,
  },
});
