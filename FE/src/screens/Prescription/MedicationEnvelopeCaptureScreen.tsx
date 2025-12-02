import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import responsive from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/Router';

type MedicationEnvelopeCaptureScreenRouteProp = RouteProp<RootStackParamList, 'MedicationEnvelopeCapture'>;
type MedicationEnvelopeCaptureScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MedicationEnvelopeCapture'>;

interface MedicationEnvelopeCaptureScreenProps {
  onCapture?: (imageUri: string) => void; // 촬영 즉시 Processing으로 이동 (이미지 URI 전달)
  showRetakeMessage?: boolean; // 실패 시 다시 돌아왔을 때 메시지 표시
  onBack?: () => void; // 뒤로가기 버튼 클릭 시 호출 (App.tsx에서 홈으로 이동)
}

export default function MedicationEnvelopeCaptureScreen({ onCapture, showRetakeMessage: initialShowRetake = false, onBack }: MedicationEnvelopeCaptureScreenProps) {
  // 네비게이션 사용 시도 (NavigationContainer 안에 있을 때만 사용 가능)
  // App.tsx에서 직접 사용되는 경우를 대비해 안전하게 처리
  // useNavigation과 useRoute는 Hook이므로 항상 호출해야 하지만, NavigationContainer 밖에서는 에러 발생 가능
  // 따라서 optional하게 사용하도록 처리
  let navigation: MedicationEnvelopeCaptureScreenNavigationProp | null = null;
  let route: MedicationEnvelopeCaptureScreenRouteProp | null = null;
  
  // NavigationContainer가 있는지 확인
  try {
    // NavigationContainer가 있는 경우에만 navigation 사용
    navigation = useNavigation<MedicationEnvelopeCaptureScreenNavigationProp>();
    route = useRoute<MedicationEnvelopeCaptureScreenRouteProp>();
  } catch (error: any) {
    // NavigationContainer 밖에서 렌더링되는 경우 (예: App.tsx에서 직접 사용)
    // 이 경우 onCapture 콜백을 통해 화면 전환 처리
    navigation = null;
    route = null;
  }
  
  const [showRetakeMessage, setShowRetakeMessage] = useState(initialShowRetake);
  const [imageUri, setImageUri] = useState<string>('');
  
  // 카메라 권한 요청
  const [status, requestPermission] = ImagePicker.useCameraPermissions();

  useEffect(() => {
    // 권한 요청
    if (!status?.granted) {
      requestPermission();
    }
  }, []);

  // 권한이 허용되면 자동으로 카메라 실행
  useEffect(() => {
    if (status?.granted && !imageUri) {
      // 이미지가 없을 때만 자동 실행 (재촬영이 아닐 때)
      handleCameraCapture();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.granted]);

  // 재촬영 메시지가 전달되면 3초간 표시
  useEffect(() => {
    if (initialShowRetake) {
      setShowRetakeMessage(true);
      const timer = setTimeout(() => {
        setShowRetakeMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [initialShowRetake]);

  // 뒤로가기 버튼 처리 (카메라 화면에서 뒤로가기 누르면 홈으로 이동)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // 카메라 화면에서 뒤로가기 누르면 홈으로 이동
      if (navigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' as any }],
        });
      } else if (onBack) {
        // App.tsx에서 사용되는 경우 onBack 콜백 호출
        onBack();
      }
      return true; // 기본 동작 방지
    });

    return () => backHandler.remove();
  }, [navigation, onBack]);

  const handleCameraCapture = async () => {
    // 권한 확인
    if (!status?.granted) {
      const permission = await requestPermission();
      if (!permission.granted) {
        Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
        return;
      }
    }

    try {
      // 카메라로 사진 촬영 (확인 화면 없이 즉시 촬영)
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1, // 최고 품질
        base64: false,
        exif: false,
      });

      if (result.canceled) {
        // 촬영 취소 시 홈 화면으로 이동
        if (navigation) {
          // 홈 화면으로 이동
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' as any }],
          });
        } else if (onCapture) {
          // App.tsx에서 사용되는 경우 홈으로 이동하도록 처리
          // onCapture 콜백이 없으면 그냥 돌아감
        }
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        setShowRetakeMessage(true);
        setTimeout(() => {
          setShowRetakeMessage(false);
        }, 3000);
        return;
      }

      const capturedImage = result.assets[0];
      // 원본 이미지 URI 사용 (리사이징 및 압축 없이)
      const finalImageUri = capturedImage.uri;

      // 파일 존재 여부 확인
      const fileInfo = await FileSystem.getInfoAsync(finalImageUri);

      if (!fileInfo.exists || (fileInfo.exists && 'size' in fileInfo && fileInfo.size === 0)) {
        console.error('[MedicationEnvelopeCaptureScreen] 파일이 존재하지 않거나 크기가 0입니다.');
        setShowRetakeMessage(true);
        setTimeout(() => {
          setShowRetakeMessage(false);
        }, 3000);
        return;
      }

      // 이미지 URI 저장하지 않고 즉시 Processing 화면으로 이동
      if (onCapture) {
        onCapture(finalImageUri);
      } else if (navigation) {
        navigation.navigate('MedicationEnvelopeProcessing', {
          imageUri: finalImageUri,
        });
      }
    } catch (error) {
      console.error('약봉투 카메라 촬영 오류:', error);
      setShowRetakeMessage(true);
      setTimeout(() => {
        setShowRetakeMessage(false);
      }, 3000);
    }
  };

  // 권한이 없는 경우
  if (!status) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>카메라 권한 확인 중...</Text>
      </View>
    );
  }

  if (!status.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>카메라 접근 권한이 필요합니다</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>권한 허용</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 이미지가 촬영되면 즉시 Processing으로 이동하므로 미리보기 화면은 표시하지 않음

  // 이미지가 없으면 카메라 실행 중이므로 로딩 화면 표시 (또는 빈 화면)
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>카메라 준비 중...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
    paddingHorizontal: responsive(20),
  },
  permissionText: {
    fontSize: responsive(18),
    color: '#000000',
    textAlign: 'center',
    marginBottom: responsive(20),
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: responsive(30),
    paddingVertical: responsive(15),
    borderRadius: responsive(10),
  },
  permissionButtonText: {
    fontSize: responsive(16),
    fontWeight: '600' as any,
    color: '#ffffff',
  },
  guideTextContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: responsive(10),
    paddingHorizontal: responsive(20),
    paddingVertical: responsive(15),
    marginBottom: responsive(30),
  },
  guideText: {
    fontSize: responsive(18),
    fontWeight: '700' as '700',
    color: '#000000',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
  },
  loadingText: {
    fontSize: responsive(16),
    color: '#666666',
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
  },
  previewImage: {
    width: responsive(300),
    height: responsive(400),
    borderRadius: responsive(10),
    marginBottom: responsive(20),
  },
  selectButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: responsive(30),
    paddingVertical: responsive(15),
    borderRadius: responsive(10),
  },
  selectButtonText: {
    fontSize: responsive(16),
    fontWeight: '600' as any,
    color: '#ffffff',
  },
  retakeMessageContainer: {
    position: 'absolute',
    top: responsive(100),
    width: responsive(260),
    height: responsive(60),
    backgroundColor: '#ff6b6b',
    borderRadius: responsive(10),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  retakeMessageText: {
    fontSize: responsive(16),
    fontWeight: '700' as '700',
    color: '#ffffff',
    textAlign: 'center',
  },
});



