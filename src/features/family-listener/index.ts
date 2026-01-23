/**
 * Family Listener Feature Module
 *
 * This module provides the family user interface for viewing
 * and listening to stories recorded by linked senior users.
 *
 * Story 4.1: Family Story List
 * Story 4.2: Secure Streaming Player
 * Story 4.3: Realtime Comment System
 * Story 4.4: Push Notification & Deep Link
 */

// Components
export { FamilyStoryCard } from './components/FamilyStoryCard';
export { FamilyStoryList } from './components/FamilyStoryList';
export { EmptyFamilyGallery } from './components/EmptyFamilyGallery';
export { SkeletonCard } from './components/SkeletonCard';
export { NotificationPrompt } from './components/NotificationPrompt';
export { PlaybackControls } from './components/PlaybackControls';
export { CommentInput } from './components/CommentInput';
export { CommentItem } from './components/CommentItem';
export { CommentList } from './components/CommentList';
export { CommentSection } from './components/CommentSection';
export { NotificationBanner } from './components/NotificationBanner';

// Hooks
export {
  useFamilyStories,
  useRefreshFamilyStories,
  usePrefetchFamilyStories,
  FAMILY_STORIES_QUERY_KEY,
} from './hooks/useFamilyStories';
export {
  useFamilyPlayer,
  type FamilyPlayerState,
  type UseFamilyPlayerReturn,
} from './hooks/useFamilyPlayer';
export {
  useComments,
  useCommentCount,
  COMMENTS_QUERY_KEY,
  type UseCommentsReturn,
} from './hooks/useComments';
export {
  useNotifications,
  type ForegroundNotification,
  type UseNotificationsReturn,
} from './hooks/useNotifications';

// Services
export {
  fetchLinkedSeniorStories,
  fetchStoryById,
  type FamilyStory,
} from './services/familyStoryService';
export {
  getSignedAudioUrl,
  shouldRefreshUrl,
  isUrlExpired,
  type SignedAudioUrl,
} from './services/secureAudioService';
export {
  fetchComments,
  postComment,
  deleteComment,
  getCommentCount,
  subscribeToComments,
  type Comment,
} from './services/commentService';
