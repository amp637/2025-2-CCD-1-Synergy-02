import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

interface OnboardingMorningTimeSetProps {
  onNext?: () => void;
}

export default function OnboardingMorningTimeSet({ onNext }: OnboardingMorningTimeSetProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTno, setSelectedTno] = useState<number | null>(null);
  const [times, setTimes] = useState<Array<{ label: string; tno: number; hour: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();

  // 프리셋 조회
  useEffect(() => {
    const loadPresets = async () => {
      try {
        setIsLoadingPresets(true);
        const response = await getMedicationTimePresets('breakfast');
        if (response.header?.resultCode === 1000 && response.body) {
          const timeOptions = response.body.times.map((preset) => ({
            label: `${preset.time}시`,
            tno: preset.tno,
            hour: preset.time,
          }));
          setTimes(timeOptions);
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

  const isButtonActive = selectedTime !== null && !isLoading;

  const handleTimeSelect = (time: string, tno: number) => {
    setSelectedTime(time);
    setSelectedTno(tno);
  };

  const handleSubmit = async () => {
    if (!isButtonActive || !selectedTno) return;

    setIsLoading(true);
    try {
      const response = await setMedicationTime(selectedTno);
      if (response.header?.resultCode === 1000) {
        console.log('복약 시간 설정 성공:', response);
        onNext?.();
      } else {
        throw new Error(response.header?.resultMsg || '복약 시간 설정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('복약 시간 설정 실패:', error);
      Alert.alert(
        '설정 실패',
        error.response?.data?.message || error.message || '복약 시간 설정 중 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="dark" />
      
      {/* Header */}
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
          {/* Title */}
          <Text style={styles.title}>아침 약 시간을 선택하세요.</Text>

          {/* Time Buttons Grid */}
          {isLoadingPresets ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#60584d" />
              <Text style={styles.loadingText}>시간 목록 불러오는 중...</Text>
            </View>
          ) : (
            <View style={styles.timeButtonsContainer}>
              {times.map((timeOption) => {
                const isSelected = selectedTime === timeOption.label;
                return (
                  <TouchableOpacity
                    key={timeOption.tno}
                    style={[
                      styles.timeButton,
                      isSelected ? styles.timeButtonSelected : styles.timeButtonUnselected,
                    ]}
                    onPress={() => handleTimeSelect(timeOption.label, timeOption.tno)}
                    disabled={isLoading}
                  >
                    <Text 
                      style={[
                        styles.timeButtonText,
                        isSelected ? styles.timeButtonTextSelected : styles.timeButtonTextUnselected,
                      ]}
                    >
                      {timeOption.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Next Button */}
      <View style={[styles.buttonContainer, { bottom: insets.bottom + responsive(16) }]}>
        <TouchableOpacity 
          style={[
            styles.nextButton,
            isButtonActive ? styles.nextButtonActive : styles.nextButtonInactive,
          ]} 
          onPress={handleSubmit}
          disabled={!isButtonActive}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.nextButtonText}>다음으로</Text>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: responsive(1),
    borderBottomColor: '#EAEAEA',
  },
  headerContent: {
    minHeight: responsive(56),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  headerText: {
    fontSize: responsive(27),
    fontWeight: '700' as any,
    color: '#1A1A1A',
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
    marginBottom: responsive(24),
    textAlign: 'left',
  },
  timeButtonsContainer: {
    width: '100%',
    flexDirection: 'row' as any,
    flexWrap: 'wrap' as any,
    justifyContent: 'space-between' as any,
  },
  timeButton: {
    width: '48%', // 2열 그리드 유지 - scale 제거
    height: responsive(144), // height는 scale 처리
    borderRadius: responsive(25),
    borderWidth: responsive(1),
    borderColor: '#ffcc02',
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    marginBottom: responsive(24),
  },
  timeButtonSelected: {
    backgroundColor: '#60584d',
    borderColor: '#60584d',
  },
  timeButtonUnselected: {
    backgroundColor: '#ffcc02',
    borderColor: '#ffcc02',
  },
  timeButtonText: {
    fontSize: responsive(48),
    fontWeight: '700' as any,
    lineHeight: responsive(57.6),
  },
  timeButtonTextSelected: {
    color: '#ffffff',
  },
  timeButtonTextUnselected: {
    color: '#545045',
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
    color: '#ffffff',
    lineHeight: responsive(32.4),
  },
  nextButtonTextActive: {
    color: '#ffffff',
  },
  nextButtonTextInactive: {
    color: '#ffffff',
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
