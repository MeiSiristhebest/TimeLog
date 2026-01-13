import { Text, View } from 'react-native';

export const EditScreenInfo = ({ path }: { path: string }) => {
  const title = 'Open up the code for this screen:';
  const description =
    'Change any of the text, save the file, and your app will automatically update.';

  return (
    <View>
      <View className={styles.getStartedContainer}>
        <Text className={styles.getStartedText}>{title}</Text>
        <View className={`${styles.codeHighlightContainer} ${styles.homeScreenFilename}`}>
          <Text className={styles.pathText}>{path}</Text>
        </View>
        <Text className={styles.getStartedText}>{description}</Text>
      </View>
    </View>
  );
};

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
