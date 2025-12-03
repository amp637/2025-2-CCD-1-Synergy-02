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
import { getEvents, updateEventStatus, getAIScript } from '../../api/eventApi';
import { playBase64Audio, stopAudio } from '../../utils/ttsPlayer';
import PinchZoomScrollView from '../../components/PinchZoomScrollView';

interface IntakeAlarmQuizScreenProps {
  onMedicationTaken?: () => void;
  onThreeTimesWrong?: (umno?: number, eno?: number) => void; // umno, eno 전달
  initialWrongCount?: number; // 전화에서 돌아왔을 때 3번 틀린 상태 유지
  eno?: number; // 이벤트 번호
  eventDetail?: any;
}

const IntakeAlarmQuizScreen = React.memo(({ onMedicationTaken, onThreeTimesWrong, initialWrongCount = 0, eno, eventDetail }: IntakeAlarmQuizScreenProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isWrong, setIsWrong] = useState(initialWrongCount >= 3);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wrongCount, setWrongCount] = useState(initialWrongCount);
  const [isInteractionComplete, setIsInteractionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [answers, setAnswers] = useState<Array<{ id: string; text: string }>>([]);
  const [correctAnswerId, setCorrectAnswerId] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);

  // 이벤트 데이터 로드
  useEffect(() => {
    const loadEventData = async () => {
      try {
        setIsLoading(true);

        if (eventDetail) {
            console.log('[IntakeAlarmQuizScreen] 알림 데이터 사용:', eventDetail);
            setEventData(eventDetail);

            if (eventDetail.candidate && eventDetail.candidate.answer) {
              const answerList = [
                { id: 'correct', text: eventDetail.candidate.answer },
                ...(eventDetail.candidate.wrong || []).map((wrong: string, index: number) => ({
                  id: `wrong_${index}`,
                  text: wrong,
                })),
              ];
              const shuffled = answerList.sort(() => Math.random() - 0.5);
              const correctIndex = shuffled.findIndex(a => a.id === 'correct');
              setAnswers(shuffled);
              setCorrectAnswerId(correctIndex.toString());
            }
            setIsLoading(false);
            return; 
        }
        
        const response = await getEvents();
        
        if (response.header?.resultCode === 1000 && response.body?.events) {
          const events = response.body.events;
          
          // eno가 있으면 해당 이벤트를 찾고, 없거나 찾을 수 없으면 첫 번째 이벤트 사용
          let event = null;
          if (eno) {
            // 타입 변환을 고려하여 찾기 (숫자와 문자열 모두 지원)
            event = events.find((e: any) => {
              return e.eno === eno || e.eno === Number(eno) || String(e.eno) === String(eno);
            });
            if (!event) {
              // eno가 전달되었지만 찾을 수 없을 때는 첫 번째 이벤트 사용
              event = events[0];
            }
          } else {
            event = events[0];
          }
          
          if (event) {
            // candidate가 없으면 에러
            if (!event.candidate || !event.candidate.answer) {
              console.error('[IntakeAlarmQuizScreen] 이벤트에 candidate 정보가 없습니다.');
              Alert.alert(
                '오류', 
                '퀴즈 정보가 불완전합니다.\n백엔드에서 이벤트 데이터를 확인해주세요.'
              );
              return;
            }
            
            setEventData(event);
            
            // 답변 목록 생성 (정답 + 오답들)
            const answerList = [
              { id: 'correct', text: event.candidate.answer },
              ...(event.candidate.wrong || []).map((wrong: string, index: number) => ({
                id: `wrong_${index}`,
                text: wrong,
              })),
            ];
            
            // 답변 순서 섞기
            const shuffled = answerList.sort(() => Math.random() - 0.5);
            const correctIndex = shuffled.findIndex(a => a.id === 'correct');
            
            if (correctIndex === -1) {
              console.error('[IntakeAlarmQuizScreen] 정답을 찾을 수 없습니다.');
              Alert.alert('오류', '퀴즈 정답 정보를 찾을 수 없습니다.');
              return;
            }
            
            setAnswers(shuffled);
            setCorrectAnswerId(correctIndex.toString());
          } else {
            console.warn('[IntakeAlarmQuizScreen] 이벤트를 찾을 수 없습니다.');
            Alert.alert(
              '알림', 
              eno 
                ? `이벤트(ENO: ${eno})를 찾을 수 없습니다.` 
                : '오늘의 퀴즈가 없습니다.'
            );
          }
        } else {
          console.error('[IntakeAlarmQuizScreen] ⚠️ API 응답이 성공이 아니거나 이벤트가 없습니다.');
          Alert.alert(
            '알림', 
            response.header?.resultMsg || '오늘의 퀴즈가 없습니다.'
          );
        }
      } catch (error: any) {
        console.error('=== [IntakeAlarmQuizScreen] 이벤트 데이터 로드 실패 ===');
        console.error('에러 타입:', error.constructor.name);
        console.error('에러 메시지:', error.message);
        
        if (error.response) {
          console.error('응답 상태:', error.response.status);
          console.error('응답 데이터:', JSON.stringify(error.response.data, null, 2));
          
          if (error.response.status === 500) {
            Alert.alert(
              '서버 오류', 
              '백엔드에서 500 에러가 발생했습니다.\n\n백엔드 로그를 확인해주세요.\n\n에러 경로: /users/me/events'
            );
          } else {
            Alert.alert(
              '오류', 
              `퀴즈 정보를 불러오는데 실패했습니다.\n\n에러 코드: ${error.response.status}`
            );
          }
        } else {
          Alert.alert('오류', '퀴즈 정보를 불러오는데 실패했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEventData();
  }, [eno, eventDetail]);

  // 화면 전환 애니메이션 이후에 실행
  useEffect(() => {
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      setIsInteractionComplete(true);
      console.log('IntakeAlarmQuizScreen: Interactions complete');
    });

    return () => interactionPromise.cancel();
  }, []);

  // TTS 재생 - 화면이 준비되고 이벤트 데이터가 로드되면 재생
  useEffect(() => {
    if (!isLoading && eventData && isInteractionComplete) {
      const playTTS = async () => {
        try {
          // eventData에 audioUrl 또는 audio_url이 있으면 사용, 없으면 getAIScript로 가져오기
          let audioUrl: string | null = null;
          
          // 백엔드에서 audioUrl (camelCase) 또는 audio_url (snake_case)로 반환될 수 있음
          if (eventData.audioUrl) {
            audioUrl = eventData.audioUrl;
          } else if (eventData.audio_url) {
            audioUrl = eventData.audio_url;
          } else if (eventData.umno) {
            // audio_url이 없으면 getAIScript로 가져오기
            try {
              const scriptResponse = await getAIScript(eventData.umno);
              if (scriptResponse.header?.resultCode === 1000 && scriptResponse.body?.audio_url) {
                audioUrl = scriptResponse.body.audio_url;
              }
            } catch (error) {
              console.warn('[IntakeAlarmQuizScreen] TTS 오디오 가져오기 실패:', error);
            }
          }
          
          if (audioUrl) {
            await playBase64Audio(audioUrl);
          }
        } catch (error) {
          console.error('[IntakeAlarmQuizScreen] TTS 재생 실패:', error);
        }
      };
      
      // 약간의 지연 후 TTS 재생 (화면 렌더링 완료 후)
      const timer = setTimeout(() => {
        playTTS();
      }, 500);
      
      return () => {
        clearTimeout(timer);
        // 화면을 이탈할 때만 TTS 종료
        stopAudio();
      };
    }
  }, [isLoading, eventData, isInteractionComplete]);

  // 컴포넌트 언마운트 시 TTS 종료 (화면을 벗어날 때)
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const handleSelectAnswer = useCallback((answerId: string) => {
    if (!correctAnswerId) return;
    
    setSelectedAnswer(answerId);
    
    // 정답 체크 (answers 배열의 인덱스로 비교)
    const selectedIndex = parseInt(answerId);
    const correctIndex = parseInt(correctAnswerId);
    
    if (selectedIndex !== correctIndex) {
      // 오답인 경우
      const newWrongCount = wrongCount + 1;
      setWrongCount(newWrongCount);
      setIsWrong(true);
      setIsCorrect(false);
      
      // 3번 연속 오답이 아닌 경우만 3초 후 퀴즈로 돌아감
      if (newWrongCount < 3) {
        setTimeout(() => {
          setIsWrong(false);
          setSelectedAnswer(null); // 선택 초기화
        }, 3000);
      } else {
        // 3번 연속 오답인 경우 바로 전화 화면으로 이동
        onThreeTimesWrong?.(eventData?.umno, eventData?.eno);
      }
    } else {
      // 정답인 경우
      setIsWrong(false);
      setIsCorrect(true);
    }
  }, [wrongCount, onThreeTimesWrong, correctAnswerId, eventData]);

  // 정답을 맞췄을 때만 버튼 활성화
  const isButtonActive = isCorrect && !isLoading;

  const handleSubmit = useCallback(async () => {
    if (!isButtonActive || isSubmitting || !eventData) return;

    try {
      setIsSubmitting(true);
      
      // 이벤트 상태 업데이트 (복약 완료 처리)
      if (eventData.eno) {
        const response = await updateEventStatus(eventData.eno);
        
        if (response.header?.resultCode === 1000) {
          onMedicationTaken?.();
        } else {
          const errorMsg = response.header?.resultMsg || '복약 완료 처리에 실패했습니다.';
          throw new Error(errorMsg);
        }
      } else {
        // eno가 없으면 그냥 진행
        onMedicationTaken?.();
      }
    } catch (error: any) {
      console.error('[IntakeAlarmQuizScreen] 복약 완료 처리 실패:', error.message);
      
      if (error.response) {
        console.error('응답 상태:', error.response.status);
        console.error('응답 데이터:', JSON.stringify(error.response.data, null, 2));
      }
      
      const errorMessage = error.response?.data?.header?.resultMsg 
        || error.response?.data?.message 
        || error.message 
        || '복약 완료 처리 중 오류가 발생했습니다.';
      
      Alert.alert(
        '처리 실패',
        `${errorMessage}\n\n에러 코드: ${error.response?.status || 'N/A'}`,
        [
          {
            text: '확인',
            onPress: () => {
              // 에러가 발생해도 화면은 유지 (사용자가 다시 시도할 수 있도록)
            }
          }
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [isCorrect, isSubmitting, eventData, onMedicationTaken]);

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

            {/* 오답인 경우 오답 UI 표시 */}
            {isWrong && wrongCount >= 3 ? (
              /* 3번 연속 오답인 경우 정답 공개 */
              <View style={styles.threeTimesWrongBox}>
                <View style={styles.threeTimesWrongTextContainer}>
                  <Text style={styles.threeTimesWrongMainText}>오답</Text>
                  <Text 
                    style={styles.threeTimesWrongSubText}
                    numberOfLines={3}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.7}
                  >
                    정답은{'\n'}
                    {answers.find(a => a.id === correctAnswerId)?.text}이예요.
                  </Text>
                </View>
              </View>
            ) : isWrong ? (
              /* 1~2번 오답인 경우 */
              <View style={styles.wrongAnswerBox}>
                <View style={styles.wrongTextContainer}>
                  <Text style={styles.wrongMainText}>오답</Text>
                  <Text style={styles.wrongSubText}>다시 풀어주세요</Text>
                </View>
              </View>
            ) : isCorrect ? (
              /* 정답인 경우 정답 UI 표시 */
              <View style={styles.correctAnswerBox}>
                <View style={styles.correctTextContainer}>
                  <Text style={styles.correctMainText}>정답</Text>
                  <Text 
                    style={styles.correctSubText}
                    numberOfLines={3}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.7}
                  >
                    정답은{'\n'}
                    {selectedAnswer !== null ? answers[parseInt(selectedAnswer)]?.text : ''}이예요.
                  </Text>
                </View>
              </View>
            ) : (
              /* 퀴즈 컨테이너 - 오답/정답이 아닐 때만 표시 */
              <View style={styles.quizQuestionBox}>
                <Text 
                  style={styles.quizQuestionText}
                  numberOfLines={3}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                >
                  {eventData.question}
                </Text>

                {/* 답변 버튼들 */}
                <View style={styles.answersContainer}>
                  {answers.map((answer, index) => (
                    <TouchableOpacity
                      key={answer.id}
                      style={[
                        styles.answerButton,
                        selectedAnswer === index.toString() && styles.answerButtonSelected,
                      ]}
                      onPress={() => handleSelectAnswer(index.toString())}
                      activeOpacity={0.8}
                    >
                      <View style={styles.answerButtonTextContainer}>
                        <Text
                          style={[
                            styles.answerButtonText,
                            selectedAnswer === index.toString() && styles.answerButtonTextSelected,
                          ]}
                          numberOfLines={3}
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.5}
                        >
                          {answer.text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
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

IntakeAlarmQuizScreen.displayName = 'IntakeAlarmQuizScreen';

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
  wrongAnswerBox: {
    width: '100%',
    backgroundColor: '#FFCC02',
    borderRadius: responsive(21),
    paddingHorizontal: responsive(13),
    paddingTop: responsive(62),
    paddingBottom: responsive(76),
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
    marginBottom: responsive(24),
  },
  wrongTextContainer: {
    alignItems: 'center' as any,
  },
  wrongMainText: {
    fontWeight: '700' as '700',
    fontSize: responsive(48),
    color: '#545045',
    lineHeight: responsive(48),
    marginBottom: responsive(16),
    textAlign: 'center',
  },
  wrongSubText: {
    fontWeight: '700' as '700',
    fontSize: responsive(28),
    color: '#545045',
    lineHeight: responsive(30),
    textAlign: 'center',
  },
  quizQuestionBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: responsive(21),
    paddingHorizontal: responsive(16),
    paddingTop: responsive(20),
    paddingBottom: responsive(25),
  },
  quizQuestionText: {
    fontWeight: '700' as '700',
    fontSize: responsive(24),
    color: '#60584D',
    lineHeight: responsive(28.8),
    marginBottom: responsive(32),
    textAlign: 'left' as any,
  },
  answersContainer: {
    width: '100%',
    flexDirection: 'row' as any,
    flexWrap: 'wrap' as any,
    justifyContent: 'space-between' as any,
    rowGap: responsive(24),
  },
  answerButton: {
    width: '48%',
    minHeight: responsive(56),
    backgroundColor: '#FFCC02',
    borderRadius: responsive(108),
    justifyContent: 'center' as any,
    alignItems: 'stretch' as any,
    paddingHorizontal: responsive(12),
    paddingVertical: responsive(10),
  },
  answerButtonSelected: {
    backgroundColor: '#60584D',
  },
  answerButtonTextContainer: {
    width: '100%',
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    flex: 1,
    paddingHorizontal: responsive(2),
  },
  answerButtonText: {
    fontWeight: '700' as '700',
    fontSize: responsive(24),
    color: '#5E5B50',
    lineHeight: responsive(28.8),
    textAlign: 'center' as any,
    includeFontPadding: false,
    flexShrink: 1,
    alignSelf: 'center' as any,
  },
  answerButtonTextSelected: {
    color: '#FFFFFF',
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
  // 정답 UI 스타일
  correctAnswerBox: {
    width: '100%',
    backgroundColor: '#FFCC02',
    borderRadius: responsive(21),
    paddingHorizontal: responsive(13),
    paddingTop: responsive(43),
    paddingBottom: responsive(57),
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
  },
  correctTextContainer: {
    alignItems: 'center' as any,
  },
  correctMainText: {
    fontWeight: '700' as '700',
    fontSize: responsive(48),
    color: '#545045',
    lineHeight: responsive(57.6),
    marginBottom: responsive(11),
    textAlign: 'center' as any,
  },
  correctSubText: {
    fontWeight: '700' as '700',
    fontSize: responsive(27),
    color: '#545045',
    lineHeight: responsive(32.4),
    textAlign: 'center' as any,
  },
  // 3번 연속 오답 UI 스타일
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

export default IntakeAlarmQuizScreen;
