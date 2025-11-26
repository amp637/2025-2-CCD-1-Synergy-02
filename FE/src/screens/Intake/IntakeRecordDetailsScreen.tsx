import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  InteractionManager,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Circle } from 'react-native-svg';
import responsive from '../../utils/responsive';


// 원형 진행률 그래프 컴포넌트
const CircularProgress = ({ percentage }: { percentage: number }) => {
  const size = responsive(60);
  const strokeWidth = responsive(4);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;
  const strokeDashoffset = circumference - progress;

  return (
    <View style={styles.circularProgressContainer}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* 배경 원 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FFF4C9"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* 진행률 원 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FFCC02"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.percentageTextContainer}>
        <Text style={styles.progressPercentage}>{percentage}%</Text>
      </View>
    </View>
  );
};

interface IntakeRecordDetailsScreenProps {
  onExit?: () => void;
}

const IntakeRecordDetailsScreen = React.memo(({ onExit }: IntakeRecordDetailsScreenProps) => {
  const [isInteractionComplete, setIsInteractionComplete] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();

  // 화면 전환 애니메이션 이후에 실행
  useEffect(() => {
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      setIsInteractionComplete(true);
    });

    return () => interactionPromise.cancel();
  }, []);

  const handleExit = useCallback(() => {
    console.log('나가기 버튼 클릭');
    onExit?.();
  }, [onExit]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      
      {/* 상단 헤더 - 고정 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>상세 기록</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + responsive(20) }]}
        showsVerticalScrollIndicator={false}
        minimumZoomScale={1}
        maximumZoomScale={3}
        pinchGestureEnabled
        centerContent
      >
        <View style={[styles.pageWrapper, { maxWidth: MAX_WIDTH }]}>
          {/* 약 정보 섹션 */}
          <View style={styles.medicineInfoSection}>
            {/* 복통약 태그 */}
            <View style={styles.medicineTag}>
              <Text style={styles.medicineTagText}>복통약</Text>
            </View>

            {/* 병원 정보 */}
            <Text style={styles.hospitalInfo}>가람병원 - 1일 3회</Text>
            
            {/* 날짜 정보 */}
            <Text style={styles.dateText}>2025년 10월 14일 - 2025년 10월 25일</Text>
          </View>

          {/* 진행률 카드 */}
          <View style={styles.progressCard}>
            <View style={styles.progressContent}>
              {/* 진행률 원형 차트 */}
              <View style={styles.progressCircleWrapper}>
                <Text style={styles.progressLabel}>진행률</Text>
                <CircularProgress percentage={60} />
              </View>

              {/* 통계 정보 */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>총 복용 횟수</Text>
                  <Text style={styles.statValue}>15회</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>현재 복용 회차</Text>
                  <Text style={styles.statValue}>9회</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>실 복용 횟수</Text>
                  <Text style={styles.statValue}>7회</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 약 카드 섹션 */}
          <View style={styles.medicationCard}>
            {/* 약 #1 */}
            <View style={styles.medicationItemWrapper}>
              <View style={styles.medicationLeftBar} />
              <View style={styles.medicationContentWrapper}>
                <View style={styles.medicationItem}>
                  <View style={styles.medicationContent}>
                    <View style={styles.medicationHeader}>
                      <Text style={styles.medicationNumber}>#1</Text>
                      <View style={styles.medicationTypeTag}>
                        <Text style={styles.medicationTypeText}>소염진통제</Text>
                      </View>
                    </View>
                    <Text style={styles.medicationName}>이부프로펜 200mg</Text>
                  </View>
                </View>
                
                {/* 약 설명 */}
                <View style={styles.medicationDescription}>
                  <Text style={styles.medicationDescriptionText}>
                    💊 두통, 복통, 설사가 나타날 수 있습니다
                  </Text>
                </View>
              </View>
            </View>

            {/* 약 #2 */}
            <View style={styles.medicationItemWrapper}>
              <View style={styles.medicationLeftBar} />
              <View style={styles.medicationContentWrapper}>
                <View style={styles.medicationItem}>
                  <View style={styles.medicationContent}>
                    <View style={styles.medicationHeader}>
                      <Text style={styles.medicationNumber}>#2</Text>
                      <View style={styles.medicationTypeTag}>
                        <Text style={styles.medicationTypeText}>소염진통제</Text>
                      </View>
                    </View>
                    <Text style={styles.medicationName}>이프로펜 200mg</Text>
                  </View>
                </View>
                
                {/* 약 설명 */}
                <View style={styles.medicationDescription}>
                  <Text style={styles.medicationDescriptionText}>
                    💊 두통, 복통, 설사가 나타날 수 있습니다
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 부작용 기록 카드 */}
          <View style={styles.sideEffectCard}>
            <View style={styles.sideEffectSection}>
              {/* 1주차 */}
              <View style={styles.sideEffectItem}>
                <Text style={styles.sideEffectWeek}>1주차 부작용</Text>
                <View style={styles.sideEffectContent}>
                  <Text style={styles.sideEffectText}>입마름, 두통(3회)</Text>
                </View>
              </View>

              <View style={styles.sideEffectDivider} />

              {/* 2주차 */}
              <View style={styles.sideEffectItem}>
                <Text style={styles.sideEffectWeek}>2주차 부작용</Text>
                <View style={styles.sideEffectContent}>
                  <Text style={styles.sideEffectText}>입마름, 두통(3회)</Text>
                </View>
              </View>

              <View style={styles.sideEffectDivider} />

              {/* 3주차 */}
              <View style={styles.sideEffectItem}>
                <Text style={styles.sideEffectWeek}>3주차 부작용</Text>
                <View style={styles.sideEffectContent}>
                  <Text style={styles.sideEffectText}>입마름, 두통(3회)</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 총평 카드 */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryLogo}>
                <Image
                  source={require('../../../assets/images/PillImage.png')}
                  style={styles.summaryLogoImage}
                  contentFit="contain"
                />
              </View>
              <Text style={styles.summaryTitle}>총평</Text>
            </View>
            <Text style={styles.summaryText}>
              약을 잊지 않고 잘 챙겨드셨네요!{'\n'}
              복약 점수가 80점으로 아주 좋습니다.{'\n'}
              남은 기간도 꾸준히 복용하면 몸이 한결 편해질 거예요.{'\n'}
              혹시 두통이나 입마름이 계속된다면 의사나 약사에게 꼭 말씀해주세요.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View style={styles.exitButtonContainer}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
          <Text style={styles.exitButtonText}>나가기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});

