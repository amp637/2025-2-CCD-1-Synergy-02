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
import { getMedicationTime, updateMedicationTime } from '../../api/userApi';
import { getMedicationTimePresets } from '../../api/presetApi';

const TYPE = 'lunch';

interface LunchTimeEditScreenProps {
  onNext?: () => void;
}

export default function LunchTimeEditScreen({ onNext }: LunchTimeEditScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();

  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [utno, setUtno] = useState<number | null>(null);
  const [timeOptions, setTimeOptions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 기존 시간 조회 및 프리셋 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        
        // 1. 기존 시간 조회
        const currentTimeResponse = await getMedicationTime(TYPE);
        if (currentTimeResponse.header?.resultCode === 1000 && currentTimeResponse.body) {
          setUtno(currentTimeResponse.body.utno);
          setSelectedTime(currentTimeResponse.body.time);
        }

        // 2. 프리셋 조회
        const presetsResponse = await getMedicationTimePresets(TYPE);
        if (presetsResponse.header?.resultCode === 1000 && presetsResponse.body) {
          const hours = presetsResponse.body.times.map((preset) => preset.time);
          setTimeOptions(hours);
        }
      } catch (error: any) {
        console.error('데이터 로드 실패:', error);
        Alert.alert('오류', '복약 시간 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const isNextButtonActive = selectedTime !== null && !isLoading;

  const handleTimeSelect = (hour: number) => {
    setSelectedTime(hour);
  };

  const handleNext = async () => {
    if (!isNextButtonActive || selectedTime === null || utno === null) return;

    setIsLoading(true);
    try {
      const response = await updateMedicationTime(utno, {
        type: TYPE,
        time: selectedTime,
      });
      
      if (response.header?.resultCode === 1000) {
        console.log('복약 시간 수정 성공:', response);
        Alert.alert('수정 완료', '복약 시간이 수정되었습니다.', [
          { text: '확인', onPress: () => onNext?.() },
        ]);
      } else {
        throw new Error(response.header?.resultMsg || '복약 시간 수정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('복약 시간 수정 실패:', error);
      Alert.alert(
        '수정 실패',
        error.response?.data?.header?.resultMsg || error.response?.data?.message || error.message || '복약 시간 수정 중 오류가 발생했습니다.'
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
          <Text style={styles.headerText}>복약 시간 수정</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + responsive(80) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pageWrapper, { maxWidth: MAX_WIDTH }]}>
          {/* 제목 */}
          <Text style={styles.title}>점심 약 시간을 선택하세요.</Text>

          {/* 시간 버튼 그리드 */}
          {isLoadingData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#60584d" />
              <Text style={styles.loadingText}>시간 정보 불러오는 중...</Text>
            </View>
          ) : (
            <View style={styles.timeButtonsContainer}>
              {timeOptions.map((hour) => {
              const isSelected = selectedTime === hour;
              return (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.timeButton,
                    isSelected ? styles.timeButtonSelected : styles.timeButtonUnselected,
                  ]}
                  onPress={() => handleTimeSelect(hour)}
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      isSelected ? styles.timeButtonTextSelected : styles.timeButtonTextUnselected,
                    ]}
                  >
                    {hour}시
                  </Text>
                </TouchableOpacity>
              );
            })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 다음으로 버튼 */}
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
              다음으로
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
    width: responsive(164),
    height: responsive(144),
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
