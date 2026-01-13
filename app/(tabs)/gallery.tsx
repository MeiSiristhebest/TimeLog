import { Text, View } from 'react-native';

import { Container } from '@/components/ui/Container';

export default function GalleryTab() {
  return (
    <Container>
      <View className="flex-1 items-center justify-center gap-4">
        <Text className="text-headline font-bold text-onSurface">Gallery</Text>
        <Text className="text-center text-body text-onSurface">
          Story list and playback will live here. This is a placeholder screen.
        </Text>
      </View>
    </Container>
  );
}
