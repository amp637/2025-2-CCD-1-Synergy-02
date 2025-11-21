import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import responsive from '../../utils/responsive';
import { setMedicationTime } from '../../api/userApi';
import { getMedicationTimePresets } from '../../api/presetApi';

const TYPE = 'night';

interface OnboardingBedTimeSetProps {
  onComplete?: () => void;
}

export default function OnboardingBedTimeSet({ onComplete }: OnboardingBedTimeSetProps) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();

  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [selectedTno, setSelectedTno] = useState<number | null>(null);
  const [timeOptions, setTimeOptions] = useState<Array<{ hour: number; tno: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);

  // 프리셋 조회
  useEffect(() => {
    const loadPresets = async () => {
      try {
        setIsLoadingPresets(true);
        const response = await getMedicationTimePresets(TYPE);
        if (response.header?.resultCode === 1000 && response.body) {
          const timeOptionsData = response.body.times.map((preset) => ({
            hour: preset.time,
            tno: preset.tno,
          }));
          setTimeOptions(timeOptionsData);
        }
      } catch (error: any) {
        console.error('프리셋 조회 실패:', error);
        Alert.alert('오류', '복약 시간 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingPresets(false);
      }
    };
    loadPresets();
  }, []);

  const isNextButtonActive = selectedTime !== null && !isLoading;

  const handleTimeSelect = (hour: number, tno: number) => {
    setSelectedTime(hour);
    setSelectedTno(tno);
  };

  const handleNext = async () => {
    if (!isNextButtonActive || !selectedTno) return;

    setIsLoading(true);
    try {
      const response = await setMedicationTime(selectedTno);
      if (response.header?.resultCode === 1000) {
        console.log('복약 시간 설정 성공:', response);
        // 성공 시 알림 없이 바로 완료 처리
        onComplete?.();
      } else {
        throw new Error(response.header?.resultMsg || '복약 시간 설정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('복약 시간 설정 실패:', error);
      Alert.alert(
        '설정 실패',
        error.response?.data?.header?.resultMsg || error.response?.data?.message || error.message || '복약 시간 설정 중 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerText}>복약 시간 설정</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + responsive(80) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pageWrapper, { maxWidth: MAX_WIDTH }]}>
          {/* 제목 */}
          <Text style={styles.title}>취침 시간을 선택하세요.</Text>

          {/* 시간 버튼 그리드 */}
          {isLoadingPresets ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#60584d" />
              <Text style={styles.loadingText}>시간 목록 불러오는 중...</Text>
            </View>
          ) : (
            <View style={styles.timeButtonsContainer}>
              {timeOptions.map((timeOption) => {
                const isSelected = selectedTime === timeOption.hour;
                return (
                  <TouchableOpacity
                    key={timeOption.tno}
                    style={[
                      styles.timeButton,
                      isSelected ? styles.timeButtonSelected : styles.timeButtonUnselected,
                    ]}
                    onPress={() => handleTimeSelect(timeOption.hour, timeOption.tno)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.timeButtonText,
                        isSelected ? styles.timeButtonTextSelected : styles.timeButtonTextUnselected,
                      ]}
                    >
                      {timeOption.hour}시
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 완료 버튼 */}
      <View style={[styles.buttonContainer, { bottom: insets.bottom + responsive(16) }]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            isNextButtonActive ? styles.nextButtonActive : styles.nextButtonInactive,
          ]}
          onPress={handleNext}
          disabled={!isNextButtonActive}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text
              style={[
                styles.nextButtonText,
                isNextButtonActive ? styles.nextButtonTextActive : styles.nextButtonTextInactive,
              ]}
            >
              입력 완료
            </Text>
          )}
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
  header: {
    width: '100%',
    backgroundColor: '#FFFFFF', // Consistent header background
    borderBottomWidth: responsive(1),
    borderBottomColor: '#EAEAEA', // Consistent header border
  },
  headerContent: {
    minHeight: responsive(56), // Consistent header height
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  headerText: {
    fontSize: responsive(27),
    fontWeight: '700' as any, // Consistent font weight
    color: '#1A1A1A', // Consistent font color
    lineHeight: responsive(32.4),
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: responsive(16),
    paddingTop: responsive(24),
    alignItems: 'center' as any,
    flexGrow: 1,
  },
  pageWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: responsive(24),
    fontWeight: '700' as any,
    color: '#1e2939',
    marginBottom: responsive(24), // Adjusted from 32 to 24 for consistency
    textAlign: 'left', // Adjusted to left align
  },
  timeButtonsContainer: {
    width: '100%',
    flexDirection: 'row' as any,
    flexWrap: 'wrap' as any,
    justifyContent: 'space-between' as any,
  },
  timeButton: {
    width: '48%', // 2열 그리드 유지 - scale 제거
    height: responsive(144), // Increased height
    borderRadius: responsive(25),
    borderWidth: responsive(1),
    borderColor: '#ffcc02', // Unselected border color
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    marginBottom: responsive(24), // Vertical spacing
  },
  timeButtonSelected: {
    backgroundColor: '#60584d', // Selected background color
    borderColor: '#60584d',
  },
  timeButtonUnselected: {
    backgroundColor: '#ffcc02', // Unselected background color
    borderColor: '#ffcc02',
  },
  timeButtonText: {
    fontSize: responsive(48),
    fontWeight: '700' as any,
    lineHeight: responsive(57.6),
  },
  timeButtonTextSelected: {
    color: '#ffffff', // Selected text color
  },
  timeButtonTextUnselected: {
    color: '#545045', // Unselected text color
  },
  buttonContainer: {
    position: 'absolute' as any,
    left: responsive(16),
    right: responsive(16),
    alignItems: 'center' as any,
  },
  nextButton: {
    width: '100%',
    maxWidth: responsive(360),
    height: responsive(66),
    borderRadius: responsive(200),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  nextButtonActive: {
    backgroundColor: '#60584d',
  },
  nextButtonInactive: {
    backgroundColor: '#c4bcb1',
  },
  nextButtonText: {
    fontSize: responsive(27),
    fontWeight: '700' as any,
    lineHeight: responsive(32.4),
  },
  nextButtonTextActive: {
    color: '#ffffff',
  },
  nextButtonTextInactive: {
    color: '#ffffff', // Figma shows white text even when inactive
  },
  loadingContainer: {
    width: '100%',
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
