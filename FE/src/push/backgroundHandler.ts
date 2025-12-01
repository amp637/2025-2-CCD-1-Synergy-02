// 설치 필요:
// npx expo install @react-native-firebase/messaging
// npm install @notifee/react-native

import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import notifee, { AndroidImportance, AndroidCategory, EventType } from '@notifee/react-native';
import { api } from '../api/api';
import { BaseResponse } from '../api/types';

// 복약 시간 타입 정의
interface MedicationTime {
  utno: number;
  tno: number;
  type: 'breakfast' | 'lunch' | 'dinner' | 'bedtime';
  time: number; // 시간 (0-23)
}

// API 응답 타입
interface MedicationTimesResponse {
  header: {
    resultCode: number;
    resultMsg: string;
  };
  body: MedicationTime[];
}

// 알림 채널 ID
const MEDICATION_CHANNEL_ID = 'medication';
const NOTIFEE_ALARM_CHANNEL_ID = 'alarm';

/**
 * Android 알림 채널 생성 (Expo Notifications용)
 */
async function createNotificationChannel() {
  try {
    await Notifications.setNotificationChannelAsync(MEDICATION_CHANNEL_ID, {
      name: '복약 알림',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    console.log('[BackgroundHandler] ✅ Expo 알림 채널 생성 완료:', MEDICATION_CHANNEL_ID);
  } catch (error: any) {
    console.error('[BackgroundHandler] ❌ Expo 알림 채널 생성 실패:', error);
  }
}

/**
 * Notifee 알림 채널 생성 (풀스크린 인텐트용)
 */
async function createNotifeeAlarmChannel() {
  try {
    await notifee.createChannel({
      id: NOTIFEE_ALARM_CHANNEL_ID,
      name: 'Medicine Alarm',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [0, 250, 250, 250],
    });
    console.log('[BackgroundHandler] ✅ Notifee 알림 채널 생성 완료:', NOTIFEE_ALARM_CHANNEL_ID);
  } catch (error: any) {
    console.error('[BackgroundHandler] ❌ Notifee 알림 채널 생성 실패:', error);
  }
}

/**
 * type을 한글로 변환
 */
function getTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
    bedtime: '취침',
  };
  return typeMap[type] || type;
}

/**
 * 오늘 날짜 기준으로 알림 시각 계산
 * 이미 지난 시간이면 다음날로 설정
 */
function calculateTriggerDate(hour: number): Date {
  const now = new Date();
  const triggerDate = new Date();
  
  // 오늘 날짜로 설정
  triggerDate.setHours(hour, 0, 0, 0);
  
  // 이미 지난 시간이면 다음날로 설정
  if (triggerDate.getTime() <= now.getTime()) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }
  
  return triggerDate;
}

/**
 * 복약 시간 알림 예약
 */
async function scheduleMedicationNotifications(medicationTimes: MedicationTime[]) {
  try {
    console.log('[BackgroundHandler] 📅 알림 예약 시작...');
    console.log('[BackgroundHandler] 예약할 알림 개수:', medicationTimes.length);
    
    // 기존 알림 모두 취소 (중복 방지)
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[BackgroundHandler] 기존 알림 모두 취소 완료');
    
    // 각 복약 시간에 대해 알림 예약
    const notificationPromises = medicationTimes.map(async (medTime, index) => {
      try {
        const triggerDate = calculateTriggerDate(medTime.time);
        const typeLabel = getTypeLabel(medTime.type);
        
        console.log(`[BackgroundHandler] 알림 ${index + 1}/${medicationTimes.length}:`);
        console.log(`  - 타입: ${medTime.type} (${typeLabel})`);
        console.log(`  - 시간: ${medTime.time}시`);
        console.log(`  - 예약 시각: ${triggerDate.toLocaleString('ko-KR')}`);
        
        await Notifications.scheduleNotificationAsync({
          identifier: `medication-${medTime.utno}-${medTime.tno}`,
          content: {
            title: '복약 알림',
            body: `${typeLabel} 복약 시간이에요!`,
            sound: true,
            data: {
              type: medTime.type,
              utno: medTime.utno,
              tno: medTime.tno,
            },
          },
          trigger: {
            date: triggerDate,
            channelId: MEDICATION_CHANNEL_ID,
          },
        });
        
        console.log(`[BackgroundHandler] ✅ 알림 예약 완료: ${typeLabel} ${medTime.time}시`);
      } catch (error: any) {
        console.error(`[BackgroundHandler] ❌ 알림 예약 실패 (${medTime.type} ${medTime.time}시):`, error);
      }
    });
    
    await Promise.all(notificationPromises);
    console.log('[BackgroundHandler] ✅ 모든 알림 예약 완료');
  } catch (error: any) {
    console.error('[BackgroundHandler] ❌ 알림 예약 중 오류:', error);
  }
}

/**
 * 백엔드 API 호출: GET /users/me/medication-times
 * 
 * 백엔드 API는 type query parameter를 받습니다.
 * 모든 복약 시간을 조회하기 위해 각 타입별로 호출합니다.
 */
