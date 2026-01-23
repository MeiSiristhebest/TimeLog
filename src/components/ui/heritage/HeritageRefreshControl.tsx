/**
 * HeritageRefreshControl - Custom pull-to-refresh indicator.
 *
 * Features:
 * - Custom pull indicator
 * - Heritage Memoir color scheme
 * - Smooth animation
 *
 * @example
 * <ScrollView
 *   refreshControl={
 *     <HeritageRefreshControl
 *       refreshing={isRefreshing}
 *       onRefresh={handleRefresh}
 *     />
 *   }
 * >
 *   {content}
 * </ScrollView>
 */

import { RefreshControl, RefreshControlProps } from 'react-native';

// Heritage Memoir Design Tokens
const TOKENS = {
    primary: '#B85A3B',
    surface: '#F9F3E8',
} as const;

type HeritageRefreshControlProps = Omit<RefreshControlProps, 'colors' | 'tintColor' | 'progressBackgroundColor'>;

export function HeritageRefreshControl({
    refreshing,
    onRefresh,
    ...props
}: HeritageRefreshControlProps) {
    return (
        <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[TOKENS.primary]} // Android
            tintColor={TOKENS.primary} // iOS
            progressBackgroundColor={TOKENS.surface} // Android
            {...props}
        />
    );
}

export default HeritageRefreshControl;
