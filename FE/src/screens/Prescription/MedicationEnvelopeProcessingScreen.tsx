import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import responsive from '../../utils/responsive';
import { uploadMedication, getMedicationDetail } from '../../api/medicationApi';
import { RootStackParamList } from '../../navigation/Router';

type MedicationEnvelopeProcessingScreenRouteProp = RouteProp<RootStackParamList, 'MedicationEnvelopeProcessing'>;
type MedicationEnvelopeProcessingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MedicationEnvelopeProcessing'>;

interface MedicationEnvelopeProcessingScreenProps {
  onSuccess?: (umno?: number, taken?: number, comb?: string) => void; // OCR 성공 시 (umno, taken, comb 전달)
  onFailure?: () => void; // OCR 실패 시
  imageUri?: string; // 촬영된 이미지 URI
}

export default function MedicationEnvelopeProcessingScreen({ 
  onSuccess, 
  onFailure, 
  imageUri: propImageUri
}: MedicationEnvelopeProcessingScreenProps) {
  // 네비게이션 사용 시도 (NavigationContainer 안에 있을 때만 사용 가능)
  // App.tsx에서 직접 사용되는 경우를 대비해 안전하게 처리
  let navigation: MedicationEnvelopeProcessingScreenNavigationProp | null = null;
  let route: MedicationEnvelopeProcessingScreenRouteProp | null = null;
  
  // useNavigation과 useRoute는 Hook이므로 항상 호출해야 하지만, NavigationContainer 밖에서는 에러 발생 가능
  // 따라서 optional하게 사용하도록 처리
  try {
    // NavigationContainer가 있는 경우에만 navigation 사용
    navigation = useNavigation<MedicationEnvelopeProcessingScreenNavigationProp>();
    route = useRoute<MedicationEnvelopeProcessingScreenRouteProp>();
  } catch (error: any) {
    // NavigationContainer 밖에서 렌더링되는 경우 (예: App.tsx에서 직접 사용)
    // 이 경우 onSuccess/onFailure 콜백을 통해 화면 전환 처리
    navigation = null;
    route = null;
  }
  
  // route.params에서 imageUri를 가져오거나 props를 사용
  const imageUri = route?.params?.imageUri || propImageUri;
  
  // 🔥 중복 실행 방지 (useRef로 리렌더링 방지)
  const isProcessingRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // 배경음악 점진적으로 줄이기 (Fade Out)
  const fadeOutMusic = async () => {
    if (!soundRef.current) return;
    try {
      const duration = 500; // 0.5초 동안 페이드 아웃
      const steps = 10; // 10단계로 나눔
      const stepDuration = duration / steps;
      const volumeStep = 0.5 / steps; // 초기 볼륨 0.5에서 0으로

      for (let i = steps; i >= 0; i--) {
        const volume = i * volumeStep;
        await soundRef.current.setVolumeAsync(volume);
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    } catch (error) {
      console.error('[MedicationEnvelopeProcessingScreen] 페이드 아웃 실패:', error);
    }
  };

  // 배경음악 재생 (랜덤 선택)
  useEffect(() => {
    let isMounted = true;
    
    const playBackgroundMusic = async () => {
      try {
        // 랜덤하게 music1 또는 music2 선택
        const musicNumber = Math.random() < 0.5 ? 1 : 2;
        const musicSource = musicNumber === 1 
          ? require('../../../assets/music/music1.mp3')
          : require('../../../assets/music/music2.mp3');
        
        console.log(`[MedicationEnvelopeProcessingScreen] 배경음악 재생 시작: music${musicNumber}.mp3`);
        
        // 오디오 모드 설정
        await Audio.setAudioModeAsync({
          // IOS
          playsInSilentModeIOS: true,
          // Android
          staysActiveInBackground: false,
          playThroughEarpieceAndroid: false,
        });
        
        // 오디오 로드 및 재생
        const { sound: audioSound } = await Audio.Sound.createAsync(
          musicSource,
          { 
            shouldPlay: true,
            isLooping: true, // 반복 재생
            volume: 0.5, // 볼륨 50%
          }
        );
        
        if (isMounted) {
          soundRef.current = audioSound;
          console.log('[MedicationEnvelopeProcessingScreen] 배경음악 재생 성공');
        } else {
          // 컴포넌트가 언마운트된 경우 즉시 정리
          audioSound.unloadAsync();
        }
      } catch (error) {
        console.error('[MedicationEnvelopeProcessingScreen] 배경음악 재생 실패:', error);
      }
    };
    
    playBackgroundMusic();
    
    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
        soundRef.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    // 이미 처리 중이면 중복 실행 방지
    if (isProcessingRef.current) return;
    
    // 약봉투 OCR API 호출 (mode='2')
    const processOCR = async () => {
      if (!imageUri) {
        console.error('❌ 이미지 URI가 없습니다!');
        // 배경음악 종료
        if (soundRef.current) {
          console.log('[MedicationEnvelopeProcessingScreen] 이미지 URI 없음 - 배경음악 페이드 아웃');
          try {
            await fadeOutMusic();
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          } catch (audioError) {
            console.error('[MedicationEnvelopeProcessingScreen] 배경음악 종료 실패:', audioError);
            soundRef.current = null;
          }
        }
        // 실패 시 Capture 화면으로 돌아가기
        if (onFailure) {
          onFailure();
        } else if (navigation) {
          navigation.goBack();
        }
        return;
      }

      try {
        // 🔥 이미지 업로드 (medicationApi에서 ImageManipulator로 리사이징 및 JPEG 변환 처리)
        console.log('=== 📤 약봉투 업로드 시작 ===');
        console.log('Image URI:', imageUri);
        console.log('(medicationApi에서 가로 1024px로 리사이징 및 JPEG 변환 처리됨)');
        
        // 백엔드 모드: "2" (약봉투)
        const backendMode = '2';
        console.log('백엔드 모드:', backendMode, '(약봉투)');
        isProcessingRef.current = true;
        
        console.log('=== 🚀 약봉투 업로드 시작 ===');
        const response = await uploadMedication(backendMode as '2', imageUri);
        
        console.log('약봉투 OCR 응답:', response);
        
        if (response.header?.resultCode === 1000) {
          // 배경음악 종료 (다음 화면으로 이동하기 전)
          if (soundRef.current) {
            console.log('[MedicationEnvelopeProcessingScreen] 성공 - 배경음악 페이드 아웃');
            await fadeOutMusic();
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          }
          
          // 응답에서 umno 추출
          const umno = response.body?.umno;
          
          if (umno) {
            // 복약 상세 정보 조회 (taken, comb 정보 가져오기)
            try {
              const detailResponse = await getMedicationDetail(umno);
              if (detailResponse.header?.resultCode === 1000 && detailResponse.body) {
                const { taken, comb } = detailResponse.body;
                
                // 복약 시간대 선택 화면으로 이동
                if (navigation) {
                  navigation.navigate('PrescriptionIntakeTimeSelect', {
                    umno: umno,
                    taken: taken,
                    comb: comb || '',
                    source: 'medicationEnvelope',
                  });
                } else {
                  // App.tsx에서 사용되는 경우 콜백에 umno, taken, comb 전달
                  onSuccess?.(umno, taken, comb || '');
                }
              } else {
                throw new Error('복약 상세 정보를 불러올 수 없습니다.');
              }
            } catch (detailError: any) {
              console.error('복약 상세 정보 조회 실패:', detailError);
              // 상세 정보 조회 실패 시에도 복약 시간 선택 화면으로 이동 (taken, comb 없이)
              if (navigation) {
                navigation.navigate('PrescriptionIntakeTimeSelect', {
                  umno: umno,
                  taken: undefined,
                  comb: '',
                  source: 'medicationEnvelope',
                });
              } else {
                // App.tsx에서 사용되는 경우 콜백 호출 (taken, comb 없이)
                onSuccess?.(umno, undefined, '');
              }
            }
          } else {
            // umno가 없으면 콜백 호출
            onSuccess?.();
          }
        } else {
          const errorMsg = response.header?.resultMsg || '약봉투 분석에 실패했습니다.';
          throw new Error(errorMsg);
        }
      } catch (error: any) {
        // 에러 발생 시 배경음악 종료
        if (soundRef.current) {
          console.log('[MedicationEnvelopeProcessingScreen] 에러 발생 - 배경음악 페이드 아웃');
          try {
            await fadeOutMusic();
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          } catch (audioError) {
            console.error('[MedicationEnvelopeProcessingScreen] 배경음악 종료 실패:', audioError);
            soundRef.current = null;
          }
        }
        
        console.error('=== 약봉투 OCR 처리 오류 ===');
        console.error('에러 타입:', error.constructor.name);
        console.error('에러 메시지:', error.message);
        if (error.response) {
          console.error('응답 상태:', error.response.status);
          console.error('응답 데이터:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
          console.error('요청은 보냈지만 응답을 받지 못함');
        }
        
        // 에러 메시지 추출
        let errorMessage = '약봉투 분석 중 오류가 발생했습니다.';
        if (error.response?.data?.header?.resultMsg) {
          errorMessage = error.response.data.header.resultMsg;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        Alert.alert(
          '분석 실패',
          errorMessage + '\n\n다시 시도해주세요.',
          [
            {
              text: '확인',
              onPress: () => {
                // 실패 시 Capture 화면으로 돌아가기
                if (onFailure) {
                  onFailure();
                } else if (navigation) {
                  navigation.goBack();
                }
              },
            },
          ]
        );
      } finally {
        isProcessingRef.current = false;
      }
    };

    processOCR();
  }, [onSuccess, onFailure, imageUri]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 로딩 컨테이너 */}
      <View style={styles.loadingContainer}>
        {/* 로딩 인디케이터 (아이콘) */}
        <ActivityIndicator 
          size="large" 
          color="#101828" 
          style={styles.loader}
        />
        
        {/* 로딩 텍스트 */}
        <Text style={styles.loadingText}>
          약봉투를 분석 중입니다
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  loadingContainer: {
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
  },
  loader: {
    width: responsive(68),
    height: responsive(68),
    marginBottom: responsive(12),
  },
  loadingText: {
    fontSize: responsive(24),
    fontWeight: '700' as '700',
    color: '#101828',
    lineHeight: responsive(28.8),
  },
});