IntakeRecordDetailsScreen.displayName = 'IntakeRecordDetailsScreen';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F8',
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
    fontWeight: '700' as '700',
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
  medicineInfoSection: {
    width: '100%',
    marginBottom: responsive(15),
  },
  medicineTag: {
    backgroundColor: '#FFF4C9',
    borderWidth: responsive(1),
    borderColor: '#545045',
    borderRadius: responsive(15),
    paddingHorizontal: responsive(16),
    paddingVertical: responsive(8),
    alignSelf: 'flex-start',
    marginBottom: responsive(8),
  },
  medicineTagText: {
    fontWeight: '700' as '700',
    fontSize: responsive(24),
    color: '#545045',
    lineHeight: responsive(28.8),
  },
  hospitalInfo: {
    fontWeight: '700' as '700',
    fontSize: responsive(32),
    color: '#666666',
    lineHeight: responsive(38.4),
    marginBottom: responsive(4),
  },
  dateText: {
    fontWeight: '400' as '400',
    fontSize: responsive(14),
    color: '#6A7282',
    lineHeight: responsive(16.8),
  },
  progressCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: responsive(12),
    paddingVertical: responsive(9),
    paddingHorizontal: responsive(19),
    marginBottom: responsive(8),
  },
  progressContent: {
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    justifyContent: 'space-between' as any,
  },
  progressCircleWrapper: {
    alignItems: 'center' as any,
  },
  progressLabel: {
    fontWeight: '700' as '700',
    fontSize: responsive(14),
    color: '#364153',
    lineHeight: responsive(16.8),
    marginBottom: responsive(2),
  },
  circularProgressContainer: {
    position: 'relative',
    width: responsive(60),
    height: responsive(60),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  percentageTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  progressPercentage: {
    fontWeight: '700' as '700',
    fontSize: responsive(24),
    color: '#101828',
    lineHeight: responsive(28.8),
  },
  statsContainer: {
    flexDirection: 'row' as any,
    gap: responsive(12),
    flex: 1,
    justifyContent: 'space-around',
    marginLeft: responsive(16),
  },
  statItem: {
    alignItems: 'center' as any,
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    fontWeight: '400' as '400',
    fontSize: responsive(11),
    color: '#364153',
    lineHeight: responsive(13),
    marginBottom: responsive(6),
    textAlign: 'center',
  },
  statValue: {
    fontWeight: '700' as '700',
    fontSize: responsive(28),
    color: '#101828',
    lineHeight: responsive(33.6),
  },
  medicationCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: responsive(11),
    paddingVertical: responsive(12),
    paddingHorizontal: responsive(18),
    marginBottom: responsive(8),
  },
  medicationItemWrapper: {
    flexDirection: 'row' as any,
    marginBottom: responsive(12),
  },
  medicationLeftBar: {
    width: responsive(3),
    alignSelf: 'stretch',
    backgroundColor: '#60584D',
    marginRight: responsive(14),
  },
  medicationContentWrapper: {
    flex: 1,
  },
  medicationItem: {
    paddingVertical: 14,
  },
  medicationContent: {
    flex: 1,
  },
  medicationHeader: {
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    marginBottom: responsive(6),
  },
  medicationNumber: {
    fontWeight: '400' as '400',
    fontSize: responsive(20),
    color: '#99A1AF',
    lineHeight: responsive(28),
    marginRight: responsive(10),
  },
  medicationTypeTag: {
    backgroundColor: '#FFEDA5',
    borderRadius: responsive(25),
    paddingHorizontal: responsive(16),
    paddingVertical: responsive(6),
  },
  medicationTypeText: {
    fontWeight: '700' as '700',
    fontSize: responsive(16),
    color: '#60584D',
    lineHeight: responsive(20),
  },
  medicationName: {
    fontWeight: '700' as '700',
    fontSize: responsive(18),
    color: '#60584D',
    lineHeight: responsive(24),
  },
  medicationDescription: {
    backgroundColor: '#F9FAFB',
    borderRadius: responsive(4),
    paddingHorizontal: responsive(18),
    paddingVertical: responsive(10),
    marginTop: responsive(8),
  },
  medicationDescriptionText: {
    fontWeight: '400' as '400',
    fontSize: responsive(15),
    color: '#364153',
    lineHeight: responsive(21),
  },
  sideEffectCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: responsive(12),
    paddingVertical: responsive(10),
    paddingHorizontal: responsive(15),
    marginBottom: responsive(8),
  },
  sideEffectSection: {
    width: '100%',
  },
  sideEffectItem: {
    paddingVertical: responsive(8),
  },
  sideEffectWeek: {
    fontWeight: '700' as '700',
    fontSize: responsive(14),
    color: '#364153',
    lineHeight: responsive(19),
    marginBottom: responsive(8),
  },
  sideEffectContent: {
    backgroundColor: '#EAEAEA',
    borderRadius: responsive(18),
    paddingHorizontal: responsive(18),
    paddingVertical: responsive(8),
  },
  sideEffectText: {
    fontWeight: '400' as '400',
    fontSize: responsive(14),
    color: '#364153',
    lineHeight: responsive(16.8),
  },
  sideEffectDivider: {
    height: responsive(1),
    backgroundColor: '#B8B5B5',
    marginVertical: responsive(8),
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: responsive(12),
    paddingVertical: responsive(14),
    paddingHorizontal: responsive(15),
    marginBottom: responsive(20),
  },
  summaryHeader: {
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    marginBottom: responsive(16),
  },
  summaryLogo: {
    width: responsive(60),
    height: responsive(60),
    borderRadius: responsive(30),
    backgroundColor: '#60584D',
    marginRight: responsive(16),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  summaryLogoImage: {
    width: responsive(48),
    height: responsive(48),
  },
  summaryTitle: {
    fontWeight: '700' as '700',
    fontSize: responsive(22),
    color: '#000000',
    lineHeight: responsive(26.4),
  },
  summaryText: {
    fontWeight: '700' as '700',
    fontSize: responsive(16),
    color: '#141313',
    lineHeight: responsive(20),
  },
  exitButtonContainer: {
    position: 'absolute',
    left: responsive(16),
    right: responsive(16),
    bottom: responsive(36),
    alignItems: 'center' as any,
  },
  exitButton: {
    width: '100%',
    maxWidth: responsive(360),
    height: responsive(66),
    backgroundColor: '#60584D',
    borderRadius: responsive(200),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  exitButtonText: {
    fontWeight: '700' as '700',
    fontSize: responsive(27),
    color: '#FFFFFF',
    lineHeight: responsive(32.4),
  },
});

export default IntakeRecordDetailsScreen;

