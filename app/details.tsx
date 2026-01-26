import { View } from 'react-native';

import { Stack, useLocalSearchParams } from 'expo-router';

import { Container } from '@/components/ui/Container';
import { ScreenContent } from '@/components/ui/ScreenContent';

export default function Details(): JSX.Element {
  const { name } = useLocalSearchParams();

  return (
    <View className={styles.container}>
      <Stack.Screen options={{ title: 'Details' }} />
      <Container>
        <ScreenContent path="screens/details.tsx" title={`Showing details for user ${name}`} />
      </Container>
    </View>
  );
}

const styles = {
  container: 'flex flex-1 bg-surface',
};
