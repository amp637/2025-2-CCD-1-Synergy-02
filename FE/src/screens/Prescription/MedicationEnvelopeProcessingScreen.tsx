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
  let navigation: MedicationEnvelopeProcessingScreenNavigationProp | null = null;
  let route: MedicationEnvelopeProcessingScreenRouteProp | null = null;
  
  try {
    navigation = useNavigation<MedicationEnvelopeProcessingScreenNavigationProp>();
    route = useRoute<MedicationEnvelopeProcessingScreenRouteProp>();
  } catch (error: any) {
    navigation = null;
    route = null;
  }
  
  const imageUri = route?.params?.imageUri || propImageUri;
  
  const isProcessingRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // 배경음악 점진적으로 줄이기 
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
      // 페이드 아웃 완료 후 약간의 대기 (부드러운 종료)
      await new Promise(resolve => setTimeout(resolve, 100));
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
    
    const processOCR = async () => {
      if (!imageUri) {
        console.error('❌ 이미지 URI가 없습니다!');
        if (soundRef.current) {
          console.log('[MedicationEnvelopeProcessingScreen] 이미지 URI 없음 - 배경음악 페이드 아웃');
          try {
            await fadeOutMusic(); // 페이드 아웃 완료 대기
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
        console.log('=== 📤 약봉투 업로드 시작 ===');
        console.log('Image URI:', imageUri);
        console.log('(medicationApi에서 가로 1024px로 리사이징 및 JPEG 변환 처리됨)');
        
        const backendMode = '2';
        console.log('백엔드 모드:', backendMode, '(약봉투)');
        isProcessingRef.current = true;
        
        console.log('=== 🚀 약봉투 업로드 시작 ===');
        const response = await uploadMedication(backendMode as '2', imageUri);
        
        console.log('약봉투 OCR 응답:', response);
        
        if (response.header?.resultCode === 1000) {
          if (soundRef.current) {
            console.log('[MedicationEnvelopeProcessingScreen] 성공 - 배경음악 페이드 아웃');
            await fadeOutMusic(); // 페이드 아웃 완료 대기
            // 페이드 아웃이 완료되면 볼륨이 0이므로 stopAsync는 생략하고 바로 unload
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          }
          
          const umno = response.body?.umno;
          
          if (umno) {
            try {
              const detailResponse = await getMedicationDetail(umno);
              if (detailResponse.header?.resultCode === 1000 && detailResponse.body) {
                const { taken, comb } = detailResponse.body;
                
                if (navigation) {
                  navigation.navigate('PrescriptionIntakeTimeSelect', {
                    umno: umno,
                    taken: taken,
                    comb: comb || '',
                    source: 'medicationEnvelope',
                  });
                } else {
                  onSuccess?.(umno, taken, comb || '');
                }
              } else {
                throw new Error('복약 상세 정보를 불러올 수 없습니다.');
              }
            } catch (detailError: any) {
              console.error('복약 상세 정보 조회 실패:', detailError);
              if (navigation) {
                navigation.navigate('PrescriptionIntakeTimeSelect', {
                  umno: umno,
                  taken: undefined,
                  comb: '',
                  source: 'medicationEnvelope',
                });
              } else {
                onSuccess?.(umno, undefined, '');
              }
            }
          } else {
            onSuccess?.();
          }
        } else {
          const errorMsg = response.header?.resultMsg || '약봉투 분석에 실패했습니다.';
          throw new Error(errorMsg);
        }
      } catch (error: any) {
        if (soundRef.current) {
          console.log('[MedicationEnvelopeProcessingScreen] 에러 발생 - 배경음악 페이드 아웃');
          try {
            await fadeOutMusic(); // 페이드 아웃 완료 대기
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





