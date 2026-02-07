import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Container } from '@/components/ui/Container';
import { ScreenContent } from '@/components/ui/ScreenContent';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';

export default function Details(): JSX.Element {
  const { name } = useLocalSearchParams();
  const { colors } = useHeritageTheme();

  return (
    <Container>
      <Stack.Screen options={{ headerShown: false }} />
      <HeritageHeader
        title="Details"
        subtitle={typeof name === 'string' ? name : 'Item Details'}
        showBack
      />
      <View style={[styles.content, { backgroundColor: colors.surface }]}>
        <ScreenContent path="screens/details.tsx" title={`Showing details for user ${name}`} />
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
