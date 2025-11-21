import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import responsive from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/Router';

type PrescriptionCaptureScreenRouteProp = RouteProp<RootStackParamList, 'PrescriptionCapture'>;
type PrescriptionCaptureScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PrescriptionCapture'>;

interface PrescriptionCaptureScreenProps {
  mode?: 'prescription' | 'envelope';
  onCapture?: (imageUri: string) => void; // 촬영 즉시 Processing으로 이동 (이미지 URI 전달)
  showRetakeMessage?: boolean; // 실패 시 다시 돌아왔을 때 메시지 표시
}

export default function PrescriptionCaptureScreen({ mode: propMode, onCapture, showRetakeMessage: initialShowRetake = false }: PrescriptionCaptureScreenProps) {
  // 네비게이션 사용 시도 (NavigationContainer 안에 있을 때만 사용 가능)
  // App.tsx에서 직접 사용되는 경우를 대비해 안전하게 처리
  let navigation: PrescriptionCaptureScreenNavigationProp | null = null;
  let route: PrescriptionCaptureScreenRouteProp | null = null;
  
  // useNavigation과 useRoute는 Hook이므로 항상 호출해야 하지만, NavigationContainer 밖에서는 에러 발생 가능
  try {
    navigation = useNavigation<PrescriptionCaptureScreenNavigationProp>();
    route = useRoute<PrescriptionCaptureScreenRouteProp>();
  } catch (error: any) {
    // NavigationContainer 밖에서 렌더링되는 경우 (예: App.tsx에서 직접 사용)
    // 이 경우 onCapture 콜백을 통해 화면 전환 처리
    console.warn('네비게이션 컨텍스트를 사용할 수 없습니다. 콜백을 사용합니다.');
    navigation = null;
    route = null;
  }
  
  // route.params에서 mode를 가져오거나 propMode를 사용
  const mode = route?.params?.mode || propMode || 'prescription';
  const [showRetakeMessage, setShowRetakeMessage] = useState(initialShowRetake);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    // 권한 요청
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

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

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    
    try {
      // 카메라로 사진 촬영 (최고 화질 유지)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1, // 최고 화질 유지
        base64: false,
      });
      
      console.log('촬영된 사진 전체 객체:', photo);
      console.log('촬영된 사진 URI:', photo?.uri);
      
      // URI 확인
      if (!photo || !photo.uri) {
        console.error('사진 촬영 실패: photo 또는 photo.uri가 없습니다.');
        setShowRetakeMessage(true);
        setTimeout(() => {
          setShowRetakeMessage(false);
        }, 3000);
        return;
      }
      
      // 이미지 파일 크기 확인 및 압축
      let finalImageUri = photo.uri;
      
      try {
        const fileInfo = await FileSystem.getInfoAsync(photo.uri);
        if (fileInfo.exists && fileInfo.size !== undefined) {
          const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
          const fileSizeKB = (fileInfo.size / 1024).toFixed(2);
          console.log(`📸 원본 이미지 파일 크기: ${fileSizeMB} MB (${fileSizeKB} KB)`);
          console.log(`📸 파일 크기 (bytes): ${fileInfo.size}`);
          
          // 파일 크기가 5MB 이상이면 압축
          if (fileInfo.size > 5 * 1024 * 1024) { // 5MB 이상
            console.log('📦 이미지 압축 시작...');
            
            // 이미지 압축 (최대 너비 1920px, 품질 0.8)
            const manipulatedImage = await ImageManipulator.manipulateAsync(
              photo.uri,
              [{ resize: { width: 1920 } }], // 최대 너비 1920px로 리사이즈
              {
                compress: 0.8, // 품질 80% (0.0 ~ 1.0)
                format: ImageManipulator.SaveFormat.JPEG,
              }
            );
            
            finalImageUri = manipulatedImage.uri;
            
            // 압축된 이미지 크기 확인
            const compressedFileInfo = await FileSystem.getInfoAsync(finalImageUri);
            if (compressedFileInfo.exists && compressedFileInfo.size !== undefined) {
              const compressedSizeMB = (compressedFileInfo.size / (1024 * 1024)).toFixed(2);
              const compressedSizeKB = (compressedFileInfo.size / 1024).toFixed(2);
              const compressionRatio = ((1 - compressedFileInfo.size / fileInfo.size) * 100).toFixed(1);
              
              console.log(`✅ 압축 완료: ${compressedSizeMB} MB (${compressedSizeKB} KB)`);
              console.log(`📊 압축률: ${compressionRatio}% 감소`);
              console.log(`📸 압축된 이미지 URI: ${finalImageUri}`);
            }
          } else {
            console.log('✅ 이미지 크기가 적절합니다. 압축하지 않습니다.');
          }
        } else {
          console.warn('이미지 파일 정보를 가져올 수 없습니다.');
        }
      } catch (fileError) {
        console.warn('파일 크기 확인/압축 실패:', fileError);
        // 압축 실패 시 원본 이미지 사용
        finalImageUri = photo.uri;
      }
      
      // 촬영 즉시 Processing 화면으로 이동 (압축된 이미지 URI 전달)
      // Processing 화면에서 API 호출 및 결과 처리
      if (onCapture) {
        // 콜백이 있으면 콜백 사용 (App.tsx에서 사용되는 경우)
        onCapture(finalImageUri);
      } else if (navigation) {
        // NavigationContainer 안에 있을 때는 네비게이션 사용
        console.log('네비게이션으로 이동:', { imageUri: finalImageUri, mode: mode });
        navigation.navigate('PrescriptionProcessing', {
          imageUri: finalImageUri,
          mode: mode,
        });
      } else {
        // 네비게이션도 콜백도 없는 경우 에러
        console.error('네비게이션과 콜백이 모두 없습니다.');
        setShowRetakeMessage(true);
        setTimeout(() => {
          setShowRetakeMessage(false);
        }, 3000);
      }
      
    } catch (error) {
      console.error('촬영 오류:', error);
      setShowRetakeMessage(true);
      setTimeout(() => {
        setShowRetakeMessage(false);
      }, 3000);
    }
  };

  // 권한이 없는 경우
  if (!permission) {
    return <View style={styles.container}><Text style={styles.permissionText}>카메라 권한 확인 중...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>카메라 권한이 필요합니다</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>권한 허용</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* 카메라 뷰 */}
      <CameraView 
        style={styles.camera} 
        facing="back"
        ref={cameraRef}
      />
      
      {/* 오버레이 레이어 */}
      <View style={styles.overlay}>
        {/* 상단 안내 텍스트 */}
        <View style={styles.guideTextContainer}>
          <Text style={styles.guideText}>
            {mode === 'envelope' ? '약봉투를 틀 안에 맞춰주세요' : '처방전을 틀 안에 맞춰주세요'}
          </Text>
        </View>

        {/* 가이드 프레임 */}
        <View style={styles.guideFrame}>
          {/* 가이드 모서리 표시 */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          
          {/* 재촬영 메시지 (인식 실패 시 3초간 표시) */}
          {showRetakeMessage && (
            <View style={styles.retakeMessageContainer}>
              <Text style={styles.retakeMessageText}>다시 촬영해주세요</Text>
            </View>
          )}
        </View>

        {/* 촬영 버튼 */}
        <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
    paddingHorizontal: responsive(20),
  },
  permissionText: {
    fontSize: responsive(18),
    color: '#ffffff',
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: responsive(10),
    paddingHorizontal: responsive(20),
    paddingVertical: responsive(10),
    marginBottom: responsive(20),
  },
  guideText: {
    
    fontSize: responsive(16),
    fontWeight: '700' as '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  guideFrame: {
    width: responsive(360),
    height: responsive(560),
    borderRadius: responsive(10),
    borderWidth: responsive(2),
    borderColor: 'rgba(255, 255, 255, 0.6)',
    position: 'relative',
    marginBottom: responsive(40),
  },
  corner: {
    position: 'absolute',
    width: responsive(32),
    height: responsive(32),
    borderColor: '#ffffff',
    borderWidth: responsive(2),
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: responsive(10),
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: responsive(10),
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: responsive(10),
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: responsive(10),
  },
  retakeMessageContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: responsive(-130) }, { translateY: responsive(-69) }],
    width: responsive(260),
    height: responsive(138),
    backgroundColor: '#d9d9d9',
    borderRadius: responsive(20),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  retakeMessageText: {
    fontSize: responsive(27),
    fontWeight: '700' as '700',
    color: '#000000',
    textAlign: 'center',
  },
  captureButton: {
    width: responsive(80),
    height: responsive(80),
    borderRadius: responsive(40),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: responsive(4),
    borderColor: '#ffffff',
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  captureButtonInner: {
    width: responsive(60),
    height: responsive(60),
    borderRadius: responsive(30),
    backgroundColor: '#ffffff',
  },
});

