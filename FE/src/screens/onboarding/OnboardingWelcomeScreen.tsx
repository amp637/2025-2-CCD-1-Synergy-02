import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import responsive from '../../utils/responsive';
import { useAuthStore } from '../../stores/authStore';

interface OnboardingWelcomeScreenProps {
  onStartPress?: () => void;
}

export default function OnboardingWelcomeScreen({ onStartPress }: OnboardingWelcomeScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const { setFcmToken } = useAuthStore();

  // FCM 푸시 토큰 등록 함수
  const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    let token: string | null = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('푸시 알림 권한이 거부되었습니다.');
        return null;
      }
      
      try {
        // Expo 푸시 토큰 발급 (Expo Go에서 사용)
        const pushTokenData = await Notifications.getExpoPushTokenAsync({
          projectId: '7c1b8b8e-4b5a-4b5a-8b5a-4b5a8b5a4b5a', // 실제 프로젝트 ID로 변경 필요
        });
        token = pushTokenData.data;
        console.log('Expo 푸시 토큰:', token);
      } catch (error) {
        console.log('Expo 푸시 토큰 발급 실패 (정상 - Fallback 진행):', error.message);
        
        // Expo 토큰 발급 실패 시 디바이스 푸시 토큰 시도
        try {
          const devicePushToken = await Notifications.getDevicePushTokenAsync();
          token = devicePushToken.data;
          console.log('디바이스 푸시 토큰:', token);
        } catch (deviceError) {
          console.error('디바이스 푸시 토큰 발급도 실패:', deviceError);
        }
      }
    } else {
      console.log('실제 기기에서만 푸시 알림을 사용할 수 있습니다.');
    }

    return token;
  };

  const handleStartPress = async () => {
    console.log('시작하기 버튼 클릭');
    
    if (isRequestingPermission) {
      console.log('이미 권한 요청 중...');
      return;
    }

    setIsRequestingPermission(true);

    try {
      // FCM 푸시 토큰 요청
      const fcmToken = await registerForPushNotificationsAsync();
      
      if (fcmToken) {
        console.log('✅ FCM 토큰 발급 성공:', fcmToken.substring(0, 50) + '...');
        setFcmToken(fcmToken);
      } else {
        console.log('⚠️ FCM 토큰 발급 실패 또는 권한 거부');
        Alert.alert(
          '알림 권한',
          '푸시 알림 권한이 거부되었습니다.\n설정에서 언제든 변경할 수 있습니다.',
          [{ text: '확인', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('FCM 토큰 요청 중 오류:', error);
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
