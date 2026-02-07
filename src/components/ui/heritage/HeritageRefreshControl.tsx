import { RefreshControl, RefreshControlProps } from 'react-native';
import { useHeritageTheme } from '@/theme/heritage';

type HeritageRefreshControlProps = Omit<
  RefreshControlProps,
  'colors' | 'tintColor' | 'progressBackgroundColor'
>;

export function HeritageRefreshControl({
  refreshing,
  onRefresh,
  ...props
}: HeritageRefreshControlProps) {
  const { colors } = useHeritageTheme();

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[colors.primary]} // Android
      tintColor={colors.primary} // iOS
      progressBackgroundColor={colors.surface} // Android
      {...props}
    />
  );
}

export default HeritageRefreshControl;
