import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Automatic Capture',
    description: 'No more manual entries. We capture your transactions from bank alerts automatically.',
    image: require('../../assets/images/automatic_capture.png'),
  },
  {
    title: 'Smart Insights',
    description: 'Understand your spending habits with AI-powered insights tailored just for you.',
    image: require('../../assets/images/smart_insights.png'),
  },
  {
    title: 'Everything in One Place',
    description: 'All your bank accounts, cash, and expenses in one beautiful, unified dashboard.',
    image: require('../../assets/images/dashboard_overview.png'),
  }
];

export default function ValuePropScreen() {
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

  const slide = SLIDES[currentSlide];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image 
            source={slide.image} 
            style={styles.image} 
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.onBackground }]}>
            {slide.title}
          </Text>
          <Text style={[styles.description, { color: theme.outline }]}>
            {slide.description}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {SLIDES.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.dot, 
                  { backgroundColor: index === currentSlide ? theme.primary : theme.outlineVariant }
                ]} 
              />
            ))}
          </View>

          <Button 
            title={currentSlide === SLIDES.length - 1 ? "Get Started" : "Continue"} 
            onPress={handleNext}
            style={styles.button}
          />
          
          {currentSlide < SLIDES.length - 1 && (
            <TouchableOpacity 
              onPress={() => router.push('/(onboarding)/account-creation')}
              style={styles.skipBtn}
            >
              <Text style={[styles.skipText, { color: theme.outline }]}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing[6],
    justifyContent: 'space-between',
  },
  imageContainer: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing[4],
  },
  description: {
    fontFamily: Typography.fonts.body,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing[4],
  },
  footer: {
    marginTop: Spacing[8],
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing[8],
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: '100%',
  },
  skipBtn: {
    marginTop: Spacing[4],
    alignItems: 'center',
  },
  skipText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    fontWeight: '500',
  },
});
