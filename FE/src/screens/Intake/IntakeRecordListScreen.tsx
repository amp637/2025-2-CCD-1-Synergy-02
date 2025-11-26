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
import responsive from '../../utils/responsive';
import { getUserReports } from '../../api/reportApi';
import PinchZoomScrollView from '../../components/PinchZoomScrollView';

interface RecordItem {
  id: string;
  title: string;
  dateRange: string;
  rno: number;
}

interface IntakeRecordListScreenProps {
  onRecordPress?: (recordId: string, rno: number) => void;
  onExit?: () => void;
}

const IntakeRecordListScreen = React.memo(({ onRecordPress, onExit }: IntakeRecordListScreenProps) => {
  const [isInteractionComplete, setIsInteractionComplete] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const insets = useSafeAreaInsets();

  // 리포트 목록 로드
  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true);
        console.log('[IntakeRecordListScreen] 리포트 목록 로드 시작');
        
        const response = await getUserReports();
        console.log('[IntakeRecordListScreen] 리포트 목록 응답:', response);
        
        if (response.header?.resultCode === 1000) {
          if (response.body?.report_list && response.body.report_list.length > 0) {
            const reportList: RecordItem[] = response.body.report_list.map((report) => ({
              id: report.rno.toString(),
              rno: report.rno,
              title: `${report.hospital}(${report.category})`,
              dateRange: `${report.start_date} - ${report.end_date}`,
            }));
            console.log('[IntakeRecordListScreen] 리포트 목록 변환 완료:', reportList.length, '개');
            setRecords(reportList);
          } else {
            console.log('[IntakeRecordListScreen] 리포트 목록이 비어있습니다.');
            setRecords([]);
          }
        } else {
          console.warn('[IntakeRecordListScreen] 리포트 목록 조회 실패:', response.header?.resultMsg);
          setRecords([]);
        }
      } catch (error: any) {
        console.error('[IntakeRecordListScreen] 리포트 목록 로드 실패:', error);
        console.error('[IntakeRecordListScreen] 에러 타입:', error.constructor.name);
        console.error('[IntakeRecordListScreen] 에러 메시지:', error.message);
        if (error.response) {
          console.error('[IntakeRecordListScreen] 응답 상태:', error.response.status);
          console.error('[IntakeRecordListScreen] 응답 데이터:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
          console.error('[IntakeRecordListScreen] 요청은 보냈지만 응답을 받지 못함');
        }
        
        // 복약 정보가 없는 경우는 에러로 표시하지 않고 빈 목록으로 처리
        if (error.response?.status === 400 || 
            error.response?.data?.header?.resultMsg?.includes('복약 정보가 존재하지 않습니다')) {
          console.log('[IntakeRecordListScreen] 복약 정보가 없어 빈 목록으로 표시');
          setRecords([]);
        } else {
          Alert.alert('오류', error.response?.data?.header?.resultMsg || '리포트 목록을 불러오는데 실패했습니다.');
          setRecords([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadReports();
  }, []);

  // 화면 전환 애니메이션 이후에 실행
  useEffect(() => {
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      setIsInteractionComplete(true);
      console.log('IntakeRecordListScreen: Interactions complete');
    });

    return () => interactionPromise.cancel();
  }, []);

  const handleRecordPress = useCallback((recordId: string, rno: number) => {
    console.log('기록 선택:', recordId, 'rno:', rno);
    onRecordPress?.(recordId, rno);
  }, [onRecordPress]);

  const handleExit = useCallback(() => {
    console.log('나가기 버튼 클릭');
    onExit?.();
  }, [onExit]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      
      {/* 상단 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>복약 기록</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60584d" />
          <Text style={styles.loadingText}>리포트 목록 불러오는 중...</Text>
        </View>
      ) : (
        <PinchZoomScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + responsive(66) + responsive(16) + responsive(16) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.pageWrapper, { maxWidth: MAX_WIDTH }]}>
            {/* 기록 리스트 */}
            {records.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>등록된 리포트가 없습니다.</Text>
              </View>
            ) : (
              records.map((record) => (
                <TouchableOpacity
                  key={record.id}
                  style={styles.recordCard}
                  onPress={() => handleRecordPress(record.id, record.rno)}
                >
                  <View style={styles.recordContainer}>
                    <View style={styles.recordTextContainer}>
                      <Text style={styles.recordTitle}>{record.title}</Text>
                      <Text style={styles.recordDate}>{record.dateRange}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </PinchZoomScrollView>
      )}

      {/* 하단 전체를 덮는 그라데이션 (버튼 포함!) */}
      <View style={[styles.bottomFadeContainer, { paddingBottom: insets.bottom + responsive(16) }]}>
        <LinearGradient
          colors={['transparent', '#F6F7F8']}
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
    paddingTop: responsive(24),
    alignItems: 'center' as any,
  },
  pageWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  recordCard: {
    width: '100%',
    height: responsive(100),
    backgroundColor: '#FFFFFF',
    borderRadius: responsive(10),
    borderWidth: responsive(1),
    borderColor: '#E5E7EB',
    marginBottom: responsive(12),
    paddingHorizontal: responsive(21),
    justifyContent: 'center' as any,
  },
  recordContainer: {
    width: '100%',
  },
  recordTextContainer: {
    width: '100%',
  },
  recordTitle: {
    fontWeight: '700' as '700',
    fontSize: responsive(24),
    color: '#101828',
    lineHeight: responsive(28.8),
    marginBottom: responsive(4),
  },
  recordDate: {
    fontWeight: '400' as '400',
    fontSize: responsive(14),
    color: '#6A7282',
    lineHeight: responsive(16.8),
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
    paddingVertical: responsive(40),
  },
  emptyText: {
    fontSize: responsive(18),
    color: '#99a1af',
  },
});

export default IntakeRecordListScreen;

