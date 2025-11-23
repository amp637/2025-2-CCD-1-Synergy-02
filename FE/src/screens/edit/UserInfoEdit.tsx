import React, { useState, useEffect } from 'react';
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
import { getUserInfo, updateUserInfo } from '../../api/userApi';

interface UserInfoEditProps {
  onComplete?: () => void;
}

export default function UserInfoEdit({ onComplete }: UserInfoEditProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [uno, setUno] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();

  // 사용자 정보 조회
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        setIsLoadingData(true);
        const response = await getUserInfo();
        if (response.header?.resultCode === 1000 && response.body) {
          const userData = response.body;
          setUno(userData.uno);
          setName(userData.name);
          setPhone(userData.phone);
          setBirthdate(userData.birth);
          
          // 생년월일 파싱하여 날짜 선택기 초기화
          const [year, month, day] = userData.birth.split('-').map(Number);
          setSelectedYear(year);
          setSelectedMonth(month);
          setSelectedDay(day);
        }
      } catch (error: any) {
        console.error('사용자 정보 조회 실패:', error);
        Alert.alert('오류', '사용자 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadUserInfo();
  }, []);

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
    if (!uno || isLoading) return;

    // 유효성 검사
    if (!name.trim()) {
      Alert.alert('입력 오류', '이름을 입력해주세요.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('입력 오류', '전화번호를 입력해주세요.');
      return;
    }
    if (!birthdate.trim()) {
      Alert.alert('입력 오류', '생년월일을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateUserInfo({
        uno: uno,
        name: name.trim(),
        phone: phone.trim(),
        birth: birthdate.trim(),
      });
      
      if (response.header?.resultCode === 1000) {
        console.log('사용자 정보 수정 성공:', response);
        Alert.alert('수정 완료', '사용자 정보가 수정되었습니다.', [
          { text: '확인', onPress: () => onComplete?.() },
        ]);
      } else {
        throw new Error(response.header?.resultMsg || '사용자 정보 수정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('사용자 정보 수정 실패:', error);
      Alert.alert(
        '수정 실패',
        error.response?.data?.header?.resultMsg || error.response?.data?.message || error.message || '사용자 정보 수정 중 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>기본 정보 수정</Text>
        </View>
      </View>

      {isLoadingData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60584d" />
          <Text style={styles.loadingText}>사용자 정보 불러오는 중...</Text>
        </View>
      ) : (
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
            <View style={styles.textInputFull}>
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
                <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
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

          {/* Phone Number Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.headingContainer}>
              <Text style={styles.headingText}>전화번호를 입력해주세요.</Text>
            </View>
            <View style={styles.textInputFull}>
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
      )}

      {/* Submit Button - 항상 활성화 */}
      <View style={[styles.submitButtonContainer, { bottom: insets.bottom + responsive(16) }]}>
        <TouchableOpacity
          style={[styles.submitButton, styles.submitButtonActive, { maxWidth: MAX_WIDTH }]}
          onPress={handleSubmit}
          disabled={isLoading || isLoadingData}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>수정 완료</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent={true}
          visible={showDatePicker}
          animationType="slide"
          onRequestClose={handleCloseDatePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>날짜 선택</Text>
                <TouchableOpacity onPress={handleCloseDatePicker}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.pickerContainer}>
                {/* Year Picker */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>년</Text>
                  <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
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
                  <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
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
                  <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
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

              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmDate}>
                <Text style={styles.confirmButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: responsive(1),
    borderBottomColor: '#EAEAEA',
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
  textInputFull: {
    width: '100%',
    height: responsive(70),
    backgroundColor: '#ffffff',
    borderWidth: responsive(1),
    borderColor: '#e5e7eb',
    borderRadius: responsive(14),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
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
  birthdateInputContainer: {
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    gap: responsive(12),
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
  submitButtonContainer: {
    position: 'absolute' as any,
    left: responsive(16),
    right: responsive(16),
    alignItems: 'center' as any,
  },
  submitButton: {
    width: '100%',
    height: responsive(66),
    borderRadius: responsive(200),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  submitButtonActive: {
    backgroundColor: '#60584d',
  },
  submitButtonText: {
    fontSize: responsive(27),
    fontWeight: '700' as any,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  modalContent: {
    width: '90%',
    maxWidth: responsive(400),
    backgroundColor: '#FFFFFF',
    borderRadius: responsive(20),
    padding: responsive(20),
  },
  modalHeader: {
    flexDirection: 'row' as any,
    justifyContent: 'space-between' as any,
    alignItems: 'center' as any,
    marginBottom: responsive(20),
  },
  modalTitle: {
    fontSize: responsive(24),
    fontWeight: '700' as any,
    color: '#1e2939',
  },
  closeButton: {
    fontSize: responsive(28),
    color: '#6a7282',
  },
  pickerContainer: {
    flexDirection: 'row' as any,
    justifyContent: 'space-between' as any,
    marginBottom: responsive(20),
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center' as any,
  },
  pickerLabel: {
    fontSize: responsive(16),
    fontWeight: '600' as any,
    color: '#1e2939',
    marginBottom: responsive(10),
  },
  picker: {
    height: responsive(200),
    width: '100%',
  },
  pickerItem: {
    paddingVertical: responsive(10),
    alignItems: 'center' as any,
  },
  pickerItemSelected: {
    backgroundColor: '#FFCC02',
    borderRadius: responsive(8),
  },
  pickerItemText: {
    fontSize: responsive(18),
    color: '#6a7282',
  },
  pickerItemTextSelected: {
    color: '#1e2939',
    fontWeight: '700' as any,
  },
  confirmButton: {
    backgroundColor: '#60584d',
    borderRadius: responsive(200),
    height: responsive(56),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  confirmButtonText: {
    fontSize: responsive(20),
    fontWeight: '700' as any,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
    paddingVertical: responsive(40),
  },
  loadingText: {
    marginTop: responsive(12),
    fontSize: responsive(18),
    color: '#99a1af',
  },
});

