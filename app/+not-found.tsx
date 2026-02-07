import { Link, Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Container } from '@/components/ui/Container';
import { AppText } from '@/components/ui/AppText';
import { useHeritageTheme } from '@/theme/heritage';
import { Ionicons } from '@/components/ui/Icon';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';

export default function NotFoundScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  return (
    <Container>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Animated.View
          entering={ZoomIn.duration(600)}
          style={[styles.iconContainer, { backgroundColor: colors.surfaceDim }]}
        >
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>Page Not Found</AppText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <AppText style={[styles.message, { color: colors.textMuted }]}>
            The screen you are looking for doesn't exist or has been moved.
          </AppText>
        </Animated.View>

        <Link href="/" asChild>
          <HeritageButton
            title="Return Home"
            onPress={() => { }}
            variant="primary"
            style={styles.button}
          />
        </Link>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    maxWidth: '80%',
  },
  button: {
    minWidth: 200,
  },
});
