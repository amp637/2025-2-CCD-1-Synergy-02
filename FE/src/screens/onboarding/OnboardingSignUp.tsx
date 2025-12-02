import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Rect } from 'react-native-svg';
import responsive from '../../utils/responsive';
import { signUp, login } from '../../api/authApi';
import { useUserStore } from '../../stores/userStore';
import { useAuthStore } from '../../stores/authStore';
import { fetchAndStoreFcmToken } from '../../utils/fcmToken';

interface OnboardingSignUpProps {
  onSignUpComplete?: (isLogin?: boolean) => void; // isLogin: true면 로그인, false면 회원가입
}

export default function OnboardingSignUp({ onSignUpComplete }: OnboardingSignUpProps) {
  // App.tsx에서 직접 사용되는 경우를 대비해 onSignUpComplete 콜백만 사용
  // NavigationContainer 안에서 사용되는 경우에도 콜백을 통해 화면 전환 처리
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [isLoading, setIsLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();

  // 연도 목록 생성 (현재 년도부터 100년 전까지)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // 월 목록 (1-12)
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 선택된 년/월에 따른 일 수 계산
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1
  );

  const handleSubmit = async () => {
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    const startTime = Date.now(); // 시작 시간 기록
    
    try {
      console.log('회원가입 시작...');
      
      // AuthStore에서 FCM 토큰 가져오기
      let { fcmToken } = useAuthStore.getState();
      
      console.log('\n🔍 === FCM 토큰 상태 확인 ===');
      console.log('📍 FCM 토큰 (초기):', fcmToken ? fcmToken.substring(0, 50) + '...' : '없음');
      console.log('📍 토큰 길이:', fcmToken ? fcmToken.length : 0);
      console.log('📍 토큰 타입:', typeof fcmToken);
      
      // FCM 토큰이 없으면 마지막으로 한번 더 시도
      if (!fcmToken) {
        console.log('[OnboardingSignUp] ⚠️ FCM 토큰이 없습니다. 토큰 발급 재시도...');
        const newToken = await fetchAndStoreFcmToken();
        if (newToken) {
          fcmToken = newToken;
          console.log('[OnboardingSignUp] ✅ FCM 토큰 재발급 성공');
        } else {
          console.warn('[OnboardingSignUp] ⚠️ FCM 토큰 재발급 실패. 빈 문자열로 전송합니다.');
        }
      }
      
      console.log('📍 FCM 토큰 (최종):', fcmToken ? fcmToken.substring(0, 50) + '...' : '없음');
      console.log('========================\n');

      // 회원가입 API 호출
      console.log('회원가입 API 호출 중...');
      
      // 🔥 phone과 birth 형식 정규화 (백엔드 요구사항에 맞춤)
      // phone: 하이픈 제거 (숫자만)
      const normalizedPhone = phone.trim().replace(/-/g, '');
      
      // birth: YYYY-MM-DD 형식 강제
      const normalizedBirth = birthdate.trim();
      
      // 생년월일 형식 검증
      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedBirth)) {
        throw new Error('생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD 형식이어야 합니다)');
      }
      
      console.log('회원가입 데이터 (정규화 전):', { name: name.trim(), phone: phone.trim(), birth: birthdate.trim() });
      console.log('회원가입 데이터 (정규화 후):', { name: name.trim(), phone: normalizedPhone, birth: normalizedBirth });
      
      // 백엔드 스펙에 맞게 필드명 정확히 매칭
      // 필드명: name, birth, phone, fcm_token
      const signUpData: any = {};
      signUpData.name = name.trim();
      signUpData.birth = normalizedBirth; // YYYY-MM-DD 형식
      signUpData.phone = normalizedPhone; // 백엔드 스펙: call (하이픈 제거된 전화번호)
      signUpData.fcmToken = fcmToken || ''; // 백엔드 스펙: fcm (FCM 디바이스 토큰)

      // fcm_token이 null이면 요청하지 않음
//       if (fcmToken) {
//         signUpData.fcmToken = fcmToken;
//       }

      // 테스트용 로그 (회원가입 버튼 클릭 시 최종 요청 데이터 확인)
      console.log('\n📤 === 회원가입 요청 준비 ===');
      console.log('[SignUp] 최종 요청 데이터:', JSON.stringify(signUpData, null, 2));
      console.log('[SignUp] fcm_token length:', signUpData.fcm_token?.length || 0);
      console.log('📍 요청 시간:', new Date().toISOString());
      console.log('📍 요청 URL: POST http://15.165.38.252:8080/users');
      console.log('📍 요청 데이터 (정렬):', JSON.stringify(signUpData, ['name', 'birth', 'phone', 'fcmToken'], 2));
      if (signUpData.fcmToken) {
        console.log('📍 fcmToken 길이:', signUpData.fcmToken.length);
        console.log('📍 fcmToken 앞 50자:', signUpData.fcmToken.substring(0, 50) + '...');

     
//       if (signUpData.fcmToken) {
//         console.log('📍 fcmToken 길이:', signUpData.fcmToken.length);
//         console.log('📍 fcmToken 앞 50자:', signUpData.fcmToken.substring(0, 50) + '...');
//       } else {
//         console.log('📍 fcmToken: 없음 (요청에 포함되지 않음)');

      }
      console.log('========================\n');

      console.log('🚀 signUp API 호출 시작...');
      
      const response = await signUp(signUpData);
      
      const endTime = Date.now();
      console.log('\n✅ === 회원가입 응답 수신 ===');
      console.log('📍 응답 시간:', new Date().toISOString());
      console.log('📍 소요 시간:', (endTime - startTime) + 'ms');
      console.log('📍 응답 타입:', typeof response);
      console.log('📍 응답 구조:', Object.keys(response || {}));
      console.log('📍 응답 전체:', JSON.stringify(response, null, 2));
      console.log('========================\n');
      
      // 백엔드 응답 형식: { header: { resultCode: 1000, resultMsg: "회원가입 성공" }, body: { uno: ... } }
      console.log('🔍 응답 검증 중...');
      console.log('response.header:', response.header);
      console.log('response.body:', response.body);
      console.log('resultCode:', response.header?.resultCode);
      console.log('resultCode 타입:', typeof response.header?.resultCode);
      
      if (response.header?.resultCode === 1000 && response.body) {
        console.log('✅ 회원가입 성공 조건 만족!');
        
        // Store에 사용자 정보 저장 (정규화된 값으로 저장)
        const uno = response.body.uno;
        if (uno) {
          // 🔥 정규화된 값으로 저장 (call은 하이픈 제거된 값)
          useUserStore.getState().setUserFromApi(
            uno,
            name.trim(),
            normalizedPhone, // 정규화된 전화번호 (하이픈 제거) - call 필드로 전송됨
            normalizedBirth  // 정규화된 생년월일
          );
            console.log('[OnboardingSignUp] 사용자 정보 저장 완료:', { uno, name: name.trim(), phone: normalizedPhone, birth: normalizedBirth });
        }
        
        // 토큰 저장 확인
        console.log('🔍 토큰 저장 상태 확인 중...');
        const savedToken = useAuthStore.getState().token;
        console.log('저장된 토큰:', savedToken ? savedToken.substring(0, 30) + '...' : '없음');
        
        if (!savedToken) {
          console.error('[OnboardingSignUp] ⚠️ 회원가입 후 토큰이 저장되지 않았습니다!');
          // 토큰이 없어도 일단 진행해보자 (디버깅용)
          console.warn('토큰 없이 진행합니다...');
        }
        
        // JWT 토큰은 응답 헤더의 Authorization에 포함됩니다 (interceptor에서 자동 저장)
        // 성공 시 알림 없이 바로 다음 화면으로 이동
        console.log('🎯 회원가입 완료! 다음 화면으로 이동...');
        setIsLoading(false);
        onSignUpComplete?.(false); // false = 회원가입 성공
      } else {
        // 응답은 받았지만 resultCode가 1000이 아닌 경우
        console.error('❌ 회원가입 실패 - resultCode가 1000이 아님');
        console.error('실제 resultCode:', response.header?.resultCode);
        console.error('resultMsg:', response.header?.resultMsg);
        console.error('전체 응답:', response);
        throw new Error(response.header?.resultMsg || '회원가입에 실패했습니다.');
      }
    } catch (error: any) {
      const errorTime = Date.now();
      console.error('\n❌ === 회원가입 최종 에러 ===');
      console.error('📍 에러 시간:', new Date().toISOString());
      console.error('📍 소요 시간:', (errorTime - startTime) + 'ms');
      console.error('📍 에러 메시지:', error.message);
      console.error('📍 에러 코드:', error.code);
      console.error('📍 에러 타입:', error.constructor.name);
      
      if (error.response) {
        console.error('📍 서버 응답 에러:');
        console.error('  - 상태:', error.response.status, error.response.statusText);
        console.error('  - 데이터:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('📍 네트워크 에러 (응답 없음):');
        console.error('  - 요청 URL:', 'http://15.165.38.252:8080/users');
        if (error.code === 'ECONNABORTED') {
          console.error('  - 타임아웃: 30초 내에 응답이 없었습니다');
        } else if (error.code === 'NETWORK_ERROR') {
          console.error('  - 네트워크 연결 실패');
        }
      } else {
        console.error('📍 기타 에러:', error.message);
      }
      console.error('========================\n');
      
      // 409 Conflict 에러 처리 (이미 가입한 사용자) - 자동 로그인 시도
      if (error.response?.status === 409 || error.response?.data?.header?.resultCode === 2001) {
        console.log('=== 이미 가입된 사용자 감지, 자동 로그인 시도 ===');
        console.log('회원가입 실패 이유: 이미 가입된 사용자');
        
        try {
          // 자동 로그인 시도
          // 🔥 phone과 birth 형식 정규화 (백엔드 요구사항에 맞춤)
          // phone: 하이픈 제거 (숫자만)
          const normalizedPhone = phone.trim().replace(/-/g, '');
          
          // birth: YYYY-MM-DD 형식 강제
          const normalizedBirth = birthdate.trim();
          
          // 생년월일 형식 검증
          if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedBirth)) {
            throw new Error('생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD 형식이어야 합니다)');
          }
          
          const loginData = {
            name: name.trim(),
            phone: normalizedPhone, // 하이픈 제거된 전화번호
            birth: normalizedBirth, // YYYY-MM-DD 형식
          };
          
          console.log('[OnboardingSignUp] 자동 로그인 API 호출 시작...');
          console.log('[OnboardingSignUp] 정규화된 로그인 데이터:', loginData);
          
          const loginResponse = await login(loginData);
          
          console.log('[OnboardingSignUp] 자동 로그인 API 응답:', loginResponse);
          
          if (loginResponse.header?.resultCode === 1000 && loginResponse.body) {
            console.log('✅ 자동 로그인 성공:', loginResponse);
            
            // 🔥 Bearer 토큰이 Response Interceptor에서 자동으로 저장되었는지 확인
            const savedToken = useAuthStore.getState().token;
            const savedUno = useAuthStore.getState().uno;
            
            console.log('[OnboardingSignUp] === Bearer 토큰 저장 확인 ===');
            console.log('[OnboardingSignUp] 저장된 토큰:', savedToken ? savedToken.substring(0, 30) + '...' : '없음');
            console.log('[OnboardingSignUp] 저장된 uno:', savedUno);
            
            // ⚠️ 토큰이 없으면 절대 성공 처리하면 안 됨
            if (!savedToken) {
              console.error('[OnboardingSignUp] ❌ 토큰이 저장되지 않았습니다! 로그인 실패 처리');
              throw new Error('토큰 저장 실패: 로그인에 실패했습니다.');
            }
            
            // 응답 body의 uno와 저장된 uno가 일치하는지 확인
            const responseUno = loginResponse.body.uno;
            if (savedUno && savedUno !== responseUno) {
              console.error(`[OnboardingSignUp] ⚠️ uno 불일치! 저장된 uno: ${savedUno}, 응답 uno: ${responseUno}`);
              throw new Error('사용자 정보 불일치: 로그인에 실패했습니다.');
            }
            
            console.log('[OnboardingSignUp] ✅ Bearer 토큰이 정상적으로 저장되었습니다.');
            
            // Store에 사용자 정보 저장 (정규화된 값으로 저장)
            const uno = responseUno || savedUno;
            if (!uno) {
              throw new Error('사용자 번호를 찾을 수 없습니다.');
            }
            
            // 🔥 정규화된 값으로 저장 (phone은 하이픈 제거된 값)
            useUserStore.getState().setUserFromApi(
              uno,
              name.trim(),
              normalizedPhone, // 정규화된 전화번호 (하이픈 제거)
              normalizedBirth  // 정규화된 생년월일
            );
            console.log('[OnboardingSignUp] 자동 로그인 - 사용자 정보 저장 완료:', { uno, name: name.trim(), phone: normalizedPhone, birth: normalizedBirth });
            
            // 로그인 성공 시 홈 화면으로 이동
            setIsLoading(false);
            onSignUpComplete?.(true); // true = 자동 로그인 성공
            return; // 성공 시 여기서 종료
          } else {
            throw new Error(loginResponse.header?.resultMsg || '자동 로그인에 실패했습니다.');
          }
        } catch (loginError: any) {
          console.error('=== 자동 로그인 실패 ===');
          console.error('자동 로그인 에러:', loginError);
          console.error('자동 로그인 에러 상세:', {
            message: loginError.message,
            response: loginError.response,
            status: loginError.response?.status,
            data: loginError.response?.data,
          });
          
          // 500 에러 처리 (백엔드에서 IllegalArgumentException이 500으로 반환되는 경우)
          if (loginError.response?.status === 500) {
            const errorMsg = loginError.response?.data?.header?.resultMsg 
              || loginError.response?.data?.message 
              || loginError.message 
              || '로그인 중 서버 오류가 발생했습니다.';
            
            // 에러 메시지에 "회원이 존재하지 않습니다" 또는 "탈퇴한 회원"이 포함된 경우
            if (errorMsg.includes('회원이 존재하지 않습니다') || errorMsg.includes('탈퇴한 회원')) {
              Alert.alert(
                '로그인 실패',
                errorMsg + '\n\n입력하신 정보를 다시 확인해주세요.',
                [{ text: '확인', onPress: () => setIsLoading(false) }]
              );
            } else {
              Alert.alert(
                '로그인 실패',
                errorMsg + '\n\n다시 시도해주세요.',
                [{ text: '확인', onPress: () => setIsLoading(false) }]
              );
            }
          } else {
            // 기타 에러 처리
            Alert.alert(
              '로그인 실패',
              loginError.response?.data?.header?.resultMsg || loginError.response?.data?.message || loginError.message || '이미 가입된 사용자입니다. 로그인에 실패했습니다.\n\n다시 시도해주세요.',
              [{ text: '확인', onPress: () => setIsLoading(false) }]
            );
          }
          return;
        }
      } else {
        // 기타 에러 처리 (500 에러 포함)
        const errorStatus = error.response?.status;
        const errorMessage = error.response?.data?.header?.resultMsg 
          || error.response?.data?.message 
          || error.message 
          || `회원가입 중 오류가 발생했습니다. (상태 코드: ${errorStatus || '알 수 없음'})`;
        
        console.error('회원가입 실패 상세:', {
          status: errorStatus,
          code: error.response?.data?.header?.resultCode,
          message: errorMessage,
        });
        
        // 500 에러인 경우 특별 처리
        if (errorStatus === 500) {
          Alert.alert(
            '회원가입 실패',
            errorMessage + '\n\n입력하신 정보를 확인하고 다시 시도해주세요.',
            [{ text: '확인', onPress: () => setIsLoading(false) }]
          );
        } else {
          Alert.alert(
            '회원가입 실패',
            errorMessage + '\n\n다시 시도해주세요.',
            [{ text: '확인', onPress: () => setIsLoading(false) }]
          );
        }
      }
    }
  };

  const handleDatePickerPress = () => {
    setShowDatePicker(true);
  };

  const handleCloseDatePicker = () => {
    setShowDatePicker(false);
  };

  const handleConfirmDate = () => {
    const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    setBirthdate(formattedDate);
    setShowDatePicker(false);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    const maxDay = getDaysInMonth(year, selectedMonth);
    if (selectedDay > maxDay) {
      setSelectedDay(maxDay);
    }
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    const maxDay = getDaysInMonth(selectedYear, month);
    if (selectedDay > maxDay) {
      setSelectedDay(maxDay);
    }
  };

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
  };

  // 세 가지 항목이 모두 입력되었는지 확인
  const isFormValid = name.trim() !== '' && birthdate.trim() !== '' && phone.trim() !== '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>기본 정보 입력</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + responsive(80) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pageWrapper, { maxWidth: MAX_WIDTH }]}>

          {/* Name Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.headingContainer}>
              <Text style={styles.headingText}>성함을 입력해주세요.</Text>
            </View>
            <View style={styles.textInput}>
              <TextInput
                style={styles.inputText}
                placeholder="이름 입력"
                placeholderTextColor="#99a1af"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Birthdate Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.headingContainer}>
              <Text style={styles.headingText}>생년월일을 입력해주세요.</Text>
            </View>
            <View style={styles.birthdateInputContainer}>
              <TouchableOpacity
                style={styles.textInput}
                onPress={handleDatePickerPress}
                activeOpacity={0.7}
              >
                <TextInput
                  style={styles.inputText}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#99a1af"
                  value={birthdate}
                  onChangeText={setBirthdate}
                  editable={false}
                  pointerEvents="none"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={handleDatePickerPress}
                activeOpacity={0.8}
              >
                <Svg width={responsive(28)} height={responsive(28)} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="6" width="18" height="15" rx="2" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round"/>
                  <Path d="M3 10H21" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <Path d="M7 3V6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <Path d="M17 3V6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <Path d="M8 14H8.01" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <Path d="M12 14H12.01" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <Path d="M16 14H16.01" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <Path d="M8 18H8.01" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <Path d="M12 18H12.01" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </TouchableOpacity>
            </View>
          </View>

          {/* Phone Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.headingContainer}>
              <Text style={styles.headingText}>전화번호를 입력해주세요.</Text>
            </View>
            <View style={styles.textInput}>
              <TextInput
                style={styles.inputText}
                placeholder="010-0000-0000"
                placeholderTextColor="#99a1af"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Submit Button - 모든 항목 입력 시 활성화 */}
      <View style={[styles.submitButtonContainer, { bottom: insets.bottom + responsive(16) }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            isFormValid && !isLoading ? styles.submitButtonActive : styles.submitButtonDeactive
          ]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
          <Text style={[
            styles.submitButtonText,
              isFormValid && !isLoading ? styles.submitButtonTextActive : styles.submitButtonTextDeactive
          ]}>
            회원가입
          </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseDatePicker}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseDatePicker}
        >
          <TouchableOpacity
            style={styles.datePickerContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>생년월일 선택</Text>
              <TouchableOpacity onPress={handleCloseDatePicker}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerContent}>
              <View style={styles.pickerRow}>
                {/* Year Picker */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>년</Text>
                  <ScrollView
                    style={styles.pickerScroll}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.pickerScrollContent}
                  >
                    {years.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.pickerItem,
                          selectedYear === year && styles.pickerItemSelected,
                        ]}
                        onPress={() => handleYearSelect(year)}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            selectedYear === year && styles.pickerItemTextSelected,
                          ]}
                        >
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Month Picker */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>월</Text>
                  <ScrollView
                    style={styles.pickerScroll}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.pickerScrollContent}
                  >
                    {months.map((month) => (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.pickerItem,
                          selectedMonth === month && styles.pickerItemSelected,
                        ]}
                        onPress={() => handleMonthSelect(month)}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            selectedMonth === month && styles.pickerItemTextSelected,
                          ]}
                        >
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Day Picker */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>일</Text>
                  <ScrollView
                    style={styles.pickerScroll}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.pickerScrollContent}
                  >
                    {days.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.pickerItem,
                          selectedDay === day && styles.pickerItemSelected,
                        ]}
                        onPress={() => handleDaySelect(day)}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            selectedDay === day && styles.pickerItemTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmDate}
              >
                <Text style={styles.confirmButtonText}>선택 완료</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    width: '100%',
    borderBottomWidth: responsive(1),
    borderBottomColor: '#EAEAEA',
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    minHeight: responsive(56),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  headerTitle: {
    fontWeight: '700' as any,
    fontSize: responsive(27),
    color: '#1A1A1A',
    lineHeight: responsive(32.4),
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: responsive(16),
    paddingTop: responsive(24),
    alignItems: 'center' as any,
  },
  pageWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  inputSection: {
    width: '100%',
    marginBottom: responsive(24),
  },
  headingContainer: {
    width: '100%',
    height: responsive(30),
    marginBottom: responsive(6),
  },
  headingText: {
    fontSize: responsive(24),
    fontWeight: '700' as any,
    color: '#1e2939',
    lineHeight: responsive(28.8),
    textAlign: 'left',
  },
  birthdateInputContainer: {
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    gap: responsive(12),
  },
  textInput: {
    flex: 1,
    height: responsive(70),
    backgroundColor: '#ffffff',
    borderWidth: responsive(1),
    borderColor: '#e5e7eb',
    borderRadius: responsive(14),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  inputText: {
    fontSize: responsive(24),
    fontWeight: '700' as any,
    color: '#99a1af',
    lineHeight: responsive(28.8),
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: responsive(16),
  },
  calendarButton: {
    width: responsive(70),
    height: responsive(70),
    backgroundColor: '#60584d',
    borderRadius: responsive(14),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive(2) },
    shadowOpacity: 0.1,
    shadowRadius: responsive(4),
    elevation: responsive(3),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  datePickerContainer: {
    width: '92%',
    maxWidth: responsive(400),
    backgroundColor: '#ffffff',
    borderRadius: responsive(24),
    paddingVertical: responsive(24),
    paddingHorizontal: responsive(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive(4) },
    shadowOpacity: 0.15,
    shadowRadius: responsive(12),
    elevation: responsive(8),
  },
  datePickerHeader: {
    flexDirection: 'row' as any,
    justifyContent: 'space-between' as any,
    alignItems: 'center' as any,
    marginBottom: responsive(20),
  },
  datePickerTitle: {
    fontSize: responsive(22),
    fontWeight: '700' as any,
    color: '#1e2939',
    letterSpacing: responsive(-0.5),
  },
  closeButton: {
    fontSize: responsive(24),
    color: '#99a1af',
    fontWeight: '400' as any,
    paddingHorizontal: responsive(8),
    paddingVertical: responsive(4),
  },
  datePickerContent: {
    width: '100%',
  },
  pickerRow: {
    flexDirection: 'row' as any,
    justifyContent: 'space-between' as any,
    gap: responsive(8),
    marginBottom: responsive(20),
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: responsive(15),
    fontWeight: '700' as any,
    color: '#1e2939',
    textAlign: 'center' as any,
    marginBottom: responsive(10),
  },
  pickerScroll: {
    maxHeight: responsive(280),
    borderWidth: responsive(1),
    borderColor: '#e5e7eb',
    borderRadius: responsive(14),
    backgroundColor: '#f9fafb',
  },
  pickerScrollContent: {
    paddingVertical: responsive(4),
  },
  pickerItem: {
    paddingVertical: responsive(14),
    paddingHorizontal: responsive(12),
    borderBottomWidth: responsive(1),
    borderBottomColor: '#f0f0f0',
  },
  pickerItemSelected: {
    backgroundColor: '#ffcc02',
  },
  pickerItemText: {
    fontSize: responsive(16),
    color: '#1e2939',
    textAlign: 'center' as any,
    fontWeight: '500' as any,
  },
  pickerItemTextSelected: {
    color: '#545045',
    fontWeight: '700' as any,
  },
  confirmButton: {
    width: '100%',
    height: responsive(52),
    backgroundColor: '#60584d',
    borderRadius: responsive(14),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  confirmButtonText: {
    fontSize: responsive(18),
    fontWeight: '700' as any,
    color: '#ffffff',
  },
  submitButtonContainer: {
    position: 'absolute' as any,
    left: responsive(16),
    right: responsive(16),
    alignItems: 'center' as any,
  },
  submitButton: {
    width: '100%',
    maxWidth: responsive(360),
    height: responsive(66),
    borderRadius: responsive(200),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  submitButtonActive: {
    backgroundColor: '#60584d',
  },
  submitButtonDeactive: {
    backgroundColor: '#c4bcb1',
  },
  submitButtonText: {
    fontWeight: '700' as any,
    fontSize: responsive(27),
    lineHeight: responsive(32.4),
  },
  submitButtonTextActive: {
    color: '#ffffff',
  },
  submitButtonTextDeactive: {
    color: '#ffffff',
  },
});
