import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import responsive from '../../utils/responsive';

// 임시 데이터 - 나중에 API로 대체
interface Medication {
  id: number;
  category: string;
  hospital: string;
  frequency: number;
  startDate: string;
}

const sampleMedications: Medication[] = [
  {
    id: 1,
    category: '감기약',
    hospital: '가람병원',
    frequency: 2,
    startDate: '2025년 10월 5일',
  },
  {
    id: 2,
    category: '소화제',
    hospital: '서울병원',
    frequency: 3,
    startDate: '2025년 10월 10일',
  },
  {
    id: 3,
    category: '두통약',
    hospital: '중앙병원',
    frequency: 2,
    startDate: '2025년 10월 12일',
  },
  {
    id: 4,
    category: '비타민',
    hospital: '건강의원',
    frequency: 1,
    startDate: '2025년 10월 15일',
  },
];

export default function HomeScreenList() {
  const handleMedicationPress = (id: number) => {
    console.log('약 상세 페이지로 이동:', id);
    // TODO: 네비게이션 연결
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headingContainer}>
            <Text style={styles.dateText}>10월 10일 (금)</Text>
            <Text style={styles.greetingText}>오늘도 건강한 하루 되세요</Text>
          </View>
          {/* 복약 기록 버튼 */}
          <TouchableOpacity style={styles.recordButton} activeOpacity={0.8}>
            <Text style={styles.recordButtonText}>복약 기록</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons Grid */}
        <View style={styles.actionButtonsContainer}>
          {/* Prescription Button */}
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <LinearGradient
              colors={['#6b6558', '#5a5347']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <View style={styles.iconContainer}>
                <Image 
                  source={require('../../../assets/images/HomeScreenPrescriptionRegistration.png')} 
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.actionButtonText}>처방전 등록</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Pill Envelope Button */}
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <LinearGradient
              colors={['#6b6558', '#5a5347']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <View style={styles.iconContainer}>
                <Image 
                  source={require('../../../assets/images/HomeScreenPrescriptionBag.png')} 
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.actionButtonText}>약봉투 등록</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Edit Info Button */}
        <TouchableOpacity style={styles.editInfoButton} activeOpacity={0.8}>
          <LinearGradient
            colors={['#6b6558', '#5a5347']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.editInfoGradient}
          >
            <View style={styles.editIconContainer}>
              <Image 
                source={require('../../../assets/images/HomeScreenMyInfo.png')} 
                style={styles.editIconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.editInfoButtonText}>내 정보 수정</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* 복용 중인 약 섹션 */}
        <View style={styles.medicationListSection}>
          <Text style={styles.sectionTitle}>복용 중인 약</Text>
          
          {/* 약 목록 */}
          {sampleMedications.map((medication) => (
            <TouchableOpacity 
              key={medication.id}
              style={styles.medicationCard}
              activeOpacity={0.8}
              onPress={() => handleMedicationPress(medication.id)}
            >
              <View style={styles.medicationCardContent}>
                {/* 왼쪽 정보 */}
                <View style={styles.medicationInfo}>
                  {/* 카테고리 태그 */}
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{medication.category}</Text>
                  </View>
                  {/* 병원 정보 */}
                  <Text style={styles.hospitalText}>
                    {medication.hospital} - 1일 {medication.frequency}회
                  </Text>
                  {/* 날짜 */}
                  <Text style={styles.dateInfoText}>{medication.startDate}</Text>
                </View>
                
                {/* 오른쪽 화살표 아이콘 */}
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsive(16),
    paddingTop: responsive(57), // 81 - 24 (status bar height)
    paddingBottom: responsive(40),
    alignItems: 'center' as any,
  },
  headerSection: {
    width: '100%',
    maxWidth: responsive(368),
    marginBottom: responsive(24),
    flexDirection: 'row' as any,
    justifyContent: 'space-between' as any,
    alignItems: 'flex-start' as any,
  },
  headingContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: responsive(27),
    fontWeight: '700' as any,
    color: '#1e2939',
    lineHeight: responsive(32.4),
    marginBottom: responsive(5),
  },
  greetingText: {
    fontSize: responsive(16),
    fontWeight: '400' as any,
    color: '#6a7282',
    lineHeight: responsive(24),
  },
  recordButton: {
    backgroundColor: '#FFCC02',
    borderRadius: responsive(14),
    paddingHorizontal: responsive(19),
    paddingVertical: responsive(10),
    height: responsive(40),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  recordButtonText: {
    fontSize: responsive(17),
    fontWeight: '700' as any,
    color: '#545045',
    lineHeight: responsive(20.4),
  },
  actionButtonsContainer: {
    width: '100%',
    maxWidth: responsive(368),
    flexDirection: 'row' as any,
    justifyContent: 'space-between' as any,
    marginBottom: responsive(24),
  },
  actionButton: {
    width: responsive(172),
    height: responsive(172),
    borderRadius: responsive(16),
    overflow: 'hidden' as any,
  },
  actionButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end' as any,
    alignItems: 'center' as any,
    paddingBottom: responsive(21),
  },
  iconContainer: {
    width: responsive(80),
    height: responsive(80),
    borderRadius: responsive(40),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: responsive(18),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  iconImage: {
    width: responsive(48),
    height: responsive(48),
  },
  actionButtonText: {
    fontSize: responsive(24),
    fontWeight: '700' as any,
    color: '#ffffff',
    lineHeight: responsive(28.8),
  },
  editInfoButton: {
    width: '100%',
    maxWidth: responsive(368),
    height: responsive(100),
    borderRadius: responsive(16),
    overflow: 'hidden' as any,
    marginBottom: responsive(24),
  },
  editInfoGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row' as any,
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    paddingHorizontal: responsive(20),
  },
  editIconContainer: {
    width: responsive(56),
    height: responsive(56),
    borderRadius: responsive(28),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: responsive(18),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  editIconImage: {
    width: responsive(32),
    height: responsive(32),
  },
  editInfoButtonText: {
    fontSize: responsive(24),
    fontWeight: '700' as any,
    color: '#ffffff',
    lineHeight: responsive(28.8),
  },
  medicationListSection: {
    width: '100%',
    maxWidth: responsive(368),
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: responsive(20),
    fontWeight: '700' as any,
    color: '#1e2939',
    lineHeight: responsive(28),
    marginBottom: responsive(8),
  },
  medicationCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: responsive(16),
    borderWidth: responsive(1),
    borderColor: '#F3F4F6',
    paddingHorizontal: responsive(11),
    paddingVertical: responsive(11),
    marginBottom: responsive(8),
  },
  medicationCardContent: {
    flexDirection: 'row' as any,
    justifyContent: 'space-between' as any,
    alignItems: 'center' as any,
  },
  medicationInfo: {
    flex: 1,
  },
  categoryTag: {
    backgroundColor: '#FFCC02',
    borderRadius: responsive(8),
    paddingHorizontal: responsive(12),
    paddingVertical: responsive(4),
    alignSelf: 'flex-start',
    marginBottom: responsive(8),
  },
  categoryTagText: {
    fontSize: responsive(14),
    fontWeight: '700' as any,
    color: '#364153',
    lineHeight: responsive(20),
  },
  hospitalText: {
    fontSize: responsive(16),
    fontWeight: '700' as any,
    color: '#1e2939',
    lineHeight: responsive(24),
    marginBottom: responsive(4),
  },
  dateInfoText: {
    fontSize: responsive(14),
    fontWeight: '400' as any,
    color: '#99a1af',
    lineHeight: responsive(20),
  },
  arrowContainer: {
    width: responsive(24),
    height: responsive(24),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    marginLeft: responsive(8),
  },
  arrowText: {
    fontSize: responsive(24),
    fontWeight: '400' as any,
    color: '#99a1af',
  },
});