async function fetchMedicationTimes(): Promise<MedicationTime[]> {
  try {
    console.log('[BackgroundHandler] 📡 API 호출 시작: GET /users/me/medication-times');
    
    // 모든 타입에 대해 병렬로 호출
    const types: Array<'breakfast' | 'lunch' | 'dinner' | 'bedtime'> = ['breakfast', 'lunch', 'dinner', 'bedtime'];
    
    console.log('[BackgroundHandler] 조회할 타입:', types.join(', '));
    
    const promises = types.map(async (type) => {
      try {
        const response = await api.get<BaseResponse<MedicationTime[]>>(`/users/me/medication-times?type=${type}`);
        if (response.data.header?.resultCode === 1000 && response.data.body) {
          return response.data.body;
        }
        return [];
      } catch (error: any) {
        console.error(`[BackgroundHandler] ⚠️ ${type} 타입 조회 실패:`, error.message);
        return [];
      }
    });
    
    const results = await Promise.all(promises);
    const allMedicationTimes = results.flat();
    
    console.log('[BackgroundHandler] 📡 모든 API 호출 완료');
    console.log('[BackgroundHandler] 조회된 복약 시간 개수:', allMedicationTimes.length);
    
    if (allMedicationTimes.length > 0) {
      console.log('[BackgroundHandler] ✅ 복약 시간 조회 성공');
      console.log('[BackgroundHandler] 조회된 복약 시간:', JSON.stringify(allMedicationTimes, null, 2));
    } else {
      console.warn('[BackgroundHandler] ⚠️ 조회된 복약 시간이 없습니다.');
    }
    
    return allMedicationTimes;
  } catch (error: any) {
    console.error('[BackgroundHandler] ❌ API 호출 실패');
    console.error('[BackgroundHandler] 에러 타입:', error.constructor.name);
    console.error('[BackgroundHandler] 에러 메시지:', error.message);
    
    if (error.response) {
      console.error('[BackgroundHandler] 응답 상태:', error.response.status);
      console.error('[BackgroundHandler] 응답 데이터:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('[BackgroundHandler] 네트워크 에러: 요청은 보냈지만 응답을 받지 못함');
    }
    
    return [];
  }
}

/**
 * FCM 백그라운드 메시지 핸들러
 */
async function handleBackgroundMessage(remoteMessage: any) {
  try {
    console.log('\n🔔 === FCM 백그라운드 메시지 수신 ===');
    console.log('[BackgroundHandler] 메시지 ID:', remoteMessage.messageId);
    console.log('[BackgroundHandler] 메시지 데이터:', JSON.stringify(remoteMessage.data, null, 2));
    console.log('[BackgroundHandler] 메시지 수신 시간:', new Date().toISOString());
    
    // SYNC_MEDICATION_TIMES 타입만 처리
    if (remoteMessage.data?.type !== 'SYNC_MEDICATION_TIMES') {
      console.log('[BackgroundHandler] ⏭️ 처리하지 않는 메시지 타입:', remoteMessage.data?.type);
      console.log('[BackgroundHandler] 기대하는 타입: SYNC_MEDICATION_TIMES');
      return;
    }
    
    console.log('[BackgroundHandler] ✅ SYNC_MEDICATION_TIMES 메시지 감지');
    
    // 1. 알림 채널 생성 (Expo Notifications 및 Notifee)
    await createNotificationChannel();
    await createNotifeeAlarmChannel();
    
    // 2. 백엔드 API 호출하여 복약 시간 조회
    const medicationTimes = await fetchMedicationTimes();
    
    if (medicationTimes.length === 0) {
      console.warn('[BackgroundHandler] ⚠️ 조회된 복약 시간이 없습니다.');
      return;
    }
    
    // 3. 알림 예약
    await scheduleMedicationNotifications(medicationTimes);
    
    console.log('[BackgroundHandler] ✅ 백그라운드 메시지 처리 완료');
    console.log('=====================================\n');
  } catch (error: any) {
    console.error('\n❌ === FCM 백그라운드 메시지 처리 실패 ===');
    console.error('[BackgroundHandler] 에러 타입:', error.constructor.name);
    console.error('[BackgroundHandler] 에러 메시지:', error.message);
    console.error('[BackgroundHandler] 에러 스택:', error.stack);
    console.error('=====================================\n');
  }
}

// FCM 백그라운드 메시지 핸들러 등록
messaging().setBackgroundMessageHandler(handleBackgroundMessage);

// Notifee 백그라운드 이벤트 핸들러 등록
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('[BackgroundHandler] Notifee 백그라운드 이벤트:', type, detail);
  
  if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
    const route = detail.notification?.data?.route;
    if (route && typeof route === 'string') {
      console.log('[BackgroundHandler] 백그라운드 알림 클릭 - 라우팅 예정:', route);
      // 백그라운드에서는 직접 라우팅할 수 없으므로,
      // 앱이 포그라운드로 올 때 App.tsx의 리스너에서 처리됨
    }
  }
});

console.log('[BackgroundHandler] ✅ FCM 백그라운드 메시지 핸들러 등록 완료');
console.log('[BackgroundHandler] ✅ Notifee 백그라운드 이벤트 핸들러 등록 완료');

