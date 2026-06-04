import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Palette } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';

const SLIDES = [
  {
    title: 'Track Spending Without Stress',
    description: 'Organize transactions automatically and understand your financial habits.',
    image: require('../../assets/images/automatic_capture.png'),
  },
  {
    title: 'Make Smarter Money Decisions',
    description: 'Gain deeper financial insights with AI-powered analysis that helps you save more.',
    image: require('../../assets/images/smart_insights.png'),
  },
  {
    title: 'Tax Season Made Easier for You',
    description: 'Export organized income and expense records for personal or business tax filing',
    image: require('../../assets/images/dashboard_overview.png'),
  },
];

export default function ValuePropScreen() {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.5;
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push('/(onboarding)/account-creation');
    }
  };

  const handleSkip = () => {
    router.push('/(onboarding)/account-creation');
  };

  const slide = SLIDES[currentSlide];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.imageSection, { height: IMAGE_HEIGHT }]}>
        <Image source={slide.image} style={styles.image} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', theme.background]}
          style={styles.gradient}
          pointerEvents="none"
        />
      </View>
      <View style={styles.contentSection}>
        <View style={styles.textCard}>
          <Text style={[styles.title, { color: theme.onBackground }]}>
            {slide.title}
          </Text>
          <Text style={[styles.description, { color: theme.onBackground }]}>
            {slide.description}
          </Text>
          <View style={styles.pagination}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: index === currentSlide ? theme.primary : theme.outlineVariant },
                ]}
              />
            ))}
          </View>
        </View>
        <SafeAreaView style={styles.buttonSection}>
          <View style={styles.buttonsContainer}>
            <Button
              title={currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
              onPress={handleNext}
              style={styles.button}
            />
            <Button
              title="Skip"
              onPress={handleSkip}
              variant="outline"
              style={[styles.button, { borderColor: theme.primary }]}
            />
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageSection: {
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  contentSection: {
    flex: 1,
  },
  textCard: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 48,
  },
  title: {
    fontFamily: Typography.fonts.body,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  description: {
    fontFamily: Typography.fonts.body,
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing[6],

  },
  pagination: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  buttonSection: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonsContainer: {
    marginHorizontal: 24,
    gap: Spacing[4],
  },
  button: {
    width: '100%',
  },
});
