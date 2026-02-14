import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Reanimated from 'react-native-reanimated';

const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);
const AnimatedView = Reanimated.createAnimatedComponent(View);
const AnimatedText = Reanimated.createAnimatedComponent(Text);
const AnimatedScrollView = Reanimated.createAnimatedComponent(ScrollView);
const AnimatedTextInput = Reanimated.createAnimatedComponent(TextInput);
const AnimatedFlatList = Reanimated.FlatList;

export const Animated = {
  View: AnimatedView,
  Text: AnimatedText,
  Pressable: AnimatedPressable,
  ScrollView: AnimatedScrollView,
  TextInput: AnimatedTextInput,
  FlatList: AnimatedFlatList,
  createAnimatedComponent: Reanimated.createAnimatedComponent,
} as const;
