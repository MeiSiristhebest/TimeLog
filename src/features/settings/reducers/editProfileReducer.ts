import { UserProfile } from '../services/profileService';

export type EditProfileState = {
  displayName: string;
  role: 'storyteller' | 'family';
  avatarUri: string;
  isSaving: boolean;
  isUploadingAvatar: boolean;
  error: string | null;
};

export type EditBuildAction =
  | { type: 'SYNC_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_DISPLAY_NAME'; payload: string }
  | { type: 'SET_ROLE'; payload: 'storyteller' | 'family' }
  | { type: 'SET_AVATAR'; payload: string }
  | { type: 'START_SAVE' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_FAILURE'; payload: string }
  | { type: 'START_UPLOAD' }
  | { type: 'UPLOAD_SUCCESS'; payload: string }
  | { type: 'UPLOAD_FAILURE'; payload: string };

export const initialState: EditProfileState = {
  displayName: '',
  role: 'storyteller',
  avatarUri: '',
  isSaving: false,
  isUploadingAvatar: false,
  error: null,
};

export function editProfileReducer(
  state: EditProfileState,
  action: EditBuildAction
): EditProfileState {
  switch (action.type) {
    case 'SYNC_PROFILE':
      if (!action.payload) return state;
      return {
        ...state,
        displayName: action.payload.displayName || '',
        role: action.payload.role || 'storyteller',
        avatarUri: action.payload.avatarUrl || '',
      };
    case 'SET_DISPLAY_NAME':
      return { ...state, displayName: action.payload, error: null };
    case 'SET_ROLE':
      return { ...state, role: action.payload };
    case 'SET_AVATAR':
      return { ...state, avatarUri: action.payload };
    case 'START_SAVE':
      return { ...state, isSaving: true, error: null };
    case 'SAVE_SUCCESS':
      return { ...state, isSaving: false };
    case 'SAVE_FAILURE':
      return { ...state, isSaving: false, error: action.payload };
    case 'START_UPLOAD':
      return { ...state, isUploadingAvatar: true, error: null };
    case 'UPLOAD_SUCCESS':
      return { ...state, isUploadingAvatar: false, avatarUri: action.payload };
    case 'UPLOAD_FAILURE':
      return { ...state, isUploadingAvatar: false, error: action.payload };
    default:
      return state;
  }
}
