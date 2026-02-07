// Mock data for Story Gallery components
// Moving static text and assets here to decouple from UI logic

export const PREVIEW_TEXT_PLACEHOLDER = 'It was red, cherry red. My father brought it home...';
export const LISTENER_NAME_DEFAULT = 'Alice';

// In a real app, these image requires would likely be dynamic or remote URLs
// Mapped covers matching user request descriptions
// (Using existing assets as placeholders where distinct asset is missing)
export const CATEGORY_COVERS: Record<string, any> = {
  travel: require('../../../../assets/images/illustration_travel.png'),
  education: require('../../../../assets/images/illustration_education.png'),
  wisdom: require('../../../../assets/images/illustration_wisdom.png'),
  celebration: require('../../../../assets/images/illustration_celebration.png'),
  hobbies: require('../../../../assets/images/illustration_hobbies.png'),
  food: require('../../../../assets/images/illustration_food.png'),
  friendship: require('../../../../assets/images/illustration_friendship.png'),
  friends: require('../../../../assets/images/illustration_friendship.png'),
  history: require('../../../../assets/images/illustration_history.png'),
  childhood: require('../../../../assets/images/illustration_childhood.png'),
  all: require('../../../../assets/images/illustration_family.png'), // Fallback
};

// Fallback array for when category is unknown
export const COVER_IMAGES = [
  require('../../../../assets/images/illustration_childhood.png'),
  require('../../../../assets/images/illustration_family.png'),
  require('../../../../assets/images/illustration_travel.png'),
];
