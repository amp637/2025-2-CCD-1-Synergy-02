import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  useWindowDimensions,
  InteractionManager,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import responsive from '../../utils/responsive';
import { getAIScript } from '../../api/eventApi';
import { playBase64Audio, stopAudio } from '../../utils/ttsPlayer';

interface ActiveCallScreenProps {
  umno?: number; // 복약 번호
  onCallEnd?: () => void;
}

export const ActiveCallScreen = React.memo(({ umno, onCallEnd }: ActiveCallScreenProps) => {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const [isInteractionComplete, setIsInteractionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptData, setScriptData] = useState<any>(null);
  const [isTtsFinished, setIsTtsFinished] = useState(false);

  // AI 스크립트 및 TTS 로드
  useEffect(() => {
    if (!umno) {
      setIsLoading(false);
      return;
    }

    const loadAIScript = async () => {
      try {
        setIsLoading(true);
        setIsTtsFinished(false);
        
        console.log(`[ActiveCallScreen] AI 스크립트 로드 시작 - umno: ${umno}`);
        const response = await getAIScript(umno);
        
        console.log('[ActiveCallScreen] getAIScript 응답:', {
          resultCode: response.header?.resultCode,
          resultMsg: response.header?.resultMsg,
          hasBody: !!response.body,
          hasAudioUrl: !!response.body?.audio_url
        });
        
        if (response.header?.resultCode === 1000 && response.body) {
          setScriptData(response.body);
          
          // Base64 TTS 오디오 재생
          if (response.body.audio_url) {
            try {
              console.log('[ActiveCallScreen] TTS 재생 시작');
              const success = await playBase64Audio(response.body.audio_url, () => {
                // TTS 재생 완료 시 버튼 활성화 및 콜백 호출
                console.log('[ActiveCallScreen] ✅ TTS 재생 완료');
                setIsTtsFinished(true);
                onCallEnd?.();
              });
              
              if (!success) {
                console.log('[ActiveCallScreen] ⚠️ TTS 재생 실패 - 버튼 활성화');
                setIsTtsFinished(true); // 재생 실패 시에도 버튼 활성화
              }
            } catch (audioError) {
              console.error('[ActiveCallScreen] ❌ TTS 재생 에러:', audioError);
              setIsTtsFinished(true); // 에러 발생 시에도 버튼 활성화
            }
          } else {
            console.log('[ActiveCallScreen] ⚠️ audio_url이 없음 - 버튼 활성화');
            setIsTtsFinished(true); // TTS가 없으면 바로 버튼 활성화
          }
        } else {
          console.error(`[ActiveCallScreen] ❌ resultCode가 1000이 아니거나 body가 없음 - resultCode: ${response.header?.resultCode}`);
          setIsTtsFinished(true); // 에러 발생 시에도 버튼 활성화
        }
      } catch (error: any) {
        console.error('=== [ActiveCallScreen] AI 스크립트 로드 실패 ===');
        console.error('에러 타입:', error.constructor.name);
        console.error('에러 메시지:', error.message);
        console.error('umno:', umno);
        
        if (error.response) {
          console.error('응답 상태:', error.response.status);
          console.error('응답 데이터:', JSON.stringify(error.response.data, null, 2));
        }
        
        Alert.alert(
          '오류', 
          `AI 스크립트를 불러오는데 실패했습니다.\n\n에러 코드: ${error.response?.status || 'N/A'}`
        );
        setIsTtsFinished(true); // 에러 발생 시에도 버튼 활성화
      } finally {
        setIsLoading(false);
      }
    };

    loadAIScript();
  }, [umno, onCallEnd]);

  // 컴포넌트 언마운트 시 TTS 정리
  useEffect(() => {
    return () => {
      console.log('[ActiveCallScreen] 컴포넌트 언마운트 - TTS 종료');
      stopAudio();
    };
  }, []);
  
  // 화면 포커스를 잃을 때 TTS 종료 (추가 안전장치)
  useEffect(() => {
    // 화면이 마운트될 때는 아무것도 하지 않음
    return () => {
      // 화면을 벗어날 때 TTS 종료
      console.log('[ActiveCallScreen] 화면 이탈 - TTS 종료');
      stopAudio();
    };
  }, []);

  useEffect(() => {
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      setIsInteractionComplete(true);
      console.log('ActiveCallScreen: Interactions complete');
    });

    return () => interactionPromise.cancel();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#60584d" />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>통화 연결 중...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.pageWrapper, { maxWidth: MAX_WIDTH }]}>
            {/* App Logo - 232x232 */}
            <Image
              source={require('../../../assets/images/icon.png')}
              style={styles.appLogo}
              contentFit="contain"
              cachePolicy="disk"
              priority="high"
              transition={150}
            />
            
            {/* Voice Wave Icon - 232x115 */}
            <Image
              source={require('../../../assets/images/VoiceWaveIcon.png')}
              style={styles.voiceWaveIcon}
              contentFit="contain"
              cachePolicy="disk"
              priority="high"
              transition={150}
            />
            
            {/* 스크립트 설명 (선택적) */}
            {scriptData?.description && (
              <View style={styles.scriptContainer}>
                <Text style={styles.scriptText}>{scriptData.description}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#60584d',
  },
  scrollContent: {
    paddingHorizontal: responsive(16),
    paddingTop: responsive(70),
    paddingBottom: responsive(120),
    alignItems: 'center' as any,
    flexGrow: 1,
  },
  pageWrapper: {
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center' as any,
  },
  appLogo: {
    width: responsive(232),
    height: responsive(232),
    marginTop: responsive(100),
    marginBottom: responsive(24),
  },
  voiceWaveIcon: {
    width: responsive(232),
    height: responsive(115),
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
    color: '#ffffff',
  },
  scriptContainer: {
    marginTop: responsive(24),
    paddingHorizontal: responsive(20),
    paddingVertical: responsive(16),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: responsive(12),
  },
  scriptText: {
    fontSize: responsive(16),
    color: '#ffffff',
    textAlign: 'center' as any,
    lineHeight: responsive(24),
  },
});

