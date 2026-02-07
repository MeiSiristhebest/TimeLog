/**
 * Logic to determine the current "Listener" or Family Member context.
 * Currently returns a mock listener, but designed to be replaced by API/Context later.
 */

export interface ListenerProfile {
    id: string;
    name: string;
    avatarUrl?: string;
    relation?: string;
}

// Mock Data
const DEFAULT_LISTENER: ListenerProfile = {
    id: 'listener-1',
    name: 'Alice',
    avatarUrl: 'https://i.pravatar.cc/150?u=alice', // Use a consistent avatar
    relation: 'Granddaughter',
};

/**
 * Get the current primary listener.
 * In the future, this might read from a Store or API.
 */
export function getCurrentListener(): ListenerProfile {
    return DEFAULT_LISTENER;
}
