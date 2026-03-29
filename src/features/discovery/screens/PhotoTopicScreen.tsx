import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { AppText } from '@/components/ui/AppText';
import { useHeritageTheme } from '@/theme/heritage';
import { supabase } from '@/lib/supabase';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { EN_COPY } from '@/features/app/copy/en';

interface AnalyzeResponse {
  questions: string[];
}

export default function PhotoTopicScreen() {
  const { colors } = useHeritageTheme();
  const router = useRouter();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64);
        setQuestions([]); // reset
      }
    } catch (e) {
      Alert.alert(EN_COPY.photoToTopic.errorGallery, '');
    }
  };

  const handleAnalyze = async () => {
    if (!imageBase64) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke<AnalyzeResponse>('analyze-photo', {
        body: {
          base64Image: imageBase64,
          mimeType: 'image/jpeg',
          language: 'en-US',
        },
      });

      if (error) throw error;
      if (data?.questions) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(EN_COPY.photoToTopic.errorAnalysis, 'Please try again later');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectQuestion = (question: string) => {
    router.replace({
      pathname: '/',
      params: {
        topicId: `photo_${Date.now()}`,
        topicText: question,
        topicCategory: 'custom',
        topicFamily: '0',
      },
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.surfaceDim }} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-2">
          <Ionicons name="close" size={28} color={colors.textMuted} />
        </Pressable>
        <AppText variant="title" className="font-serif" style={{ color: colors.onSurface }}>{EN_COPY.photoToTopic.title}</AppText>
        <View className="w-11" />
      </View>

      <View className="flex-1 p-6 items-center">
        {/* Image Preview Area */}
        <Pressable 
          onPress={handlePickImage} 
          className="w-full aspect-square rounded-3xl border-2 border-dashed overflow-hidden justify-center items-center mb-6"
          style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="w-full h-full" contentFit="cover" />
          ) : (
            <View className="items-center gap-3">
              <Ionicons name="image-outline" size={48} color={colors.primaryMuted} />
              <AppText className="text-base font-medium" style={{ color: colors.textMuted }}>
                {EN_COPY.photoToTopic.selectPhoto}
              </AppText>
            </View>
          )}
        </Pressable>

        {/* Action Button */}
        {imageUri && questions.length === 0 && !isAnalyzing && (
          <Pressable
            className="flex-row items-center gap-2 px-8 py-4 rounded-full shadow-lg"
            style={{ backgroundColor: colors.primary }}
            onPress={handleAnalyze}
          >
            <Ionicons name="sparkles" size={20} color={colors.onPrimary} />
            <AppText className="text-lg font-bold" style={{ color: colors.onPrimary }}>
              {EN_COPY.photoToTopic.analyze}
            </AppText>
          </Pressable>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <View className="items-center gap-4 mt-6">
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText className="text-base" style={{ color: colors.textMuted }}>
              {EN_COPY.photoToTopic.processing}
            </AppText>
          </View>
        )}

        {/* Results */}
        {questions.length > 0 && (
          <View className="w-full gap-3">
            <AppText className="text-base font-semibold mb-2" style={{ color: colors.onSurface }}>
              {EN_COPY.photoToTopic.selectTopic}
            </AppText>
            {questions.map((q, idx) => (
              <QuestionCard 
                key={idx} 
                question={q} 
                onPress={() => handleSelectQuestion(q)} 
                colors={colors}
              />
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function QuestionCard({ 
  question, 
  onPress, 
  colors 
}: { 
  question: string; 
  onPress: () => void;
  colors: any;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.96); }}
      onPressOut={() => { scale.value = withSpring(1); }}
    >
      <Animated.View 
        className="flex-row items-center p-5 rounded-2xl border gap-4"
        style={[
          { backgroundColor: colors.surface, borderColor: colors.border },
          animatedStyle
        ]}>
        <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} className="opacity-80" />
        <AppText className="flex-1 text-[17px] font-medium leading-6" style={{ color: colors.onSurface }}>
          {question}
        </AppText>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Animated.View>
    </Pressable>
  );
}


