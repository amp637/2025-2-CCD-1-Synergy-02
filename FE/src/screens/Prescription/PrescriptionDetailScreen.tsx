import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import responsive from '../../utils/responsive';
import { getMedicationDetail, MedicationDetailResponse, getMedicationCombination } from '../../api/medicationApi';
import { useMedicationStore } from '../../stores/medicationStore';
import { getMedicineImageSource } from '../../utils/medicineImageMap';
import { playBase64Audio, playSequentialAudio, stopAudio } from '../../utils/ttsPlayer';
import PinchZoomScrollView from '../../components/PinchZoomScrollView';

interface Medicine {
  mdno: number;
  name: string;
  classification: string;
  image?: string;
  description?: string;
  information?: string;
  audioUrl?: string; // TTS 오디오 URL
  warning?: {
    title: string;
    items: string[];
  };
  materials?: Array<{
    mtno: number;
    name: string;
  }>;
}

interface PrescriptionData {
  uno: number;
  umno: number;
  hospital: string;
  category: string;
  taken: number; 
  combination?: string; 
  date?: string;
  medicines: Medicine[];
}

interface SimpleMedication {
  id: number;
  category: string;
  hospital: string;
  frequency: number;
  startDate: string;
}

interface PrescriptionDetailScreenProps {
  umno: number; // 복약 정보 ID
  onGoHome?: () => void;
  onEditTime?: (timePeriods: string[]) => void; // 복약 시간대 배열 전달
}

