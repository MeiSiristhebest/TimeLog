/**
 * Story Image Utilities
 * Centralizes logic for mapping categories to static assets (images).
 * Used by Story Cards and Gallery.
 */

// Define asset requirements using require() so Metro bundler resolves them.
// In a real scenario, these might be remote URLs or handled via a dedicated Asset Manager.

import { ImageSourcePropType } from 'react-native';

const ASSETS = {
    illustration_career: require('../../../../assets/images/illustration_career.png'),
    illustration_wisdom: require('../../../../assets/images/illustration_wisdom.png'),
    illustration_family: require('../../../../assets/images/illustration_family.png'),
    illustration_childhood: require('../../../../assets/images/illustration_childhood.png'),
    illustration_travel: require('../../../../assets/images/illustration_travel.png'),
    illustration_education: require('../../../../assets/images/illustration_education.png'),
    illustration_celebration: require('../../../../assets/images/illustration_celebration.png'),
    illustration_hobbies: require('../../../../assets/images/illustration_hobbies.png'),
    illustration_food: require('../../../../assets/images/illustration_food.png'),
    illustration_friendship: require('../../../../assets/images/illustration_friendship.png'),
    illustration_history: require('../../../../assets/images/illustration_history.png'),
};

export const CATEGORY_COVERS: Record<string, ImageSourcePropType> = {
    travel: ASSETS.illustration_travel,
    education: ASSETS.illustration_education,
    wisdom: ASSETS.illustration_wisdom,
    celebration: ASSETS.illustration_celebration,
    hobbies: ASSETS.illustration_hobbies,
    food: ASSETS.illustration_food,
    friendship: ASSETS.illustration_friendship,
    friends: ASSETS.illustration_friendship,
    history: ASSETS.illustration_history,
    childhood: ASSETS.illustration_childhood,
    all: ASSETS.illustration_family, // Fallback
};

export const FALLBACK_COVERS: ImageSourcePropType[] = [
    ASSETS.illustration_childhood,
    ASSETS.illustration_family,
    ASSETS.illustration_travel,
];

/**
 * Get the cover image source for a specific category.
 * Returns a default if category is not found.
 */
export function getCategoryCover(category: string | undefined): ImageSourcePropType {
    if (!category) return ASSETS.illustration_family;

    const normalizedKey = category.toLowerCase();
    return CATEGORY_COVERS[normalizedKey] || ASSETS.illustration_family;
}

/**
 * Get a random cover image from the fallback set.
 * Useful for stories with unknown categories or variety.
 */
export function getRandomCover(): ImageSourcePropType {
    const index = Math.floor(Math.random() * FALLBACK_COVERS.length);
    return FALLBACK_COVERS[index];
}
