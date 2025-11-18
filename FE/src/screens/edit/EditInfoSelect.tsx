import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import responsive from '../../utils/responsive';

interface EditInfoSelectProps {
  onBasicInfo?: () => void;
  onMedicationTime?: () => void;
  onExit?: () => void;
}

export default function EditInfoSelect({ onBasicInfo, onMedicationTime, onExit }: EditInfoSelectProps) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();

  const handleBasicInfo = () => {
    console.log('기본 정보 수정');
    onBasicInfo?.();
  };

  const handleMedicationTime = () => {
    console.log('복약 시간 수정');
    onMedicationTime?.();
  };

  const handleExit = () => {
    console.log('나가기');
    onExit?.();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerText}>내 정보 수정</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + responsive(80) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pageWrapper, { maxWidth: MAX_WIDTH }]}>
          {/* 제목 */}
          <Text style={styles.title}>수정할 항목을 선택하세요</Text>

          {/* 버튼 그리드 */}
          <View style={styles.buttonGrid}>
            {/* 기본 정보 버튼 */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleBasicInfo}
              activeOpacity={0.8}
            >
              <Text style={styles.optionButtonText}>기본 정보</Text>
            </TouchableOpacity>

            {/* 복약 시간 버튼 */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleMedicationTime}
              activeOpacity={0.8}
            >
              <Text style={styles.optionButtonText}>복약 시간</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 나가기 버튼 */}
      <View style={[styles.buttonContainer, { bottom: insets.bottom + responsive(16) }]}>
        <TouchableOpacity
          style={[styles.submitButton, { maxWidth: MAX_WIDTH }]}
          onPress={handleExit}
        >
          <Text style={styles.submitButtonText}>나가기</Text>
        </TouchableOpacity>
      </View>
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
  headerText: {
    fontWeight: '700' as any,
    fontSize: responsive(27),
    color: '#1A1A1A',
    lineHeight: responsive(32.4),
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: responsive(16),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  pageWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: responsive(27),
    fontWeight: '700' as any,
    color: '#000000',
    lineHeight: responsive(32.4),
    marginBottom: responsive(24),
  },
  buttonGrid: {
    width: '100%',
    flexDirection: 'row' as any,
    justifyContent: 'space-between' as any,
  },
  optionButton: {
    width: responsive(172),
    height: responsive(172),
    backgroundColor: '#FFCC02',
    borderRadius: responsive(16),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    paddingHorizontal: responsive(16),
  },
  optionButtonText: {
    fontSize: responsive(27),
    fontWeight: '700' as any,
    color: '#5A5347',
    lineHeight: responsive(32.4),
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute' as any,
    left: responsive(16),
    right: responsive(16),
    alignItems: 'center' as any,
  },
  submitButton: {
    width: '100%',
    height: responsive(66),
    backgroundColor: '#60584d',
    borderRadius: responsive(200),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  submitButtonText: {
    fontSize: responsive(27),
    fontWeight: '700' as any,
    color: '#FFFFFF',
  },
});
