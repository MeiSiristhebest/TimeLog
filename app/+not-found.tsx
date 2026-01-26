import { AppText } from '@/components/ui/AppText';
import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Container } from '@/components/ui/Container';

export default function NotFoundScreen(): JSX.Element {
  return (
    <View className={styles.container}>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Container>
        <AppText className={styles.title}>{"This screen doesn't exist."}</AppText>
        <Link href="/" className={styles.link}>
          <AppText className={styles.linkText}>Go to home screen!</AppText>
        </Link>
      </Container>
    </View>
  );
}

const styles = {
  container: `flex flex-1 bg-white`,
  title: `text-xl font-bold`,
  link: `mt-4 pt-4`,
  linkText: `text-base text-[#2e78b7]`,
};
