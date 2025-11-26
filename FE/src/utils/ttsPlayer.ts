import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

// 현재 재생 중인 Sound 인스턴스와 파일 경로를 추적
let currentSound: Audio.Sound | null = null;
let currentFileUri: string | null = null;
// 순차 재생 취소 플래그
let isSequentialCancelled = false;

/**
 * 현재 재생 중인 오디오를 중지하고 정리합니다.
 * @param cancelSequential 순차 재생을 취소할지 여부 (기본값: true)
 */
const stopCurrentAudio = async (cancelSequential: boolean = true): Promise<void> => {
  try {
    // 순차 재생 취소 플래그 설정 (순차 재생 중 다음 오디오로 넘어갈 때는 false)
    if (cancelSequential) {
      isSequentialCancelled = true;
    }
    
    if (currentSound) {
      const status = await currentSound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await currentSound.stopAsync();
        console.log('⏹️ [TTS] 이전 오디오 재생 중지');
      }
      await currentSound.unloadAsync();
      currentSound = null;
    }
    
    // 이전 파일 정리
    if (currentFileUri) {
      await FileSystem.deleteAsync(currentFileUri, { idempotent: true });
      currentFileUri = null;
    }
  } catch (error) {
    console.error('❌ [TTS] 이전 오디오 중지 실패:', error);
    // 에러가 발생해도 계속 진행
    currentSound = null;
    currentFileUri = null;
  }
};

/**
 * Base64 인코딩된 오디오 데이터를 재생합니다.
 * 이전에 재생 중인 오디오가 있으면 자동으로 중지하고 새로운 오디오를 재생합니다.
 * @param base64Audio Base64 인코딩된 오디오 문자열
 * @param onFinish 재생 완료 시 호출될 콜백 함수 (선택적)
 * @returns 재생 성공 여부
 */
export const playBase64Audio = async (base64Audio: string, onFinish?: () => void): Promise<boolean> => {
  try {
    if (!base64Audio || base64Audio.trim().length === 0) {
      console.warn('⚠️ [TTS] Base64 오디오 데이터가 없습니다.');
      return false;
    }

    // 이전 재생 중지
    await stopCurrentAudio();

    // Base64 데이터를 디코딩하여 임시 파일로 저장
    const base64Data = base64Audio.trim();
    
    // Base64 문자열이 data URI 형식인지 확인 (예: "data:audio/mp3;base64,...")
    let audioBase64 = base64Data;
    if (base64Data.startsWith('data:')) {
      // data URI에서 base64 부분만 추출
      const commaIndex = base64Data.indexOf(',');
      if (commaIndex !== -1) {
        audioBase64 = base64Data.substring(commaIndex + 1);
      }
    }

    // 임시 파일 경로 생성
    const tempFileUri = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
    currentFileUri = tempFileUri;
    
    // 파일로 저장
    await FileSystem.writeAsStringAsync(tempFileUri, audioBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 오디오 재생 설정
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Sound 객체 생성 및 재생
    const { sound } = await Audio.Sound.createAsync(
      { uri: tempFileUri },
      { shouldPlay: true }
    );
    
    // 현재 재생 중인 Sound 인스턴스 저장
    currentSound = sound;

    // 재생 완료 후 정리
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        // 재생 완료 시 파일 삭제 및 리소스 해제
        sound.unloadAsync().catch(console.error);
        FileSystem.deleteAsync(tempFileUri, { idempotent: true }).catch(console.error);
        
        // 현재 재생 중인 인스턴스 초기화
        if (currentSound === sound) {
          currentSound = null;
          currentFileUri = null;
          console.log('✅ [TTS] 오디오 재생 완료 및 정리');
          
          // 재생 완료 콜백 호출
          if (onFinish) {
            onFinish();
          }
        }
      }
    });

    console.log('✅ [TTS] 오디오 재생 시작');
    return true;
  } catch (error) {
    console.error('❌ [TTS] 오디오 재생 실패:', error);
    // 에러 발생 시 정리
    currentSound = null;
    currentFileUri = null;
    return false;
  }
};

