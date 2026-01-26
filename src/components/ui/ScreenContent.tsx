import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { View } from 'react-native';

import { EditScreenInfo } from './EditScreenInfo';

type ScreenContentProps = {
  title: string;
  path: string;
  children?: React.ReactNode;
};

export function ScreenContent({ title, path, children }: ScreenContentProps): JSX.Element {
  return (
    <View className={styles.container}>
      <AppText className={styles.title}>{title}</AppText>
      <View className={styles.separator} />
      <EditScreenInfo path={path} />
      {children}
    </View>
  );
}
const styles = {
  container: 'items-center flex-1 justify-center bg-surface',
  separator: 'h-[1px] my-7 w-4/5 bg-onSurface opacity-10',
  title: 'text-headline font-bold text-onSurface',
};
