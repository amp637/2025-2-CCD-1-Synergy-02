import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import responsive from '../../utils/responsive';

interface MorningTimeEditScreenProps {
  onNext?: () => void;
}

export default function MorningTimeEditScreen({ onNext }: MorningTimeEditScreenProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>('7시'); // 기존 시간으로 초기화
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();

  const times = ['6시', '7시', '8시', '9시', '10시', '11시'];

  const isButtonActive = selectedTime !== null;

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleSubmit = () => {
    if (isButtonActive) {
      console.log('선택된 시간:', selectedTime);
      onNext?.();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="dark" />
      
      {/* Header */}
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
          {/* Title */}
          <Text style={styles.title}>아침 약 시간을 선택하세요.</Text>

          {/* Time Buttons Grid */}
          <View style={styles.timeButtonsContainer}>
            {times.map((time) => {
              const isSelected = selectedTime === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeButton,
                    isSelected ? styles.timeButtonSelected : styles.timeButtonUnselected,
                  ]}
                  onPress={() => handleTimeSelect(time)}
                >
                  <Text 
                    style={[
                      styles.timeButtonText,
                      isSelected ? styles.timeButtonTextSelected : styles.timeButtonTextUnselected,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
          <Text style={styles.nextButtonText}>다음으로</Text>
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
    gap: 0,
  },
  timeButton: {
    width: '48%',
    maxWidth: 148,
    aspectRatio: 148 / 128,
    minHeight: 128,
    borderRadius: 25,
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    marginBottom: responsive(24),
  },
  timeButtonSelected: {
    backgroundColor: '#60584d',
  },
  timeButtonUnselected: {
    backgroundColor: '#ffcc02',
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
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 36,
    alignItems: 'center' as any,
  },
  nextButton: {
    width: 320,
    height: 66,
    borderRadius: 200,
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
});
