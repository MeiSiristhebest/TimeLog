import { AppText } from '@/components/ui/AppText';
import { View } from 'react-native';

export function EditScreenInfo({ path }: { path: string }): JSX.Element {
  const title = 'Open up the code for this screen:';
  const description =
    'Change any of the text, save the file, and your app will automatically update.';

  return (
    <View>
      <View className={styles.getStartedContainer}>
        <AppText className={styles.getStartedText}>{title}</AppText>
        <View className={`${styles.codeHighlightContainer} ${styles.homeScreenFilename}`}>
          <AppText className={styles.pathText}>{path}</AppText>
        </View>
        <AppText className={styles.getStartedText}>{description}</AppText>
      </View>
    </View>
  );
}

const styles = {
  codeHighlightContainer: 'rounded-md bg-onSurface/10 px-2 py-1',
  getStartedContainer: `items-center mx-12`,
  getStartedText: 'text-body text-center text-onSurface',
  helpContainer: `items-center mx-5 mt-4`,
  helpLink: `py-4`,
  helpLinkText: 'text-center text-body text-onSurface',
  homeScreenFilename: 'my-3',
  pathText: 'text-body text-onSurface',
};
