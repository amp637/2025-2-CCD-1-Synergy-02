import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * FCM 토큰을 가져오는 함수
 * @returns FCM 토큰 문자열 또는 null
 */
export const getFcmToken = async (): Promise<string | null> => {
  try {
    // 알림 권한 요청
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 권한이 없으면 요청
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // 권한이 거부된 경우
    if (finalStatus !== 'granted') {
      console.warn('알림 권한이 거부되었습니다.');
      return null;
    }

    // Android의 경우 채널 설정 필요
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // FCM 토큰 가져오기
    // projectId를 app.json의 extra.eas.projectId에서 가져오거나 명시적으로 지정
    let projectId: string | undefined;
    
    try {
      // expo-constants가 사용 가능한 경우에만 사용
      if (Constants && Constants.expoConfig) {
        projectId = Constants.expoConfig?.extra?.eas?.projectId;
      }
    } catch (e) {
      // Constants를 사용할 수 없는 경우 무시 (Expo Go에서는 정상)
      console.warn('Constants를 사용할 수 없습니다 (정상일 수 있음):', e);
    }
    
    // projectId가 있으면 명시적으로 전달, 없으면 기본값 사용 (Expo Go에서는 자동 감지)
    const tokenData = projectId && projectId !== 'your-project-id-here'
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const token = tokenData.data;
    console.log('FCM 토큰 받기 성공:', token);
    return token;
  } catch (error) {
    console.error('FCM 토큰 받기 실패:', error);
    return null;
  }
};

