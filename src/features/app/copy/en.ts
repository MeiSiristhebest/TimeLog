type StoryCategory =
  | 'childhood'
  | 'family'
  | 'career'
  | 'education'
  | 'memories'
  | 'history'
  | 'wisdom'
  | 'travel'
  | 'celebrations'
  | 'hobbies'
  | 'food'
  | 'friendship';

export const EN_COPY = {
  common: {
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    done: 'Done',
  },
  pickers: {
    selectTime: 'Select Time',
    selectBirthday: 'Select Birthday',
    confirmTimeSelectionA11y: 'Confirm time selection',
    timePickerA11yPrefix: 'Time picker',
    datePickerA11yPrefix: 'Date picker',
  },
  story: {
    storyWord: 'Story',
    untitled: 'Untitled Story',
    notFound: 'Story not found',
    goBack: 'Go Back',
    deleteFailed: 'Delete failed, please try again',
    restoreFailed: 'Restore failed, please try again',
    transcriptUnavailable: 'Transcript not available yet for this story.',
    detailsTitle: 'Story Details',
    detailDuration: 'Duration',
    detailFileSize: 'File Size',
    detailBackup: 'Backup',
    unitSeconds: 'seconds',
    unitKb: 'KB',
    backupCloudSaved: 'Cloud saved ✓',
    backupLocalOnly: 'Local only',
    readOnlyPreview: 'Read-Only Preview',
    editStory: 'Edit Story',
    speakerYou: 'You',
    speakerAi: 'AI',
    speakerTranscript: 'Transcript',
  },
  timeCapsule: {
    label: 'Time Capsule',
    memories: 'Time Memories',
    exportTitle: 'Export Time Capsule Memoir',
    unlocksOn: 'Unlocks on',
    description: 'This is a Time Capsule. It will unlock on',
    changeDate: 'Change Date',
    setDate: 'Set Unlock Date',
    seal: 'Seal Capsule',
    saveFailed: 'Failed to save Time Capsule settings',
  },
  photoToTopic: {
    title: 'Photo to Topic',
    selectPhoto: 'Tap here to select an old photo',
    selectTopic: 'Select a topic to start your story:',
    analyze: 'Analyze Photo',
    processing: 'Processing memories...',
    errorGallery: 'Could not open gallery',
    errorAnalysis: 'Analysis failed, please try again',
  },
  comments: {
    familyComments: 'Family Comments',
    comments: 'Comments',
    cannotLoadStory: 'Cannot load story',
    loadingComments: 'Loading comments...',
    emptyTitle: 'No comments yet',
    emptyReadOnlyDescription: "Family hasn't left any comments yet",
    emptyDescription: 'Be the first to comment!',
  },
  storySaved: {
    successTitle: 'Story Kept Safe.',
    successSubtitle: 'Saving to your library...',
    defaultStoryTitle: 'My Childhood Joy',
    defaultCaption: 'My Story',
    categoryLabels: {
      childhood: 'My Childhood',
      family: 'My Family',
      career: 'My Career',
      education: 'My Education',
      memories: 'My Memories',
      history: 'My History',
      wisdom: 'My Wisdom',
      travel: 'My Travel',
      celebrations: 'My Celebration',
      hobbies: 'My Hobbies',
      food: 'My Food',
      friendship: 'My Friends',
    } satisfies Record<StoryCategory, string>,
  },
} as const;

export function formatCommentsButtonLabel(commentCount: number): string {
  return commentCount > 0
    ? `${EN_COPY.comments.comments} (${commentCount})`
    : EN_COPY.comments.comments;
}

export function getStorySavedCategoryLabel(category?: string): string {
  if (!category) {
    return EN_COPY.storySaved.defaultCaption;
  }

  const labels = EN_COPY.storySaved.categoryLabels as Record<string, string>;
  return labels[category] ?? EN_COPY.storySaved.defaultCaption;
}

export function formatPickerA11yLabel(prefix: string, title: string): string {
  return `${prefix}: ${title}`;
}
