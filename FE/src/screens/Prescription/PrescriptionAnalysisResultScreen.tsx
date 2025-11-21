import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import responsive from '../../utils/responsive';


interface Medicine {
  mdno: number;
  name: string;
  classification: string;
  image?: string;
  description?: string;
  information?: string;
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
  medicines: Medicine[];
}

interface PrescriptionAnalysisResultScreenProps {
  onGoHome?: () => void;
}

export default function PrescriptionAnalysisResultScreen({ onGoHome }: PrescriptionAnalysisResultScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();

  // TODO: navigation과 route params는 나중에 연결
  const source = 'prescription' as 'prescription' | 'medicationEnvelope'; // 기본값
  const headerText = source === 'medicationEnvelope' ? '약봉투 분석 완료' : '처방전 분석 완료';
  

  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [categoryText, setCategoryText] = useState('복통약'); // 초기값: API에서 받아온 데이터

  // 실제 API에서 받아온 데이터로 교체
  // GET /api/v1/users/me/medications/{umno}
  const prescriptionData: PrescriptionData = {
    uno: 1,
    umno: 1,
    hospital: '가람병원',
    category: categoryText || '복통약',
    taken: 3,
    combination: 'breakfast,lunch,dinner',
    medicines: [
      {
        mdno: 1,
        name: '이부프로펜 200mg',
        classification: '소염진통제',
        warning: {
          title: '병용 섭취 주의',
          items: ['녹차, 오미자'],
        },
      },
      {
        mdno: 2,
        name: '이부프로펜 200mg',
        classification: '소염진통제',
        warning: {
          title: '병용 섭취 주의',
          items: ['녹차, 오미자'],
        },
      },
    ],
  };


  const handleGoHome = () => {
    console.log("홈으로 이동");
    onGoHome?.();
  };


  const handleCategoryEditPress = () => {
    if (isEditingCategory) {
      // 편집 완료 - API 호출하여 카테고리 저장
      // PUT /api/v1/users/me/medications/{umno}/category
      console.log('카테고리 수정 완료:', categoryText);
      setIsEditingCategory(false);
    } else {
      // 편집 시작
      setIsEditingCategory(true);
    }
  };


  const getCombinationText = (combination?: string) => {
    if (!combination) return '';
    const timeMap: { [key: string]: string } = {
      breakfast: '아침',
      lunch: '점심',
      dinner: '저녁',
      bedtime: '취침 전',
    };
    return combination
      .split(',')
      .map((time) => timeMap[time] || time)
      .join(', ');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="dark" />
      
      {/* Header - 고정 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{headerText}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + responsive(120) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pageWrapper, { maxWidth: MAX_WIDTH }]}>
          {/* 약 정보 섹션 */}
          <View style={styles.medicineInfoSection}>
            {/* 카테고리 태그와 수정 버튼 */}
            <View style={styles.categoryRow}>
              {isEditingCategory ? (
                <View style={styles.medicineTag}>
                  <TextInput
                    style={styles.medicineTagInput}
                    value={categoryText}
                    onChangeText={setCategoryText}
                    autoFocus={true}
                    onSubmitEditing={handleCategoryEditPress}
                    onBlur={handleCategoryEditPress}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.medicineTag}>
                    <Text style={styles.medicineTagText}>{prescriptionData.category}</Text>
                  </View>
                  <TouchableOpacity onPress={handleCategoryEditPress} style={styles.editButtonContainer}>
                    <View style={styles.editButtonBackground}>
                      <Image 
                        source={require('../../../assets/images/PencilIcon.png')}
                        style={styles.editIcon}
                        resizeMode="contain"
                      />
                    </View>
                  </TouchableOpacity>
                </>
              )}
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
                      <View style={styles.medicationHeader}>
                        <Text style={styles.medicationNumber}>#{index + 1}</Text>
                        <View style={styles.medicationTypeTag}>
                          <Text style={styles.medicationTypeText}>{medicine.classification}</Text>
                        </View>
                      </View>
                      <Text style={styles.medicationName}>{medicine.name}</Text>
                    </View>
                  </View>
                  
                  {/* 병용 섭취 주의 */}
                  {medicine.warning && (
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
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View style={[styles.buttonContainer, { bottom: insets.bottom + responsive(36) }]}>
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
  medicineInfoSection: {
    width: '100%',
    marginBottom: responsive(15),
  },
  categoryRow: {
    flexDirection: 'row' as any,
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
    marginRight: responsive(8),
  },
  medicineTagText: {
    fontWeight: '700' as any,
    fontSize: responsive(24),
    color: '#545045',
    lineHeight: responsive(28.8),
  },
  medicineTagInput: {
    fontWeight: '700' as any,
    fontSize: responsive(24),
    color: '#545045',
    lineHeight: responsive(28.8),
    minWidth: responsive(100),
  },
  editButtonContainer: {
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  editButtonBackground: {
    width: responsive(44),
    height: responsive(43),
    backgroundColor: '#60584d',
    borderRadius: responsive(200),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  editIcon: {
    width: responsive(25),
    height: responsive(25),
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
  buttonContainer: {
    position: 'absolute' as any,
    left: responsive(16),
    right: responsive(16),
    alignItems: 'center' as any,
  },
  submitButton: {
    width: '100%',
    height: responsive(66),
    backgroundColor: '#60584d',
    borderRadius: responsive(200),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  submitButtonText: {
    fontSize: responsive(27),
    fontWeight: '700' as any,
    color: '#FFFFFF',
  },
});