export default function PrescriptionDetailScreen({ umno, onGoHome, onEditTime }: PrescriptionDetailScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();
  const { setSelectedUmno } = useMedicationStore();

  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playingTtsMdno, setPlayingTtsMdno] = useState<number | null>(null); // 현재 재생 중인 약품의 mdno
  
  // 컴포넌트 언마운트 시 TTS 종료 (추가 안전장치)
  useEffect(() => {
    return () => {
      console.log('[PrescriptionDetailScreen] 컴포넌트 언마운트 - TTS 종료');
      stopAudio();
      setPlayingTtsMdno(null);
    };
  }, []);
  
  // Store에 선택된 복약 설정
  useEffect(() => {
    if (umno) {
      setSelectedUmno(umno);
      console.log('[PrescriptionDetailScreen] 선택된 복약 umno 설정:', umno);
    }
  }, [umno, setSelectedUmno]);

  // 복약 상세 정보 조회
  useEffect(() => {
    const loadMedicationDetail = async () => {
      try {
        setIsLoading(true);
        const response = await getMedicationDetail(umno);
        console.log('=== 복약 상세 정보 응답 ===');
        console.log('응답 상태:', response.header?.resultCode);
        console.log('응답 본문:', JSON.stringify(response.body, null, 2));
        
        if (response.header?.resultCode === 1000 && response.body) {
          const data = response.body;
          console.log('약품 개수:', data.medicines?.length || 0);
          console.log('약품 목록:', data.medicines);
          
          setPrescriptionData({
            uno: 0, // 필요시 추가
            umno: data.umno,
            hospital: data.hospital,
            category: data.category,
            taken: data.taken,
            combination: data.comb,
            medicines: data.medicines.map((med) => {
              // materials 파싱 (배열이 중첩되어 있을 수 있음)
              let materials: any[] = [];
              
              // materials가 존재하는지 확인
              if (med.materials !== null && med.materials !== undefined) {
                try {
                  if (Array.isArray(med.materials)) {
                    // 배열인 경우 평탄화 처리
                    const flattened: any[] = [];
                    const flattenArray = (arr: any[]) => {
                      arr.forEach((item: any) => {
                        if (Array.isArray(item)) {
                          flattenArray(item);
                        } else {
                          flattened.push(item);
                        }
                      });
                    };
                    flattenArray(med.materials);
                    
                    // 객체 배열인 경우 name 속성 추출
                    materials = flattened.map((m: any) => {
                      if (m === null || m === undefined) return null;
                      if (typeof m === 'object') {
                        // MaterialDTO 형태: { mtno: number, name: string }
                        const materialObj = m as { name?: string; mtno?: number };
                        return materialObj.name || materialObj.mtno || null;
                      }
                      return m;
                    }).filter((m: any) => m !== null && m !== undefined && m !== '');
                  } else if (typeof med.materials === 'object') {
                    // 단일 객체인 경우
                    const materialObj = med.materials as { name?: string; mtno?: number };
                    materials = [materialObj.name || materialObj.mtno || med.materials].filter(Boolean);
                  } else {
                    // 문자열이나 다른 타입인 경우
                    materials = [med.materials].filter(Boolean);
                  }
                } catch (error) {
                  console.error(`[PrescriptionDetailScreen] materials 파싱 오류 (${med.name}):`, error);
                  materials = [];
                }
              }
              
              // materials를 warning 형식으로 변환
              const warningItems = materials.map((m: any) => {
                if (typeof m === 'object' && m !== null) {
                  const materialObj = m as { name?: string };
                  return materialObj.name || String(m);
                }
                return String(m);
              }).filter(Boolean);
              
              const warning = warningItems.length > 0 ? {
                title: '병용 섭취 주의',
                items: warningItems,
              } : undefined;
              
              // 개발 모드에서만 상세 로그 출력
              if (__DEV__ && warning) {
                console.log(`[PrescriptionDetailScreen] 약품: ${med.name} - 병용섭취 주의: ${warningItems.join(', ')}`);
              }
              
              return {
                mdno: med.mdno,
                name: med.name,
                classification: med.classification,
                image: med.image,
                description: med.description,
                information: med.information,
                audioUrl: med.audioUrl, // TTS 오디오 URL 추가
                materials: materials,
                warning: warning,
              };
            }),
          });
          
          console.log('설정된 약품 개수:', data.medicines?.length || 0);
        }
      } catch (error: any) {
        console.error('복약 상세 정보 조회 실패:', error);
        Alert.alert('오류', '복약 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    loadMedicationDetail();
  }, [umno]);

  // 화면이 켜지면 모든 약품의 TTS를 순차적으로 재생
  useEffect(() => {
    if (prescriptionData && prescriptionData.medicines && prescriptionData.medicines.length > 0) {
      const audioUrls = prescriptionData.medicines
        .map(med => med.audioUrl)
        .filter((url): url is string => !!url && url.trim().length > 0);
      
      if (audioUrls.length > 0) {
        console.log(`[PrescriptionDetailScreen] ${audioUrls.length}개의 약품 TTS 순차 재생 시작`);
        playSequentialAudio(audioUrls)
          .then(() => {
            console.log('[PrescriptionDetailScreen] 모든 약품 TTS 재생 완료');
            setPlayingTtsMdno(null);
          })
          .catch(error => {
            console.error('[PrescriptionDetailScreen] TTS 순차 재생 실패:', error);
            setPlayingTtsMdno(null);
          });
      }
    }

    // 화면을 벗어나면 TTS 종료 (useEffect cleanup)
    return () => {
      console.log('[PrescriptionDetailScreen] useEffect cleanup - TTS 종료');
      stopAudio();
      setPlayingTtsMdno(null);
    };
  }, [prescriptionData]);

  const handleGoHome = () => {
    console.log('[PrescriptionDetailScreen] 홈으로 이동 - TTS 종료');
    stopAudio();
    setPlayingTtsMdno(null);
    onGoHome?.();
  };

  const handleEditTime = async () => {
    try {
      // 이미 로드된 복약 상세 정보에서 comb 필드 사용
      // comb는 "breakfast,lunch,dinner" 형식의 문자열
      if (prescriptionData?.combination) {
        const combString = prescriptionData.combination;
        const timePeriods: string[] = [];
        
        // comb 문자열을 파싱하여 시간대 추출
        const combParts = combString.split(',').map(part => part.trim().toLowerCase());
        
        // 각 시간대가 comb에 포함되어 있으면 배열에 추가
        if (combParts.includes('breakfast') || combParts.includes('morning')) {
          timePeriods.push('breakfast');
        }
        if (combParts.includes('lunch')) {
          timePeriods.push('lunch');
        }
        if (combParts.includes('dinner') || combParts.includes('evening')) {
          timePeriods.push('dinner');
        }
        if (combParts.includes('night') || combParts.includes('bedtime')) {
          timePeriods.push('bedtime');
        }
        
        // 시간대가 있으면 해당 시간대만 순차적으로 설정
        if (timePeriods.length > 0) {
          console.log(`[PrescriptionDetailScreen] 시간 수정 - 설정된 시간대: ${timePeriods.join(', ')}`);
          onEditTime?.(timePeriods);
        } else {
          Alert.alert('알림', '설정된 복약 시간대가 없습니다.');
        }
      } else {
        // comb 필드가 없으면 API 호출하여 조회
        console.log('[PrescriptionDetailScreen] comb 필드가 없어 API 호출하여 조회');
        const combinationResponse = await getMedicationCombination(umno);
        if (combinationResponse.header?.resultCode === 1000 && combinationResponse.body) {
          const combination = combinationResponse.body;
          const timePeriods: string[] = [];
          
          // 각 시간대가 설정되어 있으면 배열에 추가
          if (combination.breakfast > 0) timePeriods.push('breakfast');
          if (combination.lunch > 0) timePeriods.push('lunch');
          if (combination.dinner > 0) timePeriods.push('dinner');
          if (combination.night > 0) timePeriods.push('bedtime');
          
          // 시간대가 있으면 해당 시간대만 순차적으로 설정
          if (timePeriods.length > 0) {
            console.log(`[PrescriptionDetailScreen] 시간 수정 (API 조회) - 설정된 시간대: ${timePeriods.join(', ')}`);
            onEditTime?.(timePeriods);
          } else {
            Alert.alert('알림', '설정된 복약 시간대가 없습니다.');
          }
        } else {
          Alert.alert('오류', '복약 시간 조합을 불러오는데 실패했습니다.');
        }
      }
    } catch (error: any) {
      console.error('복약 시간 조합 조회 실패:', error);
      Alert.alert('오류', '복약 시간 조합을 불러오는데 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="dark" />
      
      {/* Header - 고정 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>복약 상세 정보</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60584d" />
          <Text style={styles.loadingText}>복약 정보 불러오는 중...</Text>
        </View>
      ) : prescriptionData ? (
        <PinchZoomScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + responsive(66) + responsive(16) + responsive(16) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.pageWrapper, { maxWidth: MAX_WIDTH }]}>
            {/* 카테고리 및 병원 정보 섹션 */}
            <View style={styles.infoSection}>
              <View style={styles.topRow}>
                {/* 카테고리 태그 */}
                <View style={styles.medicineTag}>
                  <Text style={styles.medicineTagText}>{prescriptionData.category}</Text>
                </View>
                
                {/* 시간 수정 버튼 */}
                <TouchableOpacity onPress={handleEditTime} style={styles.editTimeButton}>
                  <Image 
                    source={require('../../../assets/images/PencilIcon.png')}
                    style={styles.editTimeIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.editTimeText}>시간 수정</Text>
                </TouchableOpacity>
              </View>

              {/* 병원 정보 */}
              <Text style={styles.hospitalInfo}>
                {prescriptionData.hospital} - 1일 {prescriptionData.taken}회
              </Text>
            </View>

            {/* 약 카드 섹션 */}
            <View style={styles.medicationCard}>
              {prescriptionData.medicines.map((medicine, index) => (
              <View key={medicine.mdno} style={styles.medicationItemWrapper}>
                <View style={styles.medicationLeftBar} />
                <View style={styles.medicationContentWrapper}>
                  <View style={styles.medicationItem}>
                    <View style={styles.medicationContent}>
                      <View style={styles.medicationHeaderWithImage}>
                        <View style={styles.medicationTextContainer}>
                          <View style={styles.medicationHeader}>
                            <Text style={styles.medicationNumber}>#{index + 1}</Text>
                            <View style={styles.medicationTypeTag}>
                              <Text style={styles.medicationTypeText}>{medicine.classification}</Text>
                            </View>
                          </View>
                          <Text style={styles.medicationName}>{medicine.name}</Text>
                        </View>
                        {/* 약 이미지 - 오른쪽 상단 */}
                        <View style={styles.medicationImageContainer}>
                          <Image
                            source={getMedicineImageSource(medicine.mdno)}
                            style={styles.medicationImage}
                            resizeMode="contain"
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  {/* 병용 섭취 주의 - 약 설명 위에 배치 */}
                  {medicine.warning && medicine.warning.items && medicine.warning.items.length > 0 && (
                    <View style={styles.warningSection}>
                      <View style={styles.warningHeader}>
                        <Image
                          source={require('../../../assets/images/caution.png')}
                          style={styles.warningIcon}
                        />
                        <Text style={styles.warningTitle}>{medicine.warning.title}</Text>
                      </View>
                      <Text style={styles.warningText}>{medicine.warning.items.join(', ')}</Text>
                    </View>
                  )}
                  
                  {/* 약 설명 */}
                  {medicine.description && (
                    <View style={styles.descriptionSection}>
                      {/* TTS 재생 버튼 - 우상단 구석 */}
                      {medicine.audioUrl && (
                        <TouchableOpacity
                          style={[
                            styles.ttsButton,
                            playingTtsMdno === medicine.mdno && styles.ttsButtonPlaying
                          ]}
                          onPress={async () => {
                            // 다른 TTS가 재생 중이면 무조건 중지 (다른 약품이거나 순차 재생 중)
                            // playBase64Audio 내부에서 자동으로 이전 TTS를 종료하지만,
                            // 순차 재생 중일 수 있으므로 명시적으로 종료
                            if (playingTtsMdno !== null) {
                              await stopAudio();
                            }
                            
                            // 현재 약품의 TTS 재생 (playBase64Audio가 자동으로 이전 TTS 종료)
                            setPlayingTtsMdno(medicine.mdno);
                            const success = await playBase64Audio(medicine.audioUrl!, () => {
                              // 재생 완료 시 상태 초기화
                              setPlayingTtsMdno(null);
                            });
                            
                            if (!success) {
                              setPlayingTtsMdno(null);
                            }
                          }}
                        >
                          <Text style={styles.ttsButtonText}>
                            {playingTtsMdno === medicine.mdno ? '🔊' : '🔊'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      <Text style={styles.descriptionText}>{medicine.description}</Text>
                    </View>
                  )}
                </View>
              </View>
              ))}
            </View>
          </View>
        </PinchZoomScrollView>
      ) : null}

      {/* 하단 전체를 덮는 그라데이션 (버튼 포함!) */}
      <View style={[styles.bottomFadeContainer, { paddingBottom: insets.bottom + responsive(16) }]}>
        <LinearGradient
          colors={['transparent', '#F6F7F8']}
          style={styles.gradient}
        />
        {/* 버튼은 그라데이션 내부에 배치 */}
        <TouchableOpacity 
          style={[styles.submitButton, { maxWidth: MAX_WIDTH }]}
          onPress={handleGoHome}
        >
          <Text style={styles.submitButtonText}>홈으로</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
    fontWeight: '700' as any,
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
  infoSection: {
    width: '100%',
    marginBottom: responsive(15),
  },
  topRow: {
    flexDirection: 'row' as any,
    justifyContent: 'space-between' as any,
    alignItems: 'center' as any,
    marginBottom: responsive(8),
  },
  medicineTag: {
    backgroundColor: '#FFF4C9',
    borderWidth: responsive(1),
    borderColor: '#545045',
    borderRadius: responsive(15),
    paddingHorizontal: responsive(16),
    paddingVertical: responsive(8),
  },
  medicineTagText: {
    fontWeight: '700' as any,
    fontSize: responsive(24),
    color: '#545045',
    lineHeight: responsive(28.8),
  },
  editTimeButton: {
    backgroundColor: '#FFCC02',
    borderRadius: responsive(10),
    paddingHorizontal: responsive(12),
    paddingVertical: responsive(8),
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    height: responsive(39),
  },
  editTimeIcon: {
    width: responsive(16),
    height: responsive(16),
    marginRight: responsive(4),
  },
  editTimeText: {
    fontSize: responsive(17),
    fontWeight: '700' as any,
    color: '#60584d',
    lineHeight: responsive(20.4),
  },
  hospitalInfo: {
    fontWeight: '700' as any,
    fontSize: responsive(32),
    color: '#666666',
    lineHeight: responsive(38.4),
    marginBottom: responsive(4),
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
    paddingVertical: responsive(14),
  },
  medicationContent: {
    flex: 1,
  },
  medicationHeaderWithImage: {
    flexDirection: 'row' as any,
    alignItems: 'flex-start' as any,
    justifyContent: 'space-between' as any,
  },
  medicationTextContainer: {
    flex: 1,
    marginRight: responsive(12),
  },
  medicationHeader: {
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    marginBottom: responsive(6),
  },
  medicationNumber: {
    fontWeight: '400' as any,
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
    fontWeight: '700' as any,
    fontSize: responsive(16),
    color: '#60584D',
    lineHeight: responsive(20.8),
  },
  medicationName: {
    fontWeight: '700' as any,
    fontSize: responsive(20),
    color: '#364153',
    lineHeight: responsive(24),
  },
  medicationImageContainer: {
    width: responsive(60),
    height: responsive(60),
    borderRadius: responsive(8),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    marginLeft: responsive(12),
  },
  medicationImage: {
    width: responsive(60),
    height: responsive(60),
    borderRadius: responsive(8),
  },
  ttsButton: {
    position: 'absolute' as any,
    top: responsive(8),
    right: responsive(8),
    width: responsive(20),
    height: responsive(20),
    borderRadius: responsive(10),
    backgroundColor: '#60584D',
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
    zIndex: 10,
  },
  ttsButtonPlaying: {
    backgroundColor: '#8B8268',
  },
  ttsButtonText: {
    fontSize: responsive(12),
    color: '#FFFFFF',
  },
  descriptionSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: responsive(4),
    padding: responsive(8),
    marginBottom: responsive(8),
    position: 'relative' as any,
  },
  descriptionText: {
    fontSize: responsive(14),
    fontWeight: '400' as any,
    color: '#364153',
    lineHeight: responsive(20),
    paddingRight: responsive(32), // 스피커 버튼 공간 확보 (버튼 너비 20 + 여백 12)
  },
  warningSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: responsive(12),
    padding: responsive(12),
    borderWidth: responsive(1),
    borderColor: '#FFE5B4',
  },
  warningHeader: {
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    marginBottom: responsive(8),
  },
  warningIcon: {
    width: responsive(20),
    height: responsive(20),
    marginRight: responsive(8),
  },
  warningTitle: {
    fontSize: responsive(16),
    fontWeight: '700' as any,
    color: '#D97706',
  },
  warningText: {
    fontSize: responsive(14),
    fontWeight: '400' as any,
    color: '#92400E',
  },
  bottomFadeContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: responsive(32),
    alignItems: 'center' as any,
    zIndex: 10,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  submitButton: {
    width: '90%',
    height: responsive(66),
    backgroundColor: '#60584d',
    borderRadius: responsive(200),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    zIndex: 20,
  },
  submitButtonText: {
    fontSize: responsive(27),
    fontWeight: '700' as any,
    color: '#FFFFFF',
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
});
