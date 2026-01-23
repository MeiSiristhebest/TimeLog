import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Root container with Apple-style defaults:
 * - Safe area insets
 * - Warm background color
 * - Consistent padding
 */
export const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <SafeAreaView
      className="flex-1 bg-surface"
      style={{ flex: 1, backgroundColor: '#FFFAF5' }} // Enforce warm background
    >
      {children}
    </SafeAreaView>
  );
};

const styles = {
  // Removed unused styles object
};
