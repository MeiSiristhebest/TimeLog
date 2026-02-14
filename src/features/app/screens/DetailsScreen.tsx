import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Container } from '@/components/ui/Container';
import { ScreenContent } from '@/components/ui/ScreenContent';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';

export default function DetailsScreen(): JSX.Element {
  const { name } = useLocalSearchParams<{ name?: string | string[] }>();
  const { colors } = useHeritageTheme();

  const displayName = typeof name === 'string' ? name : 'Item Details';
  const detailText = typeof name === 'string' ? `Showing details for user ${name}` : 'Showing details';

  return (
    <Container>
      <Stack.Screen options={{ headerShown: false }} />
      <HeritageHeader title="Details" subtitle={displayName} showBack />
      <View style={[styles.content, { backgroundColor: colors.surface }]}>
        <ScreenContent path="screens/details.tsx" title={detailText} />
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 24,
  },
});
