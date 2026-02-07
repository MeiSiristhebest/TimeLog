import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Share } from 'react-native';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { MOCK_FAMILY_MEMBERS, FAMILY_STRINGS } from '../data/mockFamilyData';
import { devLog } from '@/lib/devLogger';
import { createFamilyInvite, acceptFamilyInvite } from '@/features/family/services/inviteService';
import { setStoredRole } from '@/features/auth/services/roleStorage';
import {
  loadInspirationLibrary,
  submitQuestion,
  type QuestionCategory,
} from '@/features/family-listener/services/questionService';
import { useAuthStore } from '@/features/auth/store/authStore';

// Hook for Family Members Logic
import { getFamilyMembers, removeFamilyMember, FamilyMember } from '../services/familyService';

export function useFamilyMembersLogic() {
  // const theme = useHeritageTheme(); // Consumed in view
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFamilyMembers();
      setMembers(data);
    } catch (error) {
      devLog.error('[FamilyMembers] Failed to load members:', error);
      // Optionally show alert or silent fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleRemoveMember = useCallback((id: string, name: string) => {
    HeritageAlert.show({
      title: FAMILY_STRINGS.familyMembers.removeAlert.title,
      message: FAMILY_STRINGS.familyMembers.removeAlert.message.replace('{name}', name),
      variant: 'warning',
      primaryAction: {
        label: FAMILY_STRINGS.familyMembers.removeAlert.confirm,
        destructive: true,
        onPress: async () => {
          try {
            await removeFamilyMember(id);
            setMembers((prev) => prev.filter((m) => m.id !== id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            devLog.error('[FamilyMembers] Remove failed:', error);
            HeritageAlert.show({
              title: 'Error',
              message: 'Failed to remove family member.',
              variant: 'error',
            });
          }
        },
      },
      secondaryAction: { label: FAMILY_STRINGS.familyMembers.removeAlert.cancel },
    });
  }, []);

  return {
    state: {
      members,
      isLoading,
      scrollY,
    },
    actions: {
      handleRemoveMember,
      scrollHandler,
      refresh: loadMembers,
    },
  };
}

// Hook for Invite Logic
export function useInviteLogic() {
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleCreateInvite = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await createFamilyInvite(email);
      setInviteLink(result.inviteLink ?? null);
      HeritageAlert.show({
        title: FAMILY_STRINGS.invite.inviteReady.alertTitle,
        message: FAMILY_STRINGS.invite.inviteReady.alertMessage,
        variant: 'success',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : FAMILY_STRINGS.invite.errors.createFailed;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!inviteLink) return;
    try {
      await Share.share({
        message: FAMILY_STRINGS.invite.inviteReady.shareMessage.replace('{link}', inviteLink),
        url: inviteLink,
      });
    } catch {
      // User cancelled or share failed, ignore
    }
  };

  const handleOpen = async () => {
    if (!inviteLink) return;
    try {
      await Linking.openURL(inviteLink);
    } catch (err) {
      const message = err instanceof Error ? err.message : FAMILY_STRINGS.invite.errors.openFailed;
      HeritageAlert.show({
        title: FAMILY_STRINGS.invite.errors.alertTitle,
        message: message,
        variant: 'error',
      });
    }
  };

  const isSubmitDisabled = !email.trim() || loading;

  return {
    state: {
      email,
      inviteLink,
      loading,
      error,
      scrollY,
      isSubmitDisabled,
    },
    actions: {
      setEmail,
      handleCreateInvite,
      handleShare,
      handleOpen,
      scrollHandler,
    },
  };
}

// Hook for Accept Invite Logic
export function useAcceptInviteLogic() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const token = useMemo(() => {
    const value = params.token;
    return Array.isArray(value) ? value[0] : value;
  }, [params.token]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await acceptFamilyInvite(token);
      await setStoredRole('family');
      HeritageAlert.show({
        title: FAMILY_STRINGS.acceptInvite.success.title,
        message: FAMILY_STRINGS.acceptInvite.success.message,
        variant: 'success',
        primaryAction: {
          label: FAMILY_STRINGS.acceptInvite.buttons.continue,
          onPress: () => router.replace('/(tabs)'),
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : FAMILY_STRINGS.acceptInvite.errors.acceptFailed;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackHome = () => {
    router.replace('/(tabs)');
  };

  const missingToken = !token;

  return {
    state: {
      token,
      loading,
      error,
      missingToken,
    },
    actions: {
      handleAccept,
      handleBackHome,
    },
  };
}

// Hook for Ask Question Logic
export function useAskQuestionLogic() {
  const router = useRouter();
  const params = useLocalSearchParams<{ seniorUserId?: string }>();
  const sessionUserId = useAuthStore((state) => state.sessionUserId);

  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll Animation
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Load inspiration library
  useEffect(() => {
    async function loadLibrary() {
      const library = await loadInspirationLibrary();
      setCategories(library.categories);
      if (library.categories.length > 0) {
        setSelectedCategory(library.categories[0].id);
      }
    }
    loadLibrary();
  }, []);

  // Handle question selection
  const handleSelectQuestion = useCallback((question: string) => {
    setSelectedQuestion(question);
    setCustomQuestion(question);
  }, []);

  const suggestedQuestions = useMemo(() => {
    if (!selectedCategory) return [];
    return categories.find((c) => c.id === selectedCategory)?.questions ?? [];
  }, [categories, selectedCategory]);

  // Handle submission
  const handleSubmit = async () => {
    if (!customQuestion.trim()) {
      HeritageAlert.show({
        title: FAMILY_STRINGS.askQuestion.alerts.missing.title,
        message: FAMILY_STRINGS.askQuestion.alerts.missing.message,
        variant: 'warning',
      });
      return;
    }

    if (!params.seniorUserId || !sessionUserId) {
      HeritageAlert.show({
        title: FAMILY_STRINGS.askQuestion.alerts.missingUser.title,
        message: FAMILY_STRINGS.askQuestion.alerts.missingUser.message,
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitQuestion(customQuestion.trim(), params.seniorUserId, sessionUserId);
      HeritageAlert.show({
        title: FAMILY_STRINGS.askQuestion.alerts.success.title,
        message: FAMILY_STRINGS.askQuestion.alerts.success.message,
        variant: 'success',
        primaryAction: {
          label: FAMILY_STRINGS.askQuestion.alerts.success.button,
          onPress: () => router.back(),
        },
      });
    } catch (error) {
      devLog.error('[AskQuestionScreen] Failed to submit question:', error);
      HeritageAlert.show({
        title: FAMILY_STRINGS.askQuestion.alerts.error.title,
        message: FAMILY_STRINGS.askQuestion.alerts.error.message,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    state: {
      categories,
      selectedCategory,
      selectedQuestion,
      customQuestion,
      isSubmitting,
      scrollY,
      suggestedQuestions,
    },
    actions: {
      setSelectedCategory,
      setCustomQuestion,
      scrollHandler,
      handleSelectQuestion,
      handleSubmit,
    },
  };
}
