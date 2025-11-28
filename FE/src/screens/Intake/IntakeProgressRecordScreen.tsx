import React, { useCallback, useEffect, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import responsive from '../../utils/responsive';
import { getReportSummary } from '../../api/reportApi';
import PinchZoomScrollView from '../../components/PinchZoomScrollView';

// 한글 로케일 설정
LocaleConfig.locales['kr'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

interface RecordData {
  id: string;
  title: string;
  dateRange: string;
}

interface IntakeProgressRecordScreenProps {
  recordData?: RecordData;
  onExit?: () => void;
  onDetailRecord?: () => void;
  rno?: number;
}

const IntakeProgressRecordScreen = React.memo(({ recordData, onExit, onDetailRecord, rno }: IntakeProgressRecordScreenProps) => {
  const [isInteractionComplete, setIsInteractionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [reportData, setReportData] = useState<any>(null);
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();
  
  // 현재 날짜를 YYYY-MM-DD 형식으로 가져오기
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 리포트 요약 데이터 로드
  useEffect(() => {
    if (!rno) {
      setIsLoading(false);
      return;
    }

    const loadReportSummary = async () => {
      try {
        setIsLoading(true);
        const response = await getReportSummary(rno);
        console.log('[IntakeProgressRecordScreen] API 응답:', JSON.stringify(response, null, 2));
        
        if (response.header?.resultCode === 1000 && response.body) {
          setReportData(response.body);
          
          // 캘린더 마킹 데이터 생성
          const dates: any = {};
          if (response.body.colors) {
            console.log('[IntakeProgressRecordScreen] colors 배열:', response.body.colors);
            
            response.body.colors.forEach((color: any) => {
              // 백엔드가 'g', 'y', 'r'로 반환하는지 확인
              let colorValue = color.color;
              if (colorValue === 'g' || colorValue === 'green') {
                colorValue = '#A0DB87'; // 초록색
              } else if (colorValue === 'y' || colorValue === 'yellow') {
                colorValue = '#FFEA4C'; // 노란색
              } else if (colorValue === 'r' || colorValue === 'red') {
                colorValue = '#DD7C7C'; // 빨간색
              } else {
                // 기본값 (빨간색)
                colorValue = '#DD7C7C';
              }
              
              dates[color.date] = { 
                selected: true, 
                selectedColor: colorValue
              };
              
              console.log(`[IntakeProgressRecordScreen] 날짜 ${color.date}: 원본 color="${color.color}" → 선택된 색상=${colorValue}`);
            });
          } else {
            console.warn('[IntakeProgressRecordScreen] colors 배열이 없습니다!');
          }
          
          console.log('[IntakeProgressRecordScreen] 최종 markedDates:', dates);
          setMarkedDates(dates);
        }
      } catch (error: any) {
        console.error('리포트 요약 로드 실패:', error);
        Alert.alert('오류', '리포트 요약 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadReportSummary();
  }, [rno]);

  // 화면 전환 애니메이션 이후에 실행
  useEffect(() => {
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      setIsInteractionComplete(true);
      console.log('IntakeProgressRecordScreen: Interactions complete');
    });

    return () => interactionPromise.cancel();
  }, []);

  const handleDetailRecord = useCallback(() => {
    console.log('상세 기록 버튼 클릭');
    onDetailRecord?.();
  }, [onDetailRecord]);

  const handleExit = useCallback(() => {
    console.log('나가기 버튼 클릭');
    onExit?.();
  }, [onExit]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      
      {/* 상단 헤더 - IntakeRecordListScreen과 동일 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>복약 진행 기록</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60584d" />
          <Text style={styles.loadingText}>리포트 정보 불러오는 중...</Text>
        </View>
      ) : (
        <PinchZoomScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + responsive(66) + responsive(16) + responsive(16) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.pageWrapper, { maxWidth: MAX_WIDTH }]}>
            {/* 약 정보 섹션 */}
            <View style={styles.medicineInfoSection}>
              {/* 상단 행: 약 태그와 상세 기록 버튼 */}
              <View style={styles.topRow}>
                {/* 약 태그 */}
                <View style={styles.medicineTag}>
                  <Text style={styles.medicineTagText}>
                    {reportData?.category || recordData?.title.split('(')[1]?.replace(')', '') || '복통약'}
                  </Text>
                </View>
                
                {/* 상세 기록 버튼 */}
                <TouchableOpacity style={styles.detailButton} onPress={handleDetailRecord}>
                  <Text style={styles.detailButtonText}>상세 기록</Text>
                </TouchableOpacity>
              </View>

              {/* 병원 정보 */}
              <Text style={styles.hospitalInfo}>
                {reportData?.hospital || recordData?.title.split('(')[0] || '가람병원'} - 1일 {reportData?.taken || 3}회
              </Text>
              
              {/* 날짜 정보 */}
              <Text style={styles.dateText}>
                {reportData?.start_date && reportData?.end_date 
                  ? `${reportData.start_date} - ${reportData.end_date}`
                  : recordData?.dateRange || '2025년 10월 14일 - 2025년 10월 25일'}
              </Text>
            </View>

          {/* 복용 상태 범례 */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendCircle, styles.legendAll]} />
              <Text style={styles.legendText}>모두 복용</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendCircle, styles.legendPartial]} />
              <Text style={styles.legendText}>일부 복용</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendCircle, styles.legendNone]} />
              <Text style={styles.legendText}>미복용</Text>
            </View>
          </View>

          {/* 캘린더 컨테이너 */}
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeaderSection}>
              <View>
                <Text style={styles.calendarTitle}>복용 캘린더</Text>
              </View>
            </View>

            {/* 실제 캘린더 */}
            <Calendar
              current={getCurrentDate()}
              markedDates={markedDates}
              monthFormat={'M월'}
              hideExtraDays={true}
              disableMonthChange={false}
              firstDay={0}
              hideDayNames={false}
              onPressArrowLeft={subtractMonth => subtractMonth()}
              onPressArrowRight={addMonth => addMonth()}
              disableArrowLeft={false}
              disableArrowRight={false}
              enableSwipeMonths={true}
              renderArrow={(direction) => (
                <Text style={styles.arrowText}>
                  {direction === 'left' ? '←' : '→'}
                </Text>
              )}
              theme={{
                backgroundColor: '#EAEAEA',
                calendarBackground: '#EAEAEA',
                textSectionTitleColor: '#000000',
                selectedDayBackgroundColor: '#A0DB87',
                selectedDayTextColor: '#000000',
                todayTextColor: '#0088FF',
                dayTextColor: '#000000',
                textDisabledColor: '#D9D9D9',
                dotColor: '#00adf5',
                selectedDotColor: '#ffffff',
                arrowColor: '#000000',
                monthTextColor: '#364153',
                indicatorColor: 'blue',
                textDayFontFamily: 'SF Pro',
                textMonthFontFamily: 'Noto Sans KR',
                textDayHeaderFontFamily: 'SF Pro',
                textDayFontWeight: '400',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 24,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendar}
            />
          </View>
          </View>
        </PinchZoomScrollView>
      )}

      {/* 하단 전체를 덮는 그라데이션 (버튼 포함!) */}
      <View style={[styles.bottomFadeContainer, { paddingBottom: insets.bottom + responsive(16) }]}>
        <LinearGradient
          colors={['transparent', '#FFFFFF']}
          style={styles.gradient}
        />
        {/* 버튼은 그라데이션 내부에 배치 */}
        <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
          <Text style={styles.exitButtonText}>나가기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontWeight: '700' as '700',
    fontSize: responsive(27),
    color: '#1A1A1A',
    lineHeight: responsive(32.4),
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: responsive(16),
    paddingTop: responsive(13),
    alignItems: 'center' as any,
  },
  pageWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  medicineInfoSection: {
    width: '100%',
    marginBottom: 15,
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
    fontWeight: '700' as '700',
    fontSize: responsive(24),
    color: '#545045',
    lineHeight: responsive(28.8),
  },
  hospitalInfo: {
    fontWeight: '700' as '700',
    fontSize: responsive(32),
    color: '#666666',
    lineHeight: responsive(38.4),
    marginBottom: responsive(4),
  },
  dateText: {
    fontWeight: '400' as '400',
    fontSize: responsive(14),
    color: '#6A7282',
    lineHeight: responsive(16.8),
  },
  detailButton: {
    backgroundColor: '#FFCC02',
    borderRadius: responsive(10),
    paddingHorizontal: responsive(16),
    paddingVertical: responsive(10),
  },
  detailButtonText: {
    fontWeight: '700' as '700',
    fontSize: responsive(17),
    color: '#60584D',
    lineHeight: responsive(20.4),
  },
  legendContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: responsive(12),
    paddingVertical: responsive(14),
    paddingHorizontal: responsive(14),
    flexDirection: 'row' as any,
    justifyContent: 'space-between' as any,
    marginBottom: responsive(15),
  },
  legendItem: {
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    gap: responsive(8),
  },
  legendCircle: {
    width: responsive(28),
    height: responsive(28),
    borderRadius: responsive(14),
  },
  legendAll: {
    backgroundColor: '#A0DB87',
  },
  legendPartial: {
    backgroundColor: '#FFEA4C',
  },
  legendNone: {
    backgroundColor: '#DD7C7C',
  },
  legendText: {
    fontWeight: '700' as '700',
    fontSize: responsive(17),
    color: '#000000',
    lineHeight: responsive(20.4),
  },
  calendarContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: responsive(12),
    padding: responsive(10),
  },
  calendarHeaderSection: {
    flexDirection: 'row' as any,
    justifyContent: 'space-between' as any,
    alignItems: 'center' as any,
    marginBottom: responsive(10),
  },
  calendarTitle: {
    fontWeight: '700' as '700',
    fontSize: responsive(20),
    color: '#364153',
    lineHeight: responsive(24),
    marginBottom: responsive(8),
  },
  calendarMonth: {
    fontWeight: '700' as '700',
    fontSize: responsive(24),
    color: '#364153',
    lineHeight: responsive(28.8),
  },
  calendar: {
    backgroundColor: '#EAEAEA',
    borderRadius: responsive(18),
    paddingVertical: responsive(10),
  },
  arrowText: {
    fontSize: responsive(24),
    fontWeight: '700' as '700',
    color: '#000000',
    paddingHorizontal: responsive(10),
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
  exitButton: {
    width: '90%',
    maxWidth: responsive(360),
    height: responsive(66),
    backgroundColor: '#60584D',
    borderRadius: responsive(200),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    zIndex: 20,
  },
  exitButtonText: {
    fontWeight: '700' as '700',
    fontSize: responsive(27),
    color: '#FFFFFF',
    lineHeight: responsive(32.4),
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

export default IntakeProgressRecordScreen;

