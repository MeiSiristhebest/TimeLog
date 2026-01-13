import { Text, View } from 'react-native';

import { Container } from '@/components/ui/Container';

export default function TopicsTab() {
  return (
    <Container>
      <View className="flex-1 items-center justify-center gap-4">
        <Text className="text-headline font-bold text-onSurface">Topics</Text>
        <Text className="text-center text-body text-onSurface">
          Topic discovery and prompts will appear here in future stories.
        </Text>
      </View>
    </Container>
  );
}
