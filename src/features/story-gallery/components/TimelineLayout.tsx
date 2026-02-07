import React from 'react';
import type { ReactNode } from 'react';
import { useHeritageTheme } from '@/theme/heritage';
import { View } from 'react-native';

interface TimelineLayoutProps {
  children: ReactNode;
}

export function TimelineLayout({ children }: TimelineLayoutProps): JSX.Element {
  const { colors } = useHeritageTheme();

  return (
    <View className="relative flex-1 px-0 py-0">
      <View
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: colors.border,
          zIndex: 0
        }}
      />
      <View className="relative z-10 flex-1">{children}</View>
    </View>
  );
}

// Default export for React.lazy() compatibility
export default TimelineLayout;