/**
 * 여러 오디오를 순차적으로 재생합니다.
 * @param audioUrls Base64 인코딩된 오디오 문자열 배열
 */
export const playSequentialAudio = async (audioUrls: string[]): Promise<void> => {
  // 취소 플래그 초기화
  isSequentialCancelled = false;
  
  for (let i = 0; i < audioUrls.length; i++) {
    // 취소되었는지 확인
    if (isSequentialCancelled) {
      console.log('⏹️ [TTS] 순차 재생이 취소되었습니다.');
      break;
    }
    
    const audioUrl = audioUrls[i];
    if (!audioUrl || audioUrl.trim().length === 0) {
      continue;
    }

    try {
      // 이전 재생 중지 (첫 번째 오디오가 아닌 경우)
      // 순차 재생 중이므로 cancelSequential을 false로 설정하여 계속 재생
      if (i > 0) {
        await stopCurrentAudio(false);
      } else {
        // 첫 번째 오디오 재생 전에 이전 오디오가 있으면 정리 (순차 재생 취소하지 않음)
        if (currentSound) {
          await stopCurrentAudio(false);
        }
      }
      
      // 취소되었는지 다시 확인
      if (isSequentialCancelled) {
        console.log('⏹️ [TTS] 순차 재생이 취소되었습니다.');
        break;
      }

      const base64Data = audioUrl.trim();
      let audioBase64 = base64Data;
      if (base64Data.startsWith('data:')) {
        const commaIndex = base64Data.indexOf(',');
        if (commaIndex !== -1) {
          audioBase64 = base64Data.substring(commaIndex + 1);
        }
      }

      const tempFileUri = `${FileSystem.cacheDirectory}tts_${Date.now()}_${i}.mp3`;
      currentFileUri = tempFileUri;

      await FileSystem.writeAsStringAsync(tempFileUri, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: tempFileUri },
        { shouldPlay: true }
      );

      currentSound = sound;

      // 재생 완료를 기다림
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('재생 타임아웃'));
        }, 60000); // 60초 타임아웃
        
        sound.setOnPlaybackStatusUpdate((status) => {
          // 취소되었는지 확인
          if (isSequentialCancelled) {
            clearTimeout(timeout);
            sound.stopAsync().catch(console.error);
            sound.unloadAsync().catch(console.error);
            FileSystem.deleteAsync(tempFileUri, { idempotent: true }).catch(console.error);
            if (currentSound === sound) {
              currentSound = null;
              currentFileUri = null;
            }
            resolve();
            return;
          }
          
          if (status.isLoaded) {
            if (status.didJustFinish) {
              clearTimeout(timeout);
              sound.unloadAsync().catch(console.error);
              FileSystem.deleteAsync(tempFileUri, { idempotent: true }).catch(console.error);
              if (currentSound === sound) {
                currentSound = null;
                currentFileUri = null;
              }
              resolve();
            }
          } else {
            // 로드되지 않은 경우 에러로 처리
            clearTimeout(timeout);
            reject(new Error('오디오 로드 실패'));
          }
        });
      });
    } catch (error) {
      console.error(`❌ [TTS] ${i + 1}번째 오디오 재생 실패:`, error);
      // 에러가 발생해도 다음 오디오 재생 시도 (취소되지 않은 경우)
      if (!isSequentialCancelled) {
        currentSound = null;
        currentFileUri = null;
      }
    }
  }
  
  // 순차 재생 완료 또는 취소 후 플래그 초기화
  isSequentialCancelled = false;
};

/**
 * 현재 재생 중인 오디오를 중지합니다.
 */
export const stopAudio = async (): Promise<void> => {
  // 순차 재생 취소 플래그 설정
  isSequentialCancelled = true;
  await stopCurrentAudio();
};


