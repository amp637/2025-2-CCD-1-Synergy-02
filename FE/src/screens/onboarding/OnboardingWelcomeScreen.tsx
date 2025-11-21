import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import responsive from '../../utils/responsive';

interface OnboardingWelcomeScreenProps {
  onStartPress?: () => void;
}

export default function OnboardingWelcomeScreen({ onStartPress }: OnboardingWelcomeScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();

  const handleStartPress = () => {
    console.log('시작하기 버튼 클릭');
    onStartPress?.();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + responsive(80) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pageWrapper, { maxWidth: MAX_WIDTH }]}>
          <Image 
            source={require('../../../assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
            cachePolicy="disk"
            priority="high"
          />
          <Text style={styles.introText}>복약 자립{'\n'}복자와 함께</Text>
        </View>
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View style={[styles.submitButtonContainer, { bottom: insets.bottom + responsive(16) }]}>
        <TouchableOpacity style={styles.button} onPress={handleStartPress}>
          <Text style={styles.buttonText}>시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    paddingHorizontal: responsive(16),
    paddingTop: responsive(70),
    alignItems: 'center' as any,
    flexGrow: 1,
  },
  pageWrapper: {
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center' as any,
  },
  logo: {
    width: responsive(232),
    height: responsive(232),
    marginTop: responsive(100),
  },
  introText: {
    fontSize: responsive(24),
    fontWeight: '700' as '700',
    color: '#090a0a',
    textAlign: 'center',
    lineHeight: responsive(28.8),
    marginTop: responsive(24),
  },
  submitButtonContainer: {
    position: 'absolute' as any,
    left: responsive(16),
    right: responsive(16),
    alignItems: 'center' as any,
  },
  button: {
    width: '100%',
    maxWidth: responsive(360),
    height: responsive(66),
    borderRadius: responsive(200),
    backgroundColor: '#60584d',
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  buttonText: {
    fontSize: responsive(27),
    fontWeight: '700' as '700',
    color: '#ffffff',
  },
});
