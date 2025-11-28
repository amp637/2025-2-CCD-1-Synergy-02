import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import responsive from '../../utils/responsive';
import { useAuthStore } from '../../stores/authStore';
import { fetchAndStoreFcmToken } from '../../utils/fcmToken';

interface OnboardingWelcomeScreenProps {
  onStartPress?: () => void;
}

export default function OnboardingWelcomeScreen({ onStartPress }: OnboardingWelcomeScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  
  // [변경] 이전에는 Expo Push Token을 사용했지만, 이제는 FCM 디바이스 토큰을 사용합니다.
  // registerForPushNotificationsAsync 함수는 fcmToken.ts로 이동되었습니다.

  const handleStartPress = async () => {
    console.log('시작하기 버튼 클릭');
    
    if (isRequestingPermission) {
      console.log('이미 권한 요청 중...');
      return;
    }

    setIsRequestingPermission(true);

    try {
      // FCM 디바이스 토큰 요청 (fcmToken.ts의 fetchAndStoreFcmToken 사용)
      const fcmToken = await fetchAndStoreFcmToken();
      
      if (fcmToken) {
        console.log('[OnboardingWelcomeScreen] ✅ FCM 토큰 발급 및 저장 완료');
      } else {
        console.warn('[OnboardingWelcomeScreen] ⚠️ FCM 토큰 발급 실패 또는 권한 거부');
        Alert.alert(
          '알림 권한',
          '푸시 알림 권한이 거부되었습니다.\n설정에서 언제든 변경할 수 있습니다.',
          [{ text: '확인', style: 'default' }]
        );
      }
    } catch (error: any) {
      console.error('[OnboardingWelcomeScreen] ❌ FCM 토큰 요청 중 오류:', error);
      Alert.alert(
        '오류',
        '푸시 알림 설정 중 오류가 발생했습니다.\n앱은 정상적으로 사용할 수 있습니다.',
        [{ text: '확인', style: 'default' }]
      );
    } finally {
      setIsRequestingPermission(false);
      // 토큰 발급 성공/실패와 관계없이 다음 화면으로 이동
      onStartPress?.();
    }
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
        <TouchableOpacity 
          style={[styles.button, isRequestingPermission && styles.buttonDisabled]} 
          onPress={handleStartPress}
          disabled={isRequestingPermission}
        >
          <Text style={styles.buttonText}>
            {isRequestingPermission ? '권한 요청 중...' : '시작하기'}
          </Text>
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
  buttonDisabled: {
    backgroundColor: '#999999',
  },
});
