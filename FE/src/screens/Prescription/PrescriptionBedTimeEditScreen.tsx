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
import { getMedicationTime, updateMedicationTime } from '../../api/medicationApi';
import { getMedicationTimePresets } from '../../api/presetApi';

const TYPE = 'night';

interface PrescriptionBedTimeEditScreenProps {
  umno: number;
  onComplete?: () => void;
}

export default function PrescriptionBedTimeEditScreen({ umno, onComplete }: PrescriptionBedTimeEditScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();

  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [selectedTno, setSelectedTno] = useState<number | null>(null);
  const [atno, setAtno] = useState<number | null>(null);
  const [timeOptions, setTimeOptions] = useState<Array<{ hour: number; tno: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        
        let currentHour: number | null = null;
        try {
          const currentTimeResponse = await getMedicationTime(umno, TYPE);
          if (currentTimeResponse.header?.resultCode === 1000 && currentTimeResponse.body) {
            currentHour = currentTimeResponse.body.time;
            setAtno(currentTimeResponse.body.atno);
            setSelectedTime(currentHour);
          }
        } catch (error: any) {
          console.log('복약 시간 정보 없음:', error.response?.status === 404 ? '데이터 없음' : error.message);
        }

        const presetsResponse = await getMedicationTimePresets(TYPE);
        if (presetsResponse.header?.resultCode === 1000 && presetsResponse.body) {
          const timeOptions = presetsResponse.body.times.map((preset) => ({
            hour: preset.time,
            tno: preset.tno,
          }));
          setTimeOptions(timeOptions);
          
          if (currentHour !== null) {
            const matchingPreset = presetsResponse.body.times.find((preset) => preset.time === currentHour);
            if (matchingPreset) {
              setSelectedTno(matchingPreset.tno);
            }
          }
        }
      } catch (error: any) {
        console.error('프리셋 로드 실패:', error);
        Alert.alert('오류', '복약 시간 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [umno]);

  const isNextButtonActive = selectedTime !== null && !isLoading;

  const handleTimeSelect = (hour: number, tno: number) => {
    setSelectedTime(hour);
    setSelectedTno(tno);
  };

  const handleComplete = async () => {
    if (!isNextButtonActive || selectedTime === null) return;

    if (atno === null) {
      Alert.alert(
        '알림',
        '복약 시간이 설정되지 않았습니다. 먼저 복약 시간 조합을 설정해주세요.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateMedicationTime(umno, atno, TYPE, selectedTime);
      
      if (response.header?.resultCode === 1000) {
        console.log('복약 시간 저장 성공:', response);
        onComplete?.();
      } else {
        throw new Error(response.header?.resultMsg || '복약 시간 저장에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('복약 시간 저장 실패:', error);
      Alert.alert(
        '저장 실패',
        error.response?.data?.header?.resultMsg || error.response?.data?.message || error.message || '복약 시간 저장 중 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="dark" />

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
          <Text style={styles.title}>취침전 약 시간을 선택하세요.</Text>

          {isLoadingData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#60584d" />
              <Text style={styles.loadingText}>시간 정보 불러오는 중...</Text>
            </View>
          ) : (
            <View style={styles.timeButtonsContainer}>
              {timeOptions.map((timeOption) => {
              const isSelected = selectedTime === timeOption.hour;
              return (
                <TouchableOpacity
                  key={timeOption.hour}
                  style={[
                    styles.timeButton,
                    isSelected ? styles.timeButtonSelected : styles.timeButtonUnselected,
                  ]}
                  onPress={() => handleTimeSelect(timeOption.hour, timeOption.tno)}
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

      <View style={[styles.buttonContainer, { bottom: insets.bottom + responsive(16) }]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            isNextButtonActive && atno !== null ? styles.nextButtonActive : styles.nextButtonInactive,
          ]}
          onPress={handleComplete}
          disabled={!isNextButtonActive || atno === null}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.nextButtonText}>수정 완료</Text>
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
    color: '#ffffff',
    lineHeight: responsive(32.4),
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



