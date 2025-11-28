// 설치 필요 (Firebase SDK 사용 시):
// npx expo install @react-native-firebase/app @react-native-firebase/messaging
//
// 현재는 expo-notifications의 getDevicePushTokenAsync()를 사용하여
// Android에서 FCM 디바이스 토큰을 직접 받아옵니다.

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useAuthStore } from '../stores/authStore';

/**
 * 알림 권한 확인 및 요청
 * @returns 권한이 허용되었으면 true, 아니면 false
 */
export async function requestNotificationPermissionIfNeeded(): Promise<boolean> {
  try {
    console.log('[FCM Token] 알림 권한 확인 시작...');
    
    // 실제 기기에서만 동작
    if (!Device.isDevice) {
      console.warn('[FCM Token] ⚠️ 실제 기기에서만 푸시 알림을 사용할 수 있습니다.');
      return false;
    }

    // Android 알림 채널 설정
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('[FCM Token] ✅ Android 알림 채널 설정 완료');
    }

    // 현재 권한 상태 확인
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('[FCM Token] 현재 권한 상태:', existingStatus);
    
    let finalStatus = existingStatus;
    
    // 권한이 없으면 요청
    if (existingStatus !== 'granted') {
      console.log('[FCM Token] 알림 권한 요청 중...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('[FCM Token] 권한 요청 결과:', status);
    }
    
    if (finalStatus !== 'granted') {
      console.warn('[FCM Token] ⚠️ 푸시 알림 권한이 거부되었습니다.');
      return false;
    }
    
    console.log('[FCM Token] ✅ 알림 권한 허용됨');
    return true;
  } catch (error: any) {
    console.error('[FCM Token] ❌ 알림 권한 요청 중 오류:', error);
    return false;
  }
}

/**
 * FCM 디바이스 토큰 가져오기 및 저장
 * @returns FCM 토큰 문자열 또는 null
 */
export async function fetchAndStoreFcmToken(): Promise<string | null> {
  try {
    console.log('\n🔔 === FCM 토큰 발급 시작 ===');
    console.log('[FCM Token] 함수 호출 시간:', new Date().toISOString());
    
    // 1) 권한 확인/요청
    const hasPermission = await requestNotificationPermissionIfNeeded();
    if (!hasPermission) {
      console.warn('[FCM Token] ⚠️ 알림 권한이 없어 FCM 토큰을 가져올 수 없습니다.');
      return null;
    }
    
    // 2) FCM 디바이스 토큰 가져오기
    // Android에서는 getDevicePushTokenAsync()가 FCM 토큰을 반환합니다.
    // iOS에서는 APNS 토큰을 반환합니다.
    console.log('[FCM Token] 디바이스 푸시 토큰 요청 중...');
    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    
    if (!devicePushToken || !devicePushToken.data) {
      console.error('[FCM Token] ❌ 디바이스 푸시 토큰이 비어있습니다.');
      return null;
    }
    
    const token = devicePushToken.data;
    
    // 3) 토큰 정보 로깅
    console.log('[FCM Token] ✅ FCM 디바이스 토큰 발급 성공');
    console.log('[FCM Token] 토큰 앞 50자:', token.substring(0, 50) + '...');
    console.log('[FCM Token] 토큰 길이:', token.length);
    console.log('[FCM Token] 토큰 타입:', typeof token);
    console.log('[FCM Token] 플랫폼:', Platform.OS);
    
    // Android에서 FCM 토큰 형식 확인 (일반적으로 긴 문자열)
    if (Platform.OS === 'android') {
      // FCM 토큰은 보통 152자 정도의 문자열입니다
      if (token.length < 50) {
        console.warn('[FCM Token] ⚠️ 토큰 길이가 예상보다 짧습니다. FCM 토큰이 아닐 수 있습니다.');
      }
      // ExponentPushToken 형식이 아닌지 확인
      if (token.startsWith('ExponentPushToken')) {
        console.error('[FCM Token] ❌ 이 토큰은 Expo Push Token입니다! FCM 토큰이 아닙니다.');
        return null;
      }
    }
    
    // 4) 토큰을 useAuthStore에 저장
    console.log('[FCM Token] 토큰을 authStore에 저장 중...');
    useAuthStore.getState().setFcmToken(token);
    console.log('[FCM Token] ✅ 토큰 저장 완료');
    
    console.log('[FCM Token] ========================\n');
    return token;
  } catch (error: any) {
    console.error('\n❌ === FCM 토큰 발급 실패 ===');
    console.error('[FCM Token] 에러 발생 시간:', new Date().toISOString());
    console.error('[FCM Token] 에러 타입:', error.constructor.name);
    console.error('[FCM Token] 에러 메시지:', error.message);
    console.error('[FCM Token] 에러 스택:', error.stack);
    console.error('[FCM Token] ========================\n');
    return null;
  }
}

