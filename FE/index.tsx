// Bridgeless mode 비활성화를 위한 환경 변수 설정 (가장 먼저 실행)
if (typeof global !== 'undefined') {
  // New Architecture 비활성화
  global.__turboModuleProxy = null;
  // TurboModule interop 활성화
  if (!global.nativeModuleProxy) {
    global.nativeModuleProxy = global;
  }
}

import { registerRootComponent } from 'expo';
import App from './App';

// 백그라운드 핸들러 등록
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { scheduleDailyEvents } from './src/push/backgroundHandler';

// 1. FCM 백그라운드 메시지 핸들러 (앱이 꺼져있을 때 실행됨)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[index] FCM Background Message:', remoteMessage);
  const data = remoteMessage.data;

  if (data && data.eventData) {
    try {
      // 1. 데이터 파싱
      const eventString = data.eventData as string;
      const eventObj = JSON.parse(eventString);
      
      // 2. 알림 예약 실행 (백엔드 키 이름이 'events'인지 'event_list'인지 꼭 확인하세요!)
      // 아까 로그에서는 'events' 였습니다.
      const events = eventObj.events || eventObj.event_list; 
      
      if (events) {
        await scheduleDailyEvents(events);
      } else {
        console.log('[index] 이벤트 리스트가 없습니다.');
      }
      
    } catch (e) {
      console.error('[index] Parsing Error:', e);
    }
  }
});

// 2. Notifee 백그라운드 이벤트 핸들러 (알림 동작 처리)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  console.log('[index] Notifee Background Event:', type, detail);

  // 알림 클릭(PRESS) 시 처리
  if (type === EventType.PRESS && pressAction?.id === 'default') {
    console.log('[index] 알림 클릭됨 (백그라운드)');
    // 사용자가 알림을 누르면 앱이 켜지면서 App.tsx의 getInitialNotification이 처리합니다.
  }
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);