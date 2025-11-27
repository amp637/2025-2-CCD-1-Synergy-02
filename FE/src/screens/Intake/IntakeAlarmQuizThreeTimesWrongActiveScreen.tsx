import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  useWindowDimensions,
  InteractionManager,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import responsive from '../../utils/responsive';
import { getEvents, updateEventStatus } from '../../api/eventApi';
import PinchZoomScrollView from '../../components/PinchZoomScrollView';

interface IntakeAlarmQuizThreeTimesWrongActiveScreenProps {
  onMedicationTaken?: () => void;
  eno?: number; // 이벤트 번호
  umno?: number; // 복약 번호
}

const IntakeAlarmQuizThreeTimesWrongActiveScreen = React.memo(({ 
  onMedicationTaken, 
  eno,
  umno 
}: IntakeAlarmQuizThreeTimesWrongActiveScreenProps) => {
  const [isInteractionComplete, setIsInteractionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);

  // 이벤트 데이터 로드
  useEffect(() => {
    const loadEventData = async () => {
      try {
        setIsLoading(true);
        const response = await getEvents();
        if (response.header?.resultCode === 1000 && response.body?.events) {
          // eno가 있으면 해당 이벤트를 찾고, 없으면 첫 번째 이벤트 사용
          const event = eno 
            ? response.body.events.find((e: any) => e.eno === eno)
            : response.body.events[0];
          
          if (event) {
            setEventData(event);
            // 정답 설정
            if (event.candidate?.answer) {
              setCorrectAnswer(event.candidate.answer);
            }
          }
        }
      } catch (error: any) {
        console.error('이벤트 데이터 로드 실패:', error);
        Alert.alert('오류', '퀴즈 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEventData();
  }, [eno]);

  // 화면 전환 애니메이션 이후에 실행
  useEffect(() => {
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      setIsInteractionComplete(true);
      console.log('IntakeAlarmQuizThreeTimesWrongActiveScreen: Interactions complete');
    });

    return () => interactionPromise.cancel();
  }, []);

  // 버튼 활성화 조건: 로딩이 완료되고 이벤트 데이터가 있을 때
  const isButtonActive = !isLoading && !!eventData;

  const handleSubmit = useCallback(async () => {
    if (!isButtonActive || isSubmitting || !eventData) return;

    try {
      setIsSubmitting(true);
      
      // 이벤트 상태 업데이트 (복약 완료 처리)
      if (eventData.eno) {
        const response = await updateEventStatus(eventData.eno);
        if (response.header?.resultCode === 1000) {
          console.log('복약 완료 처리 성공:', response);
          onMedicationTaken?.();
        } else {
          throw new Error(response.header?.resultMsg || '복약 완료 처리에 실패했습니다.');
        }
      } else {
        // eno가 없으면 그냥 진행
        onMedicationTaken?.();
      }
    } catch (error: any) {
      console.error('복약 완료 처리 실패:', error);
      Alert.alert(
        '처리 실패',
        error.response?.data?.header?.resultMsg || error.message || '복약 완료 처리 중 오류가 발생했습니다.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [isButtonActive, isSubmitting, eventData, onMedicationTaken]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <PinchZoomScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#60584d" />
            <Text style={styles.loadingText}>퀴즈 정보 불러오는 중...</Text>
          </View>
        ) : eventData ? (
          <View style={[styles.pageWrapper, { maxWidth: MAX_WIDTH }]}>
            {/* 상단 약 정보 카드 */}
            <View style={styles.medicineCard}>
              <Image
                source={require('../../../assets/images/PillImage.png')}
                style={styles.pillImage}
                contentFit="contain"
                cachePolicy="disk"
                priority="high"
                transition={150}
              />
              <View style={styles.medicineTextContainer}>
                <Text 
                  style={styles.hospitalText}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.6}
                >
                  {eventData.hospital}
                </Text>
                <Text 
                  style={styles.medicineNameText}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.5}
                >
                  {eventData.category}
                </Text>
              </View>
            </View>

            {/* 퀴즈 제목 */}
            <View style={styles.quizTitleContainer}>
              <Text style={styles.quizTitleMain}>오늘의 복약 퀴즈!</Text>
              <Text style={styles.quizTitleSub}>정답을 맞춰보세요</Text>
            </View>

            {/* 3번 틀린 후 오답 & 정답 표시 */}
            <View style={styles.threeTimesWrongBox}>
              <View style={styles.threeTimesWrongTextContainer}>
                <Text style={styles.threeTimesWrongMainText}>오답</Text>
                <Text style={styles.threeTimesWrongSubText}>
                  정답은{'\n'}
                  {correctAnswer}이예요.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>퀴즈 정보를 불러올 수 없습니다.</Text>
          </View>
        )}
      </PinchZoomScrollView>

      {/* 하단 고정 버튼 */}
      <View style={styles.submitButtonContainer}>
        <TouchableOpacity 
          style={[
            styles.submitButton,
            isButtonActive ? styles.submitButtonActive : styles.submitButtonInactive
          ]}
          onPress={handleSubmit}
          disabled={!isButtonActive || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>약 먹었어요</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});

IntakeAlarmQuizThreeTimesWrongActiveScreen.displayName = 'IntakeAlarmQuizThreeTimesWrongActiveScreen';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: responsive(16),
    paddingBottom: responsive(100),
    alignItems: 'center' as any,
  },
  pageWrapper: {
    width: '100%',
    alignSelf: 'center',
    paddingTop: responsive(64),
  },
  medicineCard: {
    width: '100%',
    maxWidth: responsive(300),
    height: responsive(170),
    backgroundColor: '#5E5B50',
    borderRadius: responsive(26),
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    justifyContent: 'flex-start' as any,
    paddingLeft: responsive(10),
    paddingRight: responsive(28),
    marginBottom: responsive(41),
    alignSelf: 'center',
  },
  pillImage: {
    width: responsive(100),
    height: responsive(100),
    marginRight: responsive(2),
  },
  medicineTextContainer: {
    flex: 1,
    alignItems: 'flex-end' as any,
    justifyContent: 'center' as any,
    paddingLeft: responsive(8),
    minWidth: 0, // flex shrink를 위해 필요
  },
  hospitalText: {
    fontWeight: '700' as '700',
    fontSize: responsive(24),
    color: '#EEEEEE',
    lineHeight: responsive(28.8),
    marginBottom: responsive(3),
    textAlign: 'right' as any,
    maxWidth: '100%',
  },
  medicineNameText: {
    fontWeight: '700' as '700',
    fontSize: responsive(48),
    color: '#FFFFFF',
    lineHeight: responsive(57.6),
    textAlign: 'right' as any,
    maxWidth: '100%',
  },
  quizTitleContainer: {
    marginBottom: responsive(6),
  },
  quizTitleMain: {
    fontWeight: '400' as '400',
    fontSize: responsive(24),
    color: '#60584D',
    lineHeight: responsive(29.05),
    marginBottom: 0,
  },
  quizTitleSub: {
    fontWeight: '700' as '700',
    fontSize: responsive(24),
    color: '#60584D',
    lineHeight: responsive(28.8),
  },
  threeTimesWrongBox: {
    width: '100%',
    backgroundColor: '#FFCC02',
    borderRadius: responsive(21),
    paddingHorizontal: responsive(13),
    paddingTop: responsive(43),
    paddingBottom: responsive(57),
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
  },
  threeTimesWrongTextContainer: {
    alignItems: 'center' as any,
  },
  threeTimesWrongMainText: {
    fontWeight: '700' as '700',
    fontSize: responsive(48),
    color: '#545045',
    lineHeight: responsive(57.6),
    marginBottom: responsive(11),
    textAlign: 'center' as any,
  },
  threeTimesWrongSubText: {
    fontWeight: '700' as '700',
    fontSize: responsive(27),
    color: '#545045',
    lineHeight: responsive(32.4),
    textAlign: 'center' as any,
  },
  submitButtonContainer: {
    position: 'absolute',
    left: responsive(16),
    right: responsive(16),
    bottom: responsive(36),
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
  submitButtonInactive: {
    backgroundColor: '#C4BCB1',
  },
  submitButtonText: {
    fontWeight: '700' as '700',
    fontSize: responsive(27),
    color: '#FFFFFF',
    lineHeight: responsive(32.4),
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
    paddingVertical: responsive(40),
  },
  emptyText: {
    fontSize: responsive(18),
    color: '#99a1af',
  },
});

export default IntakeAlarmQuizThreeTimesWrongActiveScreen;

